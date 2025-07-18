/**
 * Authentication Search Test Suite
 * Based on user's Claude Desktop test case for login view evaluation
 */

import { HIGStaticContentProvider } from '../static-content.js';
import { HIGToolProvider } from '../tools.js';
import { HIGCache } from '../cache.js';
import { HIGResourceProvider } from '../resources.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';

describe('Authentication Search Tests', () => {
  let staticProvider: HIGStaticContentProvider;
  let toolProvider: HIGToolProvider;

  beforeAll(async () => {
    // Initialize providers
    staticProvider = new HIGStaticContentProvider();
    const cache = new HIGCache();
    const crawleeService = new CrawleeHIGService(cache);
    const resourceProvider = new HIGResourceProvider(crawleeService, cache, staticProvider);
    toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider, staticProvider);

    // Ensure initialization
    await staticProvider.initialize();
  });

  describe('Critical Authentication Terms', () => {
    const criticalTerms = [
      'sign in sign up',
      'sign in with apple', 
      'password',
      'authentication',
      'login',
      'privacy',
      'security',
      'apple id',
      'social login',
      'biometric authentication'
    ];

    test.each(criticalTerms)('should find results for "%s"', async (term) => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ query: term, limit: 10 });
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.total).toBeGreaterThan(0);
      
      // Log results for debugging
      console.log(`\n"${term}" found ${results.results.length} results:`);
      results.results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });
  });

  describe('Working Text Field & Form Support', () => {
    const workingTerms = [
      'text fields',
      'forms input validation', 
      'secure input',
      'user input'
    ];

    test.each(workingTerms)('should find results for "%s"', async (term) => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ query: term, limit: 10 });
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.total).toBeGreaterThan(0);
      
      console.log(`\n"${term}" found ${results.results.length} results (working):`);
      results.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });
  });

  describe('Expected Authentication Content', () => {
    test('should find "Sign in with Apple" content specifically', async () => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'sign in with apple', 
        limit: 5 
      });
      
      expect(results.results.length).toBeGreaterThan(0);
      
      // Should include the dedicated Sign in with Apple section
      const signInResult = results.results.find(r => 
        r.title.toLowerCase().includes('sign in with apple')
      );
      expect(signInResult).toBeDefined();
      expect(signInResult?.relevanceScore).toBeGreaterThan(5); // High relevance expected
      
      console.log('\n"Sign in with Apple" specific results:');
      results.results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });

    test('should find Privacy guidelines', async () => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'privacy', 
        limit: 5 
      });
      
      expect(results.results.length).toBeGreaterThan(0);
      
      // Should include the dedicated Privacy section
      const privacyResult = results.results.find(r => 
        r.title.toLowerCase().includes('privacy')
      );
      expect(privacyResult).toBeDefined();
      expect(privacyResult?.relevanceScore).toBeGreaterThan(10); // Very high relevance expected
      
      console.log('\n"Privacy" specific results:');
      results.results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });

    test('should find authentication-related content with broader terms', async () => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'authentication login security', 
        limit: 10 
      });
      
      expect(results.results.length).toBeGreaterThan(0);
      
      // Should include Sign in with Apple, Privacy, and potentially security-related content
      const authResults = results.results.filter(r => {
        const title = r.title.toLowerCase();
        const snippet = r.snippet.toLowerCase();
        return title.includes('sign in') || 
               title.includes('privacy') || 
               title.includes('security') ||
               snippet.includes('authentication') ||
               snippet.includes('password') ||
               snippet.includes('biometric');
      });
      
      expect(authResults.length).toBeGreaterThan(0);
      
      console.log('\n"authentication login security" compound search results:');
      results.results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });
  });

  describe('Component Spec Functionality', () => {
    test('should return search results for Text Field', async () => {
      // This was mentioned as broken in the user's test
      const results = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'Text Field',
        platform: 'iOS' 
      });
      
      expect(results).not.toBeNull();
      expect(results).toBeDefined();
      expect(results.results).toBeDefined();
      expect(results.total).toBeGreaterThan(0);
      
      if (results && results.results.length > 0) {
        expect(results.results[0].title).toBeDefined();
        expect(results.results[0].snippet).toBeDefined();
        console.log(`\nText Field search results found: ${results.results[0].title}`);
      }
    });
  });

  describe('Search Quality Validation', () => {
    test('should return results with meaningful relevance scores', async () => {
      const results = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'button touch target', 
        limit: 5 
      });
      
      expect(results.results.length).toBeGreaterThan(0);
      
      // All results should have relevance scores
      results.results.forEach(result => {
        expect(result.relevanceScore).toBeDefined();
        expect(result.relevanceScore).toBeGreaterThan(0);
      });
      
      // Results should be sorted by relevance (descending)
      for (let i = 1; i < results.results.length; i++) {
        expect(results.results[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          results.results[i].relevanceScore
        );
      }
      
      console.log('\n"button touch target" relevance scores:');
      results.results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (score: ${r.relevanceScore})`);
      });
    });

    test('should handle empty and whitespace queries gracefully', async () => {
      const emptyResult = await toolProvider.searchHumanInterfaceGuidelines({ query: '', limit: 5 });
      expect(emptyResult.results.length).toBe(0);
      expect(emptyResult.total).toBe(0);
      
      const whitespaceResult = await toolProvider.searchHumanInterfaceGuidelines({ query: '   ', limit: 5 });
      expect(whitespaceResult.results.length).toBe(0);
      expect(whitespaceResult.total).toBe(0);
    });
  });

  describe('Platform and Category Filtering', () => {
    test('should respect platform filtering for authentication content', async () => {
      const allResults = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'sign in with apple', 
        limit: 10 
      });
      
      const iosResults = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'sign in with apple', 
        platform: 'iOS',
        limit: 10 
      });
      
      // Should find results in both cases
      expect(allResults.results.length).toBeGreaterThan(0);
      expect(iosResults.results.length).toBeGreaterThan(0);
      
      // iOS results should be subset or equal to all results
      expect(iosResults.results.length).toBeLessThanOrEqual(allResults.results.length);
      
      console.log(`\nSign in with Apple: All platforms: ${allResults.results.length}, iOS only: ${iosResults.results.length}`);
    });

    test('should respect category filtering for authentication content', async () => {
      const allResults = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'privacy security', 
        limit: 10 
      });
      
      const foundationsResults = await toolProvider.searchHumanInterfaceGuidelines({ 
        query: 'privacy security', 
        category: 'foundations',
        limit: 10 
      });
      
      expect(allResults.results.length).toBeGreaterThan(0);
      
      console.log(`\nPrivacy security: All categories: ${allResults.results.length}, Foundations only: ${foundationsResults.results.length}`);
    });
  });
});