/**
 * Enhanced Search Indexer Service
 * Single Responsibility: Generate and manage search indices with keyword-based search
 */

import type { ISearchIndexer } from '../interfaces/content-interfaces.js';
import type { HIGSection, ContentQualityMetrics } from '../types.js';

interface SearchIndexEntry {
  id: string;
  title: string;
  platform: string;
  category: string;
  url: string;
  keywords: string[];
  snippet: string;
  quality?: ContentQualityMetrics;
  lastUpdated?: Date;
  hasStructuredContent: boolean;
  hasGuidelines: boolean;
  hasExamples: boolean;
  hasSpecifications: boolean;
  conceptCount: number;
}

export class SearchIndexerService implements ISearchIndexer {
  private searchIndex: Record<string, SearchIndexEntry> = {};

  /**
   * Add section to search index
   */
  addSection(section: HIGSection): void {
    // Validate required fields
    if (!section.title) {
      throw new Error('Section title is required');
    }
    
    // Skip sections without content
    if (!section.content && !(section as any).structuredContent) {
      return;
    }
    
    const keywords = this.extractKeywords(section);
    const snippet = this.generateSnippet(section);
    const structureAnalysis = this.analyzeContentStructure(section);

    const entry: SearchIndexEntry = {
      id: section.id,
      title: section.title,
      platform: section.platform,
      category: section.category,
      url: section.url,
      keywords,
      snippet,
      quality: section.quality,
      lastUpdated: new Date(),
      ...structureAnalysis
    };

    this.searchIndex[section.id] = entry;
  }

  /**
   * Generate search index metadata
   */
  generateIndex(): any {

    return {
      metadata: {
        version: '2.0-keyword',
        totalSections: Object.keys(this.searchIndex).length,
        semanticEnabled: false,
        semanticStats: {
          totalIndexedSections: 0,
          isInitialized: false,
          modelLoaded: false,
          config: {}
        },
        lastUpdated: new Date().toISOString(),
        indexType: 'keyword-only'
      },
      keywordIndex: this.searchIndex,
      searchCapabilities: {
        keywordSearch: true,
        exactMatch: true,
        fieldBoostingSupported: true,
        structuredContentSearch: true,
        crossPlatformSearch: true
      }
    };
  }

  /**
   * Perform keyword-based search
   */
  async search(
    query: string, 
    sectionsOrOptions?: any[] | {
      limit?: number;
      platform?: string;
      category?: string;
      minScore?: number;
      useSemanticSearch?: boolean;
    },
    options?: {
      limit?: number;
      platform?: string;
      category?: string;
      minScore?: number;
      useSemanticSearch?: boolean;
    }
  ): Promise<any[]> {
    // Handle both old and new method signatures
    let searchOptions: any = {};
    
    if (Array.isArray(sectionsOrOptions)) {
      // Old signature: search(query, sections, options)
      searchOptions = options || {};
    } else {
      // New signature: search(query, options)
      searchOptions = sectionsOrOptions || {};
    }
    const {
      limit = 10,
      platform,
      category,
      minScore = 0.1
    } = searchOptions;

    // Simple keyword-based search through the index
    const results = Object.values(this.searchIndex)
      .map(entry => {
        let score = 0;
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

        // Title matches (highest weight)
        if (entry.title.toLowerCase().includes(queryLower)) {
          score += 3.0;
        } else {
          const titleMatches = queryWords.filter(word => 
            entry.title.toLowerCase().includes(word)
          ).length;
          score += titleMatches * 1.5;
        }

        // Keyword matches
        const keywordMatches = queryWords.filter(word =>
          entry.keywords.some(keyword => keyword.toLowerCase().includes(word))
        ).length;
        score += keywordMatches * 1.0;

        // Snippet matches
        if (entry.snippet.toLowerCase().includes(queryLower)) {
          score += 0.5;
        }

        return { ...entry, score, relevanceScore: score };
      })
      .filter(result => {
        if (result.score < minScore) return false;
        if (platform && result.platform !== platform && result.platform !== 'universal') return false;
        if (category && result.category !== category) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Extract keywords from section content
   */
  private extractKeywords(section: HIGSection): string[] {
    const text = `${section.title} ${section.content || ''} ${section.url}`.toLowerCase();
    const words = text.match(/\b\w{3,}\b/g) || [];
    
    // Remove common words
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ]);

    const keywords = [...new Set(words)]
      .filter(word => !commonWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords

    return keywords;
  }

  /**
   * Generate snippet for search results
   */
  private generateSnippet(section: HIGSection): string {
    const content = section.content || '';
    const cleanContent = content.replace(/#{1,6}\s+/g, '').replace(/\n+/g, ' ').trim();
    return cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent;
  }

  /**
   * Analyze content structure
   */
  private analyzeContentStructure(section: HIGSection): {
    hasStructuredContent: boolean;
    hasGuidelines: boolean;
    hasExamples: boolean;
    hasSpecifications: boolean;
    conceptCount: number;
  } {
    const content = section.content || '';
    const structured = (section as any).structuredContent;
    
    const analysis = {
      hasStructuredContent: content.includes('##') || content.includes('###') || !!structured,
      hasGuidelines: /guidelines?|best practices?|recommendations?/i.test(content) || 
                    !!(structured?.guidelines && structured.guidelines.length > 0),
      hasExamples: /example|for instance|such as/i.test(content) ||
                  !!(structured?.examples && structured.examples.length > 0),
      hasSpecifications: /specification|requirement|standard/i.test(content) ||
                        !!structured?.specifications,
      conceptCount: (content.match(/##\s+/g) || []).length +
                   (structured?.relatedConcepts?.length || 0)
    };
    
    
    return analysis;
  }

  /**
   * Clear search index
   */
  clear(): void {
    this.searchIndex = {};
  }

  /**
   * Get index size
   */
  getIndexSize(): number {
    return Object.keys(this.searchIndex).length;
  }

  /**
   * Get indexing statistics
   */
  getStatistics(): any {
    const entries = Object.values(this.searchIndex);
    const averageKeywordsPerSection = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.keywords.length, 0) / entries.length 
      : 0;
    
    return {
      totalSections: entries.length,
      averageKeywordCount: averageKeywordsPerSection,
      keywordIndex: {
        totalEntries: entries.length,
        averageKeywordsPerSection,
        lastUpdated: new Date().toISOString()
      },
      capabilities: {
        supportedFeatures: [
          'keyword-search',
          'field-boosting',
          'exact-match',
          'partial-match',
          'platform-filtering',
          'category-filtering'
        ],
        semanticSearchEnabled: false
      }
    };
  }

  /**
   * Check if keyword search is available
   */
  isKeywordSearchEnabled(): boolean {
    return true;
  }

  /**
   * Check if semantic search is enabled (always false now)
   */
  isSemanticSearchEnabled(): boolean {
    return false;
  }
}