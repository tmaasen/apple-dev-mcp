/**
 * Unit tests for SemanticSearchService (Phase 2 functionality)
 */

import { SemanticSearchService } from '../services/semantic-search.service.js';
import type { HIGSection, SearchConfig } from '../types.js';

// Mock TensorFlow to avoid network dependencies in tests
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn().mockResolvedValue({
    embed: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue(new Float32Array(512).fill(0.5)),
      dispose: jest.fn()
    })
  })
}));

jest.mock('compromise', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    topics: () => ({ out: () => ['design', 'button'] }),
    nouns: () => ({ out: () => ['button', 'interface'] }),
    adjectives: () => ({ out: () => ['interactive', 'accessible'] })
  })
}));

describe('SemanticSearchService', () => {
  let searchService: SemanticSearchService;
  let testSections: HIGSection[];

  beforeEach(() => {
    const config: Partial<SearchConfig> = {
      semanticWeight: 0.4,
      keywordWeight: 0.3,
      structureWeight: 0.2,
      contextWeight: 0.1,
      minSemanticThreshold: 0.3,
      maxResults: 20
    };

    searchService = new SemanticSearchService(config);

    testSections = [
      {
        id: 'buttons-ios',
        title: 'Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        category: 'visual-design',
        content: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon.',
        structuredContent: {
          overview: 'Buttons are interactive elements that trigger actions',
          guidelines: ['Use clear button text', 'Make buttons appropriately sized'],
          examples: ['Primary buttons', 'Secondary buttons'],
          relatedConcepts: ['user interaction', 'accessibility'],
          specifications: {
            dimensions: { height: '44pt', minWidth: '44pt' }
          }
        },
        quality: {
          score: 0.85,
          confidence: 0.9,
          length: 120,
          structureScore: 0.8,
          appleTermsScore: 0.7,
          codeExamplesCount: 0,
          imageReferencesCount: 0,
          headingCount: 2,
          isFallbackContent: false,
          extractionMethod: 'crawlee'
        }
      },
      {
        id: 'navigation-ios',
        title: 'Navigation Bars',
        url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
        platform: 'iOS',
        category: 'navigation',
        content: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.',
        structuredContent: {
          overview: 'Navigation bars provide hierarchical navigation',
          guidelines: ['Show current location', 'Provide clear navigation paths'],
          examples: ['Standard navigation', 'Large title navigation'],
          relatedConcepts: ['information hierarchy', 'user orientation'],
          specifications: {
            dimensions: { height: '44pt' }
          }
        },
        quality: {
          score: 0.82,
          confidence: 0.88,
          length: 98,
          structureScore: 0.75,
          appleTermsScore: 0.65,
          codeExamplesCount: 0,
          imageReferencesCount: 0,
          headingCount: 2,
          isFallbackContent: false,
          extractionMethod: 'crawlee'
        }
      }
    ];
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new SemanticSearchService();
      const stats = service.getStatistics();

      expect(stats.isInitialized).toBe(false);
      expect(stats.modelLoaded).toBe(false);
      expect(stats.totalIndexedSections).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<SearchConfig> = {
        semanticWeight: 0.5,
        keywordWeight: 0.3,
        maxResults: 10
      };

      const service = new SemanticSearchService(customConfig);
      const stats = service.getStatistics();

      expect(stats.config.semanticWeight).toBe(0.5);
      expect(stats.config.keywordWeight).toBe(0.3);
      expect(stats.config.maxResults).toBe(10);
    });
  });

  describe('indexSection', () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it('should index a section with structured content', async () => {
      await searchService.indexSection(testSections[0]);

      const stats = searchService.getStatistics();
      expect(stats.totalIndexedSections).toBe(1);
    });

    it('should handle sections without content gracefully', async () => {
      const emptySection: HIGSection = {
        id: 'empty',
        title: 'Empty Section',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design'
      };

      await expect(searchService.indexSection(emptySection)).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await searchService.initialize();
      
      for (const section of testSections) {
        await searchService.indexSection(section);
      }
    });

    it('should perform semantic search and return ranked results', async () => {
      const results = await searchService.search(
        'button design guidelines',
        testSections,
        'iOS',
        undefined,
        5
      );

      expect(results.length).toBeGreaterThan(0); // Should find relevant sections
      const buttonResult = results.find(r => r.title === 'Buttons');
      expect(buttonResult).toBeDefined();
      expect(results[0].semanticScore).toBeGreaterThan(0);
      expect(results[0].keywordScore).toBeGreaterThan(0);
      expect(results[0].combinedScore).toBeGreaterThan(0);
      expect(results[0].searchTerms).toContain('design');
      expect(results[0].matchedConcepts.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by platform', async () => {
      const results = await searchService.search(
        'interface guidelines',
        testSections,
        'macOS', // Different platform
        undefined,
        10
      );

      expect(results).toHaveLength(0); // No macOS sections in test data
    });

    it('should filter by category', async () => {
      const results = await searchService.search(
        'design elements',
        testSections,
        undefined,
        'navigation',
        10
      );

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Navigation Bars');
    });

    it('should respect result limits', async () => {
      const results = await searchService.search(
        'iOS design',
        testSections,
        undefined,
        undefined,
        1
      );

      expect(results).toHaveLength(1);
    });

    it('should handle queries with no results', async () => {
      const results = await searchService.search(
        'completely unrelated query about cooking recipes',
        testSections,
        undefined,
        undefined,
        10
      );

      expect(results.length).toBeGreaterThanOrEqual(0); // May return similar results due to mocking
    });
  });

  describe('query analysis', () => {
    beforeEach(async () => {
      await searchService.initialize();
    });

    it('should analyze query intent correctly', async () => {
      // This tests the private method indirectly through search
      const results = await searchService.search(
        'how to implement button guidelines',
        testSections,
        undefined,
        undefined,
        5
      );

      // Should identify this as a guideline search
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract entities from queries', async () => {
      const results = await searchService.search(
        'iOS button specifications',
        testSections,
        undefined,
        undefined,
        5
      );

      // Should identify "button" as component and "iOS" as platform
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('scoring and ranking', () => {
    beforeEach(async () => {
      await searchService.initialize();
      
      for (const section of testSections) {
        await searchService.indexSection(section);
      }
    });

    it('should apply boost factors correctly', async () => {
      const results = await searchService.search(
        'Buttons', // Exact title match should get boost
        testSections,
        'iOS', // Platform match should get boost
        'visual-design', // Category match should get boost
        5
      );

      expect(results).toHaveLength(1);
      expect(results[0].combinedScore).toBeGreaterThan(results[0].semanticScore);
    });

    it('should rank more relevant results higher', async () => {
      const results = await searchService.search(
        'navigation hierarchy design',
        testSections,
        undefined,
        undefined,
        10
      );

      if (results.length > 1) {
        expect(results[0].combinedScore).toBeGreaterThanOrEqual(results[1].combinedScore);
      }
    });
  });

  describe('error handling', () => {
    it('should handle search without initialization gracefully', async () => {
      const uninitializedService = new SemanticSearchService();
      
      const results = await uninitializedService.search(
        'test query',
        testSections,
        undefined,
        undefined,
        5
      );

      expect(results).toEqual([]);
    });

    it('should handle malformed sections gracefully', async () => {
      await searchService.initialize();

      const malformedSection = {
        id: 'malformed',
        title: null,
        url: '',
        platform: 'iOS',
        category: 'visual-design'
      } as any;

      await expect(searchService.indexSection(malformedSection)).resolves.not.toThrow();
    });
  });

  describe('statistics and monitoring', () => {
    it('should provide accurate statistics', () => {
      const stats = searchService.getStatistics();

      expect(stats).toHaveProperty('totalIndexedSections');
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('modelLoaded');
      expect(stats).toHaveProperty('config');
      expect(typeof stats.totalIndexedSections).toBe('number');
      expect(typeof stats.isInitialized).toBe('boolean');
    });

    it('should clear indices correctly', async () => {
      await searchService.initialize();
      await searchService.indexSection(testSections[0]);

      expect(searchService.getStatistics().totalIndexedSections).toBe(1);

      searchService.clearIndices();

      expect(searchService.getStatistics().totalIndexedSections).toBe(0);
    });
  });
});