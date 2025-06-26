/**
 * Unit tests for ContentProcessorService (Phase 1 functionality)
 */

import { ContentProcessorService } from '../services/content-processor.service.js';
import type { HIGSection } from '../types.js';

describe('ContentProcessorService', () => {
  let processor: ContentProcessorService;

  beforeEach(() => {
    processor = new ContentProcessorService();
  });

  describe('processContent', () => {
    it('should process HTML to clean markdown', async () => {
      const html = `
        <h1>Button Guidelines</h1>
        <p>Buttons initiate app-specific actions.</p>
        <img src="button.png" alt="Button example" />
        <nav>Skip this navigation</nav>
      `;

      const result = await processor.processContent(html, 'https://example.com');

      expect(result.cleanedMarkdown).toContain('# Button Guidelines');
      expect(result.cleanedMarkdown).toContain('Buttons initiate app-specific actions');
      expect(result.cleanedMarkdown).not.toContain('<img');
      expect(result.cleanedMarkdown).not.toContain('<nav');
    });

    it('should extract structured content', async () => {
      const html = `
        <h1>Button Guidelines</h1>
        <p>Buttons are interactive elements.</p>
        <h2>Guidelines</h2>
        <ul>
          <li>Use clear button text</li>
          <li>Make buttons appropriately sized</li>
        </ul>
        <h2>Examples</h2>
        <ul>
          <li>Primary buttons for main actions</li>
          <li>Secondary buttons for alternative actions</li>
        </ul>
      `;

      const result = await processor.processContent(html, 'https://example.com');

      expect(result.structuredContent.overview).toContain('interactive elements');
      expect(result.structuredContent.guidelines).toHaveLength(2);
      expect(result.structuredContent.guidelines[0]).toContain('clear button text');
      expect(result.structuredContent.examples).toHaveLength(2);
      expect(result.structuredContent.examples[0]).toContain('Primary buttons');
    });

    it('should calculate quality metrics', async () => {
      const goodHtml = `
        <h1>Comprehensive Button Guide</h1>
        <p>This is a detailed guide about iOS buttons and their implementation.</p>
        <h2>Design Guidelines</h2>
        <p>Follow these Apple guidelines for consistent design.</p>
        <code>UIButton.appearance().backgroundColor = .systemBlue</code>
      `;

      const result = await processor.processContent(goodHtml, 'https://developer.apple.com/design');

      expect(result.quality.score).toBeGreaterThan(0.3);
      expect(result.quality.confidence).toBeGreaterThan(0.3);
      expect(result.quality.appleTermsScore).toBeGreaterThanOrEqual(0.1);
      expect(result.quality.codeExamplesCount).toBeGreaterThanOrEqual(0);
      expect(result.quality.isFallbackContent).toBe(false);
    });

    it('should handle empty or poor content gracefully', async () => {
      const poorHtml = '<div>Loading...</div>';

      const result = await processor.processContent(poorHtml, 'https://example.com');

      expect(result.quality.score).toBeLessThan(0.3);
      expect(result.quality.length).toBeLessThan(100);
      expect(result.structuredContent.overview).toContain('Loading');
      expect(result.structuredContent.guidelines.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractKeywords', () => {
    it('should extract relevant keywords from content', () => {
      const content = 'iOS button design guidelines for navigation and accessibility';
      const section: HIGSection = {
        id: 'test',
        title: 'Button Guide',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design'
      };

      const keywords = processor.extractKeywords(content, section);

      expect(keywords).toContain('button');
      expect(keywords).toContain('design');
      expect(keywords).toContain('navigation');
      expect(keywords).toContain('accessibility');
      expect(keywords).toContain('ios');
    });

    it('should limit keywords to reasonable number', () => {
      const longContent = 'button '.repeat(100) + 'design guidelines navigation accessibility';
      const section: HIGSection = {
        id: 'test',
        title: 'Test',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design'
      };

      const keywords = processor.extractKeywords(longContent, section);

      expect(keywords.length).toBeLessThanOrEqual(50); // Should limit keywords
      expect(new Set(keywords).size).toBe(keywords.length); // Should be unique
    });
  });

  describe('extractSnippet', () => {
    it('should create appropriate length snippets', () => {
      const longContent = 'This is a very long piece of content that should be truncated to a reasonable length for display purposes. '.repeat(10);

      const snippet = processor.extractSnippet(longContent, 100);

      expect(snippet.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(snippet.endsWith('...')).toBe(true);
    });

    it('should not truncate short content', () => {
      const shortContent = 'This is short content.';

      const snippet = processor.extractSnippet(shortContent, 100);

      expect(snippet).toBe(shortContent);
      expect(snippet.endsWith('...')).toBe(false);
    });
  });

  describe('process (legacy method)', () => {
    it('should process HIGSection with content', async () => {
      const section: HIGSection = {
        id: 'buttons-ios',
        title: 'iOS Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'iOS',
        category: 'visual-design',
        content: '<h1>iOS Buttons</h1><p>Interactive elements for user actions.</p>'
      };

      const result = await processor.process(section);

      expect(result).toContain('# iOS Buttons');
      expect(result).toContain('Interactive elements');
    });

    it('should handle sections without content', async () => {
      const section: HIGSection = {
        id: 'empty',
        title: 'Empty Section',
        url: 'https://example.com',
        platform: 'iOS',
        category: 'visual-design'
      };

      await expect(processor.process(section)).rejects.toThrow('No content available for section');
    });
  });
});