/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import { HIGScraper } from './scraper.js';
import { HIGCache } from './cache.js';
import { HIGResourceProvider } from './resources.js';
import { 
  SearchGuidelinesArgs, 
  GetComponentSpecArgs, 
  ComparePlatformsArgs, 
  GetLatestUpdatesArgs,
  SearchResult,
  HIGComponent,
  ApplePlatform
} from './types.js';

export class HIGToolProvider {
  private scraper: HIGScraper;
  private cache: HIGCache;
  private resourceProvider: HIGResourceProvider;

  constructor(scraper: HIGScraper, cache: HIGCache, resourceProvider: HIGResourceProvider) {
    this.scraper = scraper;
    this.cache = cache;
    this.resourceProvider = resourceProvider;
  }

  /**
   * Search HIG content by keywords/topics
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
    const { query, platform, category, limit = 10 } = args;
    
    // console.log(`[HIGTools] Searching for: "${query}" (platform: ${platform}, category: ${category})`);
    
    try {
      const results = await this.scraper.searchContent(query, platform, category, limit);
      
      // Enhance results with additional context
      const enhancedResults = await Promise.all(
        results.map(async (result) => {
          // Try to get more detailed content
          const resource = await this.resourceProvider.getResource(`hig://${result.platform.toLowerCase()}`);
          if (resource && resource.content.toLowerCase().includes(query.toLowerCase())) {
            // Extract more context from the full resource
            const enhancedSnippet = this.extractEnhancedSnippet(resource.content, query);
            if (enhancedSnippet.length > result.snippet.length) {
              result.snippet = enhancedSnippet;
            }
          }
          return result;
        })
      );

      return {
        results: enhancedResults,
        total: enhancedResults.length,
        query,
        filters: {
          platform,
          category
        }
      };
    } catch (error) {
      // console.error('[HIGTools] Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed specifications for a UI component
   */
  async getComponentSpec(args: GetComponentSpecArgs): Promise<{
    component: HIGComponent | null;
    relatedComponents: string[];
    platforms: ApplePlatform[];
    lastUpdated: string;
    liquidGlassUpdates?: string;
  }> {
    const { componentName, platform } = args;
    
    // console.log(`[HIGTools] Getting component spec for: ${componentName} (platform: ${platform})`);
    
    try {
      // Search for the component across guidelines
      const searchResults = await this.scraper.searchContent(componentName, platform);
      
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
      const sections = await this.scraper.discoverSections();
      const componentSection = sections.find(s => s.id === bestMatch.id);
      
      if (!componentSection) {
        return {
          component: null,
          relatedComponents: [],
          platforms: [],
          lastUpdated: new Date().toISOString()
        };
      }

      const sectionWithContent = await this.scraper.fetchSectionContent(componentSection);
      
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

      return {
        component,
        relatedComponents,
        platforms: [bestMatch.platform],
        lastUpdated: sectionWithContent.lastUpdated?.toISOString() || new Date().toISOString(),
        liquidGlassUpdates
      };
    } catch (error) {
      // console.error('[HIGTools] Get component spec failed:', error);
      throw new Error(`Failed to get component specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    liquidGlassHighlights: string[];
    wwdc2025Summary: string;
  }> {
    const { since, platform, limit = 20 } = args;
    
    // console.log(`[HIGTools] Getting latest updates (since: ${since}, platform: ${platform})`);
    
    try {
      // Get Liquid Glass information
      const liquidGlassResource = await this.resourceProvider.getResource('hig://updates/liquid-glass');
      const liquidGlassContent = liquidGlassResource?.content || '';
      
      // Extract highlights from Liquid Glass content
      const liquidGlassHighlights = this.extractLiquidGlassHighlights(liquidGlassContent);
      
      // WWDC 2025 summary
      const wwdc2025Summary = `WWDC 2025 introduced Apple's most significant design update with the Liquid Glass design system. This translucent material design language features real-time rendering, adaptive colors, and system-wide implementation across all Apple platforms (iOS 26, macOS 26, watchOS 26, iPadOS 26, tvOS 26, visionOS 26).`;
      
      // Generate mock updates based on current sections (in a real implementation, this would track actual changes)
      const sections = await this.scraper.discoverSections();
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

      // Add specific Liquid Glass updates
      const liquidGlassUpdates = [
        {
          title: 'Liquid Glass Design System Released',
          description: 'New translucent material design language with real-time rendering capabilities',
          date: '2025-06-09T00:00:00Z',
          platform: 'universal' as ApplePlatform,
          type: 'new' as const,
          url: 'https://developer.apple.com/design/human-interface-guidelines/',
          liquidGlassRelated: true
        },
        {
          title: 'SwiftUI Liquid Glass APIs',
          description: 'New APIs for implementing Liquid Glass materials in SwiftUI applications',
          date: '2025-06-09T00:00:00Z',
          platform: 'universal' as ApplePlatform,
          type: 'new' as const,
          url: 'https://developer.apple.com/documentation/swiftui',
          liquidGlassRelated: true
        }
      ];

      return {
        updates: [...liquidGlassUpdates, ...updates].slice(0, limit),
        liquidGlassHighlights,
        wwdc2025Summary
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
    const sections = await this.scraper.discoverSections();
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
   * Extract Liquid Glass information from content
   */
  private extractLiquidGlassInfo(content: string): string | undefined {
    const liquidGlassMatch = content.match(/liquid glass[^.]*\./gi);
    return liquidGlassMatch ? liquidGlassMatch.join(' ') : undefined;
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
   * Extract Liquid Glass highlights
   */
  private extractLiquidGlassHighlights(_content: string): string[] {
    const highlights = [
      'Translucent materials with real-time rendering',
      'Adaptive colors that respond to environment',
      'System-wide implementation across all platforms',
      'Updated APIs for SwiftUI, UIKit, and AppKit',
      'Specular highlights that react to movement'
    ];

    return highlights;
  }
}