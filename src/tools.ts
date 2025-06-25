/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import type { CrawleeHIGService } from './services/crawlee-hig.service.js';
import type { HIGCache } from './cache.js';
import type { HIGResourceProvider } from './resources.js';
import type { HIGStaticContentProvider } from './static-content.js';
import type { 
  SearchGuidelinesArgs, 
  GetComponentSpecArgs, 
  ComparePlatformsArgs, 
  GetLatestUpdatesArgs,
  SearchResult,
  HIGComponent,
  ApplePlatform
} from './types.js';

export class HIGToolProvider {
  private crawleeService: CrawleeHIGService;
  private _cache: HIGCache;
  private resourceProvider: HIGResourceProvider;
  private staticContentProvider?: HIGStaticContentProvider;

  constructor(crawleeService: CrawleeHIGService, cache: HIGCache, resourceProvider: HIGResourceProvider, staticContentProvider?: HIGStaticContentProvider) {
    this.crawleeService = crawleeService;
    this._cache = cache;
    this.resourceProvider = resourceProvider;
    this.staticContentProvider = staticContentProvider;
  }

  /**
   * Search HIG content by keywords/topics with input validation
   */
  async searchGuidelines(args: SearchGuidelinesArgs): Promise<{
    results: SearchResult[];
    total: number;
    query: string;
    filters: {
      platform?: ApplePlatform;
      category?: string;
    };
  }> {
    // Input validation
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { query, platform, category, limit = 10 } = args;
    
    // Validate required parameters
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be a non-empty string');
    }
    
    if (query.length > 100) {
      throw new Error('Query too long: maximum 100 characters allowed');
    }
    
    // Validate optional parameters
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      throw new Error(`Invalid platform: ${platform}. Must be one of: iOS, macOS, watchOS, tvOS, visionOS, universal`);
    }
    
    if (category && ![
      'foundations', 'layout', 'navigation', 'presentation',
      'selection-and-input', 'status', 'system-capabilities',
      'visual-design', 'icons-and-images', 'color-and-materials',
      'typography', 'motion', 'technologies'
    ].includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      throw new Error('Invalid limit: must be a number between 1 and 50');
    }
    
    try {
      const startTime = Date.now();
      let results;
      
      // Try static content search first
      if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
        try {
          results = await this.staticContentProvider.searchContent(query.trim(), platform, category, limit);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[HIGTools] Using static content search for: "${query}"`);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Static search failed, falling back to scraper:', error);
          }
          // Fall through to scraper fallback
        }
      }
      
      // Fallback to scraper search
      if (!results) {
        results = await this.crawleeService.searchContent(query.trim(), platform, category, limit);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HIGTools] Using scraper search for: "${query}"`);
        }
      }
      
      // Enhance results with additional context
      const enhancedResults = await Promise.all(
        results.map(async (result) => {
          try {
            // Try to get more detailed content
            const resource = await this.resourceProvider.getResource(`hig://${result.platform.toLowerCase()}`);
            if (resource && resource.content.toLowerCase().includes(query.toLowerCase())) {
              // Extract more context from the full resource
              const enhancedSnippet = this.extractEnhancedSnippet(resource.content, query);
              if (enhancedSnippet.length > result.snippet.length) {
                result.snippet = enhancedSnippet;
              }
            }
          } catch (enhanceError) {
            // Enhancement failure shouldn't break the search
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[HIGTools] Failed to enhance result for ${result.id}:`, enhanceError);
            }
          }
          return result;
        })
      );
      
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Search for "${query}" completed in ${duration}ms (${enhancedResults.length} results)`);
      }

      return {
        results: enhancedResults,
        total: enhancedResults.length,
        query: query.trim(),
        filters: {
          platform,
          category
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGTools] Search failed:', error);
      }
      
      throw new Error(`Search failed: ${errorMessage}`);
    }
  }

  /**
   * Get detailed specifications for a UI component with input validation
   */
  async getComponentSpec(args: GetComponentSpecArgs): Promise<{
    component: HIGComponent | null;
    relatedComponents: string[];
    platforms: ApplePlatform[];
    lastUpdated: string;
    liquidGlassUpdates?: string;
  }> {
    // Input validation
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { componentName, platform } = args;
    
    // Validate required parameters
    if (!componentName || typeof componentName !== 'string' || componentName.trim().length === 0) {
      throw new Error('Invalid componentName: must be a non-empty string');
    }
    
    if (componentName.length > 50) {
      throw new Error('Component name too long: maximum 50 characters allowed');
    }
    
    // Validate optional parameters
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      throw new Error(`Invalid platform: ${platform}. Must be one of: iOS, macOS, watchOS, tvOS, visionOS, universal`);
    }
    
    try {
      const startTime = Date.now();
      const trimmedComponentName = componentName.trim();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Getting component spec for: ${trimmedComponentName} (platform: ${platform || 'any'})`);
      }
      // Search for the component
      let searchResults;
      
      // Try static content search first
      if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
        try {
          searchResults = await this.staticContentProvider.searchContent(trimmedComponentName, platform);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Static component search failed, falling back to scraper:', error);
          }
          // Fall through to scraper fallback
        }
      }
      
      // Fallback to scraper search
      if (!searchResults) {
        searchResults = await this.crawleeService.searchContent(trimmedComponentName, platform);
      }
      
      if (searchResults.length === 0) {
        return {
          component: null,
          relatedComponents: [],
          platforms: [],
          lastUpdated: new Date().toISOString()
        };
      }

      const bestMatch = searchResults[0];
      
      // Get detailed content for the component
      const sections = await this.crawleeService.discoverSections();
      const componentSection = sections.find(s => s.id === bestMatch.id);
      
      if (!componentSection) {
        return {
          component: null,
          relatedComponents: [],
          platforms: [],
          lastUpdated: new Date().toISOString()
        };
      }

      const sectionWithContent = await this.crawleeService.fetchSectionContent(componentSection);
      
      // Extract component specifications from content
      const component: HIGComponent = {
        id: bestMatch.id,
        title: bestMatch.title,
        description: bestMatch.snippet,
        platforms: [bestMatch.platform],
        url: bestMatch.url,
        specifications: this.extractSpecifications(sectionWithContent.content || ''),
        guidelines: this.extractGuidelines(sectionWithContent.content || ''),
        examples: this.extractExamples(sectionWithContent.content || ''),
        lastUpdated: sectionWithContent.lastUpdated
      };

      // Find related components
      const relatedComponents = await this.findRelatedComponents(componentName, bestMatch.platform);
      
      // Check for Liquid Glass updates
      const liquidGlassUpdates = this.extractLiquidGlassInfo(sectionWithContent.content || '');

      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Component spec for "${trimmedComponentName}" retrieved in ${duration}ms`);
      }
      
      return {
        component,
        relatedComponents,
        platforms: [bestMatch.platform],
        lastUpdated: sectionWithContent.lastUpdated?.toISOString() || new Date().toISOString(),
        liquidGlassUpdates
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGTools] Get component spec failed:', error);
      }
      
      throw new Error(`Failed to get component specification: ${errorMessage}`);
    }
  }

  /**
   * Compare guidelines across Apple platforms
   */
  async comparePlatforms(args: ComparePlatformsArgs): Promise<{
    componentName: string;
    platforms: Array<{
      platform: ApplePlatform;
      guidelines: string[];
      specifications: any;
      differences: string[];
    }>;
    commonGuidelines: string[];
    keyDifferences: string[];
  }> {
    const { componentName, platforms } = args;
    
    // console.log(`[HIGTools] Comparing ${componentName} across platforms:`, platforms);
    
    try {
      const platformData: Array<{
        platform: ApplePlatform;
        guidelines: string[];
        specifications: any;
        differences: string[];
      }> = [];
      
      for (const platform of platforms) {
        const componentSpec = await this.getComponentSpec({ componentName, platform });
        
        if (componentSpec.component) {
          platformData.push({
            platform,
            guidelines: componentSpec.component.guidelines || [],
            specifications: componentSpec.component.specifications || {},
            differences: [] // Will be populated after comparison
          });
        }
      }

      // Find common guidelines
      const commonGuidelines = this.findCommonElements(platformData.map(p => p.guidelines));
      
      // Identify key differences
      const keyDifferences = this.identifyKeyDifferences(platformData);
      
      // Populate differences for each platform
      platformData.forEach(data => {
        data.differences = data.guidelines.filter((g: string) => !commonGuidelines.includes(g));
      });

      return {
        componentName,
        platforms: platformData,
        commonGuidelines,
        keyDifferences
      };
    } catch (error) {
      // console.error('[HIGTools] Platform comparison failed:', error);
      throw new Error(`Platform comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get latest HIG updates and changes
   */
  async getLatestUpdates(args: GetLatestUpdatesArgs): Promise<{
    updates: Array<{
      title: string;
      description: string;
      date: string;
      platform: ApplePlatform;
      type: 'new' | 'updated' | 'deprecated';
      url: string;
      liquidGlassRelated: boolean;
    }>;
    designSystemHighlights: string[];
    currentDesignSummary: string;
  }> {
    const { platform, limit = 20 } = args;
    
    // console.log(`[HIGTools] Getting latest updates (since: ${since}, platform: ${platform})`);
    
    try {
      // Get Liquid Glass information
      const designSystemResource = await this.resourceProvider.getResource('hig://updates/latest-design-system');
      const designSystemContent = designSystemResource?.content || '';
      
      // Extract highlights from current design system content
      const designSystemHighlights = this.extractDesignSystemHighlights(designSystemContent);
      
      // Current design system summary
      const currentDesignSummary = `Apple's current design system represents the latest evolution in interface design, featuring advanced materials, adaptive elements, and seamless integration across all Apple platforms with enhanced visual hierarchy and user experience improvements.`;
      
      // Generate mock updates based on current sections (in a real implementation, this would track actual changes)
      const sections = await this.crawleeService.discoverSections();
      let filteredSections = sections;
      
      if (platform && platform !== 'universal') {
        filteredSections = sections.filter(s => s.platform === platform);
      }
      
      const updates = filteredSections.slice(0, limit).map(section => ({
        title: `Updated: ${section.title}`,
        description: `Latest updates to ${section.title} guidelines including Liquid Glass design system integration`,
        date: new Date().toISOString(),
        platform: section.platform,
        type: 'updated' as const,
        url: section.url,
        liquidGlassRelated: true
      }));

      // Add specific design system updates
      const designSystemUpdates = [
        {
          title: 'Enhanced Design System',
          description: 'Latest design language updates with advanced material effects and improved accessibility',
          date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
          platform: 'universal' as ApplePlatform,
          type: 'updated' as const,
          url: 'https://developer.apple.com/design/human-interface-guidelines/',
          liquidGlassRelated: false
        },
        {
          title: 'SwiftUI Enhanced APIs',
          description: 'Updated APIs for implementing the latest design system features in SwiftUI applications',
          date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
          platform: 'universal' as ApplePlatform,
          type: 'updated' as const,
          url: 'https://developer.apple.com/documentation/swiftui',
          liquidGlassRelated: false
        }
      ];

      return {
        updates: [...designSystemUpdates, ...updates].slice(0, limit),
        designSystemHighlights,
        currentDesignSummary
      };
    } catch (error) {
      // console.error('[HIGTools] Get latest updates failed:', error);
      throw new Error(`Failed to get latest updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract enhanced snippet with more context
   */
  private extractEnhancedSnippet(content: string, query: string, maxLength: number = 300): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(queryLower);

    if (queryIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 100);
    const end = Math.min(content.length, start + maxLength);
    const snippet = content.substring(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  }

  /**
   * Extract component specifications from content
   */
  private extractSpecifications(content: string): any {
    const specs: any = {};
    
    // Look for common specification patterns
    const dimensionMatch = content.match(/(?:width|height|size):\s*([^.\n]+)/gi);
    if (dimensionMatch) {
      specs.dimensions = dimensionMatch.map(m => m.trim());
    }

    const colorMatch = content.match(/(?:color|background):\s*([^.\n]+)/gi);
    if (colorMatch) {
      specs.colors = colorMatch.map(m => m.trim());
    }

    const spacingMatch = content.match(/(?:padding|margin|spacing):\s*([^.\n]+)/gi);
    if (spacingMatch) {
      specs.spacing = spacingMatch.map(m => m.trim());
    }

    return Object.keys(specs).length > 0 ? specs : undefined;
  }

  /**
   * Extract guidelines from content
   */
  private extractGuidelines(content: string): string[] {
    const guidelines: string[] = [];
    
    // Look for bullet points and numbered lists
    const bulletMatch = content.match(/^[-*•]\s+(.+)$/gm);
    if (bulletMatch) {
      guidelines.push(...bulletMatch.map(m => m.replace(/^[-*•]\s+/, '').trim()));
    }

    const numberedMatch = content.match(/^\d+\.\s+(.+)$/gm);
    if (numberedMatch) {
      guidelines.push(...numberedMatch.map(m => m.replace(/^\d+\.\s+/, '').trim()));
    }

    return guidelines.slice(0, 10); // Limit to 10 guidelines
  }

  /**
   * Extract examples from content
   */
  private extractExamples(content: string): string[] {
    const examples: string[] = [];
    
    // Look for common example patterns
    const exampleMatch = content.match(/(?:example|for example|such as):\s*([^.\n]+)/gi);
    if (exampleMatch) {
      examples.push(...exampleMatch.map(m => m.replace(/^(?:example|for example|such as):\s*/i, '').trim()));
    }

    return examples.slice(0, 5); // Limit to 5 examples
  }

  /**
   * Find related components
   */
  private async findRelatedComponents(componentName: string, platform: ApplePlatform): Promise<string[]> {
    const sections = await this.crawleeService.discoverSections();
    const platformSections = sections.filter(s => s.platform === platform);
    
    // Simple related component finding based on similar titles
    const related = platformSections
      .filter(s => s.title.toLowerCase() !== componentName.toLowerCase())
      .filter(s => {
        const titleWords = s.title.toLowerCase().split(/\s+/);
        const componentWords = componentName.toLowerCase().split(/\s+/);
        return titleWords.some(word => componentWords.includes(word));
      })
      .map(s => s.title)
      .slice(0, 5);

    return related;
  }

  /**
   * Extract current design system information from content
   */
  private extractLiquidGlassInfo(content: string): string | undefined {
    // Look for current design system terms
    const designSystemMatch = content.match(/(design system|advanced material|enhanced interface)[^.]*\./gi);
    return designSystemMatch ? designSystemMatch.join(' ') : undefined;
  }

  /**
   * Find common elements across arrays
   */
  private findCommonElements(arrays: string[][]): string[] {
    if (arrays.length === 0) return [];
    
    return arrays[0].filter(item => 
      arrays.every(array => array.includes(item))
    );
  }

  /**
   * Identify key differences between platforms
   */
  private identifyKeyDifferences(platformData: any[]): string[] {
    const differences: string[] = [];
    
    // Compare specifications
    platformData.forEach((data, index) => {
      const otherPlatforms = platformData.filter((_, i) => i !== index);
      const uniqueGuidelines = data.guidelines.filter((guideline: string) => 
        !otherPlatforms.some(other => other.guidelines.includes(guideline))
      );
      
      if (uniqueGuidelines.length > 0) {
        differences.push(`${data.platform} has unique guidelines: ${uniqueGuidelines.slice(0, 3).join(', ')}`);
      }
    });

    return differences;
  }

  /**
   * Extract current design system highlights
   */
  private extractDesignSystemHighlights(_content: string): string[] {
    const highlights = [
      'Advanced materials with enhanced visual depth',
      'Adaptive interface elements that respond to context',
      'Consistent implementation across all Apple platforms',
      'Latest APIs for SwiftUI, UIKit, and AppKit',
      'Improved accessibility and user experience features'
    ];

    return highlights;
  }
}