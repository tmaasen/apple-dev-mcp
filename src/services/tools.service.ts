/**
 * HIG Tools with Semantic Search Integration
 * 
 * Provides MCP tools with semantic search capabilities, falling back to 
 * traditional keyword search when semantic search is unavailable.
 */

import type { 
  SearchGuidelinesArgs, 
  GetComponentSpecArgs, 
  ComparePlatformsArgs,
  GetLatestUpdatesArgs,
  SearchResult,
  SemanticSearchResult,
  HIGComponent,
  HIGSection,
  ApplePlatform,
  HIGCategory
} from '../types.js';

import { SearchIndexerService } from './search-indexer.service.js';
import { ContentProcessorService } from './content-processor.service.js';
import type { HIGStaticContentProvider } from '../static-content.js';

export class HIGToolsService {
  private searchIndexer: SearchIndexerService;
  private contentProcessor: ContentProcessorService;
  private sections: HIGSection[] = [];

  constructor(
    private staticContentProvider?: HIGStaticContentProvider
  ) {
    this.contentProcessor = new ContentProcessorService();
    this.searchIndexer = new SearchIndexerService(this.contentProcessor);
    this.initializeSections();
  }

  /**
   * Initialize sections from static content provider
   */
  private async initializeSections(): Promise<void> {
    if (this.staticContentProvider) {
      try {
        const isAvailable = await this.staticContentProvider.isAvailable();
        if (isAvailable) {
          // Load all sections for semantic indexing
          console.log('[HIGTools] Loading sections for semantic indexing...');
          // This would need to be implemented in the static content provider
          // For now, we'll work with empty sections and they'll be populated as needed
        }
      } catch (error) {
        console.warn('[HIGTools] Failed to load initial sections:', error);
      }
    }
  }

  /**
   * Enhanced search with semantic capabilities
   */
  async searchGuidelines(args: SearchGuidelinesArgs): Promise<{
    results: SearchResult[] | SemanticSearchResult[];
    total: number;
    query: string;
    filters: {
      platform?: ApplePlatform;
      category?: string;
    };
    searchMethod: 'semantic' | 'keyword' | 'static' | 'fallback';
    qualityMetrics?: {
      averageRelevance: number;
      semanticEnabled: boolean;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    
    // Input validation
    this.validateSearchArgs(args);
    
    const { query, platform, category, limit = 10 } = args;
    const trimmedQuery = query.trim();
    
    try {
      let results: SearchResult[] | SemanticSearchResult[] = [];
      let searchMethod: 'semantic' | 'keyword' | 'static' | 'fallback' = 'fallback';

      // Try semantic search first if available
      if (this.searchIndexer.isSemanticSearchEnabled() && this.sections.length > 0) {
        try {
          console.log('[HIGTools] Using semantic search for:', trimmedQuery);
          results = await this.searchIndexer.search(trimmedQuery, this.sections, {
            platform,
            category,
            limit,
            useSemanticSearch: true
          }) as SemanticSearchResult[];
          searchMethod = 'semantic';
        } catch (semanticError) {
          console.warn('[HIGTools] Semantic search failed, falling back:', semanticError);
        }
      }

      // Try static content search if semantic search failed or no results
      if (results.length === 0 && this.staticContentProvider) {
        try {
          const isAvailable = await Promise.race([
            this.staticContentProvider.isAvailable(),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]);
          
          if (isAvailable) {
            results = await Promise.race([
              this.staticContentProvider.searchContent(trimmedQuery, platform, category, limit),
              new Promise<SearchResult[]>((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 3000))
            ]);
            searchMethod = 'static';
            console.log('[HIGTools] Using static content search');
          }
        } catch (staticError) {
          console.warn('[HIGTools] Static search failed:', staticError);
        }
      }

      // Try keyword search on loaded sections if still no results
      if (results.length === 0 && this.sections.length > 0) {
        try {
          results = await this.searchIndexer.search(trimmedQuery, this.sections, {
            platform,
            category,
            limit,
            useSemanticSearch: false
          }) as SearchResult[];
          searchMethod = 'keyword';
          console.log('[HIGTools] Using keyword search');
        } catch (keywordError) {
          console.warn('[HIGTools] Keyword search failed:', keywordError);
        }
      }

      // Final fallback to curated results
      if (results.length === 0) {
        results = this.getFallbackSearchResults(trimmedQuery, platform, category, limit);
        searchMethod = 'fallback';
        console.log('[HIGTools] Using fallback search');
      }

      const processingTime = Date.now() - startTime;
      
      // Calculate quality metrics
      const averageRelevance = results.length > 0 
        ? (results as (SearchResult | SemanticSearchResult)[]).reduce((sum: number, r: SearchResult | SemanticSearchResult) => sum + r.relevanceScore, 0) / results.length 
        : 0;

      return {
        results: results.slice(0, limit),
        total: results.length,
        query: trimmedQuery,
        filters: { platform, category },
        searchMethod,
        qualityMetrics: {
          averageRelevance,
          semanticEnabled: this.searchIndexer.isSemanticSearchEnabled(),
          processingTime
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[HIGTools] Search failed:', error);
      throw new Error(`Enhanced search failed: ${errorMessage}`);
    }
  }

  /**
   * Get component specifications with enhanced search
   */
  async getComponentSpec(args: GetComponentSpecArgs): Promise<{
    component: HIGComponent | null;
    relatedComponents: string[];
    platforms: ApplePlatform[];
    lastUpdated: string;
    searchContext?: {
      method: string;
      confidence: number;
      alternatives: string[];
    };
  }> {
    // Input validation
    this.validateComponentArgs(args);
    
    const { componentName, platform } = args;
    const trimmedComponentName = componentName.trim();
    
    try {
      // First try to find exact component match
      let component = this.getComponentSpecFallback(trimmedComponentName, platform);
      let searchMethod = 'exact';
      let confidence = 1.0;
      let alternatives: string[] = [];

      // If no exact match and semantic search is available, try semantic search
      if (!component && this.searchIndexer.isSemanticSearchEnabled()) {
        try {
          const searchResults = await this.searchIndexer.search(
            `${trimmedComponentName} component specification`,
            this.sections,
            { platform, limit: 5, useSemanticSearch: true }
          ) as SemanticSearchResult[];

          if (searchResults.length > 0) {
            const bestMatch = searchResults[0];
            if (bestMatch.semanticScore > 0.7) {
              // Convert search result to component format
              component = this.searchResultToComponent(bestMatch);
              searchMethod = 'semantic';
              confidence = bestMatch.semanticScore;
              alternatives = searchResults.slice(1, 4).map(r => r.title);
            }
          }
        } catch (semanticError) {
          console.warn('[HIGTools] Semantic component search failed:', semanticError);
        }
      }

      // If still no component, try keyword-based component search
      if (!component) {
        const keywordResults = await this.searchIndexer.search(
          trimmedComponentName,
          this.sections,
          { platform, limit: 3, useSemanticSearch: false }
        ) as SearchResult[];

        if (keywordResults.length > 0) {
          const bestMatch = keywordResults[0];
          if (bestMatch.relevanceScore > 0.5) {
            component = this.searchResultToComponent(bestMatch);
            searchMethod = 'keyword';
            confidence = bestMatch.relevanceScore;
            alternatives = keywordResults.slice(1).map(r => r.title);
          }
        }
      }

      if (!component) {
        return {
          component: null,
          relatedComponents: [],
          platforms: [],
          lastUpdated: new Date().toISOString(),
          searchContext: {
            method: 'none',
            confidence: 0,
            alternatives: this.getSuggestedComponents(trimmedComponentName)
          }
        };
      }

      return {
        component,
        relatedComponents: component.guidelines || [],
        platforms: component.platforms || [],
        lastUpdated: new Date().toISOString(),
        searchContext: {
          method: searchMethod,
          confidence,
          alternatives
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[HIGTools] Component spec failed:', error);
      throw new Error(`Failed to get component specification: ${errorMessage}`);
    }
  }

  /**
   * Compare platforms for a component using semantic understanding
   */
  async comparePlatforms(args: ComparePlatformsArgs): Promise<{
    componentName: string;
    platforms: ApplePlatform[];
    comparison: Array<{
      platform: ApplePlatform;
      available: boolean;
      guidelines?: string[];
      specifications?: any;
      platformSpecificNotes?: string[];
      differences?: string[];
    }>;
    semanticInsights?: {
      crossPlatformConsistency: number;
      platformSpecificFeatures: string[];
      migrationConsiderations: string[];
    };
  }> {
    this.validateComparePlatformsArgs(args);
    
    const { componentName, platforms } = args;
    
    try {
      const comparison = [];
      const semanticInsights = {
        crossPlatformConsistency: 0,
        platformSpecificFeatures: [] as string[],
        migrationConsiderations: [] as string[]
      };

      for (const platform of platforms) {
        const componentSpec = await this.getComponentSpec({ componentName, platform });
        
        comparison.push({
          platform,
          available: componentSpec.component !== null,
          guidelines: componentSpec.component?.guidelines,
          specifications: componentSpec.component?.specifications,
          platformSpecificNotes: this.getPlatformSpecificNotes(componentName, platform),
          differences: this.getPlatformDifferences(componentName, platform, platforms)
        });
      }

      // Calculate semantic insights if available
      if (this.searchIndexer.isSemanticSearchEnabled()) {
        try {
          semanticInsights.crossPlatformConsistency = this.calculateConsistencyScore(comparison);
          semanticInsights.platformSpecificFeatures = this.extractPlatformFeatures(comparison);
          semanticInsights.migrationConsiderations = this.generateMigrationTips(componentName, platforms);
        } catch (error) {
          console.warn('[HIGTools] Failed to generate semantic insights:', error);
        }
      }

      return {
        componentName,
        platforms,
        comparison,
        semanticInsights
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[HIGTools] Platform comparison failed:', error);
      throw new Error(`Platform comparison failed: ${errorMessage}`);
    }
  }

  /**
   * Get latest updates with enhanced search capabilities
   */
  async getLatestUpdates(args: GetLatestUpdatesArgs): Promise<{
    updates: Array<{
      title: string;
      platform: ApplePlatform;
      category: HIGCategory;
      url: string;
      summary: string;
      date: string;
      type: 'new' | 'updated' | 'deprecated';
      semanticTags?: string[];
    }>;
    summary: {
      total: number;
      byPlatform: Record<string, number>;
      byType: Record<string, number>;
      timeRange: string;
    };
  }> {
    this.validateUpdatesArgs(args);
    
    const { since, platform, limit = 20 } = args;
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default 90 days
    
    try {
      // For now, return curated updates with semantic enhancement capabilities
      const updates = this.getCuratedUpdates(sinceDate, platform, limit);
      
      // Add semantic tags if semantic search is available
      if (this.searchIndexer.isSemanticSearchEnabled()) {
        for (const update of updates) {
          update.semanticTags = await this.generateSemanticTags(update.summary);
        }
      }

      const summary = this.generateUpdatesSummary(updates, sinceDate);

      return { updates, summary };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[HIGTools] Get updates failed:', error);
      throw new Error(`Failed to get latest updates: ${errorMessage}`);
    }
  }

  // Private helper methods

  private validateSearchArgs(args: SearchGuidelinesArgs): void {
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { query, platform, limit = 10 } = args;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be a non-empty string');
    }
    
    if (query.length > 200) {
      throw new Error('Query too long: maximum 200 characters allowed');
    }
    
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      throw new Error('Invalid limit: must be a number between 1 and 50');
    }
  }

  private validateComponentArgs(args: GetComponentSpecArgs): void {
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { componentName, platform } = args;
    
    if (!componentName || typeof componentName !== 'string' || componentName.trim().length === 0) {
      throw new Error('Invalid componentName: must be a non-empty string');
    }
    
    if (componentName.length > 100) {
      throw new Error('Component name too long: maximum 100 characters allowed');
    }
    
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
  }

  private validateComparePlatformsArgs(args: ComparePlatformsArgs): void {
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { componentName, platforms } = args;
    
    if (!componentName || typeof componentName !== 'string' || componentName.trim().length === 0) {
      throw new Error('Invalid componentName: must be a non-empty string');
    }
    
    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new Error('Invalid platforms: must be a non-empty array');
    }
    
    if (platforms.length > 6) {
      throw new Error('Too many platforms: maximum 6 platforms allowed');
    }
    
    const validPlatforms = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'];
    for (const platform of platforms) {
      if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
      }
    }
  }

  private validateUpdatesArgs(args: GetLatestUpdatesArgs): void {
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { since, platform, limit = 20 } = args;
    
    if (since && isNaN(new Date(since).getTime())) {
      throw new Error('Invalid since date: must be a valid ISO date string');
    }
    
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new Error('Invalid limit: must be a number between 1 and 100');
    }
  }

  private getFallbackSearchResults(query: string, platform?: ApplePlatform, category?: string, limit: number = 10): SearchResult[] {
    const queryLower = query.toLowerCase();
    const fallbackData = [
      // Enhanced fallback data with better semantic context
      { keywords: ['button', 'btn', 'press', 'tap', 'click', 'action', 'cta'], title: 'Buttons', platform: 'iOS', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons', snippet: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. Learn about sizing, styling, and accessibility.' },
      { keywords: ['navigation', 'nav', 'navigate', 'menu', 'bar', 'hierarchy'], title: 'Navigation Bars', platform: 'iOS', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars', snippet: 'Navigation bars enable navigation through content hierarchy. Design clear navigation patterns with proper title placement and button organization.' },
      { keywords: ['tab', 'tabs', 'bottom', 'switching', 'sections'], title: 'Tab Bars', platform: 'iOS', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars', snippet: 'Tab bars provide quick switching between app sections. Position tabs at the bottom with clear icons and labels for optimal user experience.' },
      { keywords: ['layout', 'grid', 'spacing', 'margin', 'responsive', 'adaptive'], title: 'Layout Fundamentals', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', snippet: 'Create adaptive layouts that work across devices. Use proper spacing, alignment, and responsive design principles for consistent experiences.' },
      { keywords: ['color', 'colours', 'theme', 'dark', 'light', 'contrast', 'accessibility'], title: 'Color Guidelines', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/color', snippet: 'Color enhances user experience and provides visual hierarchy. Ensure proper contrast ratios and support for both light and dark appearances.' },
      { keywords: ['typography', 'text', 'font', 'size', 'readability', 'hierarchy'], title: 'Typography', platform: 'universal', category: 'typography', url: 'https://developer.apple.com/design/human-interface-guidelines/typography', snippet: 'Typography creates information hierarchy and improves readability. Use system fonts and proper sizing for optimal user experience across platforms.' },
      { keywords: ['accessibility', 'a11y', 'voiceover', 'accessible', 'inclusive', 'disability'], title: 'Accessibility Best Practices', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', snippet: 'Design inclusive experiences for all users. Implement proper accessibility features including VoiceOver support, color contrast, and alternative interaction methods.' },
      { keywords: ['vision', 'visionos', 'spatial', 'immersive', 'ar', 'vr', '3d'], title: 'visionOS Design Principles', platform: 'visionOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos', snippet: 'Design for spatial computing with visionOS. Create immersive experiences that blend digital content with the physical world using depth, scale, and natural interactions.' }
    ];

    const results: SearchResult[] = [];
    
    fallbackData.forEach((item, index) => {
      let relevanceScore = 0;
      
      // Enhanced keyword matching with semantic context
      const hasKeywordMatch = item.keywords.some(keyword => 
        queryLower.includes(keyword) || keyword.includes(queryLower) ||
        this.calculateSimpleSemanticSimilarity(queryLower, keyword) > 0.7
      );
      
      if (hasKeywordMatch) {
        relevanceScore = 1.0;
      }
      
      // Title and content matching
      if (item.title.toLowerCase().includes(queryLower)) {
        relevanceScore = Math.max(relevanceScore, 0.9);
      }
      
      if (item.snippet.toLowerCase().includes(queryLower)) {
        relevanceScore = Math.max(relevanceScore, 0.6);
      }
      
      // Apply filters
      if (platform && platform !== 'universal' && item.platform !== platform && item.platform !== 'universal') {
        return;
      }
      
      if (category && item.category !== category) {
        return;
      }
      
      if (relevanceScore > 0) {
        results.push({
          id: `enhanced-fallback-${index}`,
          title: item.title,
          url: item.url,
          platform: item.platform as ApplePlatform,
          relevanceScore,
          snippet: item.snippet,
          type: 'guideline' as const
        });
      }
    });
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private calculateSimpleSemanticSimilarity(text1: string, text2: string): number {
    // Simple semantic similarity based on common words and patterns
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  // Additional helper methods would be implemented here
  private getComponentSpecFallback(_componentName: string, _platform?: ApplePlatform): HIGComponent | null {
    // Implementation similar to the original but with enhanced semantic matching
    return null; // Placeholder
  }

  private searchResultToComponent(searchResult: SearchResult | SemanticSearchResult): HIGComponent {
    return {
      id: searchResult.id,
      title: searchResult.title,
      description: searchResult.snippet,
      platforms: [searchResult.platform],
      url: searchResult.url,
      lastUpdated: new Date()
    };
  }

  private getSuggestedComponents(componentName: string): string[] {
    const suggestions = ['Button', 'Navigation Bar', 'Tab Bar', 'Text Field', 'Picker', 'Slider', 'Switch'];
    return suggestions.filter(s => 
      this.calculateSimpleSemanticSimilarity(componentName.toLowerCase(), s.toLowerCase()) > 0.3
    ).slice(0, 3);
  }

  private getPlatformSpecificNotes(_componentName: string, _platform: ApplePlatform): string[] {
    // Return platform-specific implementation notes
    return [`${_componentName} implementation notes for ${_platform}`];
  }

  private getPlatformDifferences(_componentName: string, _platform: ApplePlatform, _allPlatforms: ApplePlatform[]): string[] {
    // Return differences compared to other platforms
    return [`${_componentName} differences on ${_platform} compared to other platforms`];
  }

  private calculateConsistencyScore(_comparison: any[]): number {
    // Calculate how consistent the component is across platforms
    return 0.8; // Placeholder
  }

  private extractPlatformFeatures(_comparison: any[]): string[] {
    // Extract platform-specific features
    return ['Platform-specific feature 1', 'Platform-specific feature 2'];
  }

  private generateMigrationTips(_componentName: string, _platforms: ApplePlatform[]): string[] {
    // Generate migration considerations
    return [`Consider ${_componentName} differences when migrating between ${_platforms.join(', ')}`];
  }

  private getCuratedUpdates(_sinceDate: Date, _platform?: ApplePlatform, _limit: number = 20): any[] {
    // Return curated updates - this would be enhanced with real data
    return [];
  }

  private async generateSemanticTags(_summary: string): Promise<string[]> {
    // Generate semantic tags for update summaries
    return ['tag1', 'tag2'];
  }

  private generateUpdatesSummary(updates: any[], _sinceDate: Date): any {
    return {
      total: updates.length,
      byPlatform: {},
      byType: {},
      timeRange: `Since ${_sinceDate.toISOString()}`
    };
  }

  /**
   * Get search statistics and capabilities
   */
  getStatistics() {
    const indexerStats = this.searchIndexer.getStatistics();
    
    return {
      ...indexerStats,
      sectionsLoaded: this.sections.length,
      enhancedFeatures: {
        semanticSearch: this.searchIndexer.isSemanticSearchEnabled(),
        intentRecognition: this.searchIndexer.isSemanticSearchEnabled(),
        crossPlatformComparison: true,
        qualityMetrics: true,
        fallbackSearch: true
      },
      version: '2.0-semantic'
    };
  }
}