/**
 * MCP Resources implementation for Apple HIG content
 */

import type { CrawleeHIGService } from './services/crawlee-hig.service.js';
import type { HIGCache } from './cache.js';
import type { HIGStaticContentProvider } from './static-content.js';
import type { HIGResource, ApplePlatform, HIGCategory } from './types.js';

export class HIGResourceProvider {
  private crawleeService: CrawleeHIGService;
  private cache: HIGCache;
  private staticContentProvider?: HIGStaticContentProvider;

  constructor(crawleeService: CrawleeHIGService, cache: HIGCache, staticContentProvider?: HIGStaticContentProvider) {
    this.crawleeService = crawleeService;
    this.cache = cache;
    this.staticContentProvider = staticContentProvider;
  }

  /**
   * List all available HIG resources
   */
  async listResources(): Promise<HIGResource[]> {
    // Try static content first
    if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
      try {
        return await this.staticContentProvider.listResources();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HIGResourceProvider] Static content failed, falling back to scraping:', error);
        }
        // Fall through to scraper fallback
      }
    }
    
    // Fallback to scraper
    const cacheKey = 'resources:list';
    
    // Check cache first
    const cached = this.cache.get<HIGResource[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const sections = await this.crawleeService.discoverSections();
      const resources: HIGResource[] = [];

      // Platform-specific resource collections
      const platforms: ApplePlatform[] = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'];
      
      for (const platform of platforms) {
        const platformSections = sections.filter(s => s.platform === platform);
        
        if (platformSections.length > 0) {
          resources.push({
            uri: `hig://${platform.toLowerCase()}`,
            name: `${platform} Human Interface Guidelines`,
            description: `Complete design guidelines for ${platform} development, including the latest Liquid Glass design system updates`,
            mimeType: 'text/markdown',
            content: '' // Will be populated when requested
          });

          // Category-specific resources for each platform
          const categories: HIGCategory[] = [
            'foundations', 'layout', 'navigation', 'presentation', 
            'selection-and-input', 'visual-design', 'color-and-materials',
            'typography', 'motion', 'technologies'
          ];

          for (const category of categories) {
            const categorySections = platformSections.filter(s => s.category === category);
            if (categorySections.length > 0) {
              resources.push({
                uri: `hig://${platform.toLowerCase()}/${category}`,
                name: `${platform} ${this.formatCategoryName(category)}`,
                description: `${platform} guidelines for ${this.formatCategoryName(category).toLowerCase()}`,
                mimeType: 'text/markdown',
                content: ''
              });
            }
          }
        }
      }

      // Universal/cross-platform resources
      const universalSections = sections.filter(s => s.platform === 'universal');
      if (universalSections.length > 0) {
        resources.push({
          uri: 'hig://universal',
          name: 'Universal Design Guidelines',
          description: 'Cross-platform design principles and the Liquid Glass design system',
          mimeType: 'text/markdown',
          content: ''
        });
      }

      // Special resources for latest updates
      resources.push({
        uri: 'hig://updates/latest-design-system',
        name: 'Latest Design System Updates',
        description: 'Most recent Apple design system updates and new design language features',
        mimeType: 'text/markdown',
        content: ''
      });

      resources.push({
        uri: 'hig://updates/latest',
        name: 'Latest HIG Updates',
        description: 'Most recent changes and additions to Apple\'s Human Interface Guidelines',
        mimeType: 'text/markdown',
        content: ''
      });

      // Cache for 2 hours
      this.cache.set(cacheKey, resources, 7200);
      
      return resources;
    } catch (error) {
      console.error('[HIGResourceProvider] Failed to list resources:', error);
      return [];
    }
  }

  /**
   * Get content for a specific resource URI
   */
  async getResource(uri: string): Promise<HIGResource | null> {
    // Try static content first
    if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
      try {
        const resource = await this.staticContentProvider.getResource(uri);
        if (resource) {
          return resource;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[HIGResourceProvider] Static content failed for ${uri}, falling back to scraping:`, error);
        }
        // Fall through to scraper fallback
      }
    }
    
    // Fallback to scraper
    const cacheKey = `resource:${uri}`;
    
    // Check cache first
    const cached = this.cache.get<HIGResource>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const parsed = this.parseResourceURI(uri);
      if (!parsed) {
        return null;
      }

      let content = '';
      let name = '';
      let description = '';

      if (parsed.type === 'platform') {
        const result = await this.getPlatformContent(parsed.platform!);
        content = result.content;
        name = result.name;
        description = result.description;
      } else if (parsed.type === 'category') {
        const result = await this.getCategoryContent(parsed.platform!, parsed.category!);
        content = result.content;
        name = result.name;
        description = result.description;
      } else if (parsed.type === 'updates') {
        const result = await this.getUpdatesContent(parsed.updateType!);
        content = result.content;
        name = result.name;
        description = result.description;
      } else {
        return null;
      }

      const resource: HIGResource = {
        uri,
        name,
        description,
        mimeType: 'text/markdown',
        content
      };

      // Cache for 1 hour
      this.cache.set(cacheKey, resource, 3600);
      
      return resource;
    } catch (error) {
      console.error(`[HIGResourceProvider] Failed to get resource ${uri}:`, error);
      return null;
    }
  }

  /**
   * Parse resource URI into components
   */
  private parseResourceURI(uri: string): {
    type: 'platform' | 'category' | 'updates';
    platform?: ApplePlatform;
    category?: HIGCategory;
    updateType?: string;
  } | null {
    const match = uri.match(/^hig:\/\/([^/]+)(?:\/(.+))?$/);
    if (!match) {
      return null;
    }

    const [, first, second] = match;

    if (first === 'updates') {
      return {
        type: 'updates',
        updateType: second || 'latest'
      };
    }

    const platform = this.stringToPlatform(first);
    if (!platform) {
      return null;
    }

    if (!second) {
      return {
        type: 'platform',
        platform
      };
    }

    const category = this.stringToCategory(second);
    if (!category) {
      return null;
    }

    return {
      type: 'category',
      platform,
      category
    };
  }

  /**
   * Get content for a platform
   */
  private async getPlatformContent(platform: ApplePlatform): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    const sections = await this.crawleeService.discoverSections();
    const platformSections = sections.filter(s => s.platform === platform);

    let content = `# ${platform} Human Interface Guidelines\n\n`;
    content += `This document contains the complete design guidelines for ${platform} development, including the latest updates from Apple's design system.\n\n`;
    
    // Add attribution
    content += this.getAttributionText();

    for (const section of platformSections) {
      const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
      if (sectionWithContent.content) {
        content += `## ${section.title}\n\n`;
        content += `**URL:** ${section.url}\n\n`;
        content += sectionWithContent.content;
        content += '\n\n---\n\n';
      }
    }

    return {
      content,
      name: `${platform} Human Interface Guidelines`,
      description: `Complete design guidelines for ${platform} development`
    };
  }

  /**
   * Get content for a specific category on a platform
   */
  private async getCategoryContent(platform: ApplePlatform, category: HIGCategory): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    const sections = await this.crawleeService.discoverSections();
    const categorySections = sections.filter(s => 
      s.platform === platform && s.category === category
    );

    const categoryName = this.formatCategoryName(category);
    let content = `# ${platform} ${categoryName}\n\n`;
    content += `Guidelines for ${categoryName.toLowerCase()} in ${platform} applications.\n\n`;
    
    // Add attribution
    content += this.getAttributionText();

    for (const section of categorySections) {
      const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
      if (sectionWithContent.content) {
        content += `## ${section.title}\n\n`;
        content += `**URL:** ${section.url}\n\n`;
        content += sectionWithContent.content;
        content += '\n\n---\n\n';
      }
    }

    return {
      content,
      name: `${platform} ${categoryName}`,
      description: `${platform} guidelines for ${categoryName.toLowerCase()}`
    };
  }

  /**
   * Get content for updates (Liquid Glass, latest changes, etc.)
   */
  private async getUpdatesContent(updateType: string): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    if (updateType === 'latest-design-system') {
      let content = `# Latest Apple Design System Updates\n\n`;
      content += `Apple's most recent design language updates, featuring advanced materials and visual elements that enhance user interface experiences.\n\n`;
      
      // Add attribution
      content += this.getAttributionText();
      
      content += `## Key Features\n\n`;
      content += `- **Translucent Materials**: Shiny, reflective, and transparent visual interface elements\n`;
      content += `- **Adaptive Colors**: Intelligently adapts between light and dark environments\n`;
      content += `- **Real-time Rendering**: Dynamically reacts to movement with specular highlights\n`;
      content += `- **System-wide Implementation**: From buttons to entire interfaces\n\n`;
      
      content += `## Platform Coverage\n\n`;
      content += `The Liquid Glass design language is available across all Apple platforms:\n`;
      content += `- iOS 26\n- macOS 26\n- watchOS 26\n- iPadOS 26\n- tvOS 26\n- visionOS 26\n\n`;
      
      content += `## Developer Integration\n\n`;
      content += `Apple provides updated APIs for SwiftUI, UIKit, and AppKit to easily adopt the new design system.\n\n`;
      
      return {
        content,
        name: 'Latest Design System Updates',
        description: 'Current Apple design language featuring advanced materials and interface elements'
      };
    }

    // Default to latest updates
    let content = `# Latest HIG Updates\n\n`;
    content += `Recent changes and additions to Apple's Human Interface Guidelines.\n\n`;
    
    // Add attribution
    content += this.getAttributionText();
    
    content += `## Recent Updates\n\n`;
    content += `- **Enhanced Design System**: Major visual improvements with advanced materials\n`;
    content += `- **Unified Design Language**: Consistent design patterns across all Apple platforms\n`;
    content += `- **Updated APIs**: Latest SwiftUI, UIKit, and AppKit capabilities\n\n`;
    
    return {
      content,
      name: 'Latest HIG Updates',
      description: 'Most recent changes to Apple\'s Human Interface Guidelines'
    };
  }

  /**
   * Get Apple attribution text
   */
  private getAttributionText(): string {
    return `---
**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines, available at https://developer.apple.com/design/human-interface-guidelines/

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.

---

`;
  }

  /**
   * Convert string to ApplePlatform
   */
  private stringToPlatform(str: string): ApplePlatform | null {
    const platformMap: Record<string, ApplePlatform> = {
      'ios': 'iOS',
      'macos': 'macOS',
      'watchos': 'watchOS',
      'tvos': 'tvOS',
      'visionos': 'visionOS',
      'universal': 'universal'
    };
    
    return platformMap[str.toLowerCase()] || null;
  }

  /**
   * Convert string to HIGCategory
   */
  private stringToCategory(str: string): HIGCategory | null {
    const categoryMap: Record<string, HIGCategory> = {
      'foundations': 'foundations',
      'layout': 'layout',
      'navigation': 'navigation',
      'presentation': 'presentation',
      'selection-and-input': 'selection-and-input',
      'status': 'status',
      'system-capabilities': 'system-capabilities',
      'visual-design': 'visual-design',
      'icons-and-images': 'icons-and-images',
      'color-and-materials': 'color-and-materials',
      'typography': 'typography',
      'motion': 'motion',
      'technologies': 'technologies'
    };
    
    return categoryMap[str] || null;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: HIGCategory): string {
    const nameMap: Record<HIGCategory, string> = {
      'foundations': 'Foundations',
      'layout': 'Layout',
      'navigation': 'Navigation',
      'presentation': 'Presentation',
      'selection-and-input': 'Selection and Input',
      'status': 'Status',
      'system-capabilities': 'System Capabilities',
      'visual-design': 'Visual Design',
      'icons-and-images': 'Icons and Images',
      'color-and-materials': 'Color and Materials',
      'typography': 'Typography',
      'motion': 'Motion',
      'technologies': 'Technologies'
    };
    
    return nameMap[category];
  }
}