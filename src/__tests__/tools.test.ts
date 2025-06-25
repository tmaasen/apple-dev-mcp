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

    test('should handle search errors gracefully', async () => {
      jest.spyOn(crawleeService, 'searchContent').mockRejectedValue(new Error('Search failed'));

      await expect(toolProvider.searchGuidelines({
        query: 'button'
      })).rejects.toThrow('Search failed');
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
      expect(result.component?.title).toBe('iOS Button');
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

  describe('Compare Platforms', () => {
    test('should compare component across platforms', async () => {
      const mockComponentSpecs = {
        iOS: {
          component: {
            id: 'ios-button',
            title: 'iOS Button',
            description: 'iOS button description',
            platforms: ['iOS' as const],
            url: 'https://example.com/ios-button',
            guidelines: ['Use clear labels', 'Make buttons accessible'],
            specifications: { 
              dimensions: { height: '44pt' },
              colors: { primary: 'blue' }
            },
            lastUpdated: new Date()
          },
          relatedComponents: [],
          platforms: ['iOS' as const],
          lastUpdated: new Date().toISOString()
        },
        macOS: {
          component: {
            id: 'macos-button',
            title: 'macOS Button',
            description: 'macOS button description',
            platforms: ['macOS' as const],
            url: 'https://example.com/macos-button',
            guidelines: ['Use clear labels', 'Support keyboard navigation'],
            specifications: { 
              dimensions: { height: '32pt' },
              colors: { primary: 'blue' }
            },
            lastUpdated: new Date()
          },
          relatedComponents: [],
          platforms: ['macOS' as const],
          lastUpdated: new Date().toISOString()
        }
      };

      jest.spyOn(toolProvider, 'getComponentSpec')
        .mockImplementation(async ({ platform }) => {
          return mockComponentSpecs[platform as keyof typeof mockComponentSpecs];
        });

      const result = await toolProvider.comparePlatforms({
        componentName: 'Button',
        platforms: ['iOS', 'macOS']
      });

      expect(result.componentName).toBe('Button');
      expect(result.platforms).toHaveLength(2);
      expect(result.commonGuidelines).toContain('Use clear labels');
      expect(result.keyDifferences).toBeDefined();
    });
  });

  describe('Get Latest Updates', () => {
    test('should get latest updates', async () => {
      const mockSections = [
        {
          id: 'recent-update',
          title: 'Recent Update',
          url: 'https://example.com/recent',
          platform: 'iOS' as const,
          category: 'foundations' as const
        }
      ];

      const mockLiquidGlassResource = {
        uri: 'hig://updates/latest-design-system',
        name: 'Liquid Glass',
        description: 'Liquid Glass design system',
        mimeType: 'text/markdown',
        content: 'Translucent materials with real-time rendering'
      };

      jest.spyOn(crawleeService, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(resourceProvider, 'getResource').mockResolvedValue(mockLiquidGlassResource);

      const result = await toolProvider.getLatestUpdates({
        limit: 10
      });

      expect(result.updates).toBeDefined();
      expect(result.designSystemHighlights).toHaveLength(5);
      expect(result.currentDesignSummary).toContain('design system');
      expect(result.updates.some(u => u.liquidGlassRelated === false)).toBe(true);
    });

    test('should filter updates by platform', async () => {
      const mockSections = [
        {
          id: 'ios-update',
          title: 'iOS Update',
          url: 'https://example.com/ios-update',
          platform: 'iOS' as const,
          category: 'foundations' as const
        },
        {
          id: 'macos-update',
          title: 'macOS Update',
          url: 'https://example.com/macos-update',
          platform: 'macOS' as const,
          category: 'foundations' as const
        }
      ];

      jest.spyOn(crawleeService, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(resourceProvider, 'getResource').mockResolvedValue({
        uri: 'hig://updates/latest-design-system',
        name: 'Liquid Glass',
        description: 'Liquid Glass design system',
        mimeType: 'text/markdown',
        content: 'Liquid Glass content'
      });

      const result = await toolProvider.getLatestUpdates({
        platform: 'iOS',
        limit: 10
      });

      // Should include platform-specific updates plus Liquid Glass updates
      expect(result.updates).toBeDefined();
      expect(result.updates.length).toBeGreaterThan(0);
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