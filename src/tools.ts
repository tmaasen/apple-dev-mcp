/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import type { CrawleeHIGService } from './services/crawlee-hig.service.js';
import type { HIGCache } from './cache.js';
import type { HIGResourceProvider } from './resources.js';
import type { HIGStaticContentProvider } from './static-content.js';
import { AppleDevAPIClient } from './services/apple-dev-api-client.service.js';
import { UpdateCheckerService } from './services/update-checker.service.js';
import { WildcardSearchService } from './services/wildcard-search.service.js';
import { CrossReferenceMappingService } from './services/cross-reference-mapping.service.js';
import { ContentFusionService, type FusionRequest, type FusionResult } from './services/content-fusion.service.js';
import type { 
  SearchGuidelinesArgs, 
  GetComponentSpecArgs, 
  SearchResult,
  HIGComponent,
  ApplePlatform,
  HIGCategory,
  GetTechnicalDocumentationArgs,
  ListTechnologiesArgs,
  TechnicalDocumentation,
  FrameworkInfo,
  TechnicalSearchResult,
  UnifiedSearchResult,
  CheckUpdatesArgs
} from './types.js';

export class HIGToolProvider {
  private crawleeService: CrawleeHIGService;
  private _cache: HIGCache;
  private resourceProvider: HIGResourceProvider;
  private staticContentProvider?: HIGStaticContentProvider;
  private appleDevAPIClient: AppleDevAPIClient;
  private updateCheckerService: UpdateCheckerService;
  private wildcardSearchService: WildcardSearchService;
  private crossReferenceMappingService: CrossReferenceMappingService;
  private contentFusionService: ContentFusionService;

  constructor(crawleeService: CrawleeHIGService, cache: HIGCache, resourceProvider: HIGResourceProvider, staticContentProvider?: HIGStaticContentProvider, appleDevAPIClient?: AppleDevAPIClient) {
    this.crawleeService = crawleeService;
    this._cache = cache;
    this.resourceProvider = resourceProvider;
    this.staticContentProvider = staticContentProvider;
    this.appleDevAPIClient = appleDevAPIClient || new AppleDevAPIClient(cache);
    this.updateCheckerService = new UpdateCheckerService(cache, staticContentProvider);
    this.wildcardSearchService = new WildcardSearchService();
    this.crossReferenceMappingService = new CrossReferenceMappingService();
    this.contentFusionService = new ContentFusionService();
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
          platform,
          category
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
      let results: SearchResult[] = [];
      
      // Try static content search first (more reliable, less aggressive timeouts)
      try {
        if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
          // Try regular static search with longer timeout for complex searches
          results = await Promise.race([
            this.staticContentProvider.searchContent(query.trim(), platform, category, limit),
            new Promise<SearchResult[]>((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 8000))
          ]);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[HIGTools] Using static content search for: "${query}"`);
          }
        }
      } catch (staticError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HIGTools] Static search failed or timed out, falling back to keyword search:', staticError);
        }
        // Continue to keyword search fallback
      }
      
      // If static search failed or returned no results, try keyword search on static content
      if (!results || results.length === 0) {
        try {
          // Try simple keyword search on static content first
          if (this.staticContentProvider && await this.staticContentProvider.isAvailable()) {
            results = await this.staticContentProvider.keywordSearchContent(query.trim(), platform, category, limit);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[HIGTools] Using static keyword search for: "${query}"`);
            }
          }
        } catch (keywordError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Static keyword search failed, using minimal fallback:', keywordError);
          }
        }
        
        // Only use hardcoded fallback if static content completely unavailable
        if (!results || results.length === 0) {
          results = this.getMinimalFallbackResults(query.trim(), platform, category, limit);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[HIGTools] Using minimal fallback search for: "${query}"`);
          }
        }
      }

      return {
        results: results.slice(0, limit),
        total: results.length,
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
   * Minimal fallback search with hardcoded results (last resort only)
   */
  private getMinimalFallbackResults(query: string, platform?: ApplePlatform, category?: string, limit: number = 10): SearchResult[] {
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
      
      // Apply category filter
      if (category && item.category !== category) {
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
      const trimmedComponentName = componentName.trim();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Getting component spec for: ${trimmedComponentName} (platform: ${platform || 'any'})`);
      }
      
      // Try to get component from static content first
      let component: HIGComponent | null = null;
      
      if (this.staticContentProvider) {
        try {
          component = await this.getComponentFromStaticContent(trimmedComponentName, platform);
        } catch (error) {
          console.warn(`Failed to get component from static content: ${error}`);
        }
      }
      
      // Fall back to predefined components if static content fails
      if (!component) {
        component = this.getComponentSpecFallback(trimmedComponentName, platform);
      }
      
      if (!component) {
        return {
          component: null,
          relatedComponents: [],
          platforms: [],
          lastUpdated: new Date().toISOString()
        };
      }

      return {
        component,
        relatedComponents: component.guidelines || [],
        platforms: component.platforms || [],
        lastUpdated: new Date().toISOString(),
        liquidGlassUpdates: 'No Liquid Glass updates available'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGTools] Get component spec failed:', error);
      }
      
      throw new Error(`Failed to get component specification: ${errorMessage}`);
    }
  }

  private async getComponentFromStaticContent(componentName: string, platform?: ApplePlatform): Promise<HIGComponent | null> {
    if (!this.staticContentProvider) {
      return null;
    }

    // Search for the component in static content
    const searchQuery = componentName.toLowerCase().replace(/\s+/g, ' ');
    const searchResults = await this.staticContentProvider.searchContent(searchQuery, platform, undefined, 3);
    
    if (searchResults.length === 0) {
      return null;
    }

    // Find the best match (highest relevance score)
    const bestMatch = searchResults[0];
    
    // Get the full content for this component
    let fullContent = '';
    try {
      const section = await this.staticContentProvider.getSection(bestMatch.id);
      fullContent = section?.content || bestMatch.snippet;
    } catch {
      fullContent = bestMatch.snippet;
    }

    // Extract guidelines and examples from content
    const guidelines = this.extractGuidelines(fullContent);
    const examples = this.extractExamples(fullContent);
    const specifications = this.extractSpecifications(fullContent);

    return {
      id: bestMatch.id,
      title: bestMatch.title,
      description: bestMatch.snippet || `${bestMatch.title} component specifications and guidelines.`,
      platforms: [bestMatch.platform] as ApplePlatform[],
      url: bestMatch.url,
      specifications,
      guidelines,
      examples,
      lastUpdated: new Date()
    };
  }

  private extractGuidelines(content: string): string[] {
    const guidelines: string[] = [];
    
    // Look for common guideline patterns
    const guidelinePatterns = [
      /(?:^|\n)\s*[-•]\s*(.+?)(?=\n|$)/gm,
      /(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)/gm,
      /(?:consider|should|must|avoid|ensure)\s+(.+?)(?:[.!]|$)/gim
    ];

    for (const pattern of guidelinePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^[-•\d.\s]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 200) {
            guidelines.push(cleaned);
          }
        });
      }
    }

    return guidelines.slice(0, 5); // Return top 5 guidelines
  }

  private extractExamples(content: string): string[] {
    const examples: string[] = [];
    
    // Look for example patterns
    const examplePatterns = [
      /example[s]?[:\s]+(.+?)(?=\n\n|$)/gim,
      /for example[,\s]+(.+?)(?=[.!]|$)/gim,
      /such as[:\s]+(.+?)(?=[.!]|$)/gim
    ];

    for (const pattern of examplePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(examples?[:\s]+|for example[,\s]+|such as[:\s]+)/i, '').trim();
          if (cleaned.length > 5 && cleaned.length < 100) {
            examples.push(cleaned);
          }
        });
      }
    }

    return examples.slice(0, 3); // Return top 3 examples
  }

  private extractSpecifications(content: string): { [key: string]: any } {
    const specs: { [key: string]: any } = {};
    
    // Look for measurement patterns
    const heightMatch = content.match(/height[:\s]+(\d+(?:\.\d+)?)\s*pt/i);
    if (heightMatch) {
      specs.height = heightMatch[1] + 'pt';
    }

    const widthMatch = content.match(/width[:\s]+(\d+(?:\.\d+)?)\s*pt/i);
    if (widthMatch) {
      specs.width = widthMatch[1] + 'pt';
    }

    const minSizeMatch = content.match(/minimum[:\s]+(\d+(?:\.\d+)?)\s*pt/i);
    if (minSizeMatch) {
      specs.minimumSize = minSizeMatch[1] + 'pt';
    }

    // Touch target size is commonly 44pt
    if (content.toLowerCase().includes('touch target') || content.toLowerCase().includes('44')) {
      specs.touchTarget = '44pt x 44pt';
    }

    return specs;
  }

  /**
   * Fallback method for component specs to avoid timeouts
   */
  private getComponentSpecFallback(componentName: string, platform?: ApplePlatform): HIGComponent | null {
    const componentLower = componentName.toLowerCase();
    
    // Define known components with their specs
    const knownComponents: { [key: string]: HIGComponent } = {
      'button': {
        id: 'buttons-fallback',
        title: 'Buttons',
        description: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon.',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        specifications: {
          dimensions: { height: '44pt', minWidth: '44pt' }
        },
        guidelines: ['Make buttons easy to identify and predict', 'Size buttons appropriately for their importance', 'Use consistent styling throughout your app'],
        examples: ['Primary action buttons', 'Secondary action buttons', 'Destructive action buttons'],
        lastUpdated: new Date()
      },
      'navigation': {
        id: 'navigation-fallback',
        title: 'Navigation Bars',
        description: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS'],
        url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
        specifications: {
          dimensions: { height: '44pt' }
        },
        guidelines: ['Use a navigation bar to help people navigate hierarchical screens', 'Show the current location in the navigation hierarchy', 'Use the title area to clarify the current screen'],
        examples: ['Standard navigation bar', 'Large title navigation bar', 'Search-enabled navigation bar'],
        lastUpdated: new Date()
      },
      'tab': {
        id: 'tabs-fallback',
        title: 'Tab Bars',
        description: 'A tab bar appears at the bottom of an app screen and provides the ability to quickly switch between different sections.',
        platforms: ['iOS'],
        url: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars',
        specifications: {
          dimensions: { height: '49pt' }
        },
        guidelines: ['Use tab bars for peer categories of content', 'Avoid using a tab bar for actions', 'Badge tabs sparingly'],
        examples: ['Standard tab bar', 'Customizable tab bar', 'Translucent tab bar'],
        lastUpdated: new Date()
      },
      'text field': {
        id: 'text-fields-fallback',
        title: 'Text Fields',
        description: 'Text fields let people enter and edit text in a single line or multiple lines.',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        url: 'https://developer.apple.com/design/human-interface-guidelines/text-fields',
        specifications: {
          dimensions: { height: '44pt', minHeight: '36pt' },
          touchTarget: '44pt x 44pt'
        },
        guidelines: ['Make text fields recognizable and easy to target', 'Use secure text fields for sensitive data', 'Provide clear feedback for validation errors', 'Use appropriate keyboard types for different content'],
        examples: ['Standard text field', 'Search field', 'Secure text field', 'Multi-line text field'],
        lastUpdated: new Date()
      },
      'textfield': {
        id: 'text-fields-fallback',
        title: 'Text Fields',
        description: 'Text fields let people enter and edit text in a single line or multiple lines.',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
        url: 'https://developer.apple.com/design/human-interface-guidelines/text-fields',
        specifications: {
          dimensions: { height: '44pt', minHeight: '36pt' },
          touchTarget: '44pt x 44pt'
        },
        guidelines: ['Make text fields recognizable and easy to target', 'Use secure text fields for sensitive data', 'Provide clear feedback for validation errors', 'Use appropriate keyboard types for different content'],
        examples: ['Standard text field', 'Search field', 'Secure text field', 'Multi-line text field'],
        lastUpdated: new Date()
      }
    };

    // Try exact match first
    if (knownComponents[componentLower]) {
      const component = knownComponents[componentLower];
      // Filter by platform if specified
      if (platform && !component.platforms?.includes(platform)) {
        return null;
      }
      return component;
    }

    // Try partial matches
    for (const [key, component] of Object.entries(knownComponents)) {
      if (componentLower.includes(key) || key.includes(componentLower)) {
        if (platform && !component.platforms?.includes(platform)) {
          continue;
        }
        return component;
      }
    }

    return null;
  }

  /**
   * Get design tokens for specific components
   */
  async getDesignTokens(args: { component: string; platform: string; tokenType?: string }): Promise<{
    component: string;
    platform: string;
    tokens: {
      colors?: { [key: string]: string };
      spacing?: { [key: string]: string };
      typography?: { [key: string]: string };
      dimensions?: { [key: string]: string };
    };
  }> {
    const { component, platform, tokenType = 'all' } = args;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HIGTools] Getting design tokens for ${component} on ${platform}`);
    }

    const componentLower = component.toLowerCase();
    const designTokens = this.getDesignTokenDatabase(componentLower, platform);
    
    const tokens: any = {};
    
    if (tokenType === 'all' || tokenType === 'colors') {
      tokens.colors = designTokens.colors;
    }
    if (tokenType === 'all' || tokenType === 'spacing') {
      tokens.spacing = designTokens.spacing;
    }
    if (tokenType === 'all' || tokenType === 'typography') {
      tokens.typography = designTokens.typography;
    }
    if (tokenType === 'all' || tokenType === 'dimensions') {
      tokens.dimensions = designTokens.dimensions;
    }

    return {
      component,
      platform,
      tokens
    };
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HIGTools] Getting accessibility requirements for ${component} on ${platform}`);
    }

    const componentLower = component.toLowerCase();
    const a11yRequirements = this.getAccessibilityDatabase(componentLower, platform);

    return {
      component,
      platform,
      requirements: a11yRequirements
    };
  }

  /**
   * Get technical documentation for Apple frameworks and symbols
   */
  async getTechnicalDocumentation(args: GetTechnicalDocumentationArgs): Promise<{
    documentation: TechnicalDocumentation | null;
    designGuidance?: SearchResult[];
    success: boolean;
    error?: string;
  }> {
    // Input validation
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    
    const { path, includeDesignGuidance = false } = args;
    
    // Validate required parameters
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Invalid path: must be a non-empty string');
    }
    
    if (path.length > 200) {
      throw new Error('Path too long: maximum 200 characters allowed');
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Getting technical documentation for: ${path}`);
      }
      
      const documentation = await this.appleDevAPIClient.getTechnicalDocumentation(path.trim());
      
      // Optionally include design guidance
      let designGuidance: SearchResult[] | undefined;
      if (includeDesignGuidance && this.staticContentProvider) {
        try {
          const designQuery = this.extractDesignRelevantTerms(documentation.symbol);
          designGuidance = await this.staticContentProvider.searchContent(designQuery, undefined, undefined, 3);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Failed to get design guidance:', error);
          }
        }
      }
      
      return {
        documentation,
        designGuidance,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[HIGTools] Technical documentation failed for ${path}:`, error);
      }
      
      return {
        documentation: null,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * List available Apple technologies/frameworks
   */
  async listTechnologies(args: ListTechnologiesArgs = {}): Promise<{
    frameworks: FrameworkInfo[];
    totalCount: number;
    success: boolean;
    error?: string;
  }> {
    try {
      const { includeDesignMapping = false, platform, category = 'all' } = args;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Listing technologies (category: ${category}, platform: ${platform})`);
      }
      
      const technologies = await this.appleDevAPIClient.getTechnologies();
      const frameworks: FrameworkInfo[] = [];
      
      // Filter technologies based on category
      const filteredTechnologies = Object.values(technologies).filter(tech => {
        if (category === 'framework') {
          return tech.kind === 'symbol' && tech.role === 'collection';
        } else if (category === 'symbol') {
          return tech.kind === 'symbol' && tech.role !== 'collection';
        }
        return true; // 'all' category
      });
      
      // Convert to FrameworkInfo format
      for (const tech of filteredTechnologies.slice(0, 50)) { // Limit to prevent overload
        try {
          const frameworkInfo = await this.appleDevAPIClient.getFrameworkInfo(tech.title);
          
          // Platform filtering
          if (platform && frameworkInfo.platforms.length > 0) {
            const hasRequestedPlatform = frameworkInfo.platforms.some(p => 
              p.toLowerCase().includes(platform.toLowerCase())
            );
            if (!hasRequestedPlatform) continue;
          }
          
          // Add design mapping if requested
          if (includeDesignMapping && this.staticContentProvider) {
            try {
              const designQuery = this.extractDesignRelevantTerms(tech.title);
              const designResults = await this.staticContentProvider.searchContent(designQuery, undefined, undefined, 2);
              frameworkInfo.relatedHIGSections = designResults.map(result => result.title);
            } catch {
              // Continue without design mapping
            }
          }
          
          frameworks.push(frameworkInfo);
        } catch (error) {
          // Continue with other frameworks if one fails
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[HIGTools] Failed to get framework info for ${tech.title}:`, error);
          }
        }
      }
      
      return {
        frameworks,
        totalCount: frameworks.length,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGTools] List technologies failed:', error);
      }
      
      return {
        frameworks: [],
        totalCount: 0,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Search technical documentation symbols
   */
  async searchTechnicalDocumentation(args: {
    query: string;
    framework?: string;
    symbolType?: string;
    platform?: string;
    maxResults?: number;
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
    
    const { query, framework, symbolType, platform, maxResults = 20 } = args;
    
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
    
    if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
      throw new Error('Invalid maxResults: must be a number between 1 and 100');
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Searching technical documentation for: "${query}"`);
      }
      
      let results: TechnicalSearchResult[];
      
      if (framework) {
        // Search within specific framework
        results = await this.appleDevAPIClient.searchFramework(framework, query.trim(), {
          symbolType,
          platform,
          maxResults,
          includeRelevanceScore: true
        });
      } else {
        // Global search across all frameworks
        results = await this.appleDevAPIClient.searchGlobal(query.trim(), {
          symbolType,
          platform,
          maxResults,
          includeRelevanceScore: true
        });
      }
      
      // Add type field to results
      const typedResults = results.map(result => ({
        ...result,
        type: 'technical' as const
      }));
      
      return {
        results: typedResults,
        total: typedResults.length,
        query: query.trim(),
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[HIGTools] Technical search failed for "${query}":`, error);
      }
      
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
   * Check for updates across all content sources
   */
  async checkUpdates(args: CheckUpdatesArgs = {}): Promise<{
    updates: any[];
    notifications: any[];
    summary: string;
    hasUpdates: boolean;
    gitStatus?: any;
    success: boolean;
    error?: string;
  }> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HIGTools] Checking for updates...`);
      }
      
      const result = await this.updateCheckerService.checkUpdates(args);
      
      // Also get detailed git status
      let gitStatus;
      try {
        gitStatus = await this.updateCheckerService.getGitStatus();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HIGTools] Could not get git status:', error);
        }
      }
      
      return {
        ...result,
        gitStatus,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[HIGTools] Update check failed:', error);
      }
      
      return {
        updates: [],
        notifications: [{
          type: 'error',
          message: `Update check failed: ${errorMessage}`,
          actionRequired: false
        }],
        summary: '❌ Update check failed',
        hasUpdates: false,
        success: false,
        error: errorMessage
      };
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
   * Extract design-relevant terms from technical symbols for cross-referencing
   */
  private extractDesignRelevantTerms(symbol: string): string {
    const symbolLower = symbol.toLowerCase();
    
    // Map technical symbols to design-relevant terms
    const designMappings: Record<string, string[]> = {
      'button': ['button', 'buttons', 'interactive', 'touch target'],
      'uibutton': ['button', 'buttons', 'interactive', 'touch target'],
      'view': ['layout', 'view', 'container', 'hierarchy'],
      'uiview': ['layout', 'view', 'container', 'hierarchy'],
      'label': ['text', 'typography', 'labels', 'content'],
      'uilabel': ['text', 'typography', 'labels', 'content'],
      'textfield': ['input', 'text field', 'form', 'data entry'],
      'uitextfield': ['input', 'text field', 'form', 'data entry'],
      'textview': ['text', 'content', 'editing', 'input'],
      'uitextview': ['text', 'content', 'editing', 'input'],
      'imageview': ['image', 'visual', 'media', 'content'],
      'uiimageview': ['image', 'visual', 'media', 'content'],
      'navigationbar': ['navigation', 'navigation bar', 'hierarchy'],
      'uinavigationbar': ['navigation', 'navigation bar', 'hierarchy'],
      'tabbar': ['tab bar', 'navigation', 'organization'],
      'uitabbar': ['tab bar', 'navigation', 'organization'],
      'scrollview': ['scroll', 'content', 'layout', 'navigation'],
      'uiscrollview': ['scroll', 'content', 'layout', 'navigation'],
      'tableview': ['table', 'list', 'data', 'organization'],
      'uitableview': ['table', 'list', 'data', 'organization'],
      'collectionview': ['collection', 'grid', 'layout', 'organization'],
      'uicollectionview': ['collection', 'grid', 'layout', 'organization'],
      'picker': ['picker', 'selection', 'input', 'data entry'],
      'uipicker': ['picker', 'selection', 'input', 'data entry'],
      'switch': ['toggle', 'switch', 'control', 'input'],
      'uiswitch': ['toggle', 'switch', 'control', 'input'],
      'slider': ['slider', 'control', 'input', 'range'],
      'uislider': ['slider', 'control', 'input', 'range'],
      'stepper': ['stepper', 'control', 'input', 'increment'],
      'uistepper': ['stepper', 'control', 'input', 'increment'],
      'segmentedcontrol': ['segmented control', 'selection', 'navigation'],
      'uisegmentedcontrol': ['segmented control', 'selection', 'navigation'],
      'activityindicator': ['loading', 'progress', 'feedback'],
      'uiactivityindicator': ['loading', 'progress', 'feedback'],
      'progressview': ['progress', 'feedback', 'loading'],
      'uiprogressview': ['progress', 'feedback', 'loading'],
      'alert': ['alert', 'dialog', 'notification', 'feedback'],
      'uialert': ['alert', 'dialog', 'notification', 'feedback'],
      'actionsheet': ['action sheet', 'menu', 'selection'],
      'uiactionsheet': ['action sheet', 'menu', 'selection'],
      'popover': ['popover', 'overlay', 'context'],
      'uipopover': ['popover', 'overlay', 'context'],
      'toolbar': ['toolbar', 'navigation', 'actions'],
      'uitoolbar': ['toolbar', 'navigation', 'actions'],
      'searchbar': ['search', 'input', 'discovery'],
      'uisearchbar': ['search', 'input', 'discovery'],
      'pagecontrol': ['page control', 'navigation', 'paging'],
      'uipagecontrol': ['page control', 'navigation', 'paging']
    };
    
    // Check for direct mappings
    for (const [tech, design] of Object.entries(designMappings)) {
      if (symbolLower.includes(tech)) {
        return design.join(' ');
      }
    }
    
    // Extract common UI-related terms
    const uiTerms = [
      'button', 'view', 'label', 'text', 'image', 'navigation', 'tab', 'scroll',
      'table', 'collection', 'picker', 'switch', 'slider', 'stepper', 'control',
      'activity', 'progress', 'alert', 'action', 'popover', 'toolbar', 'search',
      'page', 'menu', 'modal', 'sheet', 'bar', 'field', 'indicator'
    ];
    
    const foundTerms = uiTerms.filter(term => symbolLower.includes(term));
    
    if (foundTerms.length > 0) {
      return foundTerms.join(' ');
    }
    
    // Fallback to the original symbol name
    return symbol;
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
   * Get design token database for components
   */
  private getDesignTokenDatabase(component: string, platform: string): any {
    const tokens: any = {
      colors: {},
      spacing: {},
      typography: {},
      dimensions: {}
    };

    // Platform-specific system colors
    const systemColors = {
      iOS: {
        primary: '#007AFF',
        secondary: '#5856D6', 
        success: '#34C759',
        warning: '#FF9500',
        destructive: '#FF3B30',
        label: '#000000',
        secondaryLabel: '#3C3C43',
        background: '#FFFFFF',
        secondaryBackground: '#F2F2F7'
      },
      macOS: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#28CD41',
        warning: '#FF9500', 
        destructive: '#FF3B30',
        label: '#000000',
        secondaryLabel: '#808080',
        background: '#FFFFFF',
        secondaryBackground: '#F5F5F5'
      }
    };

    // Component-specific tokens
    switch (component) {
      case 'button':
        tokens.colors = systemColors[platform as keyof typeof systemColors] || systemColors.iOS;
        tokens.spacing = {
          paddingHorizontal: '16pt',
          paddingVertical: '11pt',
          marginMinimum: '8pt'
        };
        tokens.typography = {
          fontSize: '17pt',
          fontWeight: '600',
          lineHeight: '22pt'
        };
        tokens.dimensions = {
          minHeight: '44pt',
          minWidth: '44pt',
          cornerRadius: '8pt'
        };
        break;
        
      case 'navigation':
      case 'navigation bar':
        tokens.colors = {
          background: systemColors[platform as keyof typeof systemColors]?.background || '#FFFFFF',
          tint: systemColors[platform as keyof typeof systemColors]?.primary || '#007AFF',
          title: systemColors[platform as keyof typeof systemColors]?.label || '#000000'
        };
        tokens.spacing = {
          contentInset: '16pt',
          titleSpacing: '8pt'
        };
        tokens.typography = {
          titleFontSize: '17pt',
          titleFontWeight: '600'
        };
        tokens.dimensions = {
          height: platform === 'iOS' ? '44pt' : '52pt',
          maxTitleWidth: '200pt'
        };
        break;
        
      case 'tab':
      case 'tab bar':
        tokens.colors = {
          background: systemColors[platform as keyof typeof systemColors]?.secondaryBackground || '#F2F2F7',
          selectedTint: systemColors[platform as keyof typeof systemColors]?.primary || '#007AFF',
          unselectedTint: systemColors[platform as keyof typeof systemColors]?.secondaryLabel || '#8E8E93'
        };
        tokens.spacing = {
          iconSpacing: '4pt',
          horizontalPadding: '12pt'
        };
        tokens.typography = {
          labelFontSize: '10pt',
          labelFontWeight: '400'
        };
        tokens.dimensions = {
          height: '49pt',
          iconSize: '25pt',
          maxTabs: '5'
        };
        break;
        
      default:
        // Generic component tokens
        tokens.colors = systemColors[platform as keyof typeof systemColors] || systemColors.iOS;
        tokens.spacing = { padding: '16pt', margin: '8pt' };
        tokens.typography = { fontSize: '17pt', fontWeight: '400' };
        tokens.dimensions = { minHeight: '44pt' };
    }

    return tokens;
  }

  /**
   * Get accessibility requirements database
   */
  private getAccessibilityDatabase(component: string, _platform: string): any {
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
    category?: string;
    includeDesign?: boolean;
    includeTechnical?: boolean;
    maxResults?: number;
    maxDesignResults?: number;
    maxTechnicalResults?: number;
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
    const {
      query,
      platform,
      category,
      includeDesign = true,
      includeTechnical = true,
      maxResults = 20,
      maxDesignResults = 10,
      maxTechnicalResults = 10
    } = args;

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
          const designSearch = await this.searchGuidelines({
            query,
            platform,
            category: category as HIGCategory,
            limit: maxDesignResults
          });
          designResults = designSearch.results;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Design search failed:', error);
          }
        }
      }

      // Search technical documentation if requested
      if (includeTechnical) {
        sources.push('technical-documentation');
        try {
          const technicalSearch = await this.searchTechnicalDocumentation({
            query,
            platform,
            maxResults: maxTechnicalResults
          });
          technicalResults = technicalSearch.results;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Technical search failed:', error);
          }
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
        if (designResult.platform && technicalResult.platforms) {
          const designPlatform = designResult.platform.toLowerCase();
          const technicalPlatforms = technicalResult.platforms.toLowerCase();
          if (technicalPlatforms.includes(designPlatform)) {
            relevance += 0.2;
          }
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

  /**
   * Wildcard search with pattern matching support
   * Phase 2: Enhanced search with * and ? wildcards
   */
  async searchWithWildcards(args: {
    pattern: string;
    searchType?: 'design' | 'technical' | 'both';
    platform?: ApplePlatform;
    category?: string;
    framework?: string;
    maxResults?: number;
    caseSensitive?: boolean;
    wholeWordMatch?: boolean;
  }): Promise<{
    results: Array<SearchResult | TechnicalSearchResult>;
    pattern: string;
    isWildcard: boolean;
    total: number;
    examples: string[];
    suggestions?: string[];
  }> {
    const {
      pattern,
      searchType = 'both',
      platform,
      category,
      framework,
      maxResults = 25,
      caseSensitive = false,
      wholeWordMatch = false
    } = args;

    // Input validation
    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
      throw new Error('Invalid pattern: must be a non-empty string');
    }

    if (pattern.length > 100) {
      throw new Error('Pattern too long: maximum 100 characters allowed');
    }

    // Validate the wildcard pattern
    const validation = this.wildcardSearchService.validatePattern(pattern);
    if (!validation.isValid) {
      throw new Error(`Invalid wildcard pattern: ${validation.error}`);
    }

    const results: Array<SearchResult | TechnicalSearchResult> = [];
    const examples: string[] = [];

    try {
      // Search design guidelines if requested
      if (searchType === 'design' || searchType === 'both') {
        if (this.staticContentProvider) {
          try {
            const designResults = await this.searchDesignWithWildcards(
              pattern,
              platform,
              category,
              maxResults,
              caseSensitive,
              wholeWordMatch
            );
            results.push(...designResults.results);
            examples.push(...designResults.examples);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[HIGTools] Wildcard design search failed:', error);
            }
          }
        }
      }

      // Search technical documentation if requested  
      if (searchType === 'technical' || searchType === 'both') {
        try {
          const technicalResults = await this.searchTechnicalWithWildcards(
            pattern,
            platform,
            framework,
            maxResults,
            caseSensitive,
            wholeWordMatch
          );
          results.push(...technicalResults.results);
          examples.push(...technicalResults.examples);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Wildcard technical search failed:', error);
          }
        }
      }

      // Sort combined results by relevance
      const sortedResults = results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, maxResults);

      // Generate suggestions for improvement
      const suggestions = this.generateWildcardSuggestions(pattern, results.length);

      return {
        results: sortedResults,
        pattern: pattern.trim(),
        isWildcard: pattern.includes('*') || pattern.includes('?'),
        total: sortedResults.length,
        examples: [...new Set(examples)].slice(0, 10), // Unique examples, max 10
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

    } catch (error) {
      throw new Error(`Wildcard search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search design guidelines using wildcard patterns
   */
  private async searchDesignWithWildcards(
    pattern: string,
    platform?: ApplePlatform,
    category?: string,
    maxResults: number = 15,
    caseSensitive: boolean = false,
    wholeWordMatch: boolean = false
  ): Promise<{ results: SearchResult[]; examples: string[] }> {
    if (!this.staticContentProvider) {
      return { results: [], examples: [] };
    }

    // Get all sections for wildcard searching by using a broad search
    const allSections = await this.staticContentProvider.searchContent(
      '*',  // Get all content
      platform,
      category as HIGCategory,
      1000  // Large limit to get most content
    );
    
    // Use wildcard search service
    const searchResults = this.wildcardSearchService.searchWithWildcards(
      allSections,
      pattern,
      ['title', 'snippet'],
      {
        caseSensitive,
        wholeWordMatch,
        maxResults,
        minScore: 0.1
      }
    );

    const results: SearchResult[] = [];
    const examples: string[] = [];

    for (const result of searchResults) {
      // Apply platform and category filters
      if (platform && platform !== 'universal' && 
          result.platform !== platform && result.platform !== 'universal') {
        continue;
      }

      if (category && result.category !== category) {
        continue;
      }

      // Convert to SearchResult format
      const searchResult: SearchResult = {
        id: result.id,
        title: result.title,
        platform: result.platform,
        category: result.category,
        url: result.url,
        snippet: this.wildcardSearchService.highlightMatches(
          result.snippet || '',
          this.wildcardSearchService.parseWildcardPattern(pattern)
        ),
        relevanceScore: result.wildcardMatch.score,
        type: 'section'
      };

      results.push(searchResult);
      
      // Collect examples of matched text
      if (result.wildcardMatch.matchedSegments.length > 0) {
        examples.push(...result.wildcardMatch.matchedSegments);
      }
    }

    return { results, examples };
  }

  /**
   * Search technical documentation using wildcard patterns
   */
  private async searchTechnicalWithWildcards(
    pattern: string,
    platform?: string,
    framework?: string,
    maxResults: number = 15,
    caseSensitive: boolean = false,
    wholeWordMatch: boolean = false
  ): Promise<{ results: TechnicalSearchResult[]; examples: string[] }> {
    try {
      // Get frameworks to search
      const frameworks = framework 
        ? [{ name: framework, title: framework }]
        : (await this.appleDevAPIClient.getFrameworkList()).slice(0, 10); // Limit to prevent overload

      const allTechnicalItems: Array<{
        title: string;
        description: string;
        path: string;
        framework: string;
        symbolKind?: string;
        platforms?: string;
        url: string;
      }> = [];

      // Collect technical documentation items
      for (const fw of frameworks) {
        try {
          const frameworkResults = await this.appleDevAPIClient.searchFramework(
            (fw as any).name || (fw as any).title,
            '*', // Get all symbols for wildcard filtering
            {
              platform,
              maxResults: 100,
              includeRelevanceScore: false
            }
          );
          
          allTechnicalItems.push(...frameworkResults.map(result => ({
            title: result.title,
            description: result.description,
            path: result.path,
            framework: result.framework,
            symbolKind: result.symbolKind,
            platforms: result.platforms,
            url: result.url
          })));
        } catch {
          // Continue with other frameworks if one fails
        }
      }

      // Apply wildcard search
      const searchResults = this.wildcardSearchService.searchWithWildcards(
        allTechnicalItems,
        pattern,
        ['title', 'description'],
        {
          caseSensitive,
          wholeWordMatch,
          maxResults,
          minScore: 0.1
        }
      );

      const results: TechnicalSearchResult[] = [];
      const examples: string[] = [];

      for (const result of searchResults) {
        const technicalResult: TechnicalSearchResult = {
          title: result.title,
          description: this.wildcardSearchService.highlightMatches(
            result.description,
            this.wildcardSearchService.parseWildcardPattern(pattern)
          ),
          path: result.path,
          framework: result.framework,
          symbolKind: result.symbolKind,
          platforms: result.platforms,
          url: result.url,
          relevanceScore: result.wildcardMatch.score,
          type: 'technical'
        };

        results.push(technicalResult);
        
        // Collect examples of matched text
        if (result.wildcardMatch.matchedSegments.length > 0) {
          examples.push(...result.wildcardMatch.matchedSegments);
        }
      }

      return { results, examples };

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[HIGTools] Technical wildcard search error:', error);
      }
      return { results: [], examples: [] };
    }
  }

  /**
   * Generate suggestions for improving wildcard patterns
   */
  private generateWildcardSuggestions(pattern: string, resultCount: number): string[] {
    const suggestions: string[] = [];

    // Too few results
    if (resultCount === 0) {
      suggestions.push('Try using wildcards like * or ? to broaden your search');
      suggestions.push('Check spelling of your search pattern');
      if (!pattern.includes('*') && !pattern.includes('?')) {
        suggestions.push(`Try "${pattern}*" to find items starting with "${pattern}"`);
        suggestions.push(`Try "*${pattern}*" to find items containing "${pattern}"`);
      }
    } else if (resultCount < 3 && !pattern.includes('*')) {
      suggestions.push(`Try "*${pattern}*" for broader results`);
    }

    // Too many results
    if (resultCount > 50) {
      suggestions.push('Try making your pattern more specific');
      if (pattern === '*') {
        suggestions.push('Use a more specific pattern instead of just "*"');
      }
      if ((pattern.match(/\*/g) || []).length > 2) {
        suggestions.push('Try using fewer wildcards for more specific results');
      }
    }

    // Pattern optimization suggestions
    if (pattern.includes('**')) {
      suggestions.push('Use single "*" instead of "**" - they have the same effect');
    }

    if (pattern.startsWith('*') && pattern.endsWith('*') && pattern.length < 5) {
      suggestions.push('Very short patterns with wildcards on both ends may return too many results');
    }

    return suggestions;
  }

  /**
   * Get cross-reference mappings between design guidelines and technical implementations
   * Phase 2: Comprehensive cross-reference mapping system
   */
  async getCrossReferences(args: {
    query: string;
    type?: 'component' | 'concept' | 'implementation';
    platform?: ApplePlatform;
    framework?: string;
    includeRelated?: boolean;
    maxResults?: number;
  }): Promise<{
    query: string;
    mappings: Array<{
      designSection: string;
      designUrl: string;
      technicalSymbol: string;
      technicalUrl: string;
      confidence: number;
      mappingType: string;
      explanation: string;
      platforms: string[];
      frameworks: string[];
    }>;
    componentMapping?: {
      componentName: string;
      designGuidelines: Array<{
        title: string;
        url: string;
        platform: string;
        relevance: number;
      }>;
      technicalSymbols: Array<{
        symbol: string;
        framework: string;
        platform: string;
        symbolKind: string;
        relevance: number;
      }>;
    };
    relatedComponents?: string[];
    suggestions: string[];
    total: number;
  }> {
    const {
      query,
      type = 'component',
      platform,
      framework,
      includeRelated = true,
      maxResults = 20
    } = args;

    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be a non-empty string');
    }

    if (query.length > 100) {
      throw new Error('Query too long: maximum 100 characters allowed');
    }

    try {
      const mappings: Array<{
        designSection: string;
        designUrl: string;
        technicalSymbol: string;
        technicalUrl: string;
        confidence: number;
        mappingType: string;
        explanation: string;
        platforms: string[];
        frameworks: string[];
      }> = [];

      let componentMapping;
      let relatedComponents: string[] = [];

      // Get component mapping if type is 'component'
      if (type === 'component') {
        componentMapping = this.crossReferenceMappingService.getComponentMapping(query);
        
        if (componentMapping && includeRelated) {
          relatedComponents = this.crossReferenceMappingService.findRelatedComponents(query);
        }
      }

      // Search for design guidelines and technical documentation to create cross-references
      let designResults: SearchResult[] = [];
      let technicalResults: TechnicalSearchResult[] = [];

      try {
        // Search design guidelines
        if (this.staticContentProvider) {
          const designSearch = await this.searchGuidelines({
            query,
            platform,
            limit: maxResults
          });
          designResults = designSearch.results;
        }

        // Search technical documentation
        const technicalSearch = await this.searchTechnicalDocumentation({
          query,
          platform,
          framework,
          maxResults
        });
        technicalResults = technicalSearch.results;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HIGTools] Cross-reference search failed:', error);
        }
      }

      // Generate cross-references between found results
      for (const designResult of designResults) {
        for (const technicalResult of technicalResults) {
          const crossRefs = this.crossReferenceMappingService.findCrossReferences(
            designResult.title,
            technicalResult.title,
            designResult.platform,
            technicalResult.platforms ? [technicalResult.platforms] : undefined
          );

          // Filter and enhance cross-references
          for (const crossRef of crossRefs) {
            const validation = this.crossReferenceMappingService.validateCrossReference(crossRef);
            
            if (validation.isValid && validation.score >= 0.3) {
              mappings.push({
                designSection: designResult.title,
                designUrl: designResult.url,
                technicalSymbol: technicalResult.title,
                technicalUrl: technicalResult.url,
                confidence: validation.score,
                mappingType: crossRef.mappingType,
                explanation: crossRef.explanation,
                platforms: crossRef.platforms,
                frameworks: crossRef.frameworks
              });
            }
          }
        }
      }

      // Sort mappings by confidence
      mappings.sort((a, b) => b.confidence - a.confidence);

      // Generate suggestions
      const suggestions = this.crossReferenceMappingService.generateCrossReferenceSuggestions(
        designResults,
        technicalResults
      );

      // Add component-specific suggestions
      if (type === 'component' && !componentMapping) {
        suggestions.push(`No direct mapping found for "${query}". Try searching for related UI components.`);
        suggestions.push('Consider breaking down complex components into simpler parts.');
      }

      if (mappings.length === 0) {
        suggestions.push('Try using more general terms like "button", "navigation", or "list"');
        suggestions.push('Search for both design concepts and technical implementations separately');
      }

      return {
        query: query.trim(),
        mappings: mappings.slice(0, maxResults),
        componentMapping,
        relatedComponents: includeRelated ? relatedComponents : undefined,
        suggestions,
        total: mappings.length
      };

    } catch (error) {
      throw new Error(`Cross-reference lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate fused guidance combining design principles with technical implementation
   * Phase 3: Comprehensive content fusion for end-to-end developer guidance
   */
  async generateFusedGuidance(args: {
    component: string;
    platform?: ApplePlatform;
    framework?: string;
    useCase?: string;
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    includeCodeExamples?: boolean;
    includeAccessibility?: boolean;
    includeTestingGuidance?: boolean;
    includeStepByStep?: boolean;
  }): Promise<{
    fusedContent?: {
      id: string;
      title: string;
      description: string;
      designGuidance: {
        principles: string[];
        bestPractices: string[];
        doAndDonts: {
          dos: string[];
          donts: string[];
        };
        accessibility: string[];
        visualExamples: string[];
      };
      technicalImplementation: {
        frameworks: string[];
        codeExamples: Array<{
          framework: string;
          language: string;
          code: string;
          description: string;
        }>;
        apiReferences: Array<{
          symbol: string;
          framework: string;
          url: string;
          description: string;
        }>;
        architecturalNotes: string[];
      };
      implementationGuide: {
        steps: Array<{
          stepNumber: number;
          title: string;
          description: string;
          designConsiderations: string[];
          codeSnippet?: string;
          resources: string[];
        }>;
        prerequisites: string[];
        commonPitfalls: string[];
        testingGuidance: string[];
      };
      platformSpecific: {
        [platform: string]: {
          designAdaptations: string[];
          implementationDifferences: string[];
          platformBestPractices: string[];
          codeExamples: Array<{
            framework: string;
            code: string;
            description: string;
          }>;
        };
      };
      crossReferences: {
        relatedComponents: string[];
        designPatterns: string[];
        technicalConcepts: string[];
      };
      metadata: {
        confidence: number;
        lastUpdated: Date;
        sources: string[];
        complexity: 'beginner' | 'intermediate' | 'advanced';
        estimatedImplementationTime: string;
      };
    };
    implementationGuide?: {
      title: string;
      overview: string;
      designPhase: {
        guidelines: string[];
        decisions: Array<{
          decision: string;
          rationale: string;
          alternatives: string[];
        }>;
        designTokens: Array<{
          property: string;
          value: string;
          platform: string;
        }>;
      };
      implementationPhase: {
        setup: Array<{
          step: string;
          code?: string;
          notes: string[];
        }>;
        coreImplementation: Array<{
          feature: string;
          implementation: string;
          codeExample: string;
          designAlignment: string[];
        }>;
        refinement: Array<{
          aspect: string;
          guidance: string;
          codeSnippet?: string;
        }>;
      };
      validationPhase: {
        designValidation: string[];
        functionalTesting: string[];
        accessibilityTesting: string[];
        performanceTesting: string[];
      };
    };
    success: boolean;
    error?: string;
  }> {
    const {
      component,
      platform = 'iOS',
      framework,
      useCase,
      complexity = 'intermediate',
      includeCodeExamples = true,
      includeAccessibility = true,
      includeTestingGuidance = true,
      includeStepByStep = true
    } = args;

    // Input validation
    if (!component || typeof component !== 'string' || component.trim().length === 0) {
      throw new Error('Invalid component: must be a non-empty string');
    }

    if (component.length > 50) {
      throw new Error('Component name too long: maximum 50 characters allowed');
    }

    try {
      // First, search for design guidelines and technical documentation
      let designResults: SearchResult[] = [];
      let technicalResults: TechnicalSearchResult[] = [];

      // Search design guidelines
      if (this.staticContentProvider) {
        try {
          const designSearch = await this.searchGuidelines({
            query: component,
            platform,
            limit: 5
          });
          designResults = designSearch.results;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HIGTools] Design search for fusion failed:', error);
          }
        }
      }

      // Search technical documentation
      try {
        const technicalSearch = await this.searchTechnicalDocumentation({
          query: component,
          platform,
          framework,
          maxResults: 5
        });
        technicalResults = technicalSearch.results;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HIGTools] Technical search for fusion failed:', error);
        }
      }

      // If we found relevant content, generate fused guidance
      let fusedContent;
      let implementationGuide;

      if (designResults.length > 0 || technicalResults.length > 0) {
        // Find the best cross-reference match
        const bestDesignResult = designResults[0];
        const bestTechnicalResult = technicalResults[0];

        if (bestDesignResult && bestTechnicalResult) {
          // Generate cross-reference for fusion
          const crossRefs = this.crossReferenceMappingService.findCrossReferences(
            bestDesignResult.title,
            bestTechnicalResult.title,
            platform,
            bestTechnicalResult.platforms ? [bestTechnicalResult.platforms] : undefined
          );

          const bestCrossRef = crossRefs[0] || {
            designSection: bestDesignResult.title,
            designUrl: bestDesignResult.url,
            technicalSymbol: bestTechnicalResult.title,
            technicalUrl: bestTechnicalResult.url,
            confidence: 0.5,
            mappingType: 'related' as const,
            explanation: 'Inferred mapping based on search results',
            platforms: [platform],
            frameworks: [bestTechnicalResult.framework]
          };

          // Generate fused content using new interface
          const fusionRequest: FusionRequest = {
            component,
            platform,
            framework: framework as any, // TODO: Fix Framework type
            useCase,
            complexity,
            includeCodeExamples,
            includeAccessibility,
            includeTestingGuidance
          };
          
          const fusionResult: FusionResult = await this.contentFusionService.generateFusedContent(
            bestDesignResult,
            bestTechnicalResult,
            bestCrossRef,
            fusionRequest
          );
          
          if (fusionResult.success && fusionResult.content) {
            fusedContent = fusionResult.content;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[HIGTools] Fusion failed:', fusionResult.error);
            }
          }
        }

        // Generate step-by-step implementation guide if requested
        if (includeStepByStep) {
          implementationGuide = await this.generateImplementationGuideFromFusion(
            component,
            platform,
            framework,
            useCase,
            fusedContent
          );
        }
      }

      // If no specific content found, generate generic guidance
      if (!fusedContent && !implementationGuide) {
        implementationGuide = await this.generateImplementationGuideFromFusion(
          component,
          platform,
          framework,
          useCase,
          undefined
        );
      }

      return {
        fusedContent,
        implementationGuide,
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Fused guidance generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate implementation guide from fused content or fallback to generic guidance
   * Apple Code Review Compliant - uses live content fusion
   */
  private async generateImplementationGuideFromFusion(
    component: string,
    platform: ApplePlatform,
    framework?: string,
    useCase?: string,
    fusedContent?: any
  ): Promise<any> {
    // If we have fused content, extract implementation guide from it
    if (fusedContent && fusedContent.implementationGuide) {
      return {
        title: `${component} Implementation Guide`,
        overview: fusedContent.description || `Complete implementation guide for ${component}`,
        designPhase: {
          guidelines: fusedContent.designGuidance?.principles || [],
          decisions: fusedContent.designGuidance?.bestPractices?.map((practice: string) => ({
            decision: practice,
            rationale: 'Based on Apple Human Interface Guidelines',
            alternatives: []
          })) || [],
          designTokens: this.extractDesignTokensFromFusedContent(fusedContent, platform)
        },
        implementationPhase: {
          setup: fusedContent.implementationGuide.prerequisites?.map((prereq: string) => ({
            step: prereq,
            notes: ['Ensure all dependencies are properly configured']
          })) || [],
          coreImplementation: fusedContent.technicalImplementation?.codeExamples?.map((example: any) => ({
            feature: example.description || 'Core implementation',
            implementation: example.code || 'Implementation details',
            codeExample: example.code || '',
            designAlignment: fusedContent.designGuidance?.principles?.slice(0, 2) || []
          })) || [],
          refinement: fusedContent.implementationGuide.steps?.map((step: any) => ({
            aspect: step.title,
            guidance: step.description,
            codeSnippet: step.codeSnippet
          })) || []
        },
        validationPhase: {
          designValidation: fusedContent.designGuidance?.bestPractices?.slice(0, 3) || [],
          functionalTesting: fusedContent.implementationGuide.testingGuidance || [],
          accessibilityTesting: fusedContent.designGuidance?.accessibility || [],
          performanceTesting: ['Test performance with large datasets', 'Optimize for smooth animations']
        }
      };
    }

    // Fallback to generic implementation guide
    return this.generateGenericImplementationGuide(component, platform, framework, useCase);
  }

  /**
   * Extract design tokens from fused content
   */
  private extractDesignTokensFromFusedContent(fusedContent: any, platform: ApplePlatform): Array<{
    property: string;
    value: string;
    platform: string;
  }> {
    const tokens: Array<{ property: string; value: string; platform: string }> = [];
    
    // Extract from platform-specific guidance
    const platformGuidance = fusedContent.platformSpecific?.get?.(platform);
    if (platformGuidance) {
      // Add any specific design tokens found in platform guidance
      tokens.push({
        property: 'minHeight',
        value: '44pt',
        platform: platform
      });
    }
    
    // Add common design tokens based on component type
    if (fusedContent.id?.includes('button')) {
      tokens.push(
        { property: 'minTouchTarget', value: '44pt x 44pt', platform: platform },
        { property: 'cornerRadius', value: '8pt', platform: platform }
      );
    }
    
    return tokens;
  }

  /**
   * Generate generic implementation guide as fallback
   */
  private generateGenericImplementationGuide(
    component: string,
    platform: ApplePlatform,
    framework?: string,
    _useCase?: string
  ): any {
    return {
      title: `${component} Implementation Guide`,
      overview: `Generic implementation guide for ${component} on ${platform}`,
      designPhase: {
        guidelines: [
          `Follow ${platform} design guidelines for ${component}`,
          'Ensure accessibility compliance',
          'Maintain visual consistency'
        ],
        decisions: [
          {
            decision: `Use standard ${platform} ${component} patterns`,
            rationale: 'Maintains platform consistency and user familiarity',
            alternatives: ['Custom implementation', 'Third-party components']
          }
        ],
        designTokens: this.getDesignTokenDatabase(component.toLowerCase(), platform)
      },
      implementationPhase: {
        setup: [
          {
            step: `Set up ${framework || 'development'} environment`,
            notes: ['Configure project dependencies', 'Set up build system']
          }
        ],
        coreImplementation: [
          {
            feature: `Basic ${component} implementation`,
            implementation: `Implement ${component} using ${framework || 'standard frameworks'}`,
            codeExample: this.generateGenericCodeExample(component, framework || 'SwiftUI', platform),
            designAlignment: [`Follows ${platform} design patterns`]
          }
        ],
        refinement: [
          {
            aspect: 'Accessibility',
            guidance: 'Ensure proper accessibility labels and behavior',
            codeSnippet: '// Add accessibility modifiers'
          }
        ]
      },
      validationPhase: {
        designValidation: ['Verify design consistency', 'Check platform guidelines compliance'],
        functionalTesting: ['Test core functionality', 'Verify edge cases'],
        accessibilityTesting: ['Test with VoiceOver', 'Verify keyboard navigation'],
        performanceTesting: ['Measure rendering performance', 'Test with various content sizes']
      }
    };
  }

  /**
   * Generate generic code example for components
   */
  private generateGenericCodeExample(component: string, framework: string, _platform: ApplePlatform): string {
    const componentLower = component.toLowerCase();
    
    if (framework === 'SwiftUI') {
      if (componentLower.includes('button')) {
        return `Button("Action") {\n    // Handle button tap\n}\n.buttonStyle(.borderedProminent)`;
      } else if (componentLower.includes('text')) {
        return `Text("Content")\n    .font(.body)\n    .foregroundColor(.primary)`;
      }
      return `// ${component} implementation\nstruct ${component}View: View {\n    var body: some View {\n        // Implementation\n    }\n}`;
    } else if (framework === 'UIKit') {
      if (componentLower.includes('button')) {
        return `let button = UIButton(type: .system)\nbutton.setTitle("Action", for: .normal)\nbutton.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)`;
      }
      return `// ${component} implementation\nlet ${componentLower} = UI${component}()\n// Configure ${componentLower}`;
    }
    
    return `// ${component} implementation for ${framework}`;
  }

  /**
   * Generate comprehensive implementation guide for a specific component
   * Phase 3: Detailed step-by-step implementation guidance
   */
  async generateImplementationGuide(args: {
    component: string;
    platform: ApplePlatform;
    framework?: string;
    useCase?: string;
    includeDesignPhase?: boolean;
    includeImplementationPhase?: boolean;
    includeValidationPhase?: boolean;
  }): Promise<{
    guide: {
      title: string;
      overview: string;
      designPhase: {
        guidelines: string[];
        decisions: Array<{
          decision: string;
          rationale: string;
          alternatives: string[];
        }>;
        designTokens: Array<{
          property: string;
          value: string;
          platform: string;
        }>;
      };
      implementationPhase: {
        setup: Array<{
          step: string;
          code?: string;
          notes: string[];
        }>;
        coreImplementation: Array<{
          feature: string;
          implementation: string;
          codeExample: string;
          designAlignment: string[];
        }>;
        refinement: Array<{
          aspect: string;
          guidance: string;
          codeSnippet?: string;
        }>;
      };
      validationPhase: {
        designValidation: string[];
        functionalTesting: string[];
        accessibilityTesting: string[];
        performanceTesting: string[];
      };
    };
    success: boolean;
    error?: string;
  }> {
    const {
      component,
      platform,
      framework,
      useCase,
      includeDesignPhase = true,
      includeImplementationPhase = true,
      includeValidationPhase = true
    } = args;

    // Input validation
    if (!component || typeof component !== 'string' || component.trim().length === 0) {
      throw new Error('Invalid component: must be a non-empty string');
    }

    if (!platform || typeof platform !== 'string') {
      throw new Error('Invalid platform: must be specified');
    }

    try {
      const guide = await this.generateImplementationGuideFromFusion(
        component,
        platform,
        framework,
        useCase,
        undefined
      );

      // Filter phases based on request
      if (!includeDesignPhase) {
        guide.designPhase = { guidelines: [], decisions: [], designTokens: [] };
      }
      if (!includeImplementationPhase) {
        guide.implementationPhase = { setup: [], coreImplementation: [], refinement: [] };
      }
      if (!includeValidationPhase) {
        guide.validationPhase = { designValidation: [], functionalTesting: [], accessibilityTesting: [], performanceTesting: [] };
      }

      return {
        guide,
        success: true
      };

    } catch (error) {
      return {
        guide: {
          title: `Failed to generate guide for ${component}`,
          overview: 'An error occurred during guide generation',
          designPhase: { guidelines: [], decisions: [], designTokens: [] },
          implementationPhase: { setup: [], coreImplementation: [], refinement: [] },
          validationPhase: { designValidation: [], functionalTesting: [], accessibilityTesting: [], performanceTesting: [] }
        },
        success: false,
        error: `Implementation guide generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}