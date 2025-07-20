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
    limit: number = 10
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

      // Title matching (highest weight)
      if (entry.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 0.5;
        highlights.push(entry.title);
      }

      // Keyword matching
      const keywordMatches = entry.keywords.filter(k => 
        k.toLowerCase().includes(queryLower) || queryLower.includes(k.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        relevanceScore += keywordMatches.length * 0.2;
        highlights.push(...keywordMatches);
      }

      // Snippet matching
      if (entry.snippet.toLowerCase().includes(queryLower)) {
        relevanceScore += 0.3;
      }

      // Apply filters
      if (platform && platform !== 'universal' && entry.platform !== platform && entry.platform !== 'universal') {
        continue;
      }

      if (category && entry.category !== category) {
        continue;
      }

      // Only include relevant results
      if (relevanceScore > 0.1) {
        // Get enhanced snippet with query context
        const enhancedSnippet = await this.getEnhancedSnippet(entry, query);
        
        results.push({
          id: entry.id,
          title: entry.title,
          url: entry.url,
          platform: entry.platform as ApplePlatform,
          category: entry.category as HIGCategory,
          relevanceScore,
          snippet: enhancedSnippet,
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
   * Get enhanced snippet with query context
   */
  private async getEnhancedSnippet(entry: SearchIndexEntry, query: string): Promise<string> {
    try {
      // Use cached snippet first
      if (entry.snippet && entry.snippet.length > 100) {
        return this.highlightQueryInSnippet(entry.snippet, query);
      }

      // Try to load full content for better snippet extraction
      const contentPath = this.getContentPath(entry);
      if (await this.fileSystem.exists(contentPath)) {
        const fullContent = await this.loadContent(contentPath);
        const contextSnippet = this.extractContextualSnippet(fullContent, query);
        return this.highlightQueryInSnippet(contextSnippet, query);
      }

      return entry.snippet || `${entry.title} - No preview available`;
    } catch {
      return entry.snippet || `${entry.title} - Preview unavailable`;
    }
  }

  /**
   * Extract contextual snippet around query matches
   */
  private extractContextualSnippet(content: string, query: string): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Find first occurrence of query
    const index = contentLower.indexOf(queryLower);
    if (index === -1) {
      // If query not found, return first paragraph with guidelines
      const lines = content.split('\n').filter(line => line.trim().length > 50);
      for (const line of lines) {
        if (line.toLowerCase().includes('best practices') || 
            line.toLowerCase().includes('guideline') ||
            line.toLowerCase().includes('consider') ||
            line.toLowerCase().includes('ensure')) {
          return line.trim().slice(0, 300);
        }
      }
      return lines[0]?.slice(0, 300) || 'No preview available';
    }

    // Extract context around the match
    const start = Math.max(0, index - 150);
    const end = Math.min(content.length, index + 300);
    let snippet = content.slice(start, end);

    // Try to start and end at word boundaries
    if (start > 0) {
      const firstSpace = snippet.indexOf(' ');
      if (firstSpace > 0 && firstSpace < 50) {
        snippet = snippet.slice(firstSpace + 1);
      }
    }

    const lastSpace = snippet.lastIndexOf(' ');
    if (lastSpace > snippet.length - 50) {
      snippet = snippet.slice(0, lastSpace);
    }

    return snippet.trim();
  }

  /**
   * Highlight query terms in snippet
   */
  private highlightQueryInSnippet(snippet: string, _query: string): string {
    // For now, just return the snippet - highlighting can be added later
    // In a real implementation, you might wrap query terms with **bold** or similar
    return snippet;
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
  private getFallbackResults(query: string, platform?: ApplePlatform, limit: number = 10): SearchResult[] {
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
          snippet: item.snippet,
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