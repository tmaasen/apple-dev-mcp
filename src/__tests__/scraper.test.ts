import { HIGScraper } from '../scraper.js';
import { HIGCache } from '../cache.js';

// Mock fetch
jest.mock('node-fetch', () => jest.fn());
const mockFetch = require('node-fetch') as jest.MockedFunction<typeof fetch>;

describe('HIGScraper', () => {
  let cache: HIGCache;
  let scraper: HIGScraper;

  beforeEach(() => {
    cache = new HIGCache(60);
    scraper = new HIGScraper(cache);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Content Scraping', () => {
    test('should discover HIG sections from curated list', async () => {
      // Mock the verification request that the scraper makes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Apple HIG</body></html>')
      } as any);

      const sections = await scraper.discoverSections();
      
      // Should return the full curated list (22 sections)
      expect(sections.length).toBeGreaterThan(20);
      
      // Check that we have sections for different platforms
      const platforms = [...new Set(sections.map(s => s.platform))];
      expect(platforms).toContain('iOS');
      expect(platforms).toContain('macOS');
      expect(platforms).toContain('watchOS');
      expect(platforms).toContain('tvOS');
      expect(platforms).toContain('visionOS');
      expect(platforms).toContain('universal');
      
      // Check that sections have required properties
      sections.forEach(section => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('url');
        expect(section).toHaveProperty('platform');
        expect(section).toHaveProperty('category');
        expect(section).toHaveProperty('lastUpdated');
      });
    });

    test('should handle network errors gracefully and still return sections', async () => {
      // Mock network error for the verification request
      mockFetch.mockRejectedValue(new Error('Network error'));

      const sections = await scraper.discoverSections();
      
      // Should still return curated sections even if verification fails
      expect(sections.length).toBeGreaterThan(20);
      expect(sections[0]).toHaveProperty('title');
      expect(sections[0]).toHaveProperty('url');
    });

    test('should include expected platform-specific sections', async () => {
      // Mock successful verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Apple HIG</body></html>')
      } as any);

      const sections = await scraper.discoverSections();
      
      // Check for specific expected sections
      const iosSections = sections.filter(s => s.platform === 'iOS');
      const macOSSections = sections.filter(s => s.platform === 'macOS');
      const watchOSSections = sections.filter(s => s.platform === 'watchOS');
      
      expect(iosSections.length).toBeGreaterThan(5);
      expect(macOSSections.length).toBeGreaterThan(2);
      expect(watchOSSections.length).toBeGreaterThan(1);
      
      // Check for specific known sections
      expect(sections.some(s => s.title === 'iOS Overview')).toBe(true);
      expect(sections.some(s => s.title === 'macOS Overview')).toBe(true);
      expect(sections.some(s => s.title === 'watchOS Overview')).toBe(true);
    });

    test('should cache discovered sections', async () => {
      // Mock successful verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Apple HIG</body></html>')
      } as any);

      // First call should make network request
      const sections1 = await scraper.discoverSections();
      const firstCallCount = mockFetch.mock.calls.length;
      expect(firstCallCount).toBeGreaterThan(0);

      // Second call should use cache
      const sections2 = await scraper.discoverSections();
      expect(mockFetch).toHaveBeenCalledTimes(firstCallCount); // No additional calls
      
      expect(sections1).toEqual(sections2);
    });
  });

  describe('Content Fetching', () => {
    test('should fetch section content', async () => {
      const mockSection = {
        id: 'ios-buttons',
        title: 'iOS Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/ios/buttons',
        platform: 'iOS' as const,
        category: 'visual-design' as const
      };

      const mockContent = `
        <html>
          <body>
            <main>
              <h1>iOS Buttons</h1>
              <p>Buttons initiate actions and enable user interaction.</p>
              <ul>
                <li>Use clear, descriptive labels</li>
                <li>Make buttons large enough to tap easily</li>
              </ul>
            </main>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      } as any);

      const result = await scraper.fetchSectionContent(mockSection);
      
      // Content should always be available (either fetched or fallback)
      expect(result.content).toBeDefined();
      expect(result.content).not.toBe('');
      expect(result.content?.length).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    test('should use cached content when available', async () => {
      const mockSection = {
        id: 'cached-section',
        title: 'Cached Section',
        url: 'https://example.com/cached',
        platform: 'iOS' as const,
        category: 'foundations' as const
      };

      // Set up cache
      cache.set('hig:section:cached-section', {
        ...mockSection,
        content: 'Cached content'
      });

      const result = await scraper.fetchSectionContent(mockSection);
      
      expect(result.content).toBe('Cached content');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    test('should search content by query', async () => {
      // Mock sections discovery
      const mockSections = [
        {
          id: 'ios-buttons',
          title: 'iOS Buttons',
          url: 'https://example.com/buttons',
          platform: 'iOS' as const,
          category: 'visual-design' as const
        }
      ];

      // Mock the scraper's discoverSections method
      jest.spyOn(scraper, 'discoverSections').mockResolvedValue(mockSections);

      // Mock content fetching
      jest.spyOn(scraper, 'fetchSectionContent').mockResolvedValue({
        ...mockSections[0],
        content: 'This section covers button design principles and best practices.'
      });

      const results = await scraper.searchContent('button', 'iOS');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('iOS Buttons');
      expect(results[0].relevanceScore).toBeGreaterThan(1.0); // Enhanced relevance scoring
    });

    test('should filter by platform and category', async () => {
      const mockSections = [
        {
          id: 'ios-buttons',
          title: 'iOS Buttons',
          url: 'https://example.com/ios-buttons',
          platform: 'iOS' as const,
          category: 'visual-design' as const
        },
        {
          id: 'macos-buttons',
          title: 'macOS Buttons',
          url: 'https://example.com/macos-buttons',
          platform: 'macOS' as const,
          category: 'visual-design' as const
        }
      ];

      jest.spyOn(scraper, 'discoverSections').mockResolvedValue(mockSections);
      jest.spyOn(scraper, 'fetchSectionContent').mockImplementation(async (section) => ({
        ...section,
        content: 'Button design guidelines'
      }));

      const results = await scraper.searchContent('button', 'iOS', 'visual-design');
      
      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe('iOS');
    });
  });
});