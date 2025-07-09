/**
 * Static HIG Content Provider
 * 
 * Loads pre-generated HIG content from static files with fallback to live scraping.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { HIGResource, ApplePlatform, HIGCategory, SearchResult } from './types.js';
import { EnhancedKeywordSearchService } from './services/enhanced-keyword-search.service.js';

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
  private availabilityCache: boolean | null = null;
  private enhancedSearch: EnhancedKeywordSearchService;

  constructor(contentDir?: string) {
    if (contentDir) {
      this.contentDir = contentDir;
    } else {
      // Defer content directory resolution until first access
      this.contentDir = '';
    }
    
    // Initialize enhanced search service
    this.enhancedSearch = new EnhancedKeywordSearchService({
      maxResults: 20,
      minScore: 0.2
    });
  }

  /**
   * Get content directory for production environments
   */
  private getProductionContentDir(): string {
    let contentDir: string;
    
    try {
      // This will work in actual Node.js runtime but not in Jest
      // Using eval to avoid Jest parsing the import.meta.url syntax
      const importMetaUrl = eval('import.meta.url');
      const currentFileUrl = new URL(importMetaUrl);
      const currentDir = path.dirname(currentFileUrl.pathname);
      const packageRoot = path.dirname(currentDir);
      
      // For DXT installations, content is at the same level as dist/
      // So if currentDir is /path/to/extension/dist, content is at /path/to/extension/content
      contentDir = path.join(packageRoot, 'content');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] Using import.meta.url approach: ${contentDir}`);
      }
    } catch (error) {
      // Fallback for CommonJS or other environments
      const cwd = process.cwd();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] import.meta.url failed, using fallback. CWD: ${cwd}`);
      }
      
      // Try multiple potential locations
      const possiblePaths = [
        path.join(cwd, 'content'),
        path.join(path.dirname(cwd), 'content'),
        path.join(__dirname, '..', 'content'),
        path.join(__dirname, '..', '..', 'content')
      ];
      
      // Don't check directory existence during construction - defer to isAvailable()
      // Use the first path as default (will be validated later when needed)
      contentDir = possiblePaths[0];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] Content directory set to: ${contentDir}`);
      }
    }
    
    return contentDir;
  }

  /**
   * Initialize the static content provider
   */
  async initialize(): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] Initializing with content directory: ${this.contentDir}`);
      }
      
      // Check if content directory exists
      try {
        await fs.access(this.contentDir);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[StaticContent] Content directory not found: ${this.contentDir}`);
        }
        return false;
      }
      
      await this.loadMetadata();
      await this.loadSearchIndex();
      await this.loadCrossReferences();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] Initialized with ${this.metadata?.totalSections || 0} sections`);
        console.log(`[StaticContent] Content last updated: ${this.metadata?.lastUpdated || 'unknown'}`);
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
   * Check if static content is available (cached for performance)
   */
  async isAvailable(): Promise<boolean> {
    // Always check fresh during development for DXT installation
    if (process.env.NODE_ENV === 'development') {
      this.availabilityCache = null;
    }
    
    // Return cached result if available
    if (this.availabilityCache !== null) {
      return this.availabilityCache;
    }

    try {
      // Resolve content directory on first access
      if (!this.contentDir) {
        this.contentDir = this.getProductionContentDir();
      }
      
      // First check if content directory exists
      const contentStat = await fs.stat(this.contentDir);
      if (!contentStat.isDirectory()) {
        throw new Error(`Content path is not a directory: ${this.contentDir}`);
      }
      
      // Then check for metadata file
      const metadataPath = path.join(this.contentDir, 'metadata', 'generation-info.json');
      await fs.access(metadataPath);
      
      this.availabilityCache = true;
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StaticContent] Content not available: ${error.message}`);
      }
      this.availabilityCache = false;
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

    // Special update resource
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
   * Search static content with enhanced keyword matching and synonym expansion
   */
  async searchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit: number = 10): Promise<SearchResult[]> {
    if (!this.searchIndex) {
      await this.initialize();
    }
    
    if (!this.searchIndex) {
      throw new Error('Search index not available');
    }

    // Use enhanced search service with synonym expansion and better relevance scoring
    const sections = Object.values(this.searchIndex).filter(entry => entry != null);
    const results = await this.enhancedSearch.search(query, sections, platform, category);
    
    // Convert to expected format and add type field
    return results.slice(0, limit).map(result => ({
      ...result,
      type: 'section' as const
    }));
  }

  /**
   * Get synonym expansions for search terms
   */
  private expandQueryWithSynonyms(query: string): string[] {
    const synonymMap: Record<string, string[]> = {
      // Navigation & Layout
      'safe area': ['layout', 'margins', 'padding', 'insets', 'edges'],
      'layout': ['safe area', 'margins', 'padding', 'spacing', 'grid'],
      'navigation': ['nav', 'menu', 'bar', 'header', 'title'],
      'custom': ['custom interface', 'patterns', 'design patterns', 'user expectations'],
      
      // Visual Design
      'color': ['colours', 'theme', 'dark mode', 'light mode', 'contrast'],
      'contrast': ['accessibility', 'color', 'visibility', 'readability', 'wcag'],
      'accessibility': ['a11y', 'voiceover', 'accessible', 'contrast', 'inclusive'],
      
      // Components
      'button': ['btn', 'press', 'tap', 'click', 'action'],
      'text': ['typography', 'font', 'label', 'title'],
      'input': ['field', 'form', 'text field', 'entry'],
      
      // App Store & Guidelines
      'app store': ['review', 'submission', 'guidelines', 'approval'],
      'review': ['app store', 'submission', 'approval', 'guidelines'],
      'guidelines': ['principles', 'standards', 'rules', 'best practices'],
      
      // Platform specific
      'ios': ['iphone', 'ipad', 'mobile'],
      'macos': ['mac', 'desktop'],
      'watchos': ['watch', 'wearable'],
      'visionos': ['vision', 'ar', 'vr', 'spatial', 'immersive'],
      
      // Design Concepts
      'interface': ['ui', 'user interface', 'design'],
      'interaction': ['gesture', 'touch', 'tap', 'swipe'],
      'feedback': ['haptic', 'sound', 'vibration', 'response'],

      // Accessibility & Touch Targets (key missing searches)
      'touch targets': ['buttons', 'accessibility', '44pt', 'minimum size', 'tap targets'],
      'touch target': ['button', 'accessibility', '44pt', 'minimum size', 'tap target'],
      '44pt': ['touch targets', 'buttons', 'accessibility', 'minimum size'],
      'minimum size': ['44pt', 'touch targets', 'buttons', 'accessibility'],
      'wcag': ['accessibility', 'contrast', 'color', 'standards'],
      
      // Custom Interface Patterns
      'custom interface': ['patterns', 'design patterns', 'user expectations', 'standards'],
      'custom patterns': ['interface', 'design patterns', 'user expectations', 'standards'],
      'design patterns': ['custom interface', 'patterns', 'user expectations', 'standards'],
      'user expectations': ['patterns', 'custom interface', 'design patterns', 'familiar'],
      'interface standards': ['guidelines', 'patterns', 'user expectations', 'design'],
      'user interface standards': ['guidelines', 'patterns', 'expectations', 'design'],
      
      // Visual Effects & Styling
      'gradients': ['color', 'visual design', 'materials', 'backgrounds'],
      'materials': ['color', 'visual design', 'backgrounds', 'glass'],
      
      // Layout & Spacing
      'spacing': ['layout', 'margins', 'padding', 'grid'],
      'margins': ['layout', 'spacing', 'padding', 'safe area'],
      'padding': ['layout', 'spacing', 'margins', 'safe area']
    };

    const queryLower = query.toLowerCase();
    const expandedTerms = [query];
    
    // Add synonyms for exact matches
    if (synonymMap[queryLower]) {
      expandedTerms.push(...synonymMap[queryLower]);
    }
    
    // Add synonyms for partial matches
    for (const [term, synonyms] of Object.entries(synonymMap)) {
      if (queryLower.includes(term) || term.includes(queryLower)) {
        expandedTerms.push(...synonyms);
      }
    }
    
    return [...new Set(expandedTerms)]; // Remove duplicates
  }

  /**
   * Simple keyword search on static content (fallback when advanced search fails)
   */
  async keywordSearchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit: number = 10): Promise<SearchResult[]> {
    if (!this.searchIndex) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const expandedTerms = this.expandQueryWithSynonyms(query);
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
    
    // Add all expanded terms to search words
    const allSearchTerms = [
      ...queryWords,
      ...expandedTerms.flatMap(term => term.toLowerCase().split(/\s+/)).filter(word => word.length > 1)
    ];
    const uniqueSearchTerms = [...new Set(allSearchTerms)];
    
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

      // Exact title match (highest priority)
      const titleLower = indexEntry.title.toLowerCase();
      if (titleLower === queryLower) {
        relevanceScore += 5.0;
      } else if (titleLower.includes(queryLower)) {
        relevanceScore += 3.0;
      } else {
        // Individual word matches in title (including synonyms)
        const titleWordMatches = uniqueSearchTerms.filter(word => titleLower.includes(word)).length;
        if (titleWordMatches > 0) {
          relevanceScore += titleWordMatches * 1.5;
        }
      }

      // Keyword matches (including synonyms)
      const keywordMatches = uniqueSearchTerms.filter(word => 
        indexEntry.keywords.some(keyword => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))
      ).length;
      if (keywordMatches > 0) {
        relevanceScore += keywordMatches * 1.0;
      }

      // Snippet matches (lower priority, including synonyms)
      const snippetLower = indexEntry.snippet.toLowerCase();
      if (snippetLower.includes(queryLower)) {
        relevanceScore += 0.5;
      } else {
        const snippetWordMatches = uniqueSearchTerms.filter(word => snippetLower.includes(word)).length;
        if (snippetWordMatches > 0) {
          relevanceScore += snippetWordMatches * 0.3;
        }
      }

      // Boost for exact synonym matches
      const exactSynonymMatch = expandedTerms.some(term => 
        titleLower.includes(term.toLowerCase()) || 
        indexEntry.keywords.some(keyword => keyword.toLowerCase().includes(term.toLowerCase()))
      );
      if (exactSynonymMatch && expandedTerms.length > 1) {
        relevanceScore += 0.8; // Bonus for synonym matches
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
    const indexData = JSON.parse(data);
    this.searchIndex = indexData.keywordIndex || indexData;
  }

  private async loadCrossReferences(): Promise<void> {
    const refsPath = path.join(this.contentDir, 'metadata', 'cross-references.json');
    const data = await fs.readFile(refsPath, 'utf-8');
    this.crossReferences = JSON.parse(data);
  }

  private async getCategoryCount(platform: ApplePlatform, category: HIGCategory): Promise<number> {
    if (!this.searchIndex) return 0;

    return Object.values(this.searchIndex).filter(entry =>
      entry && entry.platform === platform && entry.category === category
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

  private async getUpdatesContent(_updateType: string): Promise<{
    content: string;
    name: string;
    description: string;
  }> {
    let content = `# Latest HIG Updates\n\n`;
    content += `Recent changes and additions to Apple's Human Interface Guidelines.\n\n`;
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