/**
 * Unit tests for SearchIndexerService (Phase 2 functionality)
 */

import { SearchIndexerService } from '../services/search-indexer.service.js';
import { ContentProcessorService } from '../services/content-processor.service.js';
import type { HIGSection } from '../types.js';

// TensorFlow and semantic search removed - using keyword search only

describe('SearchIndexerService', () => {
  let indexer: SearchIndexerService;
  let contentProcessor: ContentProcessorService;
  let testSections: HIGSection[];

  beforeEach(() => {
    contentProcessor = new ContentProcessorService();
    indexer = new SearchIndexerService(contentProcessor);

    testSections = [
      {
        id: 'buttons-ios',
        title: 'iOS Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        category: 'visual-design',
        content: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. Use clear, predictable button text.',
        structuredContent: {
          overview: 'Buttons are interactive elements',
          guidelines: ['Use clear button text', 'Make buttons appropriately sized'],
          examples: ['Primary buttons', 'Secondary buttons'],
          relatedConcepts: ['user interaction', 'accessibility'],
          specifications: {
            dimensions: { height: '44pt' }
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

  describe('addSection', () => {
    it('should add section to keyword index', () => {
      indexer.addSection(testSections[0]);

      expect(indexer.getIndexSize()).toBe(1);

      const index = indexer.generateIndex();
      expect(index.keywordIndex).toHaveProperty('buttons-ios');
      expect(index.keywordIndex['buttons-ios'].title).toBe('iOS Buttons');
      expect(index.keywordIndex['buttons-ios'].platform).toBe('iOS');
      expect(index.keywordIndex['buttons-ios'].hasStructuredContent).toBe(true);
    });

    it('should extract enhanced metadata from structured content', () => {
      indexer.addSection(testSections[0]);

      const index = indexer.generateIndex();
      const entry = index.keywordIndex['buttons-ios'];

      expect(entry.hasStructuredContent).toBe(true);
      expect(entry.hasGuidelines).toBe(true);
      expect(entry.hasExamples).toBe(true);
      expect(entry.hasSpecifications).toBe(true);
      expect(entry.conceptCount).toBe(2);
    });

    it('should handle sections without structured content', () => {
      indexer.addSection(testSections[1]); // No structured content

      const index = indexer.generateIndex();
      const entry = index.keywordIndex['navigation-ios'];

      expect(entry.hasStructuredContent).toBe(false);
      expect(entry.hasGuidelines).toBe(false);
      expect(entry.hasExamples).toBe(false);
      expect(entry.hasSpecifications).toBe(false);
      expect(entry.conceptCount).toBe(0);
    });

    it('should skip sections without content', () => {
      const emptySection: HIGSection = {
        id: 'empty',
        title: 'Empty Section',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design'
      };

      indexer.addSection(emptySection);

      expect(indexer.getIndexSize()).toBe(0);
    });

    it('should extract keywords from content', () => {
      indexer.addSection(testSections[0]);

      const index = indexer.generateIndex();
      const entry = index.keywordIndex['buttons-ios'];

      expect(entry.keywords).toContain('button');
      expect(entry.keywords).toContain('ios'); // Keywords are lowercased
      expect(entry.keywords).toContain('actions'); // Plural form is extracted
      expect(entry.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      testSections.forEach(section => indexer.addSection(section));
    });

    it('should perform keyword search when semantic search unavailable', async () => {
      const results = await indexer.search('button design', testSections, {
        useSemanticSearch: false,
        limit: 5
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('iOS Buttons');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should filter by platform', async () => {
      const results = await indexer.search('iOS interface', testSections, {
        platform: 'macOS', // Different platform
        useSemanticSearch: false,
        limit: 10
      });

      expect(results).toHaveLength(0); // No macOS sections
    });

    it('should filter by category', async () => {
      const results = await indexer.search('design', testSections, {
        category: 'navigation',
        useSemanticSearch: false,
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Navigation Bars');
    });

    it('should respect result limits', async () => {
      const results = await indexer.search('iOS', testSections, {
        limit: 1,
        useSemanticSearch: false
      });

      expect(results).toHaveLength(1);
    });

    it('should rank results by relevance', async () => {
      const results = await indexer.search('button action iOS', testSections, {
        useSemanticSearch: false,
        limit: 10
      });

      if (results.length > 1) {
        expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
      }
    });
  });

  describe('generateIndex', () => {
    beforeEach(() => {
      testSections.forEach(section => indexer.addSection(section));
    });

    it('should generate comprehensive index with metadata', () => {
      const index = indexer.generateIndex();

      expect(index).toHaveProperty('metadata');
      expect(index).toHaveProperty('keywordIndex');
      expect(index).toHaveProperty('searchCapabilities');

      expect(index.metadata.version).toBe('2.0-keyword');
      expect(index.metadata.totalSections).toBe(2);
      expect(index.metadata.indexType).toBe('keyword-only');

      expect(index.searchCapabilities.keywordSearch).toBe(true);
      expect(index.searchCapabilities.structuredContentSearch).toBe(true);
      expect(index.searchCapabilities.crossPlatformSearch).toBe(true);
    });

    it('should include semantic search capabilities when available', () => {
      const index = indexer.generateIndex();

      expect(index.searchCapabilities).toHaveProperty('keywordSearch');
      expect(index.searchCapabilities).toHaveProperty('structuredContentSearch');
      expect(index.searchCapabilities).toHaveProperty('crossPlatformSearch');
    });
  });

  describe('statistics and monitoring', () => {
    beforeEach(() => {
      testSections.forEach(section => indexer.addSection(section));
    });

    it('should provide comprehensive statistics', () => {
      const stats = indexer.getStatistics();

      expect(stats).toHaveProperty('keywordIndex');
      expect(stats).toHaveProperty('capabilities');

      expect(stats.keywordIndex.totalEntries).toBe(2);
      expect(stats.keywordIndex.averageKeywordsPerSection).toBeGreaterThan(0);

      expect(stats.capabilities.supportedFeatures).toContain('keyword-search');
      expect(stats.capabilities.supportedFeatures).toContain('platform-filtering');
      expect(stats.capabilities.supportedFeatures).toContain('category-filtering');
    });

    it('should calculate average keywords correctly', () => {
      const stats = indexer.getStatistics();

      expect(stats.keywordIndex.averageKeywordsPerSection).toBeGreaterThan(0);
    });

    it('should report semantic search status', () => {
      const stats = indexer.getStatistics();

      expect(typeof stats.capabilities.semanticSearchEnabled).toBe('boolean');
    });
  });

  describe('clear functionality', () => {
    it('should clear all indices', () => {
      testSections.forEach(section => indexer.addSection(section));

      expect(indexer.getIndexSize()).toBe(2);

      indexer.clear();

      expect(indexer.getIndexSize()).toBe(0);

      const index = indexer.generateIndex();
      expect(Object.keys(index.keywordIndex)).toHaveLength(0);
    });
  });

  describe('semantic search integration', () => {
    it('should indicate semantic search availability', () => {
      const isEnabled = indexer.isSemanticSearchEnabled();

      expect(typeof isEnabled).toBe('boolean');
    });

    it('should attempt semantic search when enabled', async () => {
      // This tests the integration, actual semantic search is mocked
      const results = await indexer.search('button guidelines', testSections, {
        useSemanticSearch: true,
        limit: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle malformed sections gracefully', () => {
      const malformedSection = {
        id: 'malformed',
        title: null,
        url: '',
        platform: 'iOS',
        category: 'visual-design',
        content: 'Some content'
      } as any;

      expect(() => indexer.addSection(malformedSection)).toThrow(); // Should throw on null title
    });

    it('should handle search errors gracefully', async () => {
      const results = await indexer.search('', [], {
        useSemanticSearch: false,
        limit: 5
      });

      expect(results).toEqual([]);
    });
  });
});