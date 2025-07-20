/**
 * Static Content Search Service
 * 
 * Provides fast, relevant search results from pre-generated static content
 * with intelligent snippet extraction and relevance scoring.
 */

import path from 'path';
import { FileSystemService } from './content/file-system.service.js';
import type { SearchIndexEntry } from './content/search-indexer.service.js';
import type { SearchResult, ApplePlatform, HIGCategory } from '../types.js';

export class StaticContentSearchService {
  private fileSystem: FileSystemService;
  private searchIndex: SearchIndexEntry[] = [];
  private contentCache = new Map<string, string>();
  private indexLoaded = false;

  constructor(private contentDirectory: string = 'content') {
    this.fileSystem = new FileSystemService();
  }

  /**
   * Load search index from generated metadata
   */
  private async loadSearchIndex(): Promise<void> {
    if (this.indexLoaded) return;

    try {
      const indexPath = path.join(this.contentDirectory, 'metadata', 'search-index.json');
      if (await this.fileSystem.exists(indexPath)) {
        const indexData = await this.fileSystem.readFile(indexPath);
        this.searchIndex = JSON.parse(indexData);
        this.indexLoaded = true;
        console.log(`📚 Loaded search index with ${this.searchIndex.length} entries`);
      } else {
        console.warn('⚠️ Search index not found, using empty index');
        this.searchIndex = [];
        this.indexLoaded = true;
      }
    } catch (error) {
      console.error('❌ Failed to load search index:', error);
      this.searchIndex = [];
      this.indexLoaded = true;
    }
  }

  /**
   * Search static content with snippet extraction
   */
  async searchContent(
    query: string, 
    platform?: ApplePlatform, 
    category?: HIGCategory, 
    limit: number = 3
  ): Promise<SearchResult[]> {
    await this.loadSearchIndex();

    if (this.searchIndex.length === 0) {
      return this.getFallbackResults(query, platform, limit);
    }

    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search through index entries
    for (const entry of this.searchIndex) {
      let relevanceScore = 0;
      const highlights: string[] = [];

      // Title matching (highest weight with exact vs partial bonuses)
      const titleLower = entry.title.toLowerCase();
      if (titleLower === queryLower) {
        // Exact title match
        relevanceScore += 1.0;
        highlights.push(entry.title);
      } else if (titleLower.includes(queryLower)) {
        // Partial title match
        relevanceScore += 0.6;
        highlights.push(entry.title);
      }

      // Keyword matching with exact match bonuses
      const keywordMatches = entry.keywords.filter(k => 
        k.toLowerCase().includes(queryLower) || queryLower.includes(k.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        // Check for exact keyword matches (higher score)
        const exactKeywordMatches = entry.keywords.filter(k => k.toLowerCase() === queryLower);
        if (exactKeywordMatches.length > 0) {
          relevanceScore += exactKeywordMatches.length * 0.4;
        } else {
          relevanceScore += keywordMatches.length * 0.25;
        }
        highlights.push(...keywordMatches);
      }

      // Snippet matching
      if (entry.snippet.toLowerCase().includes(queryLower)) {
        relevanceScore += 0.3;
      }

      // Content quality bonuses (prioritize actionable guidance)
      if (entry.hasGuidelines) {
        relevanceScore += 0.2; // Guidelines are highly valuable
      }
      
      if (entry.hasSpecifications) {
        relevanceScore += 0.15; // Specifications provide concrete values
      }
      
      if (entry.hasExamples) {
        relevanceScore += 0.1; // Examples help implementation
      }
      
      if (entry.hasStructuredContent) {
        relevanceScore += 0.05; // Well-structured content is easier to use
      }

      // Quality score bonus (0-1 scale, so weight it appropriately)
      if (entry.quality && entry.quality.score) {
        relevanceScore += entry.quality.score * 0.3; // Up to 0.3 bonus for high quality
      }

      // Apply filters
      if (platform && platform !== 'universal' && entry.platform !== platform && entry.platform !== 'universal') {
        continue;
      }

      if (category && entry.category !== category) {
        continue;
      }

      // Only include relevant results (higher threshold due to quality bonuses)
      if (relevanceScore > 0.15) {
        // Get full content instead of snippet
        const fullContent = await this.getFullContent(entry);
        
        results.push({
          id: entry.id,
          title: entry.title,
          url: entry.url,
          platform: entry.platform as ApplePlatform,
          category: entry.category as HIGCategory,
          relevanceScore,
          content: fullContent,
          type: this.determineType(entry),
          highlights: highlights.slice(0, 3) // Limit highlights
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get full content for an entry
   */
  private async getFullContent(entry: SearchIndexEntry): Promise<string> {
    try {
      const contentPath = this.getContentPath(entry);
      if (await this.fileSystem.exists(contentPath)) {
        return await this.loadContent(contentPath);
      }

      return entry.snippet || `# ${entry.title}\n\nContent not available.`;
    } catch {
      return entry.snippet || `# ${entry.title}\n\nContent unavailable.`;
    }
  }


  /**
   * Load content from file with caching
   */
  private async loadContent(contentPath: string): Promise<string> {
    if (this.contentCache.has(contentPath)) {
      const cached = this.contentCache.get(contentPath);
      return cached || '';
    }

    try {
      const content = await this.fileSystem.readFile(contentPath);
      // Extract content after front matter
      const contentStart = content.indexOf('---\n', 4);
      const actualContent = contentStart > 0 ? content.slice(contentStart + 4) : content;
      
      this.contentCache.set(contentPath, actualContent);
      return actualContent;
    } catch {
      return '';
    }
  }

  /**
   * Get content file path for an index entry
   */
  private getContentPath(entry: SearchIndexEntry): string {
    if (entry.platform === 'universal') {
      return path.join(this.contentDirectory, 'universal', entry.filename);
    } else {
      const platformDir = entry.platform.toLowerCase();
      return path.join(this.contentDirectory, 'platforms', platformDir, entry.filename);
    }
  }

  /**
   * Determine result type based on entry
   */
  private determineType(entry: SearchIndexEntry): 'section' | 'component' | 'guideline' {
    if (entry.hasGuidelines) return 'guideline';
    if (entry.title.toLowerCase().includes('button') || 
        entry.title.toLowerCase().includes('picker') ||
        entry.title.toLowerCase().includes('slider')) {
      return 'component';
    }
    return 'section';
  }

  /**
   * Fallback results when no search index is available
   */
  private getFallbackResults(query: string, platform?: ApplePlatform, limit: number = 3): SearchResult[] {
    const queryLower = query.toLowerCase();
    const fallbackItems = [
      {
        id: 'accessibility-fallback',
        title: 'Accessibility',
        url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
        platform: 'universal',
        keywords: ['accessibility', 'a11y', 'voiceover', 'contrast', 'guidelines'],
        snippet: 'Accessible user interfaces empower everyone to have a great experience with your app or game. When you design for accessibility, you reach a larger audience and create a more inclusive experience.'
      },
      {
        id: 'buttons-fallback',
        title: 'Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'universal',
        keywords: ['button', 'btn', 'interactive', 'touch', 'tap'],
        snippet: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. The minimum touch target size is 44pt x 44pt.'
      },
      {
        id: 'navigation-fallback',
        title: 'Navigation',
        url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
        platform: 'universal',
        keywords: ['navigation', 'nav', 'hierarchy', 'menu'],
        snippet: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.'
      }
    ];

    const results: SearchResult[] = [];
    
    for (const item of fallbackItems) {
      let relevanceScore = 0;
      
      if (item.title.toLowerCase().includes(queryLower)) relevanceScore += 0.8;
      if (item.keywords.some(k => k.includes(queryLower) || queryLower.includes(k))) relevanceScore += 0.6;
      if (item.snippet.toLowerCase().includes(queryLower)) relevanceScore += 0.4;
      
      if (relevanceScore > 0) {
        results.push({
          id: item.id,
          title: item.title,
          url: item.url,
          platform: item.platform as ApplePlatform,
          relevanceScore,
          content: item.snippet, // Use snippet as basic content for fallback
          type: 'guideline'
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Check if static content is available
   */
  async isContentAvailable(): Promise<boolean> {
    const indexPath = path.join(this.contentDirectory, 'metadata', 'search-index.json');
    return await this.fileSystem.exists(indexPath);
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<{ sections: number; totalSize: string }> {
    await this.loadSearchIndex();
    const totalSize = await this.fileSystem.calculateDirectorySize(this.contentDirectory);
    return {
      sections: this.searchIndex.length,
      totalSize: `${Math.round(totalSize / 1024)}KB`
    };
  }
}