/**
 * Enhanced Search Indexer Service
 * Single Responsibility: Generate and manage search indices with semantic enhancement
 */

import type { ISearchIndexer, IContentProcessor } from '../interfaces/content-interfaces.js';
import type { HIGSection, ContentQualityMetrics, SearchConfig } from '../types.js';
import { SemanticSearchService } from './semantic-search.service.js';

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
  private semanticSearchService: SemanticSearchService | null;
  private isSemanticEnabled = false;

  constructor(
    private contentProcessor: IContentProcessor,
    semanticConfig?: Partial<SearchConfig>
  ) {
    // Check if semantic search is disabled via environment variable
    if (process.env.DISABLE_SEMANTIC_SEARCH === 'true') {
      console.log('[SearchIndexer] ⚡ Using keyword search only (DISABLE_SEMANTIC_SEARCH=true)');
      this.isSemanticEnabled = false;
      // Don't create SemanticSearchService at all when disabled
      this.semanticSearchService = null;
    } else {
      this.semanticSearchService = new SemanticSearchService(semanticConfig);
      console.log('[SearchIndexer] 🔧 Attempting semantic search initialization in background...');
      // Initialize semantic search in background, don't block constructor
      setTimeout(() => {
        this.initializeSemanticSearch().catch(() => {
          // Silently handled in initializeSemanticSearch method
        });
      }, 0);
    }
  }

  /**
   * Initialize semantic search capabilities
   */
  private async initializeSemanticSearch(): Promise<void> {
    if (!this.semanticSearchService) {
      this.isSemanticEnabled = false;
      return;
    }
    
    try {
      await this.semanticSearchService.initialize();
      
      // Check if semantic search actually initialized successfully
      const stats = this.semanticSearchService.getStatistics();
      if (stats.isInitialized && stats.modelLoaded) {
        this.isSemanticEnabled = true;
        console.log('[SearchIndexer] ✅ Semantic search enabled');
      } else {
        this.isSemanticEnabled = false;
        console.log('[SearchIndexer] ⚠️ Semantic search disabled, using keyword search only');
      }
    } catch (error) {
      console.warn('[SearchIndexer] ⚠️ Semantic search initialization failed, falling back to keyword search:', error);
      this.isSemanticEnabled = false;
    }
  }

  /**
   * Add section to both traditional and semantic indices (synchronous version for interface compatibility)
   */
  addSection(section: HIGSection): void {
    if (!section.content) {
      console.warn(`Skipping section ${section.id} - no content available`);
      return;
    }

    // Traditional indexing
    const keywords = this.contentProcessor.extractKeywords(section.content, section);
    const snippet = this.contentProcessor.extractSnippet(section.content);

    // Enhanced index entry with structured content support
    const structuredContent = (section as any).structuredContent;
    
    this.searchIndex[section.id] = {
      id: section.id,
      title: section.title,
      platform: section.platform,
      category: section.category,
      url: section.url,
      keywords,
      snippet,
      quality: section.quality,
      lastUpdated: section.lastUpdated,
      // Enhanced fields for better search
      hasStructuredContent: !!structuredContent,
      hasGuidelines: structuredContent?.guidelines?.length > 0,
      hasExamples: structuredContent?.examples?.length > 0,
      hasSpecifications: !!structuredContent?.specifications,
      conceptCount: structuredContent?.relatedConcepts?.length || 0
    };

    // Semantic indexing (only if enabled)
    if (this.isSemanticEnabled) {
      this.addSectionSemanticAsync(section).catch(error => {
        console.warn(`[SearchIndexer] Background semantic indexing failed for ${section.id}:`, error);
      });
    }
  }

  /**
   * Async semantic indexing (background operation)
   */
  private async addSectionSemanticAsync(section: HIGSection): Promise<void> {
    if (this.isSemanticEnabled && this.semanticSearchService) {
      try {
        await this.semanticSearchService.indexSection(section);
      } catch (error) {
        console.warn(`[SearchIndexer] Failed to semantically index section ${section.id}:`, error);
      }
    }
  }

  /**
   * Generate enhanced search index
   */
  generateIndex(): Record<string, any> {
    const stats = this.semanticSearchService ? this.semanticSearchService.getStatistics() : {
      totalIndexedSections: 0,
      isInitialized: false,
      modelLoaded: false,
      config: {}
    };
    
    return {
      metadata: {
        version: '2.0-semantic',
        totalSections: Object.keys(this.searchIndex).length,
        semanticEnabled: this.isSemanticEnabled,
        semanticStats: stats,
        lastUpdated: new Date().toISOString(),
        indexType: 'hybrid-semantic-keyword'
      },
      keywordIndex: { ...this.searchIndex },
      searchCapabilities: {
        keywordSearch: true,
        semanticSearch: this.isSemanticEnabled,
        structuredContentSearch: true,
        conceptSearch: this.isSemanticEnabled,
        intentRecognition: this.isSemanticEnabled,
        crossPlatformSearch: true,
        categoryFiltering: true,
        qualityFiltering: true
      }
    };
  }

  /**
   * Perform enhanced search with semantic capabilities
   */
  async search(
    query: string,
    sections: HIGSection[],
    options: {
      platform?: string;
      category?: string;
      limit?: number;
      useSemanticSearch?: boolean;
    } = {}
  ) {
    const {
      platform,
      category,
      limit = 10,
      useSemanticSearch = this.isSemanticEnabled
    } = options;

    // Use semantic search if available and requested
    if (useSemanticSearch && this.isSemanticEnabled && this.semanticSearchService) {
      try {
        return await this.semanticSearchService.search(
          query,
          sections,
          platform as any,
          category as any,
          limit
        );
      } catch (error) {
        console.warn('[SearchIndexer] Semantic search failed, falling back to keyword search:', error);
      }
    }

    // Fallback to traditional keyword search
    return this.keywordSearch(query, sections, { platform, category, limit });
  }

  /**
   * Traditional keyword-based search
   */
  private keywordSearch(
    query: string,
    sections: HIGSection[],
    options: { platform?: string; category?: string; limit?: number }
  ) {
    const { platform, category, limit = 10 } = options;
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

    const results = sections
      .map(section => {
        const indexEntry = this.searchIndex[section.id];
        if (!indexEntry) return null;

        let score = 0;

        // Title matching (highest weight)
        if (section.title.toLowerCase().includes(queryLower)) {
          score += 10;
        }

        // Keyword matching
        const keywordMatches = indexEntry.keywords.filter((keyword: string) =>
          queryWords.some(word => keyword.toLowerCase().includes(word))
        ).length;
        score += keywordMatches * 3;

        // Content matching
        const contentMatches = queryWords.filter(word =>
          (section.content || '').toLowerCase().includes(word)
        ).length;
        score += contentMatches;

        // Platform and category filtering/boosting
        if (platform && section.platform === platform) score += 2;
        else if (platform && section.platform !== platform && section.platform !== 'universal') return null;

        if (category && section.category === category) score += 2;
        else if (category && section.category !== category) return null;

        return {
          ...indexEntry,
          relevanceScore: score,
          snippet: indexEntry.snippet,
          type: 'section' as const
        };
      })
      .filter(result => result !== null && result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return results;
  }

  /**
   * Clear all indices
   */
  clear(): void {
    this.searchIndex = {};
    if (this.semanticSearchService) {
      this.semanticSearchService.clearIndices();
    }
  }

  /**
   * Get indexing statistics
   */
  getStatistics() {
    const semanticStats = this.semanticSearchService ? this.semanticSearchService.getStatistics() : {
      totalIndexedSections: 0,
      isInitialized: false,
      modelLoaded: false,
      config: {}
    };
    
    return {
      keywordIndex: {
        totalEntries: Object.keys(this.searchIndex).length,
        averageKeywordsPerSection: this.calculateAverageKeywords(),
      },
      semanticIndex: semanticStats,
      capabilities: {
        semanticSearchEnabled: this.isSemanticEnabled,
        supportedFeatures: [
          'keyword-search',
          'platform-filtering',
          'category-filtering',
          'quality-scoring',
          ...(this.isSemanticEnabled ? [
            'semantic-similarity',
            'intent-recognition',
            'concept-matching',
            'contextual-relevance'
          ] : [])
        ]
      }
    };
  }

  private calculateAverageKeywords(): number {
    const entries = Object.values(this.searchIndex);
    if (entries.length === 0) return 0;
    
    const totalKeywords = entries.reduce((sum, entry: any) => 
      sum + (entry.keywords?.length || 0), 0
    );
    
    return totalKeywords / entries.length;
  }

  getIndexSize(): number {
    return Object.keys(this.searchIndex).length;
  }

  /**
   * Check if semantic search is available
   */
  isSemanticSearchEnabled(): boolean {
    return this.isSemanticEnabled;
  }
}