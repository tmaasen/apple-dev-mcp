/**
 * Field Test Scenarios - Unit tests based on real-world MCP usage
 * 
 * These tests validate the MCP tools' responses against the actual field test
 * where Claude Code used our MCP to look up search guidelines and compare
 * them against SearchBar and MealLogView components.
 */

import { HIGToolProvider } from '../tools.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGCache } from '../cache.js';
import type { SearchResult, UnifiedSearchResult } from '../types.js';

describe('Field Test Scenarios', () => {
  let cache: HIGCache;
  let crawleeService: CrawleeHIGService;
  let toolProvider: HIGToolProvider;

  beforeEach(() => {
    cache = new HIGCache(60);
    crawleeService = new CrawleeHIGService(cache);
    toolProvider = new HIGToolProvider(crawleeService, cache);
  });

  afterEach(async () => {
    await crawleeService.teardown();
    cache.clear();
  });

  describe('Original Field Test Queries', () => {
    test('should find relevant search guidelines for query 1: "search guidelines search bar best practices"', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'search guidelines search bar best practices',
        platform: 'iOS'
      });

      // Validate basic structure
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.query).toBe('search guidelines search bar best practices');
      expect(result.filters.platform).toBe('iOS');
      expect(result.total).toBe(result.results.length);

      // Should find relevant results (not fallback content)
      expect(result.results.length).toBeGreaterThan(0);
      
      // Top result should be search-related with high relevance
      const topResult = result.results[0];
      expect(topResult.relevanceScore).toBeGreaterThan(1.0); // Improved threshold
      
      // Should find actual search content (not just accessibility fallback)
      const searchResults = result.results.filter(r => 
        r.title.toLowerCase().includes('search') || 
        r.content.toLowerCase().includes('search')
      );
      expect(searchResults.length).toBeGreaterThan(0);

      // Content should be substantial (not just snippets)
      expect(topResult.content.length).toBeGreaterThan(200);
    });

    test('should find interface patterns for query 2: "search patterns search interface components"', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'search patterns search interface components',
        platform: 'iOS'
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.query).toBe('search patterns search interface components');

      // Should find search-related components/patterns
      const relevantResults = result.results.filter(r => {
        const content = (r.title + ' ' + r.content).toLowerCase();
        return content.includes('search') || content.includes('interface') || content.includes('pattern');
      });
      
      expect(relevantResults.length).toBeGreaterThan(0);
      
      // Top result should have good relevance
      expect(result.results[0].relevanceScore).toBeGreaterThan(0.5);
    });

    test('should find technical implementation for query 3: "UISearchBar search controller searchable"', async () => {
      const result = await toolProvider.searchUnified({
        query: 'UISearchBar search controller searchable',
        platform: 'iOS'
      });

      expect(result.results).toBeDefined();
      expect(result.designResults).toBeDefined();
      expect(result.technicalResults).toBeDefined();
      expect(result.total).toBe(result.results.length);
      expect(result.sources).toContain('design-guidelines');

      // Should find design guidelines that relate to search
      expect(result.designResults.length).toBeGreaterThan(0);
      
      // At least one result should be search-related
      const searchDesignResults = result.designResults.filter(r => 
        r.title.toLowerCase().includes('search') || 
        r.content.toLowerCase().includes('search')
      );
      expect(searchDesignResults.length).toBeGreaterThan(0);

      // Results should have reasonable relevance scores
      if (result.results.length > 0) {
        expect(result.results[0].relevanceScore).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Search Quality Validation', () => {
    test('should prioritize "Searching" section for search-related queries', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'searching',
        platform: 'iOS'
      });

      expect(result.results.length).toBeGreaterThan(0);
      
      // Should find the "Searching" section as top result
      const topResult = result.results[0];
      expect(topResult.title.toLowerCase()).toContain('search');
      expect(topResult.relevanceScore).toBeGreaterThan(2.0); // Very high for exact match
    });

    test('should find "Search Fields" for search bar queries', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'search bar search field',
        platform: 'iOS'
      });

      expect(result.results.length).toBeGreaterThan(0);
      
      // Should include search fields in results
      const searchFieldResults = result.results.filter(r => 
        r.title.toLowerCase().includes('search field') ||
        r.title.toLowerCase().includes('search')
      );
      expect(searchFieldResults.length).toBeGreaterThan(0);
    });

    test('should not return only generic fallback content for specific queries', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'search guidelines best practices',
        platform: 'iOS'
      });

      expect(result.results.length).toBeGreaterThan(0);
      
      // Should not be dominated by generic accessibility/branding content
      const specificResults = result.results.filter(r => {
        const title = r.title.toLowerCase();
        return title.includes('search') || title.includes('guideline');
      });
      
      // At least one result should be search-specific
      expect(specificResults.length).toBeGreaterThan(0);
      
      // Top result should not be just "Accessibility" (which was the old fallback)
      const topResult = result.results[0];
      expect(topResult.title.toLowerCase()).not.toBe('accessibility');
    });
  });

  describe('Response Format Validation', () => {
    test('should return properly formatted SearchResult objects', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button guidelines',
        platform: 'iOS'
      });

      expect(result.results.length).toBeGreaterThan(0);
      
      const searchResult = result.results[0] as SearchResult;
      
      // Validate required fields
      expect(searchResult.id).toBeDefined();
      expect(typeof searchResult.id).toBe('string');
      expect(searchResult.title).toBeDefined();
      expect(typeof searchResult.title).toBe('string');
      expect(searchResult.url).toBeDefined();
      expect(typeof searchResult.url).toBe('string');
      expect(searchResult.platform).toBeDefined();
      expect(searchResult.relevanceScore).toBeDefined();
      expect(typeof searchResult.relevanceScore).toBe('number');
      expect(searchResult.content).toBeDefined();
      expect(typeof searchResult.content).toBe('string');
      expect(searchResult.type).toBeDefined();
      
      // Validate URL format
      expect(searchResult.url).toMatch(/^https?:\/\//);
      
      // Validate relevance score range
      expect(searchResult.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(searchResult.relevanceScore).toBeLessThanOrEqual(5); // Reasonable upper bound
    });

    test('should return properly formatted UnifiedSearchResult objects', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button design implementation',
        platform: 'iOS'
      });

      if (result.results.length > 0) {
        const unifiedResult = result.results[0] as UnifiedSearchResult;
        
        // Validate required fields
        expect(unifiedResult.id).toBeDefined();
        expect(unifiedResult.title).toBeDefined();
        expect(unifiedResult.type).toBeDefined();
        expect(['design', 'technical', 'combined'].includes(unifiedResult.type)).toBe(true);
        expect(unifiedResult.url).toBeDefined();
        expect(unifiedResult.relevanceScore).toBeDefined();
        expect(unifiedResult.snippet).toBeDefined();
        
        // Type-specific content validation
        if (unifiedResult.type === 'design' || unifiedResult.type === 'combined') {
          expect(unifiedResult.designContent).toBeDefined();
          expect(unifiedResult.designContent.platform).toBeDefined();
        }
        
        if (unifiedResult.type === 'technical' || unifiedResult.type === 'combined') {
          expect(unifiedResult.technicalContent).toBeDefined();
          expect(unifiedResult.technicalContent.framework).toBeDefined();
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty queries gracefully', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: '',
        platform: 'iOS'
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total).toBe(0);
      expect(result.query).toBe('');
    });

    test('should handle whitespace-only queries', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: '   ',
        platform: 'iOS'
      });

      expect(result.results).toBeDefined();
      expect(result.total).toBe(0);
      expect(result.query).toBe('');
    });

    test('should validate platform parameter', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button',
        platform: 'InvalidPlatform' as any
      });

      // Should still return results (handled gracefully)
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.query).toBe('button');
    });

    test('should handle very long queries', async () => {
      const longQuery = 'button '.repeat(30); // 180 characters
      
      await expect(
        toolProvider.searchHumanInterfaceGuidelines({
          query: longQuery,
          platform: 'iOS'
        })
      ).rejects.toThrow('Query too long');
    });
  });

  describe('Performance and Caching', () => {
    test('should return results within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button guidelines',
        platform: 'iOS'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.results.length).toBeGreaterThan(0);
      
      // Should complete within 5 seconds (static content should be fast)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle concurrent searches', async () => {
      const searches = [
        toolProvider.searchHumanInterfaceGuidelines({ query: 'button', platform: 'iOS' }),
        toolProvider.searchHumanInterfaceGuidelines({ query: 'search', platform: 'iOS' }),
        toolProvider.searchHumanInterfaceGuidelines({ query: 'navigation', platform: 'iOS' })
      ];

      const results = await Promise.all(searches);
      
      // All searches should succeed
      results.forEach(result => {
        expect(result.results).toBeDefined();
        expect(result.results.length).toBeGreaterThan(0);
      });
    });
  });
});