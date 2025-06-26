import { HIGToolProvider } from '../tools.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGCache } from '../cache.js';
import { HIGResourceProvider } from '../resources.js';

describe('HIGToolProvider', () => {
  let cache: HIGCache;
  let crawleeService: CrawleeHIGService;
  let resourceProvider: HIGResourceProvider;
  let toolProvider: HIGToolProvider;

  beforeEach(() => {
    cache = new HIGCache(60);
    crawleeService = new CrawleeHIGService(cache);
    resourceProvider = new HIGResourceProvider(crawleeService, cache);
    toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider);
  });

  afterEach(async () => {
    await crawleeService.teardown();
    cache.clear();
  });

  describe('Search Guidelines', () => {
    test('should search guidelines successfully', async () => {
      const mockSearchResults = [
        {
          id: 'ios-button',
          title: 'iOS Button',
          url: 'https://example.com/button',
          platform: 'iOS' as const,
          relevanceScore: 1.0,
          snippet: 'Button design guidelines',
          type: 'section' as const
        }
      ];

      jest.spyOn(crawleeService, 'searchContent').mockResolvedValue(mockSearchResults);
      jest.spyOn(resourceProvider, 'getResource').mockResolvedValue({
        uri: 'hig://ios',
        name: 'iOS Guidelines',
        description: 'iOS design guidelines',
        mimeType: 'text/markdown',
        content: 'Comprehensive button design guidelines for iOS'
      });

      const result = await toolProvider.searchGuidelines({
        query: 'button',
        platform: 'iOS',
        limit: 10
      });

      expect(result.results).toHaveLength(1);
      expect(result.query).toBe('button');
      expect(result.filters.platform).toBe('iOS');
      expect(result.total).toBe(1);
    });

    test('should handle search errors gracefully with fallback', async () => {
      jest.spyOn(crawleeService, 'searchContent').mockRejectedValue(new Error('Search failed'));

      const result = await toolProvider.searchGuidelines({
        query: 'button'
      });

      // Should return fallback results instead of throwing
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.query).toBe('button');
    });
  });

  describe('Get Component Spec', () => {
    test('should get component specification', async () => {
      const mockSearchResults = [
        {
          id: 'ios-button',
          title: 'iOS Button',
          url: 'https://example.com/button',
          platform: 'iOS' as const,
          relevanceScore: 1.0,
          snippet: 'Button specifications',
          type: 'section' as const
        }
      ];

      const mockSections = [
        {
          id: 'ios-button',
          title: 'iOS Button',
          url: 'https://example.com/button',
          platform: 'iOS' as const,
          category: 'visual-design' as const
        }
      ];

      const mockSectionWithContent = {
        ...mockSections[0],
        content: 'Button height: 44pt\nButton color: blue\nPadding: 16pt\n- Use clear labels\n- Make buttons accessible',
        lastUpdated: new Date()
      };

      jest.spyOn(crawleeService, 'searchContent').mockResolvedValue(mockSearchResults);
      jest.spyOn(crawleeService, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(crawleeService, 'fetchSectionContent').mockResolvedValue(mockSectionWithContent);

      const result = await toolProvider.getComponentSpec({
        componentName: 'Button',
        platform: 'iOS'
      });

      expect(result.component).toBeTruthy();
      expect(result.component?.title).toBe('Buttons'); // Uses fallback implementation
      expect(result.component?.platforms).toContain('iOS');
      expect(result.component?.specifications).toBeDefined();
      expect(result.platforms).toContain('iOS');
    });

    test('should return null for non-existent component', async () => {
      jest.spyOn(crawleeService, 'searchContent').mockResolvedValue([]);

      const result = await toolProvider.getComponentSpec({
        componentName: 'NonExistentComponent'
      });

      expect(result.component).toBeNull();
      expect(result.relatedComponents).toEqual([]);
      expect(result.platforms).toEqual([]);
    });
  });

  describe('Get Design Tokens', () => {
    test('should get design tokens for button component', async () => {
      const result = await toolProvider.getDesignTokens({
        component: 'Button',
        platform: 'iOS',
        tokenType: 'all'
      });

      expect(result.component).toBe('Button');
      expect(result.platform).toBe('iOS');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.colors).toBeDefined();
      expect(result.tokens.spacing).toBeDefined();
      expect(result.tokens.typography).toBeDefined();
      expect(result.tokens.dimensions).toBeDefined();
    });

    test('should get specific token type', async () => {
      const result = await toolProvider.getDesignTokens({
        component: 'Button',
        platform: 'iOS',
        tokenType: 'colors'
      });

      expect(result.tokens.colors).toBeDefined();
      expect(result.tokens.spacing).toBeUndefined();
    });
  });

  describe('Get Accessibility Requirements', () => {
    test('should get accessibility requirements for button', async () => {
      const result = await toolProvider.getAccessibilityRequirements({
        component: 'Button',
        platform: 'iOS'
      });

      expect(result.component).toBe('Button');
      expect(result.platform).toBe('iOS');
      expect(result.requirements).toBeDefined();
      expect(result.requirements.minimumTouchTarget).toBeDefined();
      expect(result.requirements.contrastRatio).toBeDefined();
      expect(result.requirements.voiceOverSupport).toBeDefined();
      expect(result.requirements.keyboardNavigation).toBeDefined();
      expect(result.requirements.wcagCompliance).toBeDefined();
    });

    test('should get accessibility requirements for navigation', async () => {
      const result = await toolProvider.getAccessibilityRequirements({
        component: 'Navigation Bar',
        platform: 'iOS'
      });

      expect(result.requirements.voiceOverSupport).toContain('Navigation bar trait');
      expect(result.requirements.keyboardNavigation).toContain('Tab navigation through interactive elements');
    });
  });

  describe('Helper Methods', () => {
    test('should extract specifications from content', () => {
      const content = 'Button width: 100px\nButton height: 44pt\nButton color: blue\nPadding: 16pt';
      
      // Access private method for testing
      const extractMethod = (toolProvider as any).extractSpecifications.bind(toolProvider);
      const specs = extractMethod(content);
      
      expect(specs).toBeDefined();
      expect(specs.dimensions).toBeDefined();
      expect(specs.colors).toBeDefined();
      expect(specs.spacing).toBeDefined();
    });

    test('should extract guidelines from content', () => {
      const content = `
Guidelines:
- Use clear, descriptive labels
- Make buttons large enough to tap
1. Ensure proper contrast
2. Support accessibility features
      `;
      
      const extractMethod = (toolProvider as any).extractGuidelines.bind(toolProvider);
      const guidelines = extractMethod(content);
      
      expect(guidelines.length).toBeGreaterThan(0);
      expect(guidelines).toContain('Use clear, descriptive labels');
      expect(guidelines).toContain('Ensure proper contrast');
    });

    test('should extract examples from content', () => {
      const content = 'For example: Primary buttons, Secondary buttons. Such as: Save, Cancel buttons.';
      
      const extractMethod = (toolProvider as any).extractExamples.bind(toolProvider);
      const examples = extractMethod(content);
      
      expect(examples.length).toBeGreaterThan(0);
    });
  });
});