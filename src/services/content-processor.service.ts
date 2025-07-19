/**
 * Enhanced Content Processor Service
 * 
 * Handles enhanced content extraction and processing using Turndown
 * for clean HTML-to-Markdown conversion and structured content organization.
 */

import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';
import type { IContentProcessor } from '../interfaces/content-interfaces.js';
import type { 
  HIGSection,
  StructuredHIGContent, 
  ProcessedContentResult, 
  ContentQualityMetrics,
  ComponentSpec 
} from '../types.js';

export interface ContentProcessorConfig {
  removeImages: boolean;
  preserveCodeBlocks: boolean;
  cleanNavigationElements: boolean;
  extractStructuredData: boolean;
}

export class ContentProcessorService implements IContentProcessor {
  private turndown: TurndownService;
  private markdown: MarkdownIt;
  private config: ContentProcessorConfig;
  private readonly commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 
    'might', 'must', 'shall'
  ]);

  constructor(config: Partial<ContentProcessorConfig> = {}) {
    this.config = {
      removeImages: true,
      preserveCodeBlocks: true,
      cleanNavigationElements: true,
      extractStructuredData: true,
      ...config
    };

    // Configure Turndown for high-quality conversion
    this.turndown = new TurndownService({
      headingStyle: 'atx',           // Use # headers
      bulletListMarker: '-',         // Use - for lists
      codeBlockStyle: 'fenced',      // Use ``` code blocks
      fence: '```',                  // Code fence marker
      emDelimiter: '*',              // Use * for emphasis
      strongDelimiter: '**',         // Use ** for strong
      linkStyle: 'inlined',          // Inline links
      linkReferenceStyle: 'full'     // Full reference links
    });

    // Configure Turndown rules
    this.configureTurndownRules();

    // Initialize markdown parser for processing
    this.markdown = new MarkdownIt({
      html: false,        // Don't allow HTML tags
      xhtmlOut: false,    // Don't use XHTML output
      breaks: false,      // Don't convert line breaks to <br>
      linkify: true,      // Auto-convert URL-like text to links
      typographer: true   // Enable smart quotes and other typography
    });
  }

  // Legacy interface method - kept for compatibility
  async process(section: HIGSection): Promise<string> {
    if (!section.content) {
      throw new Error(`No content available for section: ${section.title}`);
    }

    const result = await this.processContent(section.content, section.url);
    return result.cleanedMarkdown;
  }

  /**
   * Enhanced content processing method that returns full structured result
   */
  async processContent(html: string, url: string): Promise<ProcessedContentResult> {
    const startTime = Date.now();
    
    try {
      // Step 0: Check for JavaScript error pages
      if (this.isJavaScriptErrorPage(html)) {
        throw new Error('JavaScript error page detected - content requires browser JavaScript execution');
      }
      
      // Step 1: Clean the HTML
      const cleanedHtml = this.cleanHtml(html);
      
      // Step 2: Convert to markdown
      const rawMarkdown = this.turndown.turndown(cleanedHtml);
      
      // Step 3: Clean and normalize markdown
      const cleanedMarkdown = this.cleanMarkdown(rawMarkdown);
      
      // Step 4: Extract structured content
      const structuredContent = this.extractStructuredContent(cleanedMarkdown, url);
      
      // Step 5: Calculate quality metrics
      const quality = this.calculateQualityMetrics(cleanedMarkdown, structuredContent);
      
      const processingTime = Date.now() - startTime;
      
      return {
        cleanedMarkdown,
        structuredContent,
        quality,
        processingMetrics: {
          extractionTime: processingTime,
          contentLength: cleanedMarkdown.length,
          structureScore: this.calculateStructureScore(structuredContent),
          cleaningScore: this.calculateCleaningScore(html, cleanedMarkdown)
        }
      };
    } catch (error) {
      throw new Error(`Content processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractSnippet(content: string, maxLength: number = 200): string {
    const cleaned = content
      .replace(/#+\s*/g, '') // Remove markdown headers
      .replace(/\n+/g, ' ')   // Replace newlines with spaces
      .trim();
    
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned;
  }

  extractKeywords(content: string, section: HIGSection): string[] {
    const text = content.toLowerCase();
    
    // Extract words of 3+ characters
    const words = text.match(/\b\w{3,}\b/g) || [];
    
    // Filter out common words and get unique keywords
    const keywords = [...new Set(words)]
      .filter(word => !this.commonWords.has(word))
      .slice(0, 20); // Top 20 keywords
    
    // Add section-specific keywords
    keywords.push(
      section.platform.toLowerCase(),
      section.category,
      section.title.toLowerCase()
    );
    
    return [...new Set(keywords)];
  }

  /**
   * Configure Turndown rules for Apple HIG content
   */
  private configureTurndownRules(): void {
    // Remove images if configured
    if (this.config.removeImages) {
      this.turndown.addRule('removeImages', {
        filter: 'img',
        replacement: () => ''
      });
    }

    // Remove navigation elements
    if (this.config.cleanNavigationElements) {
      this.turndown.addRule('removeNavigation', {
        filter: (node) => {
          if (node.nodeType !== 1) return false; // Only element nodes
          const element = node as globalThis.Element;
          
          // Remove common navigation patterns
          const navSelectors = [
            'nav', '.nav', '#nav',
            '.navigation', '.breadcrumb',
            '.skip-navigation', '.skip-link',
            '.page-navigation', '.toc',
            '.sidebar', '.menu'
          ];
          
          return navSelectors.some(selector => {
            try {
              return element.matches?.(selector) || 
                     element.classList?.contains(selector.replace('.', '')) ||
                     element.id === selector.replace('#', '');
            } catch {
              return false;
            }
          });
        },
        replacement: () => ''
      });
    }

    // Clean up code blocks
    if (this.config.preserveCodeBlocks) {
      this.turndown.addRule('preserveCode', {
        filter: ['pre', 'code'],
        replacement: (content, node) => {
          if (node.nodeName === 'PRE') {
            return `\n\`\`\`\n${content}\n\`\`\`\n`;
          }
          return `\`${content}\``;
        }
      });
    }

    // Remove footer and header content
    this.turndown.addRule('removeHeaderFooter', {
      filter: (node) => {
        if (node.nodeType !== 1) return false;
        const element = node as globalThis.Element;
        const tagName = element.tagName?.toLowerCase();
        return tagName === 'header' || tagName === 'footer';
      },
      replacement: () => ''
    });
  }

  /**
   * Clean HTML before conversion
   */
  private cleanHtml(html: string): string {
    // Remove script and style tags
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove common unwanted elements
    const unwantedPatterns = [
      /<button[^>]*>.*?<\/button>/gi,
      /<input[^>]*>/gi,
      /<form[^>]*>.*?<\/form>/gi,
      /<!--[\s\S]*?-->/g, // Comments
      /<meta[^>]*>/gi,
      /<link[^>]*>/gi
    ];

    unwantedPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  /**
   * Check if HTML content is a JavaScript error page
   */
  private isJavaScriptErrorPage(html: string): boolean {
    const lowerHtml = html.toLowerCase();
    const plainText = html.replace(/<[^>]*>/g, '').trim();
    
    // Primary indicators: explicit JavaScript error messages
    const criticalErrorIndicators = [
      'please turn on javascript in your browser and refresh the page',
      'this page requires javascript',
      'javascript is required to view this content',
      'enable javascript and refresh'
    ];
    
    const hasCriticalError = criticalErrorIndicators.some(indicator => 
      lowerHtml.includes(indicator)
    );
    
    // Secondary check: Very minimal content that's mostly CSS/style with noscript
    const hasNoscriptOnly = lowerHtml.includes('<noscript>') && 
                           lowerHtml.includes('class="noscript"') &&
                           plainText.length < 150;
    
    // Tertiary check: Content is only CSS styles with almost no readable text
    const isMostlyCSS = html.includes('<style>') && 
                       plainText.length < 100 &&
                       html.length > 1000; // Large HTML but tiny text content
    
    return hasCriticalError || hasNoscriptOnly || isMostlyCSS;
  }

  /**
   * Clean and normalize markdown content
   */
  private cleanMarkdown(markdown: string): string {
    return markdown
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Fix common formatting issues
      .replace(/^[\s]*\n/gm, '')
      // Remove "Skip Navigation" artifacts
      .replace(/Skip Navigation\s*/gi, '')
      // Clean up list formatting
      .replace(/^\s*-\s*$/gm, '')
      // Remove empty links
      .replace(/\[(\s*)\]\(\s*\)/g, '')
      // Fix multiple spaces
      .replace(/  +/g, ' ');
  }

  /**
   * Extract structured content from cleaned markdown
   */
  private extractStructuredContent(markdown: string, _url: string): StructuredHIGContent {
    const lines = markdown.split('\n');
    
    let overview = '';
    const guidelines: string[] = [];
    const examples: string[] = [];
    const relatedConcepts: string[] = [];
    
    let currentSection = 'overview';
    let currentContent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers
      if (trimmed.match(/^#+\s*(overview|summary|what|description)/i)) {
        currentSection = 'overview';
        continue;
      } else if (trimmed.match(/^#+\s*(guidelines?|best practices?|do|don't|recommendations?)/i)) {
        if (currentContent && currentSection === 'overview') {
          overview = currentContent.trim();
        }
        currentSection = 'guidelines';
        currentContent = '';
        continue;
      } else if (trimmed.match(/^#+\s*(examples?|usage|use cases?|for example)/i)) {
        currentSection = 'examples';
        currentContent = '';
        continue;
      } else if (trimmed.match(/^#+\s*(related|see also|links)/i)) {
        currentSection = 'related';
        currentContent = '';
        continue;
      }
      
      // Process content based on current section
      if (trimmed) {
        if (currentSection === 'overview' && !trimmed.startsWith('#')) {
          currentContent += line + '\n';
        } else if (currentSection === 'guidelines') {
          if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            guidelines.push(trimmed.replace(/^[-*\d.]+\s*/, ''));
          } else if (!trimmed.startsWith('#')) {
            guidelines.push(trimmed);
          }
        } else if (currentSection === 'examples') {
          if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            examples.push(trimmed.replace(/^[-*\d.]+\s*/, ''));
          } else if (!trimmed.startsWith('#')) {
            examples.push(trimmed);
          }
        }
      }
    }
    
    // Handle remaining overview content
    if (currentContent && currentSection === 'overview') {
      overview = currentContent.trim();
    }
    
    // If no structured overview found, use first paragraph
    if (!overview) {
      const firstParagraph = lines.find(line => 
        line.trim().length > 50 && 
        !line.trim().startsWith('#') && 
        !line.trim().startsWith('-') &&
        !line.trim().startsWith('*')
      );
      overview = firstParagraph?.trim() || 'No overview available';
    }
    
    // Extract related concepts from content
    this.extractRelatedConcepts(markdown, relatedConcepts);
    
    return {
      overview,
      guidelines: guidelines.length ? guidelines : ['No specific guidelines identified'],
      examples: examples.length ? examples : ['No examples provided'],
      relatedConcepts,
      specifications: this.extractSpecifications(markdown)
    };
  }

  /**
   * Extract related concepts and cross-references
   */
  private extractRelatedConcepts(markdown: string, relatedConcepts: string[]): void {
    // Look for Apple HIG component mentions
    const componentPatterns = [
      /\b(buttons?|navigation bars?|tab bars?|toolbars?|alerts?|action sheets?)\b/gi,
      /\b(pickers?|text fields?|switches?|sliders?|steppers?)\b/gi,
      /\b(color|typography|layout|spacing|accessibility)\b/gi
    ];
    
    componentPatterns.forEach(pattern => {
      const matches = markdown.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = match.toLowerCase().trim();
          if (!relatedConcepts.includes(normalized)) {
            relatedConcepts.push(normalized);
          }
        });
      }
    });
  }

  /**
   * Extract technical specifications from content
   */
  private extractSpecifications(markdown: string): ComponentSpec | undefined {
    const specs: ComponentSpec = {};
    
    // Look for dimension specifications
    const dimensionMatches = markdown.match(/(?:width|height|size):\s*([^.\n]+)/gi);
    if (dimensionMatches) {
      specs.dimensions = {};
      dimensionMatches.forEach(match => {
        if (match.toLowerCase().includes('width')) {
          specs.dimensions.width = match.split(':')[1]?.trim();
        }
        if (match.toLowerCase().includes('height')) {
          specs.dimensions.height = match.split(':')[1]?.trim();
        }
      });
    }
    
    // Look for spacing specifications
    const spacingMatches = markdown.match(/(?:padding|margin|spacing):\s*([^.\n]+)/gi);
    if (spacingMatches) {
      specs.spacing = {};
      spacingMatches.forEach(match => {
        if (match.toLowerCase().includes('padding')) {
          specs.spacing.padding = match.split(':')[1]?.trim();
        }
        if (match.toLowerCase().includes('margin')) {
          specs.spacing.margin = match.split(':')[1]?.trim();
        }
      });
    }
    
    return Object.keys(specs).length > 0 ? specs : undefined;
  }

  /**
   * Calculate content quality metrics
   */
  private calculateQualityMetrics(markdown: string, structured: StructuredHIGContent): ContentQualityMetrics {
    const length = markdown.length;
    const hasOverview = structured.overview.length > 50;
    const hasGuidelines = structured.guidelines.length > 0 && structured.guidelines[0] !== 'No specific guidelines identified';
    const hasExamples = structured.examples.length > 0 && structured.examples[0] !== 'No examples provided';
    const hasRelated = structured.relatedConcepts.length > 0;
    
    // Calculate structure score
    let structureScore = 0.2; // Base score
    if (hasOverview) structureScore += 0.3;
    if (hasGuidelines) structureScore += 0.2;
    if (hasExamples) structureScore += 0.2;
    if (hasRelated) structureScore += 0.1;
    
    // Calculate content richness
    const wordCount = markdown.split(/\s+/).length;
    const contentRichness = Math.min(wordCount / 500, 1); // Normalize to 500 words max
    
    const score = (structureScore + contentRichness) / 2;
    
    return {
      score,
      length,
      structureScore,
      appleTermsScore: this.calculateAppleTermsScore(markdown),
      codeExamplesCount: (markdown.match(/```/g) || []).length / 2,
      imageReferencesCount: 0, // We remove images
      headingCount: (markdown.match(/^#+/gm) || []).length,
      isFallbackContent: false,
      extractionMethod: 'enhanced-turndown',
      confidence: Math.min(score + 0.2, 1) // Boost confidence for structured content
    };
  }

  /**
   * Calculate Apple-specific terms score
   */
  private calculateAppleTermsScore(content: string): number {
    const appleTerms = [
      'iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS',
      'SwiftUI', 'UIKit', 'AppKit',
      'Human Interface Guidelines', 'HIG',
      'accessibility', 'VoiceOver',
      'design system', 'interface'
    ];
    
    let termCount = 0;
    const contentLower = content.toLowerCase();
    
    appleTerms.forEach(term => {
      const matches = contentLower.split(term.toLowerCase()).length - 1;
      termCount += matches;
    });
    
    return Math.min(termCount / 10, 1); // Normalize to max 10 terms
  }

  /**
   * Calculate structure score for processed content
   */
  private calculateStructureScore(structured: StructuredHIGContent): number {
    let score = 0;
    
    if (structured.overview.length > 50) score += 0.4;
    if (structured.guidelines.length > 0 && structured.guidelines[0] !== 'No specific guidelines identified') score += 0.3;
    if (structured.examples.length > 0 && structured.examples[0] !== 'No examples provided') score += 0.2;
    if (structured.relatedConcepts.length > 0) score += 0.1;
    
    return score;
  }

  /**
   * Calculate cleaning score (how much improvement was made)
   */
  private calculateCleaningScore(originalHtml: string, cleanedMarkdown: string): number {
    const originalLength = originalHtml.length;
    const cleanedLength = cleanedMarkdown.length;
    
    // Calculate reduction in content (higher = more cleaning)
    const reduction = (originalLength - cleanedLength) / originalLength;
    
    // Look for artifacts that were removed
    const artifactPatterns = [
      /Skip Navigation/gi,
      /<script/gi,
      /<style/gi,
      /<nav/gi,
      /\[(\s*)\]/g
    ];
    
    let artifactsRemoved = 0;
    artifactPatterns.forEach(pattern => {
      const originalCount = (originalHtml.match(pattern) || []).length;
      const cleanedCount = (cleanedMarkdown.match(pattern) || []).length;
      artifactsRemoved += Math.max(0, originalCount - cleanedCount);
    });
    
    return Math.min((reduction * 0.7) + (artifactsRemoved * 0.1), 1);
  }
}