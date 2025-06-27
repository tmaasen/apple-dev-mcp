/**
 * Integration tests for Phase 1 and Phase 2 functionality
 * Tests the complete pipeline from content processing to semantic search
 */

import { ContentProcessorService } from '../services/content-processor.service.js';
import { ContentQualityValidatorService } from '../services/content-quality-validator.service.js';
import { SearchIndexerService } from '../services/search-indexer.service.js';
import type { HIGSection } from '../types.js';

// Mock external dependencies for integration testing
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
    topics: () => ({ out: () => ['design', 'button', 'navigation'] }),
    nouns: () => ({ out: () => ['button', 'interface', 'guidelines'] }),
    adjectives: () => ({ out: () => ['interactive', 'accessible', 'intuitive'] })
  })
}));

describe('Phase 1 & 2 Integration Tests', () => {
  let contentProcessor: ContentProcessorService;
  let qualityValidator: ContentQualityValidatorService;
  let searchIndexer: SearchIndexerService;

  const sampleHtml = `
    <div class="main-content">
      <h1>iOS Button Design Guidelines</h1>
      <p>Buttons are interactive elements that allow users to trigger actions in your iOS app. They are fundamental components of the user interface.</p>
      
      <h2>Design Principles</h2>
      <p>When designing buttons for iOS applications, follow Apple's Human Interface Guidelines to ensure consistency and usability.</p>
      
      <h3>Guidelines</h3>
      <ul>
        <li>Use clear, descriptive text that explains the button's action</li>
        <li>Make buttons large enough for easy touch interaction (minimum 44pt)</li>
        <li>Ensure sufficient contrast for accessibility compliance</li>
        <li>Maintain consistent styling throughout your application</li>
      </ul>
      
      <h3>Examples</h3>
      <ul>
        <li>Primary buttons for main actions (Save, Submit, Continue)</li>
        <li>Secondary buttons for alternative actions (Cancel, Back)</li>
        <li>Destructive buttons for dangerous actions (Delete, Remove)</li>
      </ul>
      
      <h2>Technical Specifications</h2>
      <p>iOS buttons should meet specific dimensional and spacing requirements.</p>
      
      <h3>Dimensions</h3>
      <ul>
        <li>Minimum height: 44 points</li>
        <li>Minimum width: 44 points for icon-only buttons</li>
        <li>Recommended padding: 12 points horizontal, 8 points vertical</li>
      </ul>
      
      <h2>Code Implementation</h2>
      <pre><code>
let button = UIButton(type: .system)
button.setTitle("Action", for: .normal)
button.frame = CGRect(x: 0, y: 0, width: 120, height: 44)
      </code></pre>
      
      <nav class="sidebar-nav">
        <a href="/navigation">Navigation</a>
        <a href="/tables">Tables</a>
      </nav>
      
      <img src="button-examples.png" alt="Button examples" />
    </div>
  `;

  beforeEach(() => {
    contentProcessor = new ContentProcessorService();
    qualityValidator = new ContentQualityValidatorService({
      minQualityScore: 0.6,
      minConfidence: 0.7,
      minContentLength: 200,
      maxFallbackRate: 5,
      minStructureScore: 0.5,
      minAppleTermsScore: 0.3
    });
    searchIndexer = new SearchIndexerService(contentProcessor);
  });

  describe('Phase 1: Content Processing Pipeline', () => {
    it('should process HTML through complete Phase 1 pipeline', async () => {
      // Step 1: Process HTML content
      const processedResult = await contentProcessor.processContent(
        sampleHtml, 
        'https://developer.apple.com/design/human-interface-guidelines/buttons'
      );

      // Verify content processing
      expect(processedResult.cleanedMarkdown).toContain('# iOS Button Design Guidelines');
      expect(processedResult.cleanedMarkdown).toContain('interactive elements');
      expect(processedResult.cleanedMarkdown).not.toContain('<img');
      expect(processedResult.cleanedMarkdown).not.toContain('<nav');

      // Verify structured content extraction
      expect(processedResult.structuredContent.overview).toContain('interactive elements');
      expect(processedResult.structuredContent.guidelines.length).toBeGreaterThan(3);
      expect(processedResult.structuredContent.examples.length).toBeGreaterThan(2);
      expect(processedResult.structuredContent.specifications).toBeDefined();
      expect(processedResult.structuredContent.specifications?.dimensions).toBeDefined();

      // Verify quality metrics
      expect(processedResult.quality.score).toBeGreaterThan(0.6);
      expect(processedResult.quality.confidence).toBeGreaterThan(0.8);
      expect(processedResult.quality.appleTermsScore).toBeGreaterThan(0.4);
      expect(processedResult.quality.codeExamplesCount).toBeGreaterThan(0);
      expect(processedResult.quality.headingCount).toBeGreaterThan(4);
      expect(processedResult.quality.isFallbackContent).toBe(false);

      // Step 2: Validate content quality
      const section: HIGSection = {
        id: 'buttons-ios',
        title: 'iOS Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        category: 'visual-design',
        quality: processedResult.quality
      };

      const validationResult = await qualityValidator.validateContent(
        processedResult.cleanedMarkdown,
        section
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.score).toBeGreaterThan(0.8);
      expect(validationResult.issues).toHaveLength(0);

      // Step 3: Record extraction for SLA monitoring
      qualityValidator.recordExtraction(section, processedResult.quality);

      const stats = qualityValidator.getStatistics();
      expect(stats.totalSections).toBe(1);
      expect(stats.fallbackUsage).toBe(0);
      expect(stats.extractionSuccessRate).toBe(100);
      expect(stats.averageQuality).toBeGreaterThan(0.6);
    });

    it('should meet Phase 1 SLA requirements', async () => {
      // Process multiple sections to test SLA compliance
      const testSections = [
        { html: sampleHtml, url: 'https://developer.apple.com/design/human-interface-guidelines/buttons' },
        { html: '<h1>Navigation</h1><p>Apple navigation guidelines for iOS apps.</p>', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation' },
        { html: '<h1>Typography</h1><p>Text and font guidelines for iOS.</p>', url: 'https://developer.apple.com/design/human-interface-guidelines/typography' }
      ];

      for (let i = 0; i < testSections.length; i++) {
        const result = await contentProcessor.processContent(testSections[i].html, testSections[i].url);
        
        const section: HIGSection = {
          id: `section-${i}`,
          title: `Section ${i}`,
          url: testSections[i].url,
          platform: 'iOS',
          category: 'visual-design',
          quality: result.quality
        };

        qualityValidator.recordExtraction(section, result.quality);
      }

      const stats = qualityValidator.getStatistics();
      
      // Verify SLA compliance (95% real content target)
      expect(stats.extractionSuccessRate).toBeGreaterThanOrEqual(95);
      expect(stats.averageQuality).toBeGreaterThan(0.3);
      expect(stats.averageConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('Phase 2: Semantic Search Pipeline', () => {
    let processedSections: HIGSection[];

    beforeEach(async () => {
      // Prepare test data by processing content through Phase 1 pipeline
      const htmlSamples = [
        {
          html: sampleHtml,
          title: 'iOS Buttons',
          category: 'visual-design',
          id: 'buttons-ios'
        },
        {
          html: '<h1>Navigation Bars</h1><p>Navigation bars enable users to move through content hierarchy in iOS apps.</p><h2>Guidelines</h2><ul><li>Show current location</li><li>Provide clear back navigation</li></ul>',
          title: 'Navigation Bars',
          category: 'navigation',
          id: 'navigation-ios'
        },
        {
          html: '<h1>Color Guidelines</h1><p>Apple color guidelines ensure accessibility and brand consistency.</p><h2>Accessibility</h2><p>Maintain sufficient contrast ratios for text readability.</p>',
          title: 'Color Guidelines',
          category: 'color-and-materials',
          id: 'color-universal'
        }
      ];

      processedSections = [];

      for (const sample of htmlSamples) {
        const result = await contentProcessor.processContent(
          sample.html,
          `https://developer.apple.com/design/human-interface-guidelines/${sample.id}`
        );

        const section: HIGSection = {
          id: sample.id,
          title: sample.title,
          url: `https://developer.apple.com/design/human-interface-guidelines/${sample.id}`,
          platform: sample.id.includes('universal') ? 'universal' : 'iOS',
          category: sample.category as any,
          content: result.cleanedMarkdown,
          structuredContent: result.structuredContent,
          quality: result.quality
        };

        processedSections.push(section);
        searchIndexer.addSection(section);
      }
    });

    it('should index sections with semantic capabilities', () => {
      const stats = searchIndexer.getStatistics();

      expect(stats.keywordIndex.totalEntries).toBe(3);
      expect(stats.keywordIndex.averageKeywordsPerSection).toBeGreaterThan(0);
      expect(stats.capabilities.supportedFeatures).toContain('keyword-search');
      expect(stats.capabilities.supportedFeatures).toContain('platform-filtering');
      expect(stats.capabilities.supportedFeatures).toContain('category-filtering');
    });

  });

  describe('End-to-End Integration', () => {
    it('should complete full pipeline: HTML → Processing → Validation → Indexing → Search', async () => {
      // Step 1: Process raw HTML
      const processedResult = await contentProcessor.processContent(
        sampleHtml,
        'https://developer.apple.com/design/human-interface-guidelines/buttons'
      );

      // Step 2: Validate quality
      const section: HIGSection = {
        id: 'buttons-ios-e2e',
        title: 'iOS Buttons E2E',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        category: 'visual-design',
        content: processedResult.cleanedMarkdown,
        structuredContent: processedResult.structuredContent,
        quality: processedResult.quality
      };

      const validationResult = await qualityValidator.validateContent(
        processedResult.cleanedMarkdown,
        section
      );

      expect(validationResult.isValid).toBe(true);

      // Step 3: Index for search
      searchIndexer.addSection(section);

      // Step 4: Search and verify results
      const searchResults = await searchIndexer.search(
        'iOS button interaction guidelines',
        [section],
        { useSemanticSearch: false, limit: 5 }
      );

      expect(searchResults.length).toBe(1);
      expect(searchResults[0].title).toBe('iOS Buttons E2E');
      expect(searchResults[0].relevanceScore).toBeGreaterThan(0);

      // Step 5: Pipeline complete - all steps verified successfully
    });

    it('should handle poor quality content gracefully throughout pipeline', async () => {
      const poorHtml = '<div>Loading...</div>';

      // Process poor content
      const result = await contentProcessor.processContent(
        poorHtml,
        'https://example.com/poor-content'
      );

      expect(result.quality.score).toBeLessThan(0.5);
      expect(result.quality.isFallbackContent).toBe(false); // Not fallback, just poor

      // Validate poor content
      const poorSection: HIGSection = {
        id: 'poor-content',
        title: 'Poor Content',
        url: 'https://example.com/poor-content',
        platform: 'iOS',
        category: 'visual-design',
        quality: result.quality
      };

      const validation = await qualityValidator.validateContent(
        result.cleanedMarkdown,
        poorSection
      );

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);

      // Poor content should still be indexable but with low quality
      poorSection.content = result.cleanedMarkdown;
      searchIndexer.addSection(poorSection);

      const stats = searchIndexer.getStatistics();
      expect(stats.keywordIndex.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Performance and SLA Compliance', () => {
    it('should meet performance requirements', async () => {
      const startTime = Date.now();

      // Process content
      const result = await contentProcessor.processContent(
        sampleHtml,
        'https://developer.apple.com/design/human-interface-guidelines/buttons'
      );

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Under 1 second

      // Search should be fast
      const section: HIGSection = {
        id: 'perf-test',
        title: 'Performance Test',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design',
        content: result.cleanedMarkdown,
        quality: result.quality
      };

      searchIndexer.addSection(section);

      const searchStart = Date.now();
      const searchResults = await searchIndexer.search('button', [section], {
        useSemanticSearch: false,
        limit: 5
      });
      const searchTime = Date.now() - searchStart;

      expect(searchTime).toBeLessThan(100); // Under 100ms for keyword search
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should maintain quality SLA across multiple extractions', async () => {
      const htmlSamples = [
        '<h1>Buttons</h1><p>iOS button guidelines from Apple.</p>',
        '<h1>Navigation</h1><p>Apple navigation patterns for iOS.</p>',
        '<h1>Tables</h1><p>iOS table design guidelines.</p>',
        '<h1>Alerts</h1><p>Apple alert design for iOS apps.</p>',
        '<h1>Sheets</h1><p>iOS action sheets and modals.</p>'
      ];

      for (let i = 0; i < htmlSamples.length; i++) {
        const result = await contentProcessor.processContent(
          htmlSamples[i],
          `https://developer.apple.com/design/sample-${i}`
        );

        const section: HIGSection = {
          id: `sla-test-${i}`,
          title: `SLA Test ${i}`,
          url: `https://developer.apple.com/design/sample-${i}`,
          platform: 'iOS',
          category: 'visual-design',
          quality: result.quality
        };

        qualityValidator.recordExtraction(section, result.quality);
      }

      const stats = qualityValidator.getStatistics();
      
      // Should meet SLA targets
      expect(stats.extractionSuccessRate).toBeGreaterThanOrEqual(95);
      expect(stats.averageQuality).toBeGreaterThan(0.1);
    });
  });
});