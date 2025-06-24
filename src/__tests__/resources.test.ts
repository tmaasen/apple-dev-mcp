import { HIGResourceProvider } from '../resources.js';
import { HIGScraper } from '../scraper.js';
import { HIGCache } from '../cache.js';

describe('HIGResourceProvider', () => {
  let cache: HIGCache;
  let scraper: HIGScraper;
  let resourceProvider: HIGResourceProvider;

  beforeEach(() => {
    cache = new HIGCache(60);
    scraper = new HIGScraper(cache);
    resourceProvider = new HIGResourceProvider(scraper, cache);
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Resource Listing', () => {
    test('should list available resources', async () => {
      // Mock sections discovery
      const mockSections = [
        {
          id: 'ios-foundations',
          title: 'iOS Foundations',
          url: 'https://example.com/ios-foundations',
          platform: 'iOS' as const,
          category: 'foundations' as const
        },
        {
          id: 'macos-layout',
          title: 'macOS Layout',
          url: 'https://example.com/macos-layout',
          platform: 'macOS' as const,
          category: 'layout' as const
        }
      ];

      jest.spyOn(scraper, 'discoverSections').mockResolvedValue(mockSections);

      const resources = await resourceProvider.listResources();
      
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.some(r => r.uri === 'hig://ios')).toBe(true);
      expect(resources.some(r => r.uri === 'hig://macos')).toBe(true);
      expect(resources.some(r => r.uri === 'hig://updates/liquid-glass')).toBe(true);
    });

    test('should include special update resources', async () => {
      jest.spyOn(scraper, 'discoverSections').mockResolvedValue([]);

      const resources = await resourceProvider.listResources();
      
      const liquidGlassResource = resources.find(r => r.uri === 'hig://updates/liquid-glass');
      const latestResource = resources.find(r => r.uri === 'hig://updates/latest');
      
      expect(liquidGlassResource).toBeDefined();
      expect(liquidGlassResource?.name).toContain('Liquid Glass');
      expect(latestResource).toBeDefined();
    });
  });

  describe('Resource Retrieval', () => {
    test('should get platform-specific resource', async () => {
      const mockSections = [
        {
          id: 'ios-buttons',
          title: 'iOS Buttons',
          url: 'https://example.com/ios-buttons',
          platform: 'iOS' as const,
          category: 'visual-design' as const
        }
      ];

      jest.spyOn(scraper, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(scraper, 'fetchSectionContent').mockResolvedValue({
        ...mockSections[0],
        content: 'iOS button guidelines'
      });

      const resource = await resourceProvider.getResource('hig://ios');
      
      expect(resource).toBeTruthy();
      expect(resource?.name).toBe('iOS Human Interface Guidelines');
      expect(resource?.content).toContain('iOS Human Interface Guidelines');
      expect(resource?.content).toContain('Attribution Notice');
    });

    test('should get category-specific resource', async () => {
      const mockSections = [
        {
          id: 'ios-visual-design',
          title: 'iOS Visual Design',
          url: 'https://example.com/ios-visual-design',
          platform: 'iOS' as const,
          category: 'visual-design' as const
        }
      ];

      jest.spyOn(scraper, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(scraper, 'fetchSectionContent').mockResolvedValue({
        ...mockSections[0],
        content: 'Visual design principles'
      });

      const resource = await resourceProvider.getResource('hig://ios/visual-design');
      
      expect(resource).toBeTruthy();
      expect(resource?.name).toBe('iOS Visual Design');
      expect(resource?.content).toContain('iOS Visual Design');
    });

    test('should get Liquid Glass update resource', async () => {
      const resource = await resourceProvider.getResource('hig://updates/liquid-glass');
      
      expect(resource).toBeTruthy();
      expect(resource?.name).toContain('Liquid Glass');
      expect(resource?.content).toContain('Liquid Glass Design System');
      expect(resource?.content).toContain('Translucent Materials');
      expect(resource?.content).toContain('Attribution Notice');
    });

    test('should get latest updates resource', async () => {
      const resource = await resourceProvider.getResource('hig://updates/latest');
      
      expect(resource).toBeTruthy();
      expect(resource?.name).toBe('Latest HIG Updates');
      expect(resource?.content).toContain('Latest HIG Updates');
      expect(resource?.content).toContain('WWDC 2025');
    });

    test('should return null for invalid URI', async () => {
      const resource = await resourceProvider.getResource('invalid://uri');
      expect(resource).toBeNull();
    });

    test('should use cached resources', async () => {
      // Set up cache
      const cachedResource = {
        uri: 'hig://cached',
        name: 'Cached Resource',
        description: 'A cached resource',
        mimeType: 'text/markdown',
        content: 'Cached content'
      };
      
      cache.set('resource:hig://cached', cachedResource);

      const resource = await resourceProvider.getResource('hig://cached');
      
      expect(resource).toEqual(cachedResource);
    });
  });

  describe('URI Parsing', () => {
    test('should handle various URI formats', async () => {
      const testCases = [
        { uri: 'hig://ios', expected: { type: 'platform', platform: 'iOS' } },
        { uri: 'hig://macos/layout', expected: { type: 'category', platform: 'macOS', category: 'layout' } },
        { uri: 'hig://updates/liquid-glass', expected: { type: 'updates', updateType: 'liquid-glass' } },
        { uri: 'hig://updates', expected: { type: 'updates', updateType: 'latest' } }
      ];

      for (const testCase of testCases) {
        // Access private method for testing
        const parseMethod = (resourceProvider as any).parseResourceURI.bind(resourceProvider);
        const parsed = parseMethod(testCase.uri);
        
        expect(parsed?.type).toBe(testCase.expected.type);
        if (testCase.expected.platform) {
          expect(parsed?.platform).toBe(testCase.expected.platform);
        }
      }
    });
  });
});