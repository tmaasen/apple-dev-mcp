/**
 * MCP Tools implementation for Apple HIG interactive functionality
 */

import type { CrawleeHIGService } from './services/crawlee-hig.service.js';
import type { HIGCache } from './cache.js';
import type { HIGResourceProvider } from './resources.js';
import type { HIGStaticContentProvider } from './static-content.js';
import { AppleDevAPIClient } from './services/apple-dev-api-client.service.js';
import { ContentFusionService, type FusionRequest, type FusionResult } from './services/content-fusion.service.js';
import type { 
  SearchGuidelinesArgs, 
  GetComponentSpecArgs, 
  SearchResult,
  HIGComponent,
  ApplePlatform,
  HIGCategory,
  GetTechnicalDocumentationArgs,
  TechnicalDocumentation,
  TechnicalSearchResult,
  UnifiedSearchResult
} from './types.js';

export class HIGToolProvider {
  private crawleeService: CrawleeHIGService;
  private _cache: HIGCache;
  private resourceProvider: HIGResourceProvider;
  private staticContentProvider?: HIGStaticContentProvider;
  private appleDevAPIClient: AppleDevAPIClient;
  private contentFusionService: ContentFusionService;

  constructor(crawleeService: CrawleeHIGService, cache: HIGCache, resourceProvider: HIGResourceProvider, staticContentProvider?: HIGStaticContentProvider, appleDevAPIClient?: AppleDevAPIClient) {
    this.crawleeService = crawleeService;
    this._cache = cache;
    this.resourceProvider = resourceProvider;
    this.staticContentProvider = staticContentProvider;
    this.appleDevAPIClient = appleDevAPIClient || new AppleDevAPIClient(cache);
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
          const bestCrossRef = {
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
          implementationGuide = {
            title: `${component} Implementation Guide`,
            overview: `Implementation guide for ${component} on ${platform}`,
            phases: ['Design', 'Implementation', 'Validation']
          };
        }
      }

      // If no specific content found, generate generic guidance
      if (!fusedContent && !implementationGuide) {
        implementationGuide = {
          title: `${component} Implementation Guide`,
          overview: `Generic implementation guide for ${component} on ${platform}`,
          phases: ['Design', 'Implementation', 'Validation']
        };
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

}