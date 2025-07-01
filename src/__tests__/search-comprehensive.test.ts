/**
 * Comprehensive Search Test Suite
 * 
 * Tests authentication, UI patterns, and other key HIG searches
 * to ensure the MCP covers the majority of areas across the HIG.
 */

import { HIGToolProvider } from '../tools.js';
import { HIGCache } from '../cache.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGResourceProvider } from '../resources.js';
import { HIGStaticContentProvider } from '../static-content.js';

describe('Comprehensive Search Functionality', () => {
  let toolProvider: HIGToolProvider;
  let staticProvider: HIGStaticContentProvider;

  beforeAll(async () => {
    const cache = new HIGCache(3600);
    const crawleeService = new CrawleeHIGService(cache);
    staticProvider = new HIGStaticContentProvider();
    const resourceProvider = new HIGResourceProvider(crawleeService, cache, staticProvider);
    toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider, staticProvider);
    
    await staticProvider.initialize();
  });

  describe('Authentication & Security Searches', () => {
    const authenticationQueries = [
      { query: 'sign in with apple', expectedMinResults: 1, expectedTopResult: 'Sign in with Apple' },
      { query: 'privacy security', expectedMinResults: 1, expectedTopResult: 'Privacy' },
      { query: 'authentication', expectedMinResults: 1 },
      { query: 'login', expectedMinResults: 1 },
      { query: 'password', expectedMinResults: 1 },
      { query: 'sign in sign up', expectedMinResults: 1 },
      { query: 'social login', expectedMinResults: 1 },
      { query: 'apple google social authentication', expectedMinResults: 1 }
    ];

    test.each(authenticationQueries)(
      'should find results for "$query"',
      async ({ query, expectedMinResults, expectedTopResult }) => {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        expect(result.results).toHaveLength(Math.min(5, result.total));
        
        if (expectedTopResult) {
          expect(result.results[0].title).toBe(expectedTopResult);
        }
        
        // All results should have relevance scores
        result.results.forEach(r => {
          expect(r.relevanceScore).toBeGreaterThan(0);
          expect(r.title).toBeTruthy();
          expect(r.platform).toBeTruthy();
        });
      }
    );
  });

  describe('UI Component & Pattern Searches', () => {
    const uiQueries = [
      { query: 'button', expectedMinResults: 1, expectedTopResult: 'Buttons' },
      { query: 'navigation', expectedMinResults: 1 },
      { query: 'alert', expectedMinResults: 1, expectedTopResult: 'Alerts' },
      { query: 'text field', expectedMinResults: 1, expectedTopResult: 'Text Fields' },
      { query: 'menu', expectedMinResults: 1 },
      { query: 'toolbar', expectedMinResults: 1 },
      { query: 'tab bar', expectedMinResults: 1, expectedTopResult: 'Tab Bars' },
      { query: 'modal', expectedMinResults: 1 },
      { query: 'popup', expectedMinResults: 1 },
      { query: 'dropdown', expectedMinResults: 1 }
    ];

    test.each(uiQueries)(
      'should find UI components for "$query"',
      async ({ query, expectedMinResults, expectedTopResult }) => {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        
        if (expectedTopResult) {
          expect(result.results[0].title).toBe(expectedTopResult);
        }
      }
    );
  });

  describe('Error Handling & Validation Searches', () => {
    const errorQueries = [
      { query: 'error handling', expectedMinResults: 1 },
      { query: 'validation', expectedMinResults: 1 },
      { query: 'error message', expectedMinResults: 1 },
      { query: 'feedback', expectedMinResults: 1 },
      { query: 'warning', expectedMinResults: 1 },
      { query: 'notification', expectedMinResults: 1, expectedTopResult: 'Notifications' }
    ];

    test.each(errorQueries)(
      'should find error handling content for "$query"',
      async ({ query, expectedMinResults, expectedTopResult }) => {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        
        if (expectedTopResult) {
          expect(result.results[0].title).toBe(expectedTopResult);
        }
      }
    );
  });

  describe('Accessibility & Usability Searches', () => {
    const accessibilityQueries = [
      { query: 'accessibility', expectedMinResults: 1 },
      { query: 'voiceover', expectedMinResults: 1 },
      { query: 'touch target', expectedMinResults: 1 },
      { query: 'color contrast', expectedMinResults: 1 },
      { query: 'inclusive design', expectedMinResults: 1 },
      { query: 'dark mode', expectedMinResults: 1, expectedTopResult: 'Dark Mode' }
    ];

    test.each(accessibilityQueries)(
      'should find accessibility content for "$query"',
      async ({ query, expectedMinResults, expectedTopResult }) => {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        
        if (expectedTopResult) {
          expect(result.results[0].title).toBe(expectedTopResult);
        }
      }
    );
  });

  describe('Platform-Specific Searches', () => {
    const platformQueries = [
      { query: 'ios design', platform: 'iOS', expectedMinResults: 1 },
      { query: 'macos design', platform: 'macOS', expectedMinResults: 1 },
      { query: 'watchos design', platform: 'watchOS', expectedMinResults: 1 },
      { query: 'visionos design', platform: 'visionOS', expectedMinResults: 1 },
      { query: 'tvos design', platform: 'tvOS', expectedMinResults: 1 }
    ];

    test.each(platformQueries)(
      'should find platform-specific content for "$query" on $platform',
      async ({ query, platform, expectedMinResults }) => {
        const result = await toolProvider.searchGuidelines({ 
          query, 
          platform: platform as any,
          limit: 5 
        });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        
        // Results should be filtered to the specified platform or universal
        result.results.forEach(r => {
          expect(['universal', platform]).toContain(r.platform);
        });
      }
    );
  });

  describe('Design System & Visual Searches', () => {
    const visualQueries = [
      { query: 'color', expectedMinResults: 1, expectedTopResult: 'Color' },
      { query: 'typography', expectedMinResults: 1, expectedTopResult: 'Typography' },
      { query: 'icon', expectedMinResults: 1 },
      { query: 'layout', expectedMinResults: 1, expectedTopResult: 'Layout' },
      { query: 'spacing', expectedMinResults: 1 },
      { query: 'material', expectedMinResults: 1, expectedTopResult: 'Materials' },
      { query: 'animation', expectedMinResults: 1 },
      { query: 'motion', expectedMinResults: 1, expectedTopResult: 'Motion' }
    ];

    test.each(visualQueries)(
      'should find visual design content for "$query"',
      async ({ query, expectedMinResults, expectedTopResult }) => {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(result.total).toBeGreaterThanOrEqual(expectedMinResults);
        
        if (expectedTopResult) {
          expect(result.results[0].title).toBe(expectedTopResult);
        }
      }
    );
  });

  describe('Search Quality Metrics', () => {
    test('should return results with proper relevance scoring', async () => {
      const result = await toolProvider.searchGuidelines({ 
        query: 'sign in with apple', 
        limit: 5 
      });
      
      // Scores should be in descending order
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i-1].relevanceScore).toBeGreaterThanOrEqual(
          result.results[i].relevanceScore
        );
      }
      
      // All scores should be positive
      result.results.forEach(r => {
        expect(r.relevanceScore).toBeGreaterThan(0);
      });
    });

    test('should handle edge cases gracefully', async () => {
      const edgeCases = [
        '', // Empty query
        '   ', // Whitespace only
        'nonexistenttermasdfgh', // Non-existent term
        'a', // Very short query
        'the and or but', // Only common words
      ];

      for (const query of edgeCases) {
        const result = await toolProvider.searchGuidelines({ query, limit: 5 });
        expect(result).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.results)).toBe(true);
      }
    });

    test('should respect category filters', async () => {
      const result = await toolProvider.searchGuidelines({ 
        query: 'button', 
        category: 'selection-and-input',
        limit: 5 
      });
      
      result.results.forEach(r => {
        expect(r.category).toBe('selection-and-input');
      });
    });
  });

  describe('Content Coverage Verification', () => {
    test('should have comprehensive coverage of HIG areas', async () => {
      const coverageQueries = [
        'privacy', 'accessibility', 'authentication', 'button', 
        'navigation', 'alert', 'color', 'typography', 'layout',
        'error', 'validation', 'notification', 'menu', 'form'
      ];
      
      let totalResults = 0;
      let queriesWithResults = 0;
      
      for (const query of coverageQueries) {
        const result = await toolProvider.searchGuidelines({ query, limit: 1 });
        totalResults += result.total;
        if (result.total > 0) {
          queriesWithResults++;
        }
      }
      
      // At least 90% of queries should return results
      const coveragePercentage = (queriesWithResults / coverageQueries.length) * 100;
      expect(coveragePercentage).toBeGreaterThanOrEqual(90);
      
      // Should have a reasonable total number of results across all queries
      expect(totalResults).toBeGreaterThan(coverageQueries.length);
    });
  });
});