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
    
    // First, try to find actionable guidance regardless of query location
    const actionableSnippet = this.extractActionableGuidance(content, query);
    if (actionableSnippet) {
      return actionableSnippet;
    }
    
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
   * Extract actionable guidance from content, prioritizing query-relevant guidance
   */
  private extractActionableGuidance(content: string, query: string): string | null {
    const queryLower = query.toLowerCase();
    const lines = content.split('\n');
    const actionableSections = [
      'best practices',
      'guidelines',
      'considerations',
      'recommendations',
      'do',
      'don\'t',
      'avoid',
      'ensure',
      'when to use',
      'how to use'
    ];
    
    // Look for actionable sections that contain the query term
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const isHeader = line.startsWith('#') || line.startsWith('##') || line.startsWith('###');
      
      if (isHeader && actionableSections.some(section => line.includes(section))) {
        // Found an actionable section, extract content from it
        const sectionContent = this.extractSectionContent(lines, i);
        if (sectionContent && sectionContent.length > 100) {
          // Prefer sections that mention the query term
          if (sectionContent.toLowerCase().includes(queryLower)) {
            return this.cleanAndTruncateText(sectionContent, queryLower);
          }
        }
      }
    }
    
    // Look for any actionable section as fallback
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const isHeader = line.startsWith('#') || line.startsWith('##') || line.startsWith('###');
      
      if (isHeader && actionableSections.some(section => line.includes(section))) {
        const sectionContent = this.extractSectionContent(lines, i);
        if (sectionContent && sectionContent.length > 100) {
          return this.cleanAndTruncateText(sectionContent, queryLower);
        }
      }
    }
    
    // Look for individual actionable sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      
      // Prioritize sentences that contain the query and actionable guidance
      if (sentenceLower.includes(queryLower) && (
          sentenceLower.includes('use ') ||
          sentenceLower.includes('avoid ') ||
          sentenceLower.includes('ensure ') ||
          sentenceLower.includes('consider ')
        )) {
        return this.cleanAndTruncateText(sentence.trim(), queryLower) + '.';
      }
    }
    
    return null;
  }
  
  /**
   * Extract content from a section starting at the given line index
   */
  private extractSectionContent(lines: string[], startIndex: number): string {
    const headerLevel = (lines[startIndex].match(/^#+/) || [''])[0].length;
    let content = '';
    
    // Skip the header line and collect content until next header of same or higher level
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const currentHeaderLevel = (line.match(/^#+/) || [''])[0].length;
      
      // Stop if we hit a header of same or higher level
      if (currentHeaderLevel > 0 && currentHeaderLevel <= headerLevel) {
        break;
      }
      
      // Add non-empty lines to content
      if (line.trim()) {
        content += line + ' ';
      }
      
      // Stop if we have enough content
      if (content.length > 350) {
        break;
      }
    }
    
    return content.trim();
  }
  
  /**
   * Clean markdown and truncate text, prioritizing content around query terms
   */
  private cleanAndTruncateText(text: string, queryTerm?: string): string {
    let cleaned = text
      .replace(/^#+\s*/, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // Remove emphasis
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .trim();
    
    // If we have a query term and the text is long, try to center around the query
    if (queryTerm && cleaned.length > 300) {
      const queryIndex = cleaned.toLowerCase().indexOf(queryTerm.toLowerCase());
      if (queryIndex !== -1) {
        const start = Math.max(0, queryIndex - 100);
        const end = Math.min(cleaned.length, queryIndex + 200);
        cleaned = cleaned.slice(start, end);
        
        // Clean up word boundaries
        if (start > 0) {
          const firstSpace = cleaned.indexOf(' ');
          if (firstSpace > 0 && firstSpace < 50) {
            cleaned = cleaned.slice(firstSpace + 1);
          }
        }
      }
    }
    
    return cleaned.length > 300 ? cleaned.slice(0, 300) + '...' : cleaned;
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