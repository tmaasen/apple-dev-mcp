/**
 * Content Processor Service
 * Single Responsibility: Process and clean content
 */

import { IContentProcessor } from '../interfaces/content-interfaces.js';
import { HIGSection } from '../types.js';

export class ContentProcessorService implements IContentProcessor {
  private readonly commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 
    'might', 'must', 'shall'
  ]);

  async process(section: HIGSection): Promise<string> {
    if (!section.content) {
      throw new Error(`No content available for section: ${section.title}`);
    }

    let processedContent = section.content;
    
    // Remove existing attribution blocks to prevent duplicates
    processedContent = this.removeExistingAttribution(processedContent);
    
    // Clean and normalize content
    processedContent = this.cleanContent(processedContent);
    
    // Add section heading if not present
    if (!processedContent.startsWith('#')) {
      processedContent = `# ${section.title}\n\n${processedContent}`;
    }
    
    return processedContent;
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

  private removeExistingAttribution(content: string): string {
    return content
      .replace(/---\s*\*\*Attribution Notice\*\*[\s\S]*?---/g, '')
      .replace(/\*\*Attribution Notice\*\*[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/---[\s\S]*?Apple Inc\.[\s\S]*?---/g, '')
      .trim();
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^[ \t]+/gm, '')   // Remove leading whitespace
      .trim();
  }
}