/**
 * Apple HIG content scraper with intelligent fallbacks and respectful practices
 */

import { load } from 'cheerio';
import fetch from 'node-fetch';
import { HIGSection, HIGComponent, ApplePlatform, HIGCategory, ScrapingConfig, SearchResult } from './types.js';
import { HIGCache } from './cache.js';

export class HIGScraper {
  private cache: HIGCache;
  private config: ScrapingConfig;
  private lastRequestTime: number = 0;

  constructor(cache: HIGCache) {
    this.cache = cache;
    this.config = {
      baseUrl: 'https://developer.apple.com/design/human-interface-guidelines',
      userAgent: 'Apple-HIG-MCP-Server/1.0.0 (Educational/Development Purpose)',
      requestDelay: 1000, // 1 second between requests
      retryAttempts: 3,
      timeout: 10000
    };
  }

  /**
   * Respectful request with rate limiting
   */
  private async makeRequest(url: string): Promise<string> {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.requestDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.requestDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    const cacheKey = `request:${url}`;
    
    // Try cache first with graceful fallback
    const cached = this.cache.getWithGracefulFallback<string>(cacheKey);
    if (cached.data) {
      if (cached.isStale) {
        console.warn(`[HIGScraper] Using stale cached data for: ${url}`);
      }
      return cached.data;
    }

    // Fetch fresh data
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`[HIGScraper] Fetching: ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: this.config.timeout,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Cache with graceful degradation (24 hour backup)
        this.cache.setWithGracefulDegradation(cacheKey, html, 3600, 86400);
        
        return html;
      } catch (error) {
        console.error(`[HIGScraper] Attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt === this.config.retryAttempts) {
          // Final attempt failed, try graceful degradation
          const staleData = this.cache.getStale<string>(cacheKey);
          if (staleData) {
            console.warn(`[HIGScraper] Using very stale cached data for: ${url}`);
            return staleData;
          }
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`Failed to fetch ${url} after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Extract clean text content from HTML, converting to markdown-like format
   */
  private cleanContent(html: string): string {
    const $ = load(html);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .navigation, .sidebar').remove();
    
    // Convert headers to markdown
    $('h1').each((_, el) => {
      $(el).replaceWith(`# ${$(el).text().trim()}\n\n`);
    });
    $('h2').each((_, el) => {
      $(el).replaceWith(`## ${$(el).text().trim()}\n\n`);
    });
    $('h3').each((_, el) => {
      $(el).replaceWith(`### ${$(el).text().trim()}\n\n`);
    });
    $('h4').each((_, el) => {
      $(el).replaceWith(`#### ${$(el).text().trim()}\n\n`);
    });

    // Convert lists
    $('ul').each((_, el) => {
      const items = $(el).find('li').map((_, li) => `- ${$(li).text().trim()}`).get();
      $(el).replaceWith(items.join('\n') + '\n\n');
    });

    $('ol').each((_, el) => {
      const items = $(el).find('li').map((i, li) => `${i + 1}. ${$(li).text().trim()}`).get();
      $(el).replaceWith(items.join('\n') + '\n\n');
    });

    // Convert paragraphs
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        $(el).replaceWith(`${text}\n\n`);
      }
    });

    // Get clean text and normalize whitespace
    const cleanText = $('body').text() || $.text();
    return cleanText
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim
      .substring(0, 50000); // Limit content length
  }

  /**
   * Discover HIG sections and their URLs
   */
  async discoverSections(): Promise<HIGSection[]> {
    const cacheKey = 'hig:sections:all';
    
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log('[HIGScraper] Discovering HIG sections...');
      const html = await this.makeRequest(this.config.baseUrl);
      const $ = load(html);
      
      const sections: HIGSection[] = [];
      
      // Multiple selectors as fallbacks
      const linkSelectors = [
        'a[href*="/design/human-interface-guidelines/"]',
        '.navigation a',
        'nav a',
        '.sidebar a',
        '[data-nav] a'
      ];

      for (const selector of linkSelectors) {
        const links = $(selector);
        if (links.length > 0) {
          links.each((_, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (href && text && href.includes('/design/human-interface-guidelines/')) {
              const fullUrl = href.startsWith('http') ? href : `https://developer.apple.com${href}`;
              const platform = this.extractPlatform(href, text);
              const category = this.extractCategory(href, text);
              
              // Avoid duplicates
              if (!sections.find(s => s.url === fullUrl)) {
                sections.push({
                  id: this.generateId(text, platform),
                  title: text,
                  url: fullUrl,
                  platform,
                  category,
                  lastUpdated: new Date()
                });
              }
            }
          });
          
          if (sections.length > 0) {
            break; // Found sections, no need to try other selectors
          }
        }
      }

      // Cache for 4 hours
      this.cache.set(cacheKey, sections, 14400);
      console.log(`[HIGScraper] Discovered ${sections.length} HIG sections`);
      
      return sections;
    } catch (error) {
      console.error('[HIGScraper] Failed to discover sections:', error);
      return [];
    }
  }

  /**
   * Fetch content for a specific HIG section
   */
  async fetchSectionContent(section: HIGSection): Promise<HIGSection> {
    const cacheKey = `hig:section:${section.id}`;
    
    // Check cache first
    const cached = this.cache.get<HIGSection>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`[HIGScraper] Fetching content for: ${section.title}`);
      const html = await this.makeRequest(section.url);
      const content = this.cleanContent(html);
      
      const updatedSection: HIGSection = {
        ...section,
        content,
        lastUpdated: new Date()
      };

      // Cache for 2 hours
      this.cache.set(cacheKey, updatedSection, 7200);
      
      return updatedSection;
    } catch (error) {
      console.error(`[HIGScraper] Failed to fetch content for ${section.title}:`, error);
      return section; // Return original section if fetch fails
    }
  }

  /**
   * Search HIG content
   */
  async searchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit: number = 10): Promise<SearchResult[]> {
    const sections = await this.discoverSections();
    let filteredSections = sections;

    // Filter by platform and category
    if (platform && platform !== 'universal') {
      filteredSections = filteredSections.filter(s => s.platform === platform || s.platform === 'universal');
    }
    if (category) {
      filteredSections = filteredSections.filter(s => s.category === category);
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const section of filteredSections.slice(0, limit * 2)) { // Search more than limit to get best matches
      const titleMatch = section.title.toLowerCase().includes(queryLower);
      const contentSection = await this.fetchSectionContent(section);
      const contentMatch = contentSection.content?.toLowerCase().includes(queryLower) || false;

      if (titleMatch || contentMatch) {
        const relevanceScore = titleMatch ? 1.0 : 0.5;
        const snippet = this.extractSnippet(contentSection.content || '', query);

        results.push({
          id: section.id,
          title: section.title,
          url: section.url,
          platform: section.platform,
          relevanceScore,
          snippet,
          type: 'section'
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Extract a relevant snippet from content
   */
  private extractSnippet(content: string, query: string, maxLength: number = 200): string {
    if (!content) return '';

    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(queryLower);

    if (queryIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, start + maxLength);
    const snippet = content.substring(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  }

  /**
   * Extract platform from URL or text
   */
  private extractPlatform(href: string, text: string): ApplePlatform {
    const combined = (href + ' ' + text).toLowerCase();
    
    if (combined.includes('ios')) return 'iOS';
    if (combined.includes('macos')) return 'macOS';
    if (combined.includes('watchos')) return 'watchOS';
    if (combined.includes('tvos')) return 'tvOS';
    if (combined.includes('visionos')) return 'visionOS';
    
    return 'universal';
  }

  /**
   * Extract category from URL or text
   */
  private extractCategory(href: string, text: string): HIGCategory {
    const combined = (href + ' ' + text).toLowerCase();
    
    if (combined.includes('foundation')) return 'foundations';
    if (combined.includes('layout')) return 'layout';
    if (combined.includes('navigation')) return 'navigation';
    if (combined.includes('presentation')) return 'presentation';
    if (combined.includes('input') || combined.includes('selection')) return 'selection-and-input';
    if (combined.includes('status')) return 'status';
    if (combined.includes('system')) return 'system-capabilities';
    if (combined.includes('visual') || combined.includes('design')) return 'visual-design';
    if (combined.includes('icon') || combined.includes('image')) return 'icons-and-images';
    if (combined.includes('color') || combined.includes('material')) return 'color-and-materials';
    if (combined.includes('typography') || combined.includes('font')) return 'typography';
    if (combined.includes('motion') || combined.includes('animation')) return 'motion';
    if (combined.includes('technolog')) return 'technologies';
    
    return 'foundations';
  }

  /**
   * Generate a unique ID for a section
   */
  private generateId(title: string, platform: ApplePlatform): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `${platform.toLowerCase()}-${cleanTitle}`;
  }
}