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
    test('should discover HIG sections', async () => {
      const mockHtml = `
        <html>
          <body>
            <nav>
              <a href="/design/human-interface-guidelines/ios">iOS Guidelines</a>
              <a href="/design/human-interface-guidelines/macos">macOS Guidelines</a>
            </nav>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as any);

      const sections = await scraper.discoverSections();
      
      expect(sections).toHaveLength(2);
      expect(sections[0].platform).toBe('iOS');
      expect(sections[1].platform).toBe('macOS');
    });

    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const sections = await scraper.discoverSections();
      expect(sections).toEqual([]);
    });

    test('should extract platform from URL and text', async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="/design/human-interface-guidelines/watchos/buttons">watchOS Buttons</a>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as any);

      const sections = await scraper.discoverSections();
      expect(sections[0].platform).toBe('watchOS');
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
            <h1>iOS Buttons</h1>
            <p>Buttons initiate actions and enable user interaction.</p>
            <ul>
              <li>Use clear, descriptive labels</li>
              <li>Make buttons large enough to tap easily</li>
            </ul>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      } as any);

      const result = await scraper.fetchSectionContent(mockSection);
      
      expect(result.content).toContain('iOS Buttons');
      expect(result.content).toContain('Buttons initiate actions');
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
      expect(results[0].relevanceScore).toBe(1.0); // Title match
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