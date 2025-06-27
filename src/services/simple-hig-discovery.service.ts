/**
 * Simple HIG Discovery Service
 * 
 * Fast, reliable discovery of Apple HIG sections using simple HTTP requests
 * and HTML parsing instead of complex browser automation.
 */

import type { HIGSection, ApplePlatform, HIGCategory } from '../types.js';
import type { HIGCache } from '../cache.js';

export interface DiscoveredLink {
  url: string;
  title: string;
  platform: ApplePlatform;
  category: HIGCategory;
}

export class SimpleHIGDiscoveryService {
  private cache: HIGCache;
  private readonly baseUrl = 'https://developer.apple.com/design/human-interface-guidelines';
  private readonly cacheKey = 'hig:simple:discovery:sections';
  private readonly cacheTTL = 14400; // 4 hours

  constructor(cache: HIGCache) {
    this.cache = cache;
  }

  /**
   * Discover all HIG sections by parsing the main HIG pages
   */
  async discoverSections(): Promise<HIGSection[]> {
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(this.cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[SimpleDiscovery] Using cached sections: ${cached.length} sections`);
      return cached;
    }

    console.log('[SimpleDiscovery] Starting fast HIG section discovery...');
    
    try {
      const discoveredSections: HIGSection[] = [];
      
      // Discover sections from main platform pages
      const platformPages = [
        { url: `${this.baseUrl}`, platform: 'universal' },
        { url: `${this.baseUrl}/platforms/ios`, platform: 'iOS' },
        { url: `${this.baseUrl}/platforms/macos`, platform: 'macOS' },
        { url: `${this.baseUrl}/platforms/watchos`, platform: 'watchOS' },
        { url: `${this.baseUrl}/platforms/tvos`, platform: 'tvOS' },
        { url: `${this.baseUrl}/platforms/visionos`, platform: 'visionOS' }
      ];

      for (const platformPage of platformPages) {
        try {
          console.log(`[SimpleDiscovery] Discovering sections for ${platformPage.platform}...`);
          const platformSections = await this.discoverSectionsFromPage(
            platformPage.url, 
            platformPage.platform as ApplePlatform
          );
          discoveredSections.push(...platformSections);
          
          // Rate limiting - be respectful
          await this.delay(1000);
        } catch (error) {
          console.warn(`[SimpleDiscovery] Failed to discover from ${platformPage.platform}:`, error);
        }
      }

      // Remove duplicates based on URL
      const uniqueSections = this.removeDuplicates(discoveredSections);
      
      console.log(`[SimpleDiscovery] Discovered ${uniqueSections.length} unique sections`);
      
      // Cache the results
      this.cache.set(this.cacheKey, uniqueSections, this.cacheTTL);
      
      return uniqueSections;

    } catch (error) {
      console.error('[SimpleDiscovery] Discovery failed:', error);
      // Return empty array rather than throwing - let fallback handle it
      return [];
    }
  }

  /**
   * Discover sections from a specific platform page
   */
  private async discoverSectionsFromPage(pageUrl: string, platform: ApplePlatform): Promise<HIGSection[]> {
    try {
      console.log(`[SimpleDiscovery] Fetching ${pageUrl}...`);
      
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: globalThis.AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const sections = this.parseHIGLinksFromHTML(html, platform);
      
      console.log(`[SimpleDiscovery] Found ${sections.length} sections on ${platform} page`);
      return sections;

    } catch (error) {
      console.warn(`[SimpleDiscovery] Failed to fetch ${pageUrl}:`, error);
      return [];
    }
  }

  /**
   * Parse HIG section links from HTML content
   */
  private parseHIGLinksFromHTML(html: string, platform: ApplePlatform): HIGSection[] {
    const sections: HIGSection[] = [];
    
    try {
      // Look for links that match HIG section patterns
      const linkPattern = /href="([^"]*\/human-interface-guidelines\/[^"]*)"[^>]*>([^<]+)</g;
      let match;

      while ((match = linkPattern.exec(html)) !== null) {
        const [, url, title] = match;
        
        // Clean up the URL - make it absolute if relative
        const cleanUrl = url.startsWith('http') ? url : `https://developer.apple.com${url}`;
        
        // Skip certain URLs we don't want
        if (this.shouldSkipUrl(cleanUrl)) {
          continue;
        }

        // Extract section info
        const section = this.createSectionFromUrl(cleanUrl, title.trim(), platform);
        if (section) {
          sections.push(section);
        }
      }

      // Also look for navigation items and section lists
      const navPattern = /<nav[^>]*>[\s\S]*?<\/nav>/gi;
      const navMatches = html.match(navPattern);
      
      if (navMatches) {
        for (const navHtml of navMatches) {
          const navSections = this.parseHIGLinksFromHTML(navHtml, platform);
          sections.push(...navSections);
        }
      }

    } catch (error) {
      console.warn('[SimpleDiscovery] HTML parsing error:', error);
    }

    return sections;
  }

  /**
   * Create a HIGSection from a URL and title
   */
  private createSectionFromUrl(url: string, title: string, platform: ApplePlatform): HIGSection | null {
    try {
      // Extract the section path from URL
      const urlMatch = url.match(/\/human-interface-guidelines\/(.+)$/);
      if (!urlMatch) {
        return null;
      }

      const pathPart = urlMatch[1];
      
      // Determine category from URL path or title
      const category = this.inferCategoryFromPath(pathPart, title);
      
      // Generate ID
      const id = this.generateSectionId(pathPart, platform);

      return {
        id,
        title,
        url,
        platform,
        category,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.warn(`[SimpleDiscovery] Failed to create section from ${url}:`, error);
      return null;
    }
  }

  /**
   * Infer category from URL path and title
   */
  private inferCategoryFromPath(path: string, title: string): HIGCategory {
    const pathLower = path.toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Category mapping based on common patterns
    if (pathLower.includes('color') || titleLower.includes('color')) return 'color-and-materials';
    if (pathLower.includes('typography') || titleLower.includes('typography')) return 'typography';
    if (pathLower.includes('layout') || titleLower.includes('layout')) return 'layout';
    if (pathLower.includes('accessibility') || titleLower.includes('accessibility')) return 'foundations';
    if (pathLower.includes('button') || titleLower.includes('button')) return 'visual-design';
    if (pathLower.includes('navigation') || titleLower.includes('navigation')) return 'navigation';
    if (pathLower.includes('alert') || pathLower.includes('sheet') || titleLower.includes('alert')) return 'presentation';
    if (pathLower.includes('text') || pathLower.includes('field') || titleLower.includes('input')) return 'selection-and-input';
    if (pathLower.includes('icon') || titleLower.includes('icon')) return 'icons-and-images';
    if (pathLower.includes('motion') || titleLower.includes('animation')) return 'motion';
    
    // Default fallback
    return 'foundations';
  }

  /**
   * Generate a unique section ID
   */
  private generateSectionId(path: string, platform: ApplePlatform): string {
    const cleanPath = path
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase();
    
    return `${cleanPath}-${platform.toLowerCase()}`;
  }

  /**
   * Check if we should skip this URL
   */
  private shouldSkipUrl(url: string): boolean {
    const skipPatterns = [
      '/whats-new',
      '/changelog',
      '#',
      'javascript:',
      'mailto:',
      '/platforms/', // Skip platform landing pages
      '/design/human-interface-guidelines/$', // Skip root page
      '/design/human-interface-guidelines$' // Skip root page
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Remove duplicate sections based on URL
   */
  private removeDuplicates(sections: HIGSection[]): HIGSection[] {
    const seen = new Set<string>();
    return sections.filter(section => {
      if (seen.has(section.url)) {
        return false;
      }
      seen.add(section.url);
      return true;
    });
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}