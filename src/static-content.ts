/**
 * Static HIG Content Provider
 * 
 * Loads pre-generated HIG content from static files with fallback to live scraping.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { HIGResource, ApplePlatform, HIGCategory, SearchResult } from './types.js';

interface StaticContentMetadata {
  lastUpdated: string;
  totalSections: number;
  sectionsByPlatform: Record<ApplePlatform, number>;
  sectionsByCategory: Record<HIGCategory, number>;
  totalSize: number;
  generationDuration: number;
}

interface SearchIndex {
  [key: string]: {
    id: string;
    title: string;
    platform: ApplePlatform;
    category: HIGCategory;
    url: string;
    keywords: string[];
    snippet: string;
  };
}

interface CrossReferences {
  [sectionId: string]: {
    relatedSections: string[];
    backlinks: string[];
    tags: string[];
  };
}

interface StaticSection {
  title: string;
  platform: ApplePlatform;
  category: HIGCategory;
  url: string;
  id: string;
  lastUpdated: string;
  content: string;
}

export class HIGStaticContentProvider {
  private contentDir: string;
  private searchIndex: SearchIndex | null = null;
  private crossReferences: CrossReferences | null = null;
  private metadata: StaticContentMetadata | null = null;
  private contentCache: Map<string, StaticSection> = new Map();

  constructor(contentDir?: string) {
    this.contentDir = contentDir || path.join(process.cwd(), 'content');
  }

  /**
   * Initialize the static content provider
   */
  async initialize(): Promise<boolean> {
    try {
      await this.loadMetadata();
      await this.loadSearchIndex();
      await this.loadCrossReferences();
      
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[StaticContent] Initialized with ${this.metadata?.totalSections || 0} sections`);
          console.log(`[StaticContent] Content last updated: ${this.metadata?.lastUpdated || 'unknown'}`);
        }
      }
      
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[StaticContent] Failed to initialize:', error);
        }
      }
      return false;
    }
  }

  /**
   * Check if static content is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const metadataPath = path.join(this.contentDir, 'metadata', 'generation-info.json');
      await fs.access(metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get content age in milliseconds
   */
  getContentAge(): number | null {
    if (!this.metadata) return null;
    
    const lastUpdated = new Date(this.metadata.lastUpdated);
    return Date.now() - lastUpdated.getTime();
  }

  /**
   * Check if content is stale (older than 6 months)
   */
  isContentStale(): boolean {
    const age = this.getContentAge();
    if (age === null) return true;
    
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
    return age > sixMonthsInMs;
  }

  /**
   * List all available resources
   */
  async listResources(): Promise<HIGResource[]> {
    if (!await this.isAvailable()) {
      throw new Error('Static content not available');
    }

    const resources: HIGResource[] = [];
    const platforms: ApplePlatform[] = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'];

    // Platform-specific resources
    for (const platform of platforms) {
      if (this.metadata?.sectionsByPlatform?.[platform] && this.metadata.sectionsByPlatform[platform] > 0) {
        resources.push({
          uri: `hig://${platform.toLowerCase()}`,
          name: `${platform} Human Interface Guidelines`,
          description: `Complete design guidelines for ${platform} development with the latest design system updates`,
          mimeType: 'text/markdown',
          content: '' // Will be loaded on demand
        });

        // Category-specific resources
        const categories: HIGCategory[] = [
          'foundations', 'layout', 'navigation', 'presentation',
          'selection-and-input', 'visual-design', 'color-and-materials',
          'typography', 'motion', 'technologies'
        ];

        for (const category of categories) {
          const categoryCount = await this.getCategoryCount(platform, category);
          if (categoryCount > 0) {
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

    // Universal resources
    if (this.metadata?.sectionsByPlatform?.universal && this.metadata.sectionsByPlatform.universal > 0) {
      resources.push({
        uri: 'hig://universal',
        name: 'Universal Design Guidelines',
        description: 'Cross-platform design principles and modern design system features',
        mimeType: 'text/markdown',
        content: ''
      });
    }

    // Special update resources
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

    return resources;
  }

  /**
   * Get content for a specific resource
   */
  async getResource(uri: string): Promise<HIGResource | null> {
    if (!await this.isAvailable()) {
      throw new Error('Static content not available');
    }

    const parsed = this.parseResourceURI(uri);
    if (!parsed) return null;

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

    return {
      uri,
      name,
      description,
      mimeType: 'text/markdown',
      content
    };
  }

  /**
   * Search static content
   */
  async searchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit: number = 10): Promise<SearchResult[]> {
    if (!this.searchIndex) {
      throw new Error('Search index not available');
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const results: SearchResult[] = [];

    for (const indexEntry of Object.values(this.searchIndex)) {
      // Apply platform filter
      if (platform && platform !== 'universal' && 
          indexEntry.platform !== platform && indexEntry.platform !== 'universal') {
        continue;
      }

      // Apply category filter
      if (category && indexEntry.category !== category) {
        continue;
      }

      let relevanceScore = 0;

      // Check title matches
      const titleLower = indexEntry.title.toLowerCase();
      if (titleLower.includes(queryLower)) {
        relevanceScore += 3.0;
      } else {
        const titleWordMatches = queryWords.filter(word => titleLower.includes(word)).length;
        if (titleWordMatches > 0) {
          relevanceScore += titleWordMatches * 1.5;
        }
      }

      // Check keyword matches
      const keywordMatches = queryWords.filter(word => 
        indexEntry.keywords.some(keyword => keyword.includes(word))
      ).length;
      if (keywordMatches > 0) {
        relevanceScore += keywordMatches * 1.0;
      }

      // Check snippet matches
      const snippetLower = indexEntry.snippet.toLowerCase();
      if (snippetLower.includes(queryLower)) {
        relevanceScore += 0.5;
      }

      if (relevanceScore > 0) {
        results.push({
          id: indexEntry.id,
          title: indexEntry.title,
          url: indexEntry.url,
          platform: indexEntry.platform,
          relevanceScore,
          snippet: indexEntry.snippet,
          type: 'section'
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get a specific section by ID
   */
  async getSection(sectionId: string): Promise<StaticSection | null> {
    // Check cache first
    if (this.contentCache.has(sectionId)) {
      return this.contentCache.get(sectionId)!;
    }

    const indexEntry = this.searchIndex?.[sectionId];
    if (!indexEntry) return null;

    try {
      const filename = this.generateFilename(indexEntry.title);
      const filePath = path.join(
        this.contentDir,
        'platforms',
        indexEntry.platform.toLowerCase(),
        filename
      );

      const content = await fs.readFile(filePath, 'utf-8');
      const section = this.parseMarkdownFile(content);

      // Cache the section
      this.contentCache.set(sectionId, section);

      return section;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[StaticContent] Failed to load section ${sectionId}:`, error);
        }
      }
      return null;
    }
  }

  /**
   * Get related sections for a given section ID
   */
  getRelatedSections(sectionId: string): string[] {
    return this.crossReferences?.[sectionId]?.relatedSections || [];
  }

  /**
   * Get generation metadata
   */
  getMetadata(): StaticContentMetadata | null {
    return this.metadata;
  }

  // Private helper methods

  private async loadMetadata(): Promise<void> {
    const metadataPath = path.join(this.contentDir, 'metadata', 'generation-info.json');
    const data = await fs.readFile(metadataPath, 'utf-8');
    this.metadata = JSON.parse(data);
  }

  private async loadSearchIndex(): Promise<void> {
    const indexPath = path.join(this.contentDir, 'metadata', 'search-index.json');
    const data = await fs.readFile(indexPath, 'utf-8');
    this.searchIndex = JSON.parse(data);
  }

  private async loadCrossReferences(): Promise<void> {
    const refsPath = path.join(this.contentDir, 'metadata', 'cross-references.json');
    const data = await fs.readFile(refsPath, 'utf-8');
    this.crossReferences = JSON.parse(data);
  }

  private async getCategoryCount(platform: ApplePlatform, category: HIGCategory): Promise<number> {
    if (!this.searchIndex) return 0;

    return Object.values(this.searchIndex).filter(entry =>
      entry.platform === platform && entry.category === category
    ).length;
  }

  private parseResourceURI(uri: string): {
    type: 'platform' | 'category' | 'updates';
    platform?: ApplePlatform;
    category?: HIGCategory;
    updateType?: string;
  } | null {
    const match = uri.match(/^hig:\/\/([^/]+)(?:\/(.+))?$/);
    if (!match) return null;

    const [, first, second] = match;

    if (first === 'updates') {
      return {
        type: 'updates',
        updateType: second || 'latest'
      };
    }

    const platform = this.stringToPlatform(first);
    if (!platform) return null;

    if (!second) {
      return {
        type: 'platform',
        platform
      };
    }

    const category = this.stringToCategory(second);
    if (!category) return null;

    return {
      type: 'category',
      platform,
      category
    };
  }

  private async getPlatformContent(platform: ApplePlatform): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    const sections = await this.getSectionsForPlatform(platform);
    
    let content = `# ${platform} Human Interface Guidelines\n\n`;
    content += `This document contains the complete design guidelines for ${platform} development.\n\n`;
    content += this.getAttributionText();

    for (const section of sections) {
      content += `## ${section.title}\n\n`;
      content += `**URL:** ${section.url}\n\n`;
      content += section.content;
      content += '\n\n---\n\n';
    }

    return {
      content,
      name: `${platform} Human Interface Guidelines`,
      description: `Complete design guidelines for ${platform} development`
    };
  }

  private async getCategoryContent(platform: ApplePlatform, category: HIGCategory): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    const sections = await this.getSectionsForCategory(platform, category);
    
    const categoryName = this.formatCategoryName(category);
    let content = `# ${platform} ${categoryName}\n\n`;
    content += `Guidelines for ${categoryName.toLowerCase()} in ${platform} applications.\n\n`;
    content += this.getAttributionText();

    for (const section of sections) {
      content += `## ${section.title}\n\n`;
      content += `**URL:** ${section.url}\n\n`;
      content += section.content;
      content += '\n\n---\n\n';
    }

    return {
      content,
      name: `${platform} ${categoryName}`,
      description: `${platform} guidelines for ${categoryName.toLowerCase()}`
    };
  }

  private async getUpdatesContent(updateType: string): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    if (updateType === 'latest-design-system') {
      let content = `# Latest Apple Design System Updates\n\n`;
      content += `Apple's most recent design language updates, featuring advanced materials and visual elements.\n\n`;
      content += this.getAttributionText();
      content += `## Recent Updates\n\n`;
      content += `- **Enhanced Design System**: Major visual improvements with advanced materials\n`;
      content += `- **Unified Design Language**: Consistent design patterns across all Apple platforms\n`;
      content += `- **Updated APIs**: Latest SwiftUI, UIKit, and AppKit capabilities\n\n`;
      
      // Add content age information
      if (this.metadata) {
        const age = this.getContentAge();
        const lastUpdated = new Date(this.metadata.lastUpdated);
        content += `## Content Information\n\n`;
        content += `- **Last Updated**: ${lastUpdated.toLocaleDateString()}\n`;
        content += `- **Total Sections**: ${this.metadata.totalSections}\n`;
        content += `- **Content Age**: ${age ? Math.floor(age / (24 * 60 * 60 * 1000)) : 'unknown'} days\n\n`;
      }
      
      return {
        content,
        name: 'Latest Design System Updates',
        description: 'Current Apple design language featuring advanced materials and interface elements'
      };
    }

    // Default to latest updates
    let content = `# Latest HIG Updates\n\n`;
    content += `Recent changes and additions to Apple's Human Interface Guidelines.\n\n`;
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

  private async getSectionsForPlatform(platform: ApplePlatform): Promise<StaticSection[]> {
    if (!this.searchIndex) return [];

    const sectionIds = Object.keys(this.searchIndex).filter(id =>
      this.searchIndex![id].platform === platform
    );

    const sections: StaticSection[] = [];
    for (const id of sectionIds) {
      const section = await this.getSection(id);
      if (section) sections.push(section);
    }

    return sections;
  }

  private async getSectionsForCategory(platform: ApplePlatform, category: HIGCategory): Promise<StaticSection[]> {
    if (!this.searchIndex) return [];

    const sectionIds = Object.keys(this.searchIndex).filter(id => {
      const entry = this.searchIndex![id];
      return entry.platform === platform && entry.category === category;
    });

    const sections: StaticSection[] = [];
    for (const id of sectionIds) {
      const section = await this.getSection(id);
      if (section) sections.push(section);
    }

    return sections;
  }

  private generateFilename(title: string): string {
    return title
      .replace(/^(iOS|macOS|watchOS|tvOS|visionOS)\s+/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.md';
  }

  private parseMarkdownFile(content: string): StaticSection {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontMatterMatch) {
      throw new Error('Invalid markdown file format');
    }

    const frontMatter = frontMatterMatch[1];
    const markdownContent = frontMatterMatch[2];

    // Simple front matter parsing
    const metadata: any = {};
    frontMatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    });

    return {
      title: metadata.title,
      platform: metadata.platform,
      category: metadata.category,
      url: metadata.url,
      id: metadata.id,
      lastUpdated: metadata.lastUpdated,
      content: markdownContent
    };
  }

  private getAttributionText(): string {
    return `---
**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.

---

`;
  }

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