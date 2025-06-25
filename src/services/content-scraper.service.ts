/**
 * Content Scraper Service
 * Single Responsibility: Extract content from Apple's HIG pages
 * Improved content extraction for SPA websites
 */

import * as cheerio from 'cheerio';
import { IContentScraper, INetworkClient } from '../interfaces/content-interfaces.js';
// Note: HIGSection import removed as it's not used in this service

export class ContentScraperService implements IContentScraper {
  constructor(private networkClient: INetworkClient) {}

  async scrapeContent(url: string): Promise<string> {
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    try {
      const html = await this.networkClient.fetch(url);
      return this.extractContentFromHtml(html, url);
    } catch (error) {
      console.error(`Failed to scrape content from ${url}:`, error);
      throw error;
    }
  }

  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('apple.com') && 
             parsedUrl.pathname.includes('design/human-interface-guidelines');
    } catch {
      return false;
    }
  }

  /**
   * Extract content from HTML with improved selectors for Apple's HIG
   */
  private extractContentFromHtml(html: string, url: string): string {
    const $ = cheerio.load(html);
    let content = '';

    // Try multiple content extraction strategies for Apple's SPA
    const contentSelectors = [
      // Primary content areas
      'main[role="main"]',
      '[data-module="BodyContent"]',
      '.content-wrapper',
      '[class*="content"]',
      
      // Article and section content
      'article',
      'section[role="main"]',
      '.documentation-content',
      
      // Fallback selectors
      '#main-content',
      '.main-content',
      '[role="main"]'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = this.extractStructuredContent(element, $);
        if (content.length > 500) { // Good content threshold
          break;
        }
      }
    }

    // If no good content found, try JavaScript-rendered content indicators
    if (content.length < 500) {
      content = this.extractFromDataAttributes($);
    }

    // Clean and validate content
    content = this.cleanExtractedContent(content);

    if (content.length < 200) {
      throw new Error(`Insufficient content extracted from ${url}. Content length: ${content.length}`);
    }

    return content;
  }

  /**
   * Extract structured content with proper markdown formatting
   */
  private extractStructuredContent(containerElement: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    let markdownContent = '';

    // Extract headings with hierarchy
    containerElement.find('h1, h2, h3, h4, h5, h6').each((_, heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = $(heading).text().trim();
      if (text && !this.isNavigationalText(text)) {
        markdownContent += `${'#'.repeat(level)} ${text}\n\n`;
      }
    });

    // Extract paragraphs with context
    containerElement.find('p').each((_, paragraph) => {
      const text = $(paragraph).text().trim();
      if (text && text.length > 20 && !this.isNavigationalText(text)) {
        markdownContent += `${text}\n\n`;
      }
    });

    // Extract lists with proper formatting
    containerElement.find('ul, ol').each((_, list) => {
      const listItems = $(list).find('li').map((_, item) => {
        const text = $(item).text().trim();
        return text && !this.isNavigationalText(text) ? text : null;
      }).get().filter(Boolean);

      if (listItems.length > 0) {
        const isOrdered = list.tagName === 'ol';
        listItems.forEach((item, index) => {
          const prefix = isOrdered ? `${index + 1}. ` : '- ';
          markdownContent += `${prefix}${item}\n`;
        });
        markdownContent += '\n';
      }
    });

    // Extract code blocks
    containerElement.find('pre, code').each((_, codeElement) => {
      const code = $(codeElement).text().trim();
      if (code && code.length > 10) {
        if (codeElement.tagName === 'pre') {
          markdownContent += `\`\`\`\n${code}\n\`\`\`\n\n`;
        } else {
          markdownContent += `\`${code}\`\n\n`;
        }
      }
    });

    // Extract tables
    containerElement.find('table').each((_, table) => {
      const rows = $(table).find('tr');
      if (rows.length > 0) {
        rows.each((_, row) => {
          const cells = $(row).find('td, th').map((_, cell) => 
            $(cell).text().trim()
          ).get().filter(Boolean);
          
          if (cells.length > 0) {
            markdownContent += `| ${cells.join(' | ')} |\n`;
          }
        });
        markdownContent += '\n';
      }
    });

    return markdownContent;
  }

  /**
   * Extract content from data attributes (for SPA content)
   */
  private extractFromDataAttributes($: cheerio.CheerioAPI): string {
    let content = '';

    // Look for JSON-LD or data attributes that might contain content
    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const data = JSON.parse($(script).html() || '{}');
        if (data.articleBody) {
          content += data.articleBody + '\n\n';
        }
      } catch {
        // Ignore invalid JSON
      }
    });

    // Extract from meta descriptions and other meta tags
    const description = $('meta[name="description"]').attr('content');
    if (description && description.length > 50) {
      content += description + '\n\n';
    }

    return content;
  }

  /**
   * Clean extracted content
   */
  private cleanExtractedContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\n\s+/g, '\n') // Remove indented empty lines
      .substring(0, 50000); // Limit content length
  }

  /**
   * Filter out navigational text that shouldn't be in content
   */
  private isNavigationalText(text: string): boolean {
    const navKeywords = [
      'skip to main content',
      'menu',
      'navigation',
      'breadcrumb',
      'search',
      'toggle',
      'show more',
      'show less',
      'expand',
      'collapse',
      'next',
      'previous',
      'back to top'
    ];

    const lowerText = text.toLowerCase();
    return navKeywords.some(keyword => lowerText.includes(keyword)) ||
           text.length < 5 ||
           /^[\s\W]*$/.test(text); // Only whitespace or punctuation
  }
}