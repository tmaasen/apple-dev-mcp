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
      // Curated high-value resources (replaces auto-generation of 80+ resources)
      const curatedResources: Array<{uri: string, name: string, description: string}> = [
        // Core Platforms (most requested)
        {
          uri: 'hig://ios',
          name: 'iOS Human Interface Guidelines',
          description: 'Complete design guidelines for iOS development, including iPhone and iPad'
        },
        {
          uri: 'hig://macos',
          name: 'macOS Human Interface Guidelines', 
          description: 'Complete design guidelines for macOS development'
        },
        
        // Essential Cross-Platform Topics (high usage)
        {
          uri: 'hig://buttons',
          name: 'Button Guidelines',
          description: 'Button design principles, sizing (44pt minimum), and interaction patterns across all platforms'
        },
        {
          uri: 'hig://accessibility',
          name: 'Accessibility Guidelines',
          description: 'Accessibility requirements, WCAG compliance, VoiceOver support, and inclusive design principles'
        },
        {
          uri: 'hig://color',
          name: 'Color Guidelines',
          description: 'Color usage, contrast requirements (4.5:1 ratio), dark mode, and accessibility considerations'
        },
        {
          uri: 'hig://typography',
          name: 'Typography Guidelines',
          description: 'Typography hierarchy, font usage, and text accessibility across Apple platforms'
        },
        {
          uri: 'hig://layout',
          name: 'Layout Guidelines', 
          description: 'Layout principles, safe areas, margins, spacing, and responsive design patterns'
        },
        
        // Emerging/Important Platforms
        {
          uri: 'hig://visionos',
          name: 'visionOS Human Interface Guidelines',
          description: 'Spatial design guidelines for Apple Vision Pro and mixed reality experiences'
        },
        {
          uri: 'hig://watchos',
          name: 'watchOS Human Interface Guidelines',
          description: 'Design guidelines for Apple Watch apps and complications'
        },
        
        // High-Demand Platform-Specific
        {
          uri: 'hig://ios/visual-design',
          name: 'iOS Visual Design',
          description: 'iOS-specific visual design elements, materials, and interface components'
        },
        {
          uri: 'hig://ios/foundations',
          name: 'iOS Design Foundations',
          description: 'Core iOS design principles, patterns, and foundational concepts'
        },
        {
          uri: 'hig://ios/navigation',
          name: 'iOS Navigation',
          description: 'iOS navigation patterns, tab bars, navigation bars, and user flow design'
        },
        
        // Advanced Topics
        {
          uri: 'hig://materials',
          name: 'Materials & Effects',
          description: 'Advanced materials, Liquid Glass design system, and visual effects across platforms'
        },
        {
          uri: 'hig://navigation-and-search',
          name: 'Navigation & Search',
          description: 'Navigation patterns, search interfaces, and information architecture'
        },
        
        // Special Resources
        {
          uri: 'hig://updates/latest',
          name: 'Latest HIG Updates',
          description: 'Most recent changes and additions to Apple\'s Human Interface Guidelines'
        },
        {
          uri: 'hig://universal',
          name: 'Universal Design Principles',
          description: 'Cross-platform design principles and patterns applicable to all Apple platforms'
        }
      ];

      const resources: HIGResource[] = curatedResources.map(resource => ({
        ...resource,
        mimeType: 'text/markdown',
        content: '' // Will be populated when requested
      }));

      // Cache for 2 hours
      this.cache.set(cacheKey, resources, 7200);
      
      return resources;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGResourceProvider] Failed to list resources:', error);
      }
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
      } else if (parsed.type === 'topic') {
        const result = await this.getTopicContent(parsed.topic!);
        content = result.content;
        name = result.name;
        description = result.description;
      } else if (parsed.type === 'topic-platform') {
        const result = await this.getTopicPlatformContent(parsed.topic!, parsed.platform!);
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
      if (process.env.NODE_ENV === 'development') {
        console.error(`[HIGResourceProvider] Failed to get resource ${uri}:`, error);
      }
      return null;
    }
  }

  /**
   * Parse resource URI into components (supporting topic-first structure)
   */
  private parseResourceURI(uri: string): {
    type: 'platform' | 'category' | 'updates' | 'topic' | 'topic-platform';
    platform?: ApplePlatform;
    category?: HIGCategory;
    updateType?: string;
    topic?: string;
  } | null {
    const match = uri.match(/^hig:\/\/([^/]+)(?:\/(.+))?$/);
    if (!match) {
      return null;
    }

    const [, first, second] = match;

    // Handle updates
    if (first === 'updates') {
      return {
        type: 'updates',
        updateType: second || 'latest'
      };
    }

    // Check if first part is a platform
    const platform = this.stringToPlatform(first);
    if (platform) {
      if (!second) {
        return {
          type: 'platform',
          platform
        };
      }

      const category = this.stringToCategory(second);
      if (category) {
        return {
          type: 'category',
          platform,
          category
        };
      }

      // Platform-specific topic (e.g., hig://ios/app-icons)
      return {
        type: 'topic-platform',
        platform,
        topic: second
      };
    }

    // Universal topic (e.g., hig://materials, hig://buttons)
    if (this.isValidTopicName(first)) {
      if (second) {
        // Topic with platform filter (e.g., hig://buttons/ios)
        const platformFilter = this.stringToPlatform(second);
        if (platformFilter) {
          return {
            type: 'topic-platform',
            topic: first,
            platform: platformFilter
          };
        }
      }
      
      return {
        type: 'topic',
        topic: first
      };
    }

    return null;
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
   * Check if a string is a valid topic name
   */
  private isValidTopicName(name: string): boolean {
    // Check if this matches a known universal topic
    const universalTopics = [
      'accessibility', 'action-sheets', 'activity-rings', 'activity-views', 'airplay',
      'alerts', 'always-on', 'app-clips', 'app-icons', 'app-shortcuts', 'apple-pay',
      'apple-pencil-and-scribble', 'augmented-reality', 'boxes', 'branding',
      'camera-control', 'carekit', 'carplay', 'charting-data', 'charts',
      'collaboration-and-sharing', 'collections', 'color-wells', 'color',
      'column-views', 'combo-boxes', 'complications', 'components', 'content',
      'context-menus', 'controls', 'dark-mode', 'designing-for-games',
      'designing-for-ipados', 'digit-entry-views', 'digital-crown',
      'disclosure-controls', 'dock-menus', 'drag-and-drop', 'edit-menus',
      'entering-data', 'eyes', 'feedback', 'file-management', 'focus-and-selection',
      'foundations', 'game-center', 'game-controls', 'gauges', 'generative-ai',
      'gestures', 'getting-started', 'going-full-screen', 'gyroscope-and-accelerometer',
      'healthkit', 'home-screen-quick-actions', 'homekit', 'icloud', 'icons',
      'id-verifier', 'image-views', 'image-wells', 'images', 'imessage-apps-and-stickers',
      'immersive-experiences', 'in-app-purchase', 'inclusion', 'inputs', 'keyboards',
      'labels', 'launching', 'layout-and-organization', 'layout', 'lists-and-tables',
      'live-activities', 'live-photos', 'live-viewing-apps', 'loading', 'lockups',
      'mac-catalyst', 'machine-learning', 'managing-accounts', 'managing-notifications',
      'maps', 'materials', 'menus-and-actions', 'menus', 'messages-for-business',
      'modality', 'motion', 'multitasking', 'navigation-and-search', 'nearby-interactions',
      'nfc', 'notifications', 'offering-help', 'onboarding', 'ornaments',
      'outline-views', 'page-controls', 'panels', 'path-controls', 'patterns',
      'photo-editing', 'pickers', 'playing-audio', 'playing-haptics', 'playing-video',
      'pointing-devices', 'pop-up-buttons', 'popovers', 'presentation', 'printing',
      'privacy', 'progress-indicators', 'pull-down-buttons', 'rating-indicators',
      'ratings-and-reviews', 'remotes', 'researchkit', 'right-to-left', 'scroll-views',
      'search-fields', 'searching', 'segmented-controls', 'selection-and-input',
      'settings', 'sf-symbols', 'shareplay', 'shazamkit', 'sheets', 'sidebars',
      'sign-in-with-apple', 'siri', 'sliders', 'spatial-layout', 'split-views',
      'status-bars', 'status', 'steppers', 'system-experiences', 'tab-bars',
      'tab-views', 'tap-to-pay-on-iphone', 'technologies', 'text-fields', 'text-views',
      'the-menu-bar', 'toggles', 'token-fields', 'toolbars', 'top-shelf', 'typography',
      'undo-and-redo', 'virtual-keyboards', 'voiceover', 'wallet', 'watch-faces',
      'web-views', 'widgets', 'windows', 'workouts', 'writing'
    ];
    
    return universalTopics.includes(name.toLowerCase());
  }

  /**
   * Get content for a universal topic
   */
  private async getTopicContent(topic: string): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    // Try static content first
    if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
      try {
        const resource = await this.staticContentProvider.getResource(`hig://${topic}`);
        if (resource) {
          return {
            content: resource.content,
            name: resource.name,
            description: resource.description
          };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[HIGResourceProvider] Static content failed for topic ${topic}, falling back to scraping:`, error);
        }
      }
    }

    // Fallback to scraper
    const sections = await this.crawleeService.discoverSections();
    const topicSections = sections.filter(s => 
      s.url.includes(`/${topic}`) || s.title.toLowerCase().includes(topic.toLowerCase())
    );

    const topicName = this.formatTopicName(topic);
    let content = `# ${topicName}\n\n`;
    content += `Cross-platform design guidelines for ${topicName.toLowerCase()}.\n\n`;
    
    // Add attribution
    content += this.getAttributionText();

    if (topicSections.length === 0) {
      content += `No specific content found for ${topicName}. This may be a platform-specific topic or the content may be located in a different section.\n\n`;
      content += `Please try searching for this topic or check platform-specific resources.\n`;
    } else {
      for (const section of topicSections) {
        const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
        if (sectionWithContent.content) {
          content += `## ${section.title}\n\n`;
          content += `**Platform:** ${section.platform}\n`;
          content += `**URL:** ${section.url}\n\n`;
          content += sectionWithContent.content;
          content += '\n\n---\n\n';
        }
      }
    }

    return {
      content,
      name: topicName,
      description: `Cross-platform guidelines for ${topicName.toLowerCase()}`
    };
  }

  /**
   * Get content for a topic filtered by platform
   */
  private async getTopicPlatformContent(topic: string, platform: ApplePlatform): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    // Try static content first
    if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
      try {
        const resource = await this.staticContentProvider.getResource(`hig://${topic}/${platform.toLowerCase()}`);
        if (resource) {
          return {
            content: resource.content,
            name: resource.name,
            description: resource.description
          };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[HIGResourceProvider] Static content failed for topic ${topic}/${platform}, falling back to scraping:`, error);
        }
      }
    }

    // Fallback to scraper
    const sections = await this.crawleeService.discoverSections();
    const topicPlatformSections = sections.filter(s => 
      s.platform === platform && 
      (s.url.includes(`/${topic}`) || s.title.toLowerCase().includes(topic.toLowerCase()))
    );

    const topicName = this.formatTopicName(topic);
    let content = `# ${platform} ${topicName}\n\n`;
    content += `${platform}-specific design guidelines for ${topicName.toLowerCase()}.\n\n`;
    
    // Add attribution
    content += this.getAttributionText();

    if (topicPlatformSections.length === 0) {
      content += `No ${platform}-specific content found for ${topicName}.\n\n`;
      content += `This topic may be covered in universal guidelines or may not be applicable to ${platform}.\n`;
      content += `Try the universal topic resource: hig://${topic}\n`;
    } else {
      for (const section of topicPlatformSections) {
        const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
        if (sectionWithContent.content) {
          content += `## ${section.title}\n\n`;
          content += `**URL:** ${section.url}\n\n`;
          content += sectionWithContent.content;
          content += '\n\n---\n\n';
        }
      }
    }

    return {
      content,
      name: `${platform} ${topicName}`,
      description: `${platform}-specific guidelines for ${topicName.toLowerCase()}`
    };
  }

  /**
   * Format topic name for display
   */
  private formatTopicName(topic: string): string {
    return topic
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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