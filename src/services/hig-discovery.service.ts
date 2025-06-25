/**
 * HIGDiscoveryService
 * 
 * Dynamically discovers all available Apple Human Interface Guidelines sections
 * using Crawlee's PlaywrightCrawler to navigate Apple's SPA-based HIG website.
 * 
 * Replaces the static knownSections array with dynamic discovery capability.
 */

import { PlaywrightCrawler, Dataset } from '@crawlee/playwright';
import { HIGSection, ApplePlatform, HIGCategory } from '../types.js';
import { HIGCache } from '../cache.js';

export interface DiscoveredLink {
  url: string;
  title: string;
  platform: ApplePlatform;
  category: HIGCategory;
  depth: number;
}

export interface DiscoveryConfig {
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
  respectfulDelay: number;
  cacheKey: string;
  cacheTTL: number;
}

export class HIGDiscoveryService {
  private cache: HIGCache;
  private config: DiscoveryConfig;
  private discoveredSections: Map<string, HIGSection> = new Map();
  private processedUrls: Set<string> = new Set();

  constructor(cache: HIGCache) {
    this.cache = cache;
    this.config = {
      baseUrl: 'https://developer.apple.com/design/human-interface-guidelines',
      maxDepth: 3,
      maxPages: 200,
      respectfulDelay: 2000,
      cacheKey: 'hig:discovery:sections',
      cacheTTL: 14400 // 4 hours
    };
  }

  /**
   * Discover all HIG sections dynamically from Apple's website
   */
  async discoverSections(): Promise<HIGSection[]> {
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(this.config.cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[HIGDiscovery] Using cached sections: ${cached.length} sections`);
      return cached;
    }

    console.log('[HIGDiscovery] Starting dynamic section discovery...');
    
    try {
      // Reset state
      this.discoveredSections.clear();
      this.processedUrls.clear();

      // Create dataset for storing discovered links
      const dataset = await Dataset.open('hig-discovered-links');
      await dataset.drop();

      // Configure Crawlee crawler
      const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page, request, enqueueLinks }) => {
          await this.handlePageRequest(page, request, enqueueLinks, dataset);
        },
        
        // Respectful crawling configuration
        maxRequestsPerCrawl: this.config.maxPages,
        maxConcurrency: 2, // Conservative for Apple
        
        // Browser configuration
        launchContext: {
          launchOptions: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu'
            ]
          }
        },
        
        // Error handling
        failedRequestHandler: async ({ request, error }) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`[HIGDiscovery] Failed to process ${request.url}: ${errorMessage}`);
        }
      });

      // Start crawling from HIG root
      await crawler.run([{ url: this.config.baseUrl }]);

      // Convert discovered sections to array
      const sections = Array.from(this.discoveredSections.values());
      
      // Cache the results
      this.cache.set(this.config.cacheKey, sections, this.config.cacheTTL);
      
      console.log(`[HIGDiscovery] Discovery completed: ${sections.length} sections found`);
      this.logDiscoveryStats(sections);
      
      return sections;

    } catch (error) {
      console.error('[HIGDiscovery] Discovery failed:', error);
      
      // Return fallback known sections if discovery fails
      return this.getFallbackSections();
    }
  }

  /**
   * Handle each page during crawling
   */
  private async handlePageRequest(page: any, request: any, enqueueLinks: any, dataset: any): Promise<void> {
    console.log(`[HIGDiscovery] Processing: ${request.url}`);
    
    // Wait for the SPA to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Extract the page title
    const pageTitle = await page.title();
    console.log(`[HIGDiscovery] Page title: ${pageTitle}`);

    // Look for navigation elements and content links
    await this.extractNavigationLinks(page, request, enqueueLinks, dataset);
    
    // Extract main content area links
    await this.extractContentLinks(page, request, dataset);
    
    // Create HIGSection for current page if it's a guidelines page
    await this.createSectionFromPage(page, request);
  }

  /**
   * Extract navigation links from the page
   */
  private async extractNavigationLinks(page: any, request: any, enqueueLinks: any, dataset: any): Promise<void> {
    // Look for various navigation selectors Apple might use
    const navigationSelectors = [
      'nav a[href*="/design/human-interface-guidelines"]',
      '.navigation a[href*="/design/human-interface-guidelines"]',
      '.sidebar a[href*="/design/human-interface-guidelines"]',
      '.menu a[href*="/design/human-interface-guidelines"]',
      '.toc a[href*="/design/human-interface-guidelines"]',
      '[data-testid="navigation"] a',
      '[role="navigation"] a',
      '.hig-nav a', // Apple-specific class names
      '.design-nav a'
    ];

    for (const selector of navigationSelectors) {
      try {
        const links = await page.$$eval(selector, (elements: any[]) => {
          return elements.map(el => ({
            href: el.href,
            text: el.textContent?.trim() || '',
            title: el.title || '',
            className: el.className || ''
          }));
        });

        for (const link of links) {
          await this.processDiscoveredLink(link, request, dataset);
        }

        if (links.length > 0) {
          console.log(`[HIGDiscovery] Found ${links.length} links with selector: ${selector}`);
        }
      } catch (error) {
        // Selector not found, continue with next one
      }
    }

    // Enqueue links for further crawling
    await enqueueLinks({
      selector: 'a[href*="/design/human-interface-guidelines"]',
      globs: ['**/design/human-interface-guidelines/**'],
      exclude: [
        '**/api/**',
        '**/downloads/**', 
        '**/videos/**',
        '**/sample-code/**'
      ]
    });
  }

  /**
   * Extract content area links
   */
  private async extractContentLinks(page: any, request: any, dataset: any): Promise<void> {
    const contentSelectors = [
      'main a[href*="/design/human-interface-guidelines"]',
      '.content a[href*="/design/human-interface-guidelines"]',
      '.article a[href*="/design/human-interface-guidelines"]',
      '[role="main"] a[href*="/design/human-interface-guidelines"]'
    ];

    for (const selector of contentSelectors) {
      try {
        const links = await page.$$eval(selector, (elements: any[]) => {
          return elements.map(el => ({
            href: el.href,
            text: el.textContent?.trim() || '',
            title: el.title || ''
          }));
        });

        for (const link of links) {
          await this.processDiscoveredLink(link, request, dataset);
        }
      } catch (error) {
        // Selector not found, continue
      }
    }
  }

  /**
   * Process a discovered link and add it to our dataset
   */
  private async processDiscoveredLink(link: any, request: any, dataset: any): Promise<void> {
    if (!link.href || this.processedUrls.has(link.href)) {
      return;
    }

    // Validate URL
    if (!this.isValidHIGUrl(link.href)) {
      return;
    }

    this.processedUrls.add(link.href);

    // Extract platform and category from URL and text
    const platform = this.extractPlatform(link.href, link.text);
    const category = this.extractCategory(link.href, link.text);
    const title = this.cleanTitle(link.text || link.title);

    if (title) {
      const discoveredLink: DiscoveredLink = {
        url: link.href,
        title,
        platform,
        category,
        depth: this.calculateDepth(link.href)
      };

      await dataset.pushData(discoveredLink);
      console.log(`[HIGDiscovery] Discovered: ${title} (${platform}/${category})`);
    }
  }

  /**
   * Create HIGSection from current page
   */
  private async createSectionFromPage(page: any, request: any): Promise<void> {
    try {
      const url = request.url;
      const title = await this.extractPageTitle(page);
      
      if (!title || this.discoveredSections.has(url)) {
        return;
      }

      const platform = this.extractPlatform(url, title);
      const category = this.extractCategory(url, title);
      const id = this.generateId(title, platform);

      const section: HIGSection = {
        id,
        title,
        url,
        platform,
        category,
        lastUpdated: new Date()
      };

      this.discoveredSections.set(url, section);
      console.log(`[HIGDiscovery] Created section: ${title}`);

    } catch (error) {
      console.warn(`[HIGDiscovery] Failed to create section from ${request.url}:`, error);
    }
  }

  /**
   * Extract page title from various possible sources
   */
  private async extractPageTitle(page: any): Promise<string> {
    const titleSelectors = [
      'h1',
      '.page-title',
      '.article-title', 
      '[data-testid="page-title"]',
      'title'
    ];

    for (const selector of titleSelectors) {
      try {
        const title = await page.$eval(selector, (el: any) => el.textContent?.trim());
        if (title && title.length > 0 && title !== 'Human Interface Guidelines') {
          return this.cleanTitle(title);
        }
      } catch (error) {
        // Selector not found, try next
      }
    }

    return '';
  }

  /**
   * Validate if URL is a valid HIG URL
   */
  private isValidHIGUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Must be from Apple's domain
      if (!urlObj.hostname.includes('apple.com')) {
        return false;
      }

      // Must be HIG path
      if (!urlObj.pathname.includes('/design/human-interface-guidelines')) {
        return false;
      }

      // Exclude non-guideline URLs
      const excludePatterns = [
        '/api/',
        '/downloads/',
        '/videos/',
        '/sample-code/',
        '.zip',
        '.pdf',
        '.dmg',
        '#'
      ];

      return !excludePatterns.some(pattern => url.includes(pattern));

    } catch (error) {
      return false;
    }
  }

  /**
   * Extract platform from URL and text
   */
  private extractPlatform(url: string, text: string): ApplePlatform {
    const combined = (url + ' ' + text).toLowerCase();
    
    if (combined.includes('ios')) return 'iOS';
    if (combined.includes('macos')) return 'macOS';
    if (combined.includes('watchos')) return 'watchOS';
    if (combined.includes('tvos')) return 'tvOS';
    if (combined.includes('visionos')) return 'visionOS';
    
    return 'universal';
  }

  /**
   * Extract category from URL and text
   */
  private extractCategory(url: string, text: string): HIGCategory {
    const combined = (url + ' ' + text).toLowerCase();
    
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
   * Clean and normalize title text
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/^(iOS|macOS|watchOS|tvOS|visionOS)\s+/i, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .trim();
  }

  /**
   * Calculate URL depth for crawling control
   */
  private calculateDepth(url: string): number {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
      return pathSegments.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate unique ID for section
   */
  private generateId(title: string, platform: ApplePlatform): string {
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${platform.toLowerCase()}-${cleanTitle}`;
  }

  /**
   * Log discovery statistics
   */
  private logDiscoveryStats(sections: HIGSection[]): void {
    const platformCounts = sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = sections.reduce((acc, section) => {
      acc[section.category] = (acc[section.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('[HIGDiscovery] Discovery Statistics:');
    console.log('  Platforms:', platformCounts);
    console.log('  Categories:', categoryCounts);
  }

  /**
   * Fallback to known sections if discovery fails
   */
  private getFallbackSections(): HIGSection[] {
    console.warn('[HIGDiscovery] Using fallback known sections');
    
    // Return a minimal set of core sections as fallback
    const fallbackSections = [
      { title: 'iOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/ios', platform: 'iOS' as ApplePlatform, category: 'foundations' as HIGCategory },
      { title: 'iOS Buttons', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons', platform: 'iOS' as ApplePlatform, category: 'visual-design' as HIGCategory },
      { title: 'iOS Navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars', platform: 'iOS' as ApplePlatform, category: 'navigation' as HIGCategory },
      { title: 'macOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/macos', platform: 'macOS' as ApplePlatform, category: 'foundations' as HIGCategory },
      { title: 'visionOS Overview', url: 'https://developer.apple.com/design/human-interface-guidelines/visionos', platform: 'visionOS' as ApplePlatform, category: 'foundations' as HIGCategory }
    ];

    return fallbackSections.map(section => ({
      ...section,
      id: this.generateId(section.title, section.platform),
      lastUpdated: new Date()
    }));
  }
}