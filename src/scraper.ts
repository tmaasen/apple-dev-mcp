/**
 * Apple HIG content scraper with intelligent fallbacks and respectful practices
 */

import { load } from 'cheerio';
import fetch from 'node-fetch';
import { HIGSection, ApplePlatform, HIGCategory, ScrapingConfig, SearchResult } from './types.js';
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
          signal: AbortSignal.timeout(this.config.timeout),
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
   * 
   * Note: Apple's HIG website is now a SPA (Single Page Application) that loads content
   * dynamically with JavaScript. Instead of trying to scrape the dynamic content,
   * we use a curated list of known HIG sections and URLs that are stable.
   */
  async discoverSections(): Promise<HIGSection[]> {
    const cacheKey = 'hig:sections:all';
    
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(cacheKey);
    if (cached) {
      return cached;
    }

    console.log('[HIGScraper] Loading known HIG sections...');
    
    // Curated list of stable Apple HIG sections
    // These URLs are well-established and unlikely to change frequently
    const knownSections: Omit<HIGSection, 'id' | 'lastUpdated'>[] = [
      // iOS Guidelines
      { title: 'iOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/ios', platform: 'iOS', category: 'foundations' },
      { title: 'iOS Accessibility', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility', platform: 'iOS', category: 'foundations' },
      { title: 'iOS App Icons', url: 'https://developer.apple.com/design/human-interface-guidelines/app-icons', platform: 'iOS', category: 'icons-and-images' },
      { title: 'iOS Color', url: 'https://developer.apple.com/design/human-interface-guidelines/color', platform: 'iOS', category: 'color-and-materials' },
      { title: 'iOS Typography', url: 'https://developer.apple.com/design/human-interface-guidelines/typography', platform: 'iOS', category: 'typography' },
      { title: 'iOS Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', platform: 'iOS', category: 'layout' },
      { title: 'iOS Navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/ios/app-architecture/navigation', platform: 'iOS', category: 'navigation' },
      { title: 'iOS Buttons', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons', platform: 'iOS', category: 'visual-design' },
      
      // macOS Guidelines
      { title: 'macOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/macos', platform: 'macOS', category: 'foundations' },
      { title: 'macOS Windows', url: 'https://developer.apple.com/design/human-interface-guidelines/windows', platform: 'macOS', category: 'layout' },
      { title: 'macOS Menus', url: 'https://developer.apple.com/design/human-interface-guidelines/menus', platform: 'macOS', category: 'navigation' },
      
      // watchOS Guidelines  
      { title: 'watchOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/watchos', platform: 'watchOS', category: 'foundations' },
      { title: 'watchOS Complications', url: 'https://developer.apple.com/design/human-interface-guidelines/complications', platform: 'watchOS', category: 'visual-design' },
      
      // tvOS Guidelines
      { title: 'tvOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/tvos', platform: 'tvOS', category: 'foundations' },
      { title: 'tvOS Focus and Selection', url: 'https://developer.apple.com/design/human-interface-guidelines/focus-and-selection', platform: 'tvOS', category: 'selection-and-input' },
      
      // visionOS Guidelines
      { title: 'visionOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/visionos', platform: 'visionOS', category: 'foundations' },
      { title: 'visionOS Spatial Design', url: 'https://developer.apple.com/design/human-interface-guidelines/spatial-design', platform: 'visionOS', category: 'layout' },
      
      // Universal Guidelines
      { title: 'Design Principles', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-ios', platform: 'universal', category: 'foundations' },
      { title: 'Privacy', url: 'https://developer.apple.com/design/human-interface-guidelines/privacy', platform: 'universal', category: 'system-capabilities' },
      { title: 'Inclusion', url: 'https://developer.apple.com/design/human-interface-guidelines/inclusion', platform: 'universal', category: 'foundations' },
      
      // Liquid Glass and Modern Design
      { title: 'Materials', url: 'https://developer.apple.com/design/human-interface-guidelines/materials', platform: 'universal', category: 'color-and-materials' },
      { title: 'Visual Effects', url: 'https://developer.apple.com/design/human-interface-guidelines/visual-effects', platform: 'universal', category: 'visual-design' }
    ];

    // Convert to full HIGSection objects
    const sections: HIGSection[] = knownSections.map(section => ({
      ...section,
      id: this.generateId(section.title, section.platform),
      lastUpdated: new Date()
    }));

    // Verify accessibility of a few key URLs to ensure the base URLs are still valid
    try {
      const testUrl = 'https://developer.apple.com/design/human-interface-guidelines/ios';
      await this.makeRequest(testUrl);
      console.log('[HIGScraper] Apple HIG website is accessible');
    } catch (error) {
      console.warn('[HIGScraper] Warning: Could not verify Apple HIG website accessibility:', error);
      // Continue anyway with cached/known sections
    }

    // Cache for 4 hours
    this.cache.set(cacheKey, sections, 14400);
    console.log(`[HIGScraper] Loaded ${sections.length} known HIG sections`);
    
    return sections;
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