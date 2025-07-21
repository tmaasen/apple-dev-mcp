/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import type { HIGCache } from './cache.js';
import { AppleContentAPIClient } from './services/apple-content-api-client.service.js';
import { StaticContentSearchService } from './services/static-content-search.service.js';
import type { 
  SearchGuidelinesArgs, 
  SearchResult,
  ApplePlatform,
  TechnicalSearchResult,
  UnifiedSearchResult
} from './types.js';

export class HIGToolProvider {
  private _cache: HIGCache;
  private appleContentAPIClient: AppleContentAPIClient;
  private staticContentSearch: StaticContentSearchService;

  constructor(cache: HIGCache, appleContentAPIClient?: AppleContentAPIClient) {
    this._cache = cache;
    this.appleContentAPIClient = appleContentAPIClient || new AppleContentAPIClient(cache);
    this.staticContentSearch = new StaticContentSearchService();
  }

  /**
   * Search Human Interface Guidelines content by keywords/topics with input validation
   */
  async searchHumanInterfaceGuidelines(args: SearchGuidelinesArgs): Promise<{
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
    
    const { query, platform } = args;
    const limit = 3; // Return top 3 results with full content
    
    // Validate required parameters
    if (typeof query !== 'string') {
      throw new Error('Invalid query: must be a string');
    }
    
    // Handle empty/whitespace queries gracefully
    if (query.trim().length === 0) {
      return {
        results: [],
        total: 0,
        query: query.trim(),
        filters: {
          platform
        }
      };
    }
    
    if (query.length > 100) {
      throw new Error('Query too long: maximum 100 characters allowed');
    }
    
    // Validate optional parameters
    if (platform && !['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'].includes(platform)) {
      args.platform = 'universal';
    }
     
    try {
      let results: SearchResult[] = [];
      
      // Use static content search as primary source (fast and reliable)
      try {
        results = await this.staticContentSearch.searchContent(query.trim(), args.platform, undefined, limit);
        
        // If static content search returns no results, fall back to minimal results
        if (results.length === 0) {
          results = this.getMinimalFallbackResults(query.trim(), platform, limit);
        }
      } catch {
        // Fall back to minimal hardcoded results
        results = this.getMinimalFallbackResults(query.trim(), platform, limit);
      }

      return {
        results: results.slice(0, limit),
        total: results.length,
        query: query.trim(),
        filters: {
          platform
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      throw new Error(`Search failed: ${errorMessage}`);
    }
  }

  /**
   * Minimal fallback search with hardcoded results (last resort only)
   */
  private getMinimalFallbackResults(query: string, platform?: ApplePlatform, limit: number = 3): SearchResult[] {
    const queryLower = query.toLowerCase();
    const fallbackData = [
      // Buttons & Touch Targets
      { keywords: ['button', 'btn', 'press', 'tap', 'click'], title: 'Buttons', platform: 'iOS', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons', snippet: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. Minimum touch target size is 44pt x 44pt.' },
      { keywords: ['touch', 'targets', '44pt', 'minimum', 'size', 'accessibility'], title: 'Touch Targets & Accessibility', platform: 'iOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', snippet: 'Interactive elements must be large enough for people to interact with easily. A minimum touch target size of 44pt x 44pt ensures accessibility.' },
      
      // Navigation
      { keywords: ['navigation', 'nav', 'navigate', 'menu', 'bar'], title: 'Navigation Bars', platform: 'iOS', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars', snippet: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.' },
      { keywords: ['tab', 'tabs', 'bottom'], title: 'Tab Bars', platform: 'iOS', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars', snippet: 'A tab bar appears at the bottom of an app screen and provides the ability to quickly switch between different sections of an app.' },
      
      // Layout & Design
      { keywords: ['layout', 'grid', 'spacing', 'margin'], title: 'Layout', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', snippet: 'A consistent layout that adapts to various devices and contexts makes your app easier to use and helps people feel confident.' },
      { keywords: ['color', 'colours', 'theme', 'dark', 'light'], title: 'Color', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/color', snippet: 'Color can indicate interactivity, impart vitality, and provide visual continuity.' },
      { keywords: ['typography', 'text', 'font', 'size'], title: 'Typography', platform: 'universal', category: 'typography', url: 'https://developer.apple.com/design/human-interface-guidelines/typography', snippet: 'Typography can help you clarify a hierarchy of information and make it easy for people to find what they\'re looking for.' },
      
      // Accessibility & Contrast
      { keywords: ['accessibility', 'a11y', 'voiceover', 'accessible'], title: 'Accessibility', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', snippet: 'People use Apple accessibility features to personalize how they interact with their devices in ways that work for them.' },
      { keywords: ['contrast', 'color', 'wcag', 'visibility', 'readability'], title: 'Color Contrast & Accessibility', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', snippet: 'Ensure sufficient color contrast for text and UI elements. Follow WCAG guidelines with minimum 4.5:1 contrast ratio for normal text.' },
      
      // Custom Interface Patterns  
      { keywords: ['custom', 'interface', 'patterns', 'design', 'user', 'expectations'], title: 'Custom Interface Patterns', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/', snippet: 'When creating custom interfaces, maintain consistency with platform conventions and user expectations to ensure familiarity and usability.' },
      { keywords: ['user', 'interface', 'standards', 'guidelines', 'principles'], title: 'User Interface Standards', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/', snippet: 'Follow established interface standards and design principles to create intuitive, accessible, and consistent user experiences across Apple platforms.' },
      
      // Visual Effects
      { keywords: ['gradients', 'materials', 'visual', 'effects'], title: 'Materials & Visual Effects', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/materials', snippet: 'Use system materials and visual effects thoughtfully to create depth and hierarchy while maintaining clarity and performance.' },
      
      // Input & Controls
      { keywords: ['input', 'field', 'form', 'text'], title: 'Text Fields', platform: 'iOS', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/text-fields', snippet: 'A text field is a rectangular area in which people enter or edit small, specific pieces of text.' },
      { keywords: ['picker', 'select', 'choose'], title: 'Pickers', platform: 'iOS', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/pickers', snippet: 'A picker displays one or more scrollable lists of distinct values that people can choose from.' },
      
      // Platform specific
      { keywords: ['vision', 'visionos', 'spatial', 'immersive', 'ar', 'vr'], title: 'Designing for visionOS', platform: 'visionOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos', snippet: 'visionOS brings together digital and physical worlds, creating opportunities for new types of immersive experiences.' },
      { keywords: ['watch', 'watchos', 'complication', 'crown'], title: 'Designing for watchOS', platform: 'watchOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos', snippet: 'Apple Watch is a highly personal device that people wear on their wrist, making it instantly accessible.' }
    ];

    const results: SearchResult[] = [];
    
    fallbackData.forEach((item, index) => {
      let relevanceScore = 0;
      
      // Check for keyword matches
      const hasKeywordMatch = item.keywords.some(keyword => queryLower.includes(keyword) || keyword.includes(queryLower));
      if (hasKeywordMatch) {
        relevanceScore = 1.0;
      }
      
      // Check title match
      if (item.title.toLowerCase().includes(queryLower)) {
        relevanceScore = Math.max(relevanceScore, 0.8);
      }
      
      // Apply platform filter
      if (platform && platform !== 'universal' && item.platform !== platform && item.platform !== 'universal') {
        return;
      }
      
      
      if (relevanceScore > 0) {
        results.push({
          id: `fallback-${index}`,
          title: item.title,
          url: item.url,
          platform: item.platform as ApplePlatform,
          relevanceScore,
          content: item.snippet,
          type: 'guideline' as const
        });
      }
    });
    
    // Sort by relevance score and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }








  /**
   * Get accessibility requirements for specific components
   * TODO: Future release - integrate with static content parsing
   * For now, users should search "accessibility" + component through regular HIG search
   */
  // async getAccessibilityRequirements(args: { component: string; platform: string }): Promise<{
  //   component: string;
  //   platform: string;
  //   requirements: {
  //     minimumTouchTarget: string;
  //     contrastRatio: string;
  //     voiceOverSupport: string[];
  //     keyboardNavigation: string[];
  //     wcagCompliance: string;
  //     additionalGuidelines: string[];
  //   };
  // }> {
  //   const { component, platform } = args;
  //   const componentLower = component.toLowerCase();
  //   const a11yRequirements = this.getAccessibilityDatabase(componentLower, platform);

  //   return {
  //     component,
  //     platform,
  //     requirements: a11yRequirements
  //   };
  // }



  /**
   * Search technical documentation using dynamic Apple API client
   */
  async searchTechnicalDocumentation(args: {
    query: string;
    framework?: string;
    platform?: string;
  }): Promise<{
    results: TechnicalSearchResult[];
    total: number;
    query: string;
    success: boolean;
    error?: string;
  }> {
    // Input validation
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { query, framework, platform } = args;
    const maxResults = 20; // Use sensible default internally
    
    // Validate required parameters
    if (typeof query !== 'string') {
      throw new Error('Invalid query: must be a string');
    }
    
    if (query.trim().length === 0) {
      return {
        results: [],
        total: 0,
        query: query.trim(),
        success: true
      };
    }
    
    if (query.length > 100) {
      throw new Error('Query too long: maximum 100 characters allowed');
    }
    
    try {
      let results: TechnicalSearchResult[] = [];
      
      // Try fast, targeted API search with aggressive timeout
      try {
        const searchPromise = this.performFastAPISearch(query.trim(), { framework, platform, maxResults });
        
        // Race condition: API search vs 15-second timeout (matching MightyDillah's approach)
        const timeoutPromise = new Promise<TechnicalSearchResult[]>((_, reject) => {
          setTimeout(() => reject(new Error('API search timeout')), 15000);
        });
        
        results = await Promise.race([searchPromise, timeoutPromise]);
      } catch {
        // API failed or timed out - return empty results for now
        // This maintains the "no static content" principle
        results = []; 
      }
      
      return {
        results: results.slice(0, maxResults),
        total: results.length,
        query: query.trim(),
        success: results.length > 0,
        error: results.length === 0 ? 'No results found. Try a more specific technical symbol like "UIButton" or "ScrollView".' : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        results: [],
        total: 0,
        query: query.trim(),
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Perform fast, targeted API search with intelligent framework targeting
   */
  private async performFastAPISearch(query: string, options: {
    framework?: string;
    platform?: string;
    maxResults?: number;
  }): Promise<TechnicalSearchResult[]> {
    const { framework, platform, maxResults = 10 } = options;
    
    // If framework specified, search only that framework (faster)
    if (framework) {
      return await this.appleContentAPIClient.searchFramework(framework, query, {
        platform,
        maxResults: Math.min(maxResults, 5) // Limit to reduce API calls
      });
    }
    
    // For general searches, use the improved global search with sequential framework processing
    const results = await this.appleContentAPIClient.searchGlobal(query, {
      platform,
      maxResults
    });
    
    return results.slice(0, maxResults);
  }



  /**
   * Unified search across both HIG design guidelines and technical documentation
   * Phase 2: Enhanced search that combines design and implementation guidance
   */
  async searchUnified(args: {
    query: string;
    platform?: ApplePlatform;
  }): Promise<{
    results: UnifiedSearchResult[];
    designResults: SearchResult[];
    technicalResults: TechnicalSearchResult[];
    total: number;
    query: string;
    sources: string[];
    crossReferences: Array<{
      designSection: string;
      technicalSymbol: string;
      relevance: number;
    }>;
  }> {
    const { query, platform } = args;
    
    // Use sensible defaults internally
    const includeDesign = true;
    const includeTechnical = true;
    const maxResults = 20;

    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be a non-empty string');
    }

    if (query.length > 100) {
      throw new Error('Query too long: maximum 100 characters allowed');
    }

    const sources: string[] = [];
    let designResults: SearchResult[] = [];
    let technicalResults: TechnicalSearchResult[] = [];

    try {
      // Search design guidelines if requested
      if (includeDesign) {
        sources.push('design-guidelines');
        try {
          const designSearch = await this.searchHumanInterfaceGuidelines({
            query,
            platform
          });
          designResults = designSearch.results;
        } catch {
          // Fall through to fallback
        }
      }

      // Search technical documentation if requested
      if (includeTechnical) {
        sources.push('technical-documentation');
        try {
          const technicalSearch = await this.searchTechnicalDocumentation({
            query,
            platform
          });
          technicalResults = technicalSearch.results;
        } catch {
          // Fall through to fallback
        }
      }

      // Generate cross-references between design and technical content
      const crossReferences = this.generateCrossReferences(designResults, technicalResults, query);

      // Combine and rank results using unified scoring
      const unifiedResults = this.combineAndRankResults(
        designResults,
        technicalResults,
        crossReferences,
        maxResults
      );

      return {
        results: unifiedResults,
        designResults,
        technicalResults,
        total: unifiedResults.length,
        query: query.trim(),
        sources,
        crossReferences
      };

    } catch (error) {
      throw new Error(`Unified search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate cross-references between design guidelines and technical documentation
   */
  private generateCrossReferences(
    designResults: SearchResult[],
    technicalResults: TechnicalSearchResult[],
    query: string
  ): Array<{
    designSection: string;
    technicalSymbol: string;
    relevance: number;
  }> {
    const crossReferences: Array<{
      designSection: string;
      technicalSymbol: string;
      relevance: number;
    }> = [];

    // Common UI component mappings
    const componentMappings = new Map([
      // Buttons
      ['button', ['Button', 'UIButton', 'NSButton', 'SwiftUI.Button']],
      ['buttons', ['Button', 'UIButton', 'NSButton', 'SwiftUI.Button']],
      
      // Navigation
      ['navigation', ['NavigationView', 'UINavigationController', 'NSNavigationController', 'NavigationStack']],
      ['navigation bar', ['NavigationView', 'UINavigationBar', 'NSNavigationItem']],
      
      // Lists
      ['list', ['List', 'UITableView', 'NSTableView', 'UICollectionView']],
      ['table', ['UITableView', 'NSTableView', 'TableView']],
      
      // Text
      ['text', ['Text', 'UILabel', 'NSTextField', 'TextField']],
      ['label', ['Text', 'UILabel', 'NSTextField']],
      
      // Images
      ['image', ['Image', 'UIImageView', 'NSImageView']],
      ['icon', ['Image', 'UIImageView', 'NSImageView', 'SF Symbols']],
      
      // Controls
      ['picker', ['Picker', 'UIPickerView', 'NSPopUpButton']],
      ['slider', ['Slider', 'UISlider', 'NSSlider']],
      ['switch', ['Toggle', 'UISwitch', 'NSSwitch']],
      ['toggle', ['Toggle', 'UISwitch', 'NSSwitch']],
      
      // Layout
      ['stack', ['VStack', 'HStack', 'ZStack', 'UIStackView', 'NSStackView']],
      ['scroll', ['ScrollView', 'UIScrollView', 'NSScrollView']],
      
      // Sheets and Popups
      ['sheet', ['Sheet', 'UIModalPresentationStyle', 'NSModalSession']],
      ['alert', ['Alert', 'UIAlertController', 'NSAlert']],
      ['popup', ['Popover', 'UIPopoverController', 'NSPopover']]
    ]);

    // Extract key terms from query for mapping
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    for (const designResult of designResults) {
      for (const technicalResult of technicalResults) {
        let relevance = 0;

        // Direct title matching
        const designTitle = designResult.title.toLowerCase();
        const technicalTitle = technicalResult.title.toLowerCase();
        
        // Check if design title contains technical symbol name or vice versa
        if (designTitle.includes(technicalTitle) || technicalTitle.includes(designTitle)) {
          relevance += 0.8;
        }

        // Component mapping-based relevance
        for (const [designTerm, technicalSymbols] of componentMappings) {
          if (designTitle.includes(designTerm)) {
            for (const symbol of technicalSymbols) {
              if (technicalTitle.includes(symbol.toLowerCase())) {
                relevance += 0.6;
                break;
              }
            }
          }
        }

        // Query term overlap between design and technical content
        for (const term of queryTerms) {
          if (designTitle.includes(term) && technicalTitle.includes(term)) {
            relevance += 0.3;
          }
        }

        // Platform consistency boost
        if (designResult.platform && technicalResult.platforms && typeof technicalResult.platforms === 'string') {
          const designPlatform = designResult.platform.toLowerCase();
          const technicalPlatforms = technicalResult.platforms.toLowerCase();
          if (technicalPlatforms.includes(designPlatform)) {
            relevance += 0.2;
          }
        }

        // Framework preference: slightly boost UIKit/AppKit over SwiftUI in cross-references for backward compatibility
        if (technicalResult.framework === 'UIKit' || technicalResult.framework === 'AppKit') {
          relevance += 0.1;
        }

        // Only include cross-references with meaningful relevance
        if (relevance >= 0.4) {
          const crossRefKey = `${designResult.title}:${technicalResult.title}`;
          // Avoid duplicate cross-references
          if (!crossReferences.some(ref => `${ref.designSection}:${ref.technicalSymbol}` === crossRefKey)) {
            crossReferences.push({
              designSection: designResult.title,
              technicalSymbol: technicalResult.title,
              relevance: Math.round(relevance * 100) / 100
            });
          }
        }
      }
    }

    // Sort by relevance and limit to top cross-references
    return crossReferences
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * Combine and rank design and technical results into unified search results
   */
  private combineAndRankResults(
    designResults: SearchResult[],
    technicalResults: TechnicalSearchResult[],
    crossReferences: Array<{
      designSection: string;
      technicalSymbol: string;
      relevance: number;
    }>,
    maxResults: number
  ): UnifiedSearchResult[] {
    const unifiedResults: UnifiedSearchResult[] = [];

    // Convert design results to unified format
    for (const result of designResults) {
      const hasCrossRef = crossReferences.some(ref => ref.designSection === result.title);
      const crossRefBoost = hasCrossRef ? 0.2 : 0;
      
      unifiedResults.push({
        id: `design-${result.url}`,
        title: result.title,
        type: 'design',
        url: result.url,
        relevanceScore: result.relevanceScore + crossRefBoost,
        snippet: result.content || '',
        designContent: {
          platform: result.platform,
          category: result.category
        }
      });
    }

    // Convert technical results to unified format
    for (const result of technicalResults) {
      const hasCrossRef = crossReferences.some(ref => ref.technicalSymbol === result.title);
      const crossRefBoost = hasCrossRef ? 0.2 : 0;
      
      unifiedResults.push({
        id: `technical-${result.path}`,
        title: result.title,
        type: 'technical',
        url: result.url,
        relevanceScore: result.relevanceScore + crossRefBoost,
        snippet: result.description,
        technicalContent: {
          framework: result.framework,
          symbolKind: result.symbolKind || '',
          platforms: result.platforms ? [result.platforms] : [],
          abstract: result.description,
          codeExamples: []
        }
      });
    }

    // Create combined results for high-confidence cross-references
    const processedCombinations = new Set<string>();
    for (const crossRef of crossReferences.slice(0, 5)) { // Top 5 cross-references
      if (crossRef.relevance >= 0.6) { // Lower threshold for more combinations
        const designResult = designResults.find(r => r.title === crossRef.designSection);
        const technicalResult = technicalResults.find(r => r.title === crossRef.technicalSymbol);
        
        if (designResult && technicalResult) {
          const combinationKey = `${designResult.title}:${technicalResult.title}`;
          if (!processedCombinations.has(combinationKey)) {
            processedCombinations.add(combinationKey);
            
            // Create more concise snippet for combined results
            const designSnippet = (designResult.content || '').slice(0, 200);
            const techSnippet = technicalResult.description.slice(0, 200);
            
            unifiedResults.push({
              id: `combined-${designResult.url.split('/').pop()}-${technicalResult.path.split('/').pop()}`,
              title: `${designResult.title} + ${technicalResult.title}`,
              type: 'combined',
              url: designResult.url,
              relevanceScore: (designResult.relevanceScore + technicalResult.relevanceScore) / 2 + (crossRef.relevance * 0.2),
              snippet: `Design: ${designSnippet}... | Implementation: ${techSnippet}...`,
              designContent: {
                platform: designResult.platform,
                category: designResult.category
              },
              technicalContent: {
                framework: technicalResult.framework,
                symbolKind: technicalResult.symbolKind || '',
                platforms: technicalResult.platforms ? [technicalResult.platforms] : [],
                abstract: technicalResult.description,
                codeExamples: []
              },
              combinedGuidance: {
                designPrinciples: [designSnippet],
                implementationSteps: [techSnippet],
                crossPlatformConsiderations: technicalResult.platforms ? [technicalResult.platforms] : [],
                accessibilityNotes: [`Ensure ${designResult.title} follows accessibility guidelines`]
              }
            });
          }
        }
      }
    }

    // Sort by relevance score and return top results
    return unifiedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Get accessibility requirements database
   * TODO: Future release - replace with static content integration
   */
  // private getAccessibilityDatabase(component: string, _platform: string): { minimumTouchTarget: string; contrastRatio: string; wcagCompliance: string; voiceOverSupport: string[]; keyboardNavigation: string[]; additionalGuidelines: string[] } {
  //   const baseRequirements = {
  //     minimumTouchTarget: '44pt x 44pt',
  //     contrastRatio: '4.5:1 (WCAG AA)',
  //     wcagCompliance: 'WCAG 2.1 AA',
  //     voiceOverSupport: ['Accessible label', 'Accessible hint', 'Accessible value'],
  //     keyboardNavigation: ['Tab navigation', 'Return key activation'],
  //     additionalGuidelines: []
  //   };

  //   switch (component) {
  //     case 'button':
  //       return {
  //         ...baseRequirements,
  //         voiceOverSupport: [
  //           'Clear button label describing action',
  //           'Button trait for VoiceOver',
  //           'State changes announced (enabled/disabled)'
  //         ],
  //         keyboardNavigation: [
  //           'Tab order follows reading order',
  //           'Space bar or Return key activation',
  //           'Focus indicator clearly visible'
  //         ],
  //         additionalGuidelines: [
  //           'Use descriptive labels, not just "tap" or "click"',
  //           'Ensure sufficient spacing between buttons',
  //           'Provide haptic feedback on supported devices'
  //         ]
  //       };
        
  //     case 'navigation':
  //     case 'navigation bar':
  //       return {
  //         ...baseRequirements,
  //         minimumTouchTarget: '44pt x 44pt for interactive elements',
  //         voiceOverSupport: [
  //           'Navigation bar trait',
  //           'Clear title announcement',
  //           'Back button with destination context'
  //         ],
  //         keyboardNavigation: [
  //           'Tab navigation through interactive elements',
  //           'Escape key for back navigation (macOS)',
  //           'Command+[ for back navigation (macOS)'
  //         ],
  //         additionalGuidelines: [
  //           'Keep navigation titles concise and descriptive',
  //           'Ensure back button context is clear',
  //           'Use navigation landmarks for screen readers'
  //         ]
  //       };
        
  //     case 'tab':
  //     case 'tab bar':
  //       return {
  //         ...baseRequirements,
  //         voiceOverSupport: [
  //           'Tab bar trait',
  //           'Selected state clearly announced',
  //           'Tab count and position information'
  //         ],
  //         keyboardNavigation: [
  //           'Arrow key navigation between tabs',
  //           'Return/Space key for tab selection',
  //           'Control+Tab for tab switching'
  //         ],
  //         additionalGuidelines: [
  //           'Use clear, distinct tab labels',
  //           'Ensure selected state is visually obvious',
  //           'Badge numbers should be announced by VoiceOver'
  //         ]
  //       };
        
  //     default:
  //       return {
  //         ...baseRequirements,
  //         additionalGuidelines: [
  //           'Follow platform-specific accessibility guidelines',
  //           'Test with VoiceOver and other assistive technologies',
  //           'Ensure content is accessible in all interface modes'
  //         ]
  //       };
  //   }
  // }
}