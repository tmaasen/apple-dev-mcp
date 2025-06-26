/**
 * Unit tests for HIGToolsService (Phase 2 functionality)
 */

import { HIGToolsService } from '../services/tools.service.js';
import type { SearchGuidelinesArgs, GetComponentSpecArgs, ComparePlatformsArgs } from '../types.js';

// Mock dependencies to avoid external dependencies in tests
jest.mock('../services/search-indexer.service.js', () => ({
  SearchIndexerService: jest.fn().mockImplementation(() => ({
    isSemanticSearchEnabled: jest.fn().mockReturnValue(false),
    search: jest.fn().mockResolvedValue([
      {
        id: 'buttons-ios',
        title: 'Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        relevanceScore: 0.9,
        snippet: 'Buttons initiate app-specific actions',
        type: 'section'
      }
    ]),
    getStatistics: jest.fn().mockReturnValue({
      enhancedFeatures: {
        semanticSearch: false,
        intentRecognition: false,
        conceptMatching: false,
        contextualRelevance: false,
        fallbackSearch: true
      },
      version: '2.0-semantic'
    })
  }))
}));

jest.mock('../services/content-processor.service.js', () => ({
  ContentProcessorService: jest.fn().mockImplementation(() => ({
    extractKeywords: jest.fn().mockReturnValue(['button', 'iOS', 'design', 'guidelines']),
    extractSnippet: jest.fn().mockReturnValue('Button design guidelines for iOS')
  }))
}));

describe('HIGToolsService', () => {
  let toolsService: HIGToolsService;

  beforeEach(() => {
    toolsService = new HIGToolsService();
  });

  describe('searchGuidelines', () => {
    it('should search and return results with quality metrics', async () => {
      const args: SearchGuidelinesArgs = {
        query: 'button design guidelines',
        platform: 'iOS',
        limit: 10
      };

      const result = await toolsService.searchGuidelines(args);

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('filters');
      expect(result).toHaveProperty('searchMethod');
      expect(result).toHaveProperty('qualityMetrics');

      expect(result.query).toBe('button design guidelines');
      expect(result.filters.platform).toBe('iOS');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.qualityMetrics?.averageRelevance).toBeGreaterThan(0);
      expect(result.qualityMetrics?.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should validate input parameters', async () => {
      const invalidArgs = {
        query: '',
        platform: 'InvalidPlatform'
      } as any;

      await expect(toolsService.searchGuidelines(invalidArgs))
        .rejects.toThrow('Invalid query: must be a non-empty string');
    });

    it('should handle platform filtering', async () => {
      const args: SearchGuidelinesArgs = {
        query: 'navigation design',
        platform: 'iOS',
        category: 'navigation',
        limit: 5
      };

      const result = await toolsService.searchGuidelines(args);

      expect(result.filters.platform).toBe('iOS');
      expect(result.filters.category).toBe('navigation');
    });

    it('should limit query length', async () => {
      const longQuery = 'a'.repeat(250);
      const args: SearchGuidelinesArgs = {
        query: longQuery,
        limit: 10
      };

      await expect(toolsService.searchGuidelines(args))
        .rejects.toThrow('Query too long: maximum 200 characters allowed');
    });

    it('should validate limit parameter', async () => {
      const args = {
        query: 'button design',
        limit: 100
      } as SearchGuidelinesArgs;

      await expect(toolsService.searchGuidelines(args))
        .rejects.toThrow('Invalid limit: must be a number between 1 and 50');
    });

    it('should indicate search method used', async () => {
      const args: SearchGuidelinesArgs = {
        query: 'accessibility guidelines',
        limit: 5
      };

      const result = await toolsService.searchGuidelines(args);

      expect(result.searchMethod).toMatch(/^(semantic|keyword|static|fallback)$/);
    });
  });

  describe('getComponentSpec', () => {
    it('should retrieve component specifications', async () => {
      const args: GetComponentSpecArgs = {
        componentName: 'button',
        platform: 'iOS'
      };

      const result = await toolsService.getComponentSpec(args);

      expect(result).toHaveProperty('component');
      expect(result).toHaveProperty('relatedComponents');
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('searchContext');

      expect(result.searchContext?.method).toBeDefined();
      expect(result.searchContext?.confidence).toBeDefined();
      expect(Array.isArray(result.searchContext?.alternatives)).toBe(true);
    });

    it('should validate component name', async () => {
      const invalidArgs = {
        componentName: '',
        platform: 'iOS'
      } as GetComponentSpecArgs;

      await expect(toolsService.getComponentSpec(invalidArgs))
        .rejects.toThrow('Invalid componentName: must be a non-empty string');
    });

    it('should limit component name length', async () => {
      const longName = 'a'.repeat(150);
      const args: GetComponentSpecArgs = {
        componentName: longName,
        platform: 'iOS'
      };

      await expect(toolsService.getComponentSpec(args))
        .rejects.toThrow('Component name too long: maximum 100 characters allowed');
    });

    it('should validate platform parameter', async () => {
      const args = {
        componentName: 'button',
        platform: 'InvalidPlatform'
      } as any;

      await expect(toolsService.getComponentSpec(args))
        .rejects.toThrow('Invalid platform: InvalidPlatform');
    });

    it('should provide alternatives when component not found', async () => {
      const args: GetComponentSpecArgs = {
        componentName: 'nonexistent-component',
        platform: 'iOS'
      };

      const result = await toolsService.getComponentSpec(args);

      expect(result.component).toBeDefined(); // Mock returns a component
      expect(result.searchContext?.alternatives).toBeDefined();
      expect(result.searchContext?.alternatives.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('comparePlatforms', () => {
    it('should compare component across platforms', async () => {
      const args: ComparePlatformsArgs = {
        componentName: 'button',
        platforms: ['iOS', 'macOS', 'watchOS']
      };

      const result = await toolsService.comparePlatforms(args);

      expect(result).toHaveProperty('componentName');
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('semanticInsights');

      expect(result.componentName).toBe('button');
      expect(result.platforms).toEqual(['iOS', 'macOS', 'watchOS']);
      expect(result.comparison).toHaveLength(3);

      result.comparison.forEach(comp => {
        expect(comp).toHaveProperty('platform');
        expect(comp).toHaveProperty('available');
        expect(['iOS', 'macOS', 'watchOS']).toContain(comp.platform);
      });
    });

    it('should validate platforms array', async () => {
      const invalidArgs = {
        componentName: 'button',
        platforms: []
      } as ComparePlatformsArgs;

      await expect(toolsService.comparePlatforms(invalidArgs))
        .rejects.toThrow('Invalid platforms: must be a non-empty array');
    });

    it('should limit number of platforms', async () => {
      const args: ComparePlatformsArgs = {
        componentName: 'button',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal', 'extra'] as any
      };

      await expect(toolsService.comparePlatforms(args))
        .rejects.toThrow('Too many platforms: maximum 6 platforms allowed');
    });

    it('should validate individual platform names', async () => {
      const args = {
        componentName: 'button',
        platforms: ['iOS', 'InvalidPlatform']
      } as any;

      await expect(toolsService.comparePlatforms(args))
        .rejects.toThrow('Invalid platform: InvalidPlatform');
    });

    it('should provide semantic insights when available', async () => {
      const args: ComparePlatformsArgs = {
        componentName: 'button',
        platforms: ['iOS', 'macOS']
      };

      const result = await toolsService.comparePlatforms(args);

      expect(result.semanticInsights).toBeDefined();
      expect(result.semanticInsights?.crossPlatformConsistency).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.semanticInsights?.platformSpecificFeatures)).toBe(true);
      expect(Array.isArray(result.semanticInsights?.migrationConsiderations)).toBe(true);
    });
  });

  describe('getLatestUpdates', () => {
    it('should retrieve latest updates with summary', async () => {
      const args = {
        limit: 10
      };

      const result = await toolsService.getLatestUpdates(args);

      expect(result).toHaveProperty('updates');
      expect(result).toHaveProperty('summary');

      expect(Array.isArray(result.updates)).toBe(true);
      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('byPlatform');
      expect(result.summary).toHaveProperty('byType');
      expect(result.summary).toHaveProperty('timeRange');
    });

    it('should validate since date parameter', async () => {
      const args = {
        since: 'invalid-date',
        limit: 10
      };

      await expect(toolsService.getLatestUpdates(args))
        .rejects.toThrow('Invalid since date: must be a valid ISO date string');
    });

    it('should validate limit parameter', async () => {
      const args = {
        limit: 150
      };

      await expect(toolsService.getLatestUpdates(args))
        .rejects.toThrow('Invalid limit: must be a number between 1 and 100');
    });

    it('should filter by platform when specified', async () => {
      const args = {
        platform: 'iOS',
        limit: 5
      } as any;

      const result = await toolsService.getLatestUpdates(args);

      expect(result.updates).toBeDefined();
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStatistics', () => {
    it('should provide comprehensive statistics', () => {
      const stats = toolsService.getStatistics();

      expect(stats).toHaveProperty('enhancedFeatures');
      expect(stats).toHaveProperty('version');

      expect(stats.enhancedFeatures).toHaveProperty('semanticSearch');
      expect(stats.enhancedFeatures).toHaveProperty('intentRecognition');
      expect(stats.enhancedFeatures).toHaveProperty('crossPlatformComparison');
      expect(stats.enhancedFeatures).toHaveProperty('qualityMetrics');
      expect(stats.enhancedFeatures).toHaveProperty('fallbackSearch');

      expect(stats.version).toBe('2.0-semantic');
    });

    it('should report feature availability', () => {
      const stats = toolsService.getStatistics();

      expect(typeof stats.enhancedFeatures.semanticSearch).toBe('boolean');
      expect(typeof stats.enhancedFeatures.intentRecognition).toBe('boolean');
      expect(typeof stats.enhancedFeatures.crossPlatformComparison).toBe('boolean');
      expect(typeof stats.enhancedFeatures.qualityMetrics).toBe('boolean');
      expect(typeof stats.enhancedFeatures.fallbackSearch).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle null/undefined arguments gracefully', async () => {
      await expect(toolsService.searchGuidelines(null as any))
        .rejects.toThrow('Invalid arguments: expected object');

      await expect(toolsService.getComponentSpec(undefined as any))
        .rejects.toThrow('Invalid arguments: expected object');

      await expect(toolsService.comparePlatforms({} as any))
        .rejects.toThrow('Invalid componentName: must be a non-empty string');
    });

    it('should provide meaningful error messages', async () => {
      const invalidArgs = {
        query: 'test',
        platform: 'Windows'
      } as any;

      await expect(toolsService.searchGuidelines(invalidArgs))
        .rejects.toThrow(/Invalid platform.*Windows/);
    });
  });

  describe('fallback behavior', () => {
    it('should use fallback search when semantic search unavailable', async () => {
      const args: SearchGuidelinesArgs = {
        query: 'button design',
        limit: 5
      };

      const result = await toolsService.searchGuidelines(args);

      expect(result.searchMethod).toBe('fallback');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should provide consistent interface regardless of search method', async () => {
      const args: SearchGuidelinesArgs = {
        query: 'navigation bars',
        platform: 'iOS',
        limit: 3
      };

      const result = await toolsService.searchGuidelines(args);

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('filters');
      expect(result).toHaveProperty('searchMethod');
      expect(result).toHaveProperty('qualityMetrics');
    });
  });
});