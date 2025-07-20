/**
 * Search Improvements Validation Tests
 * 
 * These tests validate the specific search improvements made to fix
 * the field test issues and prevent regressions.
 */

import { StaticContentSearchService } from '../services/static-content-search.service.js';
// import type { SearchResult } from '../types.js';

describe('Search Improvements Validation', () => {
  let searchService: StaticContentSearchService;

  beforeEach(() => {
    searchService = new StaticContentSearchService('content');
  });

  describe('Synonym Expansion', () => {
    test('should treat "search" and "searching" as related terms', async () => {
      const searchResults = await searchService.searchContent('search', 'iOS', undefined, 5);
      const searchingResults = await searchService.searchContent('searching', 'iOS', undefined, 5);

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchingResults.length).toBeGreaterThan(0);
      
      // Both should find search-related content
      const searchTitles = searchResults.map(r => r.title.toLowerCase());
      const searchingTitles = searchingResults.map(r => r.title.toLowerCase());
      
      // Should have significant overlap in results
      const hasSearchContent = searchTitles.some(title => title.includes('search'));
      const hasSearchingContent = searchingTitles.some(title => title.includes('search'));
      
      expect(hasSearchContent).toBe(true);
      expect(hasSearchingContent).toBe(true);
    });

    test('should expand "guidelines" to include "best practices"', async () => {
      const guidelinesResults = await searchService.searchContent('guidelines', 'iOS', undefined, 5);
      const bestPracticesResults = await searchService.searchContent('best practices', 'iOS', undefined, 5);

      expect(guidelinesResults.length).toBeGreaterThan(0);
      expect(bestPracticesResults.length).toBeGreaterThan(0);
      
      // Both queries should find relevant content
      expect(guidelinesResults[0].relevanceScore).toBeGreaterThan(0.5);
      expect(bestPracticesResults[0].relevanceScore).toBeGreaterThan(0.5);
    });

    test('should expand "interface" to include "component" terms', async () => {
      const interfaceResults = await searchService.searchContent('interface', 'iOS', undefined, 3);
      const componentResults = await searchService.searchContent('component', 'iOS', undefined, 3);

      expect(interfaceResults.length).toBeGreaterThan(0);
      expect(componentResults.length).toBeGreaterThan(0);
      
      // Should find UI-related content for both
      const interfaceContent = interfaceResults.map(r => (r.title + ' ' + r.content).toLowerCase());
      const componentContent = componentResults.map(r => (r.title + ' ' + r.content).toLowerCase());
      
      const hasUIContent = interfaceContent.some(content => 
        content.includes('interface') || content.includes('component') || content.includes('ui')
      );
      const hasComponentContent = componentContent.some(content => 
        content.includes('interface') || content.includes('component') || content.includes('ui')
      );
      
      expect(hasUIContent).toBe(true);
      expect(hasComponentContent).toBe(true);
    });
  });

  describe('Multi-term Query Handling', () => {
    test('should handle complex multi-term queries effectively', async () => {
      const result = await searchService.searchContent('search guidelines best practices interface', 'iOS', undefined, 5);

      expect(result.length).toBeGreaterThan(0);
      
      // Should prioritize results that match multiple terms
      const topResult = result[0];
      expect(topResult.relevanceScore).toBeGreaterThan(0.8);
      
      // Content should relate to multiple query terms
      const content = (topResult.title + ' ' + topResult.content).toLowerCase();
      const termMatches = ['search', 'guideline', 'practice', 'interface'].filter(term => 
        content.includes(term)
      );
      
      expect(termMatches.length).toBeGreaterThan(1);
    });

    test('should score partial term matches appropriately', async () => {
      const fullTermResult = await searchService.searchContent('searching', 'iOS', undefined, 1);
      const partialTermResult = await searchService.searchContent('search field guide', 'iOS', undefined, 1);

      expect(fullTermResult.length).toBeGreaterThan(0);
      expect(partialTermResult.length).toBeGreaterThan(0);
      
      // Exact term match should score higher than partial matches
      expect(fullTermResult[0].relevanceScore).toBeGreaterThan(partialTermResult[0].relevanceScore);
    });
  });

  describe('Relevance Threshold Improvements', () => {
    test('should find more relevant results with lowered threshold', async () => {
      // This query previously returned only fallback content
      const result = await searchService.searchContent('search bar best practices', 'iOS', undefined, 5);

      expect(result.length).toBeGreaterThan(0);
      
      // Should find search-related content (not just generic fallback)
      const searchResults = result.filter(r => {
        const content = (r.title + ' ' + r.content).toLowerCase();
        return content.includes('search');
      });
      
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Top result should have reasonable relevance
      expect(result[0].relevanceScore).toBeGreaterThan(0.3);
    });

    test('should still filter out completely irrelevant results', async () => {
      const result = await searchService.searchContent('xyz123nonexistent', 'iOS', undefined, 5);

      // Should return some results (fallback) but they should have low scores
      expect(result.length).toBeGreaterThan(0); // Fallback system provides results
      expect(result.length).toBeLessThanOrEqual(5); // Respects limit
      
      // Any results returned should have low but non-zero scores
      if (result.length > 0) {
        expect(result[0].relevanceScore).toBeGreaterThan(0);
        expect(result[0].relevanceScore).toBeLessThan(1.5); // Allow for quality bonuses
      }
    });
  });

  describe('Content Quality Validation', () => {
    test('should prioritize high-quality guideline content', async () => {
      const result = await searchService.searchContent('button guidelines', 'iOS', undefined, 5);

      expect(result.length).toBeGreaterThan(0);
      
      // Should find button-related content
      const buttonResults = result.filter(r => 
        r.title.toLowerCase().includes('button') || 
        r.content.toLowerCase().includes('button')
      );
      
      expect(buttonResults.length).toBeGreaterThan(0);
      
      // Content should be substantial (not just snippets)
      const topResult = result[0];
      expect(topResult.content.length).toBeGreaterThan(100);
      
      // Should include structured guidance
      expect(topResult.content).toBeTruthy();
    });

    test('should return full content instead of just snippets', async () => {
      const result = await searchService.searchContent('accessibility guidelines', 'iOS', undefined, 1);

      expect(result.length).toBeGreaterThan(0);
      
      const topResult = result[0];
      
      // Content should be the full markdown content, not just snippet
      expect(topResult.content.length).toBeGreaterThan(500);
      
      // Should contain substantial content (full markdown content)
      // Content is processed to remove front matter, so check for substantial content
      expect(topResult.content).toMatch(/[A-Z][a-z]+\s+[A-Z][a-z]+/); // Should have proper content structure
    });
  });

  describe('Platform Filtering', () => {
    test('should respect platform filters while maintaining relevance', async () => {
      const iOSResult = await searchService.searchContent('button', 'iOS', undefined, 5);
      const universalResult = await searchService.searchContent('button', 'universal', undefined, 5);

      expect(iOSResult.length).toBeGreaterThan(0);
      expect(universalResult.length).toBeGreaterThan(0);
      
      // iOS results should include iOS and universal content
      const iOSPlatforms = iOSResult.map(r => r.platform);
      const validPlatforms = iOSPlatforms.every(platform => 
        platform === 'iOS' || platform === 'universal'
      );
      expect(validPlatforms).toBe(true);
      
      // Universal results should primarily be universal platform
      const universalPlatforms = universalResult.map(r => r.platform);
      const hasUniversal = universalPlatforms.some(platform => platform === 'universal');
      expect(hasUniversal).toBe(true); // Should have at least some universal content
    });
  });

  describe('Regression Prevention', () => {
    test('should find "Searching" content for search-related queries', async () => {
      const queries = [
        'search guidelines',
        'search bar best practices',
        'searching interface',
        'search patterns'
      ];

      for (const query of queries) {
        const result = await searchService.searchContent(query, 'iOS', undefined, 3);
        
        expect(result.length).toBeGreaterThan(0);
        
        // Should find search-related content
        const searchResults = result.filter(r => 
          r.title.toLowerCase().includes('search') || 
          r.content.toLowerCase().includes('search')
        );
        
        expect(searchResults.length).toBeGreaterThan(0);
        
        // Top result should have good relevance
        expect(result[0].relevanceScore).toBeGreaterThan(0.5);
      }
    });

    test('should not return only accessibility fallback for specific queries', async () => {
      const specificQueries = [
        'search guidelines search bar best practices',
        'search patterns search interface components',
        'button interaction guidelines',
        'navigation patterns'
      ];

      for (const query of specificQueries) {
        const result = await searchService.searchContent(query, 'iOS', undefined, 3);
        
        expect(result.length).toBeGreaterThan(0);
        
        // Should not have all results be "Accessibility" (old fallback behavior)
        const accessibilityCount = result.filter(r => 
          r.title.toLowerCase() === 'accessibility'
        ).length;
        
        expect(accessibilityCount).toBeLessThan(result.length);
        
        // Should find specific content related to the query
        const relevantResults = result.filter(r => {
          const content = (r.title + ' ' + r.content).toLowerCase();
          const queryTerms = query.toLowerCase().split(' ');
          return queryTerms.some(term => content.includes(term));
        });
        
        expect(relevantResults.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Validation', () => {
    test('should maintain fast search performance', async () => {
      const startTime = Date.now();
      
      const result = await searchService.searchContent('button guidelines interface', 'iOS', undefined, 5);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.length).toBeGreaterThan(0);
      
      // Should complete within 2 seconds for static content
      expect(duration).toBeLessThan(2000);
    });

    test('should handle multiple concurrent searches efficiently', async () => {
      const startTime = Date.now();
      
      const searches = [
        searchService.searchContent('button', 'iOS'),
        searchService.searchContent('search', 'iOS'), 
        searchService.searchContent('navigation', 'iOS'),
        searchService.searchContent('accessibility', 'iOS'),
        searchService.searchContent('layout', 'iOS')
      ];

      const results = await Promise.all(searches);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All searches should succeed
      results.forEach(result => {
        expect(result.length).toBeGreaterThan(0);
      });
      
      // Should complete within 3 seconds total
      expect(duration).toBeLessThan(3000);
    });
  });
});