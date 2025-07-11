/**
 * HIGContentExtractor
 * 
 * Specialized service for extracting high-quality content from Apple's HIG pages
 * with advanced quality scoring and validation to achieve 95%+ real content SLA.
 */

import type { HIGSection } from '../types.js';

export interface ContentQualityMetrics {
  score: number; // 0-1, where 1 is highest quality
  length: number;
  structureScore: number;
  appleTermsScore: number;
  codeExamplesCount: number;
  imageReferencesCount: number;
  headingCount: number;
  isFallbackContent: boolean;
  extractionMethod: string;
  confidence: number;
}

export interface ProcessedContent {
  content: string;
  summary: string;
  tableOfContents: string;
  codeExamples: string[];
  imageReferences: string[];
  relatedSections: string[];
  keywords: string[];
  quality: ContentQualityMetrics;
}

export class HIGContentExtractor {
  private appleDesignTerms: string[] = [
    'accessibility', 'animation', 'branding', 'buttons', 'color', 'controls',
    'design', 'feedback', 'gestures', 'haptics', 'icons', 'images', 'input',
    'interface', 'layout', 'materials', 'motion', 'navigation', 'presentation',
    'selection', 'status', 'system', 'typography', 'visual', 'widgets',
    'human interface guidelines', 'user experience', 'user interface',
    'touch target', 'dynamic type', 'voiceover', 'dark mode', 'light mode'
  ];

  private applePlatformTerms: string[] = [
    'ios', 'iphone', 'ipad', 'macos', 'mac', 'imac', 'macbook', 
    'watchos', 'apple watch', 'tvos', 'apple tv', 'visionos', 'vision pro',
    'swiftui', 'uikit', 'appkit', 'core animation', 'core graphics'
  ];

  private fallbackIndicators: string[] = [
    'this page requires javascript',
    'single page application',
    'please turn on javascript',
    'javascript is required',
    'content not available',
    'loading...',
    'page not found'
  ];

  /**
   * Extract and process content from raw HTML or text
   */
  async extractContent(rawContent: string, section: HIGSection): Promise<ProcessedContent> {
    // Clean and normalize the content
    const cleanedContent = this.cleanRawContent(rawContent);
    
    // Extract structured information
    const codeExamples = this.extractCodeExamples(cleanedContent);
    const imageReferences = this.extractImageReferences(cleanedContent);
    const headings = this.extractHeadings(cleanedContent);
    const relatedSections = this.extractRelatedSections(cleanedContent);
    const keywords = this.extractKeywords(cleanedContent, section);
    
    // Generate table of contents
    const tableOfContents = this.generateTableOfContents(headings);
    
    // Generate summary
    const summary = this.generateSummary(cleanedContent, section);
    
    // Calculate quality metrics
    const quality = this.calculateQualityMetrics(cleanedContent, {
      codeExamplesCount: codeExamples.length,
      imageReferencesCount: imageReferences.length,
      headingCount: headings.length
    });

    return {
      content: cleanedContent,
      summary,
      tableOfContents,
      codeExamples,
      imageReferences,
      relatedSections,
      keywords,
      quality
    };
  }

  /**
   * Clean and normalize raw content
   */
  private cleanRawContent(content: string): string {
    if (!content) return '';

    return content
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\t/g, '  ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Clean up common artifacts
      .replace(/\u00A0/g, ' ') // Non-breaking spaces
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/\u2013/g, '-') // En dash
      .replace(/\u2014/g, '--') // Em dash
      
      // Remove navigation artifacts
      .replace(/^\s*Skip to content.*$/gm, '')
      .replace(/^\s*Developer.*Apple.*$/gm, '')
      .replace(/^\s*Human Interface Guidelines.*$/gm, '')
      
      // Trim and limit length
      .trim()
      .substring(0, 150000); // 150KB limit
  }

  /**
   * Extract code examples from content
   */
  private extractCodeExamples(content: string): string[] {
    const codeExamples: string[] = [];
    
    // Match code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex) || [];
    
    // Match inline code
    const inlineCodeRegex = /`[^`\n]+`/g;
    const inlineCodes = content.match(inlineCodeRegex) || [];
    
    // Match SwiftUI/UIKit patterns
    const swiftPatterns = [
      /\b(?:struct|class|func|var|let)\s+\w+[\s\S]*?(?=\n\n|\n$)/g,
      /\b(?:Button|Text|VStack|HStack|NavigationView)[\s\S]*?(?=\n\n|\n$)/g,
      /\b(?:UIButton|UILabel|UIViewController|UIView)[\s\S]*?(?=\n\n|\n$)/g
    ];
    
    swiftPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      codeExamples.push(...matches);
    });
    
    codeExamples.push(...codeBlocks, ...inlineCodes);
    
    return [...new Set(codeExamples)].filter(code => code.length > 10);
  }

  /**
   * Extract image references from content
   */
  private extractImageReferences(content: string): string[] {
    const imageRefs: string[] = [];
    
    // Markdown images
    const markdownImages = content.match(/!\[.*?\]\(.*?\)/g) || [];
    imageRefs.push(...markdownImages);
    
    // HTML images
    const htmlImages = content.match(/<img[^>]*>/g) || [];
    imageRefs.push(...htmlImages);
    
    // Image URLs
    const imageUrls = content.match(/https?:\/\/[^\s]*\.(jpg|jpeg|png|gif|svg|webp)/gi) || [];
    imageRefs.push(...imageUrls);
    
    return [...new Set(imageRefs)];
  }

  /**
   * Extract headings from content
   */
  private extractHeadings(content: string): Array<{ level: number; text: string; anchor: string }> {
    const headings: Array<{ level: number; text: string; anchor: string }> = [];
    
    // Match markdown headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const anchor = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      
      headings.push({ level, text, anchor });
    }
    
    return headings;
  }

  /**
   * Extract related sections from content
   */
  private extractRelatedSections(content: string): string[] {
    const relatedSections: string[] = [];
    
    // Look for "See also", "Related", "Learn more" sections
    const relatedPatterns = [
      /(?:see also|related|learn more|additional resources):\s*(.+?)(?:\n\n|\n$)/gi,
      /\[([^\]]+)\]\([^)]*human-interface-guidelines[^)]*\)/gi
    ];
    
    relatedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        relatedSections.push(match[1].trim());
      }
    });
    
    return [...new Set(relatedSections)].filter(section => section.length > 0);
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, section: HIGSection): string[] {
    const keywords: Set<string> = new Set();
    
    // Add section metadata
    keywords.add(section.platform.toLowerCase());
    keywords.add(section.category);
    keywords.add(section.title.toLowerCase());
    
    // Extract from content
    const contentLower = content.toLowerCase();
    
    // Add Apple design terms found in content
    this.appleDesignTerms.forEach(term => {
      if (contentLower.includes(term)) {
        keywords.add(term);
      }
    });
    
    // Add Apple platform terms found in content
    this.applePlatformTerms.forEach(term => {
      if (contentLower.includes(term)) {
        keywords.add(term);
      }
    });
    
    // Extract repeated words (potential keywords)
    const words = contentLower.match(/\b[a-z]{3,}\b/g) || [];
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      if (!this.isStopWord(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    // Add frequently mentioned words
    Array.from(wordCount.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([word]) => keywords.add(word));
    
    return Array.from(keywords);
  }

  /**
   * Generate table of contents from headings
   */
  private generateTableOfContents(headings: Array<{ level: number; text: string; anchor: string }>): string {
    if (headings.length < 3) return '';
    
    const toc = ['## Table of Contents', ''];
    
    headings.forEach(heading => {
      if (heading.level <= 4) { // Only include up to h4
        const indent = '  '.repeat(Math.max(0, heading.level - 2));
        toc.push(`${indent}- [${heading.text}](#${heading.anchor})`);
      }
    });
    
    toc.push('', '');
    return toc.join('\n');
  }

  /**
   * Generate content summary
   */
  private generateSummary(content: string, section: HIGSection): string {
    // Find first paragraph or substantial text block
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    
    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[0]
        .replace(/^#+\s+/, '') // Remove heading markers
        .replace(/\*\*/g, '') // Remove bold markers
        .trim();
      
      if (firstParagraph.length > 100) {
        return firstParagraph.substring(0, 300) + (firstParagraph.length > 300 ? '...' : '');
      }
    }
    
    // Fallback summary
    return `Guidelines for ${section.title} in ${section.platform} design. Part of Apple's Human Interface Guidelines covering ${section.category}.`;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private calculateQualityMetrics(
    content: string, 
    counts: { codeExamplesCount: number; imageReferencesCount: number; headingCount: number }
  ): ContentQualityMetrics {
    let score = 0;
    const contentLower = content.toLowerCase();
    
    // Length score (0-0.25)
    const lengthScore = Math.min(content.length / 5000, 1) * 0.25;
    score += lengthScore;
    
    // Structure score (0-0.25)
    const structureScore = Math.min(counts.headingCount / 8, 1) * 0.25;
    score += structureScore;
    
    // Apple terms score (0-0.3)
    const appleTermsFound = this.appleDesignTerms.filter(term => 
      contentLower.includes(term)
    ).length;
    const appleTermsScore = Math.min(appleTermsFound / 10, 1) * 0.3;
    score += appleTermsScore;
    
    // Code examples boost (0-0.1)
    if (counts.codeExamplesCount > 0) {
      score += Math.min(counts.codeExamplesCount / 5, 1) * 0.1;
    }
    
    // Images boost (0-0.05)
    if (counts.imageReferencesCount > 0) {
      score += Math.min(counts.imageReferencesCount / 3, 1) * 0.05;
    }
    
    // Apple platform terms boost (0-0.05)
    const platformTermsFound = this.applePlatformTerms.filter(term => 
      contentLower.includes(term)
    ).length;
    if (platformTermsFound > 0) {
      score += Math.min(platformTermsFound / 3, 1) * 0.05;
    }
    
    // Fallback content detection (major penalty)
    const isFallbackContent = this.fallbackIndicators.some(indicator => 
      contentLower.includes(indicator)
    );
    if (isFallbackContent) {
      score = Math.min(score, 0.2); // Cap at 0.2 for fallback content
    }
    
    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(content, score, isFallbackContent);
    
    return {
      score: Math.min(score, 1.0),
      length: content.length,
      structureScore,
      appleTermsScore,
      codeExamplesCount: counts.codeExamplesCount,
      imageReferencesCount: counts.imageReferencesCount,
      headingCount: counts.headingCount,
      isFallbackContent,
      extractionMethod: isFallbackContent ? 'fallback' : 'crawlee',
      confidence
    };
  }

  /**
   * Calculate confidence in the extracted content
   */
  private calculateConfidence(content: string, score: number, isFallbackContent: boolean): number {
    if (isFallbackContent) return 0.1;
    
    let confidence = score;
    
    // Boost confidence for specific quality indicators
    const contentLower = content.toLowerCase();
    
    // Has proper Apple attribution
    if (contentLower.includes('apple inc') || contentLower.includes('human interface guidelines')) {
      confidence += 0.1;
    }
    
    // Has technical content
    if (contentLower.includes('swiftui') || contentLower.includes('uikit') || contentLower.includes('appkit')) {
      confidence += 0.1;
    }
    
    // Has design guidance language
    const designLanguage = ['should', 'avoid', 'consider', 'ensure', 'design', 'implement'];
    const designTermsFound = designLanguage.filter(term => contentLower.includes(term)).length;
    confidence += Math.min(designTermsFound / 10, 0.1);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'you', 'your', 'they', 'their', 'them',
      'we', 'our', 'us', 'it', 'its', 'he', 'him', 'his', 'she', 'her', 'hers'
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Validate content meets minimum quality standards
   */
  isHighQualityContent(metrics: ContentQualityMetrics): boolean {
    return (
      metrics.score >= 0.5 && // Minimum quality score
      metrics.length >= 200 && // Minimum content length
      !metrics.isFallbackContent && // Not fallback content
      metrics.confidence >= 0.4 // Minimum confidence
    );
  }

  /**
   * Generate quality report for debugging
   */
  generateQualityReport(metrics: ContentQualityMetrics, section: HIGSection): string {
    return `
Quality Report for: ${section.title}
===========================================
Overall Score: ${metrics.score.toFixed(3)}
Confidence: ${metrics.confidence.toFixed(3)}
Length: ${metrics.length} characters
Structure Score: ${metrics.structureScore.toFixed(3)}
Apple Terms Score: ${metrics.appleTermsScore.toFixed(3)}
Headings: ${metrics.headingCount}
Code Examples: ${metrics.codeExamplesCount}
Image References: ${metrics.imageReferencesCount}
Extraction Method: ${metrics.extractionMethod}
Is Fallback: ${metrics.isFallbackContent}
High Quality: ${this.isHighQualityContent(metrics)}
`;
  }
}