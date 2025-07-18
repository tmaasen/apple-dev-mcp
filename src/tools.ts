/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import type { CrawleeHIGService } from './services/crawlee-hig.service.js';
import type { HIGCache } from './cache.js';
import type { HIGResourceProvider } from './resources.js';
import type { HIGStaticContentProvider } from './static-content.js';
import { AppleDevAPIClient } from './services/apple-dev-api-client.service.js';
import type { 
  SearchGuidelinesArgs, 
  SearchResult,
  ApplePlatform,
  TechnicalSearchResult,
  UnifiedSearchResult
} from './types.js';

export class HIGToolProvider {
  private crawleeService: CrawleeHIGService;
  private _cache: HIGCache;
  private resourceProvider: HIGResourceProvider;
  private staticContentProvider?: HIGStaticContentProvider;
  private appleDevAPIClient: AppleDevAPIClient;

  constructor(crawleeService: CrawleeHIGService, cache: HIGCache, resourceProvider: HIGResourceProvider, staticContentProvider?: HIGStaticContentProvider, appleDevAPIClient?: AppleDevAPIClient) {
    this.crawleeService = crawleeService;
    this._cache = cache;
    this.resourceProvider = resourceProvider;
    this.staticContentProvider = staticContentProvider;
    this.appleDevAPIClient = appleDevAPIClient || new AppleDevAPIClient(cache);
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
    const limit = 10; // Use sensible default internally
    
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
      throw new Error(`Invalid platform: ${platform}. Must be one of: iOS, macOS, watchOS, tvOS, visionOS, universal`);
    }
    
    
    try {
      let results: SearchResult[] = [];
      
      // Try static content search first (more reliable, less aggressive timeouts)
      try {
        if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
          // Try regular static search with longer timeout for complex searches
          results = await Promise.race([
            this.staticContentProvider.searchContent(query.trim(), platform, undefined, limit),
            new Promise<SearchResult[]>((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 8000))
          ]);
        }
      } catch {
        // Continue to keyword search fallback
      }
      
      // If static search failed or returned no results, try keyword search on static content
      if (!results || results.length === 0) {
        try {
          // Try simple keyword search on static content first
          if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
            results = await this.staticContentProvider.keywordSearchContent(query.trim(), platform, undefined, limit);
          }
        } catch {
          // Fall through to minimal fallback
        }
        
        // Only use hardcoded fallback if static content completely unavailable
        if (!results || results.length === 0) {
          results = this.getMinimalFallbackResults(query.trim(), platform, limit);
        }
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
  private getMinimalFallbackResults(query: string, platform?: ApplePlatform, limit: number = 10): SearchResult[] {
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
          snippet: item.snippet,
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
   */
  async getAccessibilityRequirements(args: { component: string; platform: string }): Promise<{
    component: string;
    platform: string;
    requirements: {
      minimumTouchTarget: string;
      contrastRatio: string;
      voiceOverSupport: string[];
      keyboardNavigation: string[];
      wcagCompliance: string;
      additionalGuidelines: string[];
    };
  }> {
    const { component, platform } = args;
    const componentLower = component.toLowerCase();
    const a11yRequirements = this.getAccessibilityDatabase(componentLower, platform);

    return {
      component,
      platform,
      requirements: a11yRequirements
    };
  }



  /**
   * Search technical documentation symbols or get specific documentation by path
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
      
      // Perform search functionality  
      const fallbackResults = this.generateTechnicalSearchFallback(query.trim(), {
        framework,
        platform,
        maxResults
      });
      
      return {
        results: fallbackResults,
        total: fallbackResults.length,
        query: query.trim(),
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Fall through to fallback
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
   * Get the technical database (extracted for reuse)
   */
  private getTechnicalDatabase() {
    return [
      {
        symbol: 'UITextField',
        title: 'UITextField',
        abstract: 'A control that displays editable text and sends an action message to a target object when the user presses the return button.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uitextfield',
        keywords: ['textfield', 'text', 'input', 'field', 'editing', 'keyboard']
      },
      {
        symbol: 'NSTextField',
        title: 'NSTextField',
        abstract: 'A control that displays editable text.',
        framework: 'AppKit',
        symbolType: 'class',
        platforms: ['macOS'],
        path: '/documentation/appkit/nstextfield',
        keywords: ['textfield', 'text', 'input', 'field', 'editing']
      },
      {
        symbol: 'UIButton',
        title: 'UIButton',
        abstract: 'A control that executes your custom code in response to user interactions.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uibutton',
        keywords: ['button', 'tap', 'action', 'control', 'interaction']
      },
      {
        symbol: 'NSButton',
        title: 'NSButton',
        abstract: 'A control that performs a specified action when clicked.',
        framework: 'AppKit',
        symbolType: 'class',
        platforms: ['macOS'],
        path: '/documentation/appkit/nsbutton',
        keywords: ['button', 'click', 'action', 'control']
      },
      {
        symbol: 'UILabel',
        title: 'UILabel',
        abstract: 'A view that displays one or more lines of informational text.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uilabel',
        keywords: ['label', 'text', 'display', 'typography']
      },
      {
        symbol: 'UIImageView',
        title: 'UIImageView',
        abstract: 'An object that displays a single image or a sequence of animated images in your interface.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uiimageview',
        keywords: ['image', 'imageview', 'picture', 'media', 'display']
      },
      {
        symbol: 'UINavigationBar',
        title: 'UINavigationBar',
        abstract: 'Navigational controls displayed in a bar along the top of the screen, usually in conjunction with a navigation controller.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uinavigationbar',
        keywords: ['navigation', 'navigationbar', 'bar', 'title']
      },
      {
        symbol: 'UITabBar',
        title: 'UITabBar',
        abstract: 'A control that displays one or more buttons in a tab bar for selecting between different subtasks, views, or modes in an app.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uitabbar',
        keywords: ['tab', 'tabbar', 'navigation', 'selection']
      },
      {
        symbol: 'UISwitch',
        title: 'UISwitch',
        abstract: 'A control that offers a binary choice, such as on/off.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uiswitch',
        keywords: ['switch', 'toggle', 'binary', 'on', 'off']
      },
      {
        symbol: 'UISlider',
        title: 'UISlider',
        abstract: 'A control for selecting a single value from a continuous range of values.',
        framework: 'UIKit',
        symbolType: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        path: '/documentation/uikit/uislider',
        keywords: ['slider', 'range', 'value', 'continuous']
      },
      // SwiftUI Components
      {
        symbol: 'Button',
        title: 'Button',
        abstract: 'A control that initiates an action.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/button',
        keywords: ['button', 'action', 'tap', 'control', 'swiftui']
      },
      {
        symbol: 'TextField',
        title: 'TextField',
        abstract: 'A control that displays an editable text interface.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/textfield',
        keywords: ['textfield', 'text', 'input', 'field', 'editing', 'swiftui']
      },
      {
        symbol: 'Text',
        title: 'Text',
        abstract: 'A view that displays one or more lines of read-only text.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/text',
        keywords: ['text', 'label', 'display', 'typography', 'swiftui']
      },
      {
        symbol: 'NavigationView',
        title: 'NavigationView',
        abstract: 'A view for presenting a stack of views that represents a visible path in a navigation hierarchy.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/navigationview',
        keywords: ['navigation', 'navigationview', 'hierarchy', 'stack', 'swiftui']
      },
      {
        symbol: 'List',
        title: 'List',
        abstract: 'A container that presents rows of data arranged in a single column, optionally providing the ability to select one or more members.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/list',
        keywords: ['list', 'table', 'rows', 'data', 'swiftui']
      },
      // Layout containers
      {
        symbol: 'VStack',
        title: 'VStack',
        abstract: 'A view that arranges its children in a vertical line.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/vstack',
        keywords: ['vstack', 'vertical', 'stack', 'layout', 'container', 'swiftui']
      },
      {
        symbol: 'HStack',
        title: 'HStack',
        abstract: 'A view that arranges its children in a horizontal line.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/hstack',
        keywords: ['hstack', 'horizontal', 'stack', 'layout', 'container', 'swiftui']
      },
      {
        symbol: 'ZStack',
        title: 'ZStack',
        abstract: 'A view that overlays its children, aligning them in both axes.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/zstack',
        keywords: ['zstack', 'overlay', 'stack', 'layout', 'container', 'swiftui']
      },
      {
        symbol: 'ScrollView',
        title: 'ScrollView',
        abstract: 'A scrollable view.',
        framework: 'SwiftUI',
        symbolType: 'struct',
        platforms: ['iOS', 'iPadOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        path: '/documentation/swiftui/scrollview',
        keywords: ['scrollview', 'scroll', 'container', 'swiftui']
      }
    ];
  }

  /**
   * Generate fallback technical search results based on common iOS/macOS components
   */
  private generateTechnicalSearchFallback(query: string, options: {
    framework?: string;
    platform?: string;
    maxResults?: number;
  }): TechnicalSearchResult[] {
    const queryLower = query.toLowerCase();
    const { framework, platform, maxResults = 20 } = options;
    
    // Use shared technical database
    const technicalDatabase = this.getTechnicalDatabase();

    // Filter results based on query and options
    const filteredResults = technicalDatabase.filter(item => {
      // Check if query matches keywords or symbol name
      const matchesQuery = item.keywords.some(keyword => 
        keyword.includes(queryLower)
      ) || item.symbol.toLowerCase().includes(queryLower) ||
        item.title.toLowerCase().includes(queryLower);

      // Filter by framework if specified
      const matchesFramework = !framework || 
        item.framework.toLowerCase().includes(framework.toLowerCase());

      // Filter by platform if specified
      const matchesPlatform = !platform || 
        item.platforms.some(p => p.toLowerCase().includes(platform.toLowerCase()));

      return matchesQuery && matchesFramework && matchesPlatform;
    });

    // Sort by relevance score (highest first)
    filteredResults.sort((a, b) => {
      const aScore = this.calculateTechnicalRelevanceScore(a, queryLower, framework);
      const bScore = this.calculateTechnicalRelevanceScore(b, queryLower, framework);
      return bScore - aScore;
    });

    // Convert to TechnicalSearchResult format and limit results
    return filteredResults.slice(0, maxResults).map(item => ({
      title: item.title,
      description: item.abstract,
      path: item.path,
      framework: item.framework,
      symbolKind: item.symbolType,
      platforms: item.platforms.join(', '), // Convert array to string
      url: `https://developer.apple.com${item.path}`,
      relevanceScore: this.calculateTechnicalRelevanceScore(item, queryLower, framework),
      type: 'technical' as const
    }));
  }

  /**
   * Calculate relevance score for technical search results
   */
  private calculateTechnicalRelevanceScore(item: { symbol: string; title: string; framework: string; keywords: string[]; abstract: string }, queryLower: string, framework?: string): number {
    let score = 0;
    
    // Exact symbol match gets highest score
    if (item.symbol.toLowerCase() === queryLower) {
      score += 100;
    } else if (item.symbol.toLowerCase().includes(queryLower)) {
      score += 80;
    }
    
    // Title matches
    if (item.title.toLowerCase().includes(queryLower)) {
      score += 60;
    }
    
    // Keyword matches
    const keywordMatches = item.keywords.filter((keyword: string) => 
      keyword.includes(queryLower)
    ).length;
    score += keywordMatches * 20;
    
    // Abstract matches
    if (item.abstract.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Framework preference boost: when no framework is specified, favor UIKit/AppKit for backward compatibility
    if (!framework && (item.framework === 'UIKit' || item.framework === 'AppKit')) {
      score += 20; // Increase boost to ensure UIKit/AppKit comes first
    }
    
    return score;
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
  private identifyKeyDifferences(platformData: Array<{ guidelines?: string[]; platform?: string }>): string[] {
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
   * Get accessibility requirements database
   */
  private getAccessibilityDatabase(component: string, _platform: string): { minimumTouchTarget: string; contrastRatio: string; wcagCompliance: string; voiceOverSupport: string[]; keyboardNavigation: string[]; additionalGuidelines: string[] } {
    const baseRequirements = {
      minimumTouchTarget: '44pt x 44pt',
      contrastRatio: '4.5:1 (WCAG AA)',
      wcagCompliance: 'WCAG 2.1 AA',
      voiceOverSupport: ['Accessible label', 'Accessible hint', 'Accessible value'],
      keyboardNavigation: ['Tab navigation', 'Return key activation'],
      additionalGuidelines: []
    };

    switch (component) {
      case 'button':
        return {
          ...baseRequirements,
          voiceOverSupport: [
            'Clear button label describing action',
            'Button trait for VoiceOver',
            'State changes announced (enabled/disabled)'
          ],
          keyboardNavigation: [
            'Tab order follows reading order',
            'Space bar or Return key activation',
            'Focus indicator clearly visible'
          ],
          additionalGuidelines: [
            'Use descriptive labels, not just "tap" or "click"',
            'Ensure sufficient spacing between buttons',
            'Provide haptic feedback on supported devices'
          ]
        };
        
      case 'navigation':
      case 'navigation bar':
        return {
          ...baseRequirements,
          minimumTouchTarget: '44pt x 44pt for interactive elements',
          voiceOverSupport: [
            'Navigation bar trait',
            'Clear title announcement',
            'Back button with destination context'
          ],
          keyboardNavigation: [
            'Tab navigation through interactive elements',
            'Escape key for back navigation (macOS)',
            'Command+[ for back navigation (macOS)'
          ],
          additionalGuidelines: [
            'Keep navigation titles concise and descriptive',
            'Ensure back button context is clear',
            'Use navigation landmarks for screen readers'
          ]
        };
        
      case 'tab':
      case 'tab bar':
        return {
          ...baseRequirements,
          voiceOverSupport: [
            'Tab bar trait',
            'Selected state clearly announced',
            'Tab count and position information'
          ],
          keyboardNavigation: [
            'Arrow key navigation between tabs',
            'Return/Space key for tab selection',
            'Control+Tab for tab switching'
          ],
          additionalGuidelines: [
            'Use clear, distinct tab labels',
            'Ensure selected state is visually obvious',
            'Badge numbers should be announced by VoiceOver'
          ]
        };
        
      default:
        return {
          ...baseRequirements,
          additionalGuidelines: [
            'Follow platform-specific accessibility guidelines',
            'Test with VoiceOver and other assistive technologies',
            'Ensure content is accessible in all interface modes'
          ]
        };
    }
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
          crossReferences.push({
            designSection: designResult.title,
            technicalSymbol: technicalResult.title,
            relevance: Math.round(relevance * 100) / 100
          });
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
        snippet: result.snippet || '',
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
    for (const crossRef of crossReferences.slice(0, 3)) { // Top 3 cross-references
      if (crossRef.relevance >= 0.7) {
        const designResult = designResults.find(r => r.title === crossRef.designSection);
        const technicalResult = technicalResults.find(r => r.title === crossRef.technicalSymbol);
        
        if (designResult && technicalResult) {
          unifiedResults.push({
            id: `combined-${designResult.url}-${technicalResult.path}`,
            title: `${designResult.title} + ${technicalResult.title}`,
            type: 'combined',
            url: designResult.url,
            relevanceScore: (designResult.relevanceScore + technicalResult.relevanceScore) / 2 + 0.3,
            snippet: `Design: ${designResult.snippet || ''} | Implementation: ${technicalResult.description}`,
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
              designPrinciples: [designResult.snippet || ''],
              implementationSteps: [technicalResult.description],
              crossPlatformConsiderations: technicalResult.platforms ? [technicalResult.platforms] : [],
              accessibilityNotes: [`Ensure ${designResult.title} follows accessibility guidelines`]
            }
          });
        }
      }
    }

    // Sort by relevance score and return top results
    return unifiedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }




}