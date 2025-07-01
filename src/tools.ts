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
      
      // Use fallback approach to avoid timeouts
      const component = this.getComponentSpecFallback(trimmedComponentName, platform);
      
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
}