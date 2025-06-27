/**
 * Comprehensive HIG Discovery Service
 * 
 * Dynamic discovery service that combines multiple strategies:
 * 1. Known Apple HIG URL patterns and structures
 * 2. HTTP-based discovery when network allows
 * 3. Comprehensive fallback based on Apple's documented HIG structure
 * 
 * This ensures we capture 100+ sections across all Apple platforms.
 */

import type { HIGSection, ApplePlatform, HIGCategory } from '../types.js';
import type { HIGCache } from '../cache.js';

export class ComprehensiveHIGDiscoveryService {
  private cache: HIGCache;
  private readonly baseUrl = 'https://developer.apple.com/design/human-interface-guidelines';
  private readonly cacheKey = 'hig:comprehensive:discovery:sections';
  private readonly cacheTTL = 14400; // 4 hours

  constructor(cache: HIGCache) {
    this.cache = cache;
  }

  /**
   * Discover all HIG sections using comprehensive approach
   */
  async discoverSections(): Promise<HIGSection[]> {
    console.log('[ComprehensiveDiscovery] Starting comprehensive HIG section discovery...');
    
    // Check cache first
    const cached = this.cache.get<HIGSection[]>(this.cacheKey);
    if (cached && cached.length > 50) { // Expect 50+ sections minimum
      console.log(`[ComprehensiveDiscovery] Using cached sections: ${cached.length} sections`);
      return cached;
    }

    const discoveredSections: HIGSection[] = [];

    // Strategy 1: Use known comprehensive HIG structure
    console.log('[ComprehensiveDiscovery] Building sections from known HIG structure...');
    const knownSections = this.buildComprehensiveKnownSections();
    discoveredSections.push(...knownSections);

    // Strategy 2: Try HTTP discovery for additional sections (with timeout protection)
    console.log('[ComprehensiveDiscovery] Attempting HTTP-based discovery...');
    try {
      const httpSections = await Promise.race([
        this.tryHttpDiscovery(),
        new Promise<HIGSection[]>((_, reject) => 
          setTimeout(() => reject(new Error('HTTP discovery timeout')), 10000)
        )
      ]);
      
      // Merge unique sections from HTTP discovery
      for (const httpSection of httpSections) {
        if (!discoveredSections.some(s => s.url === httpSection.url)) {
          discoveredSections.push(httpSection);
        }
      }
      console.log(`[ComprehensiveDiscovery] HTTP discovery added ${httpSections.length} additional sections`);
    } catch (error) {
      console.log(`[ComprehensiveDiscovery] HTTP discovery failed, using known sections only: ${error}`);
    }

    // Remove duplicates and validate
    const uniqueSections = this.removeDuplicates(discoveredSections);
    console.log(`[ComprehensiveDiscovery] Discovery completed: ${uniqueSections.length} total sections`);
    
    // Cache the results
    this.cache.set(this.cacheKey, uniqueSections, this.cacheTTL);
    
    return uniqueSections;
  }

  /**
   * Build comprehensive list of known HIG sections based on Apple's documented structure
   */
  private buildComprehensiveKnownSections(): HIGSection[] {
    const sections: HIGSection[] = [];

    // Universal/Cross-platform sections (foundations)
    const universalFoundations = [
      'accessibility', 'inclusion', 'privacy', 'branding'
    ];

    const universalLayout = [
      'layout', 'spatial-layout', 'typography', 'color', 'icons', 'images', 'motion'
    ];

    const universalInteraction = [
      'inputs', 'gestures', 'feedback', 'loading', 'onboarding', 'launching'
    ];

    const universalNavigation = [
      'navigation-and-search', 'searching', 'modality'
    ];

    const universalPresentation = [
      'alerts', 'action-sheets', 'activity-views', 'sheets', 'popovers'
    ];

    const universalComponents = [
      'buttons', 'menus', 'toolbars', 'tab-bars', 'navigation-bars', 'sliders', 
      'steppers', 'toggles', 'pickers', 'progress-indicators', 'labels', 
      'text-fields', 'text-views', 'lists-and-tables', 'collections', 'scroll-views',
      'split-views', 'boxes', 'gauges', 'charts', 'rating-indicators'
    ];

    const universalTechnologies = [
      'app-clips', 'app-shortcuts', 'apple-pay', 'carplay', 'healthkit', 'homekit',
      'icloud', 'in-app-purchase', 'machine-learning', 'maps', 'nfc', 'siri',
      'wallet', 'augmented-reality', 'game-center', 'live-activities', 
      'live-photos', 'notifications', 'shareplay', 'sign-in-with-apple',
      'tap-to-pay-on-iphone', 'widgets'
    ];

    // Add universal sections
    this.addSectionsForPlatform(sections, 'universal', universalFoundations, 'foundations');
    this.addSectionsForPlatform(sections, 'universal', universalLayout, 'layout');
    this.addSectionsForPlatform(sections, 'universal', universalInteraction, 'selection-and-input');
    this.addSectionsForPlatform(sections, 'universal', universalNavigation, 'navigation');
    this.addSectionsForPlatform(sections, 'universal', universalPresentation, 'presentation');
    this.addSectionsForPlatform(sections, 'universal', universalComponents, 'visual-design');
    this.addSectionsForPlatform(sections, 'universal', universalTechnologies, 'technologies');

    // iOS-specific sections
    const iosSpecific = [
      'designing-for-ios', 'app-icons', 'home-screen-quick-actions', 
      'multitasking', 'requesting-permission', 'settings'
    ];
    this.addSectionsForPlatform(sections, 'iOS', iosSpecific, 'foundations');

    // macOS-specific sections  
    const macosSpecific = [
      'designing-for-macos', 'the-menu-bar', 'dock-menus', 'column-views',
      'outline-views', 'combo-boxes', 'disclosure-controls', 'image-wells',
      'path-controls', 'pop-up-buttons', 'pull-down-buttons', 'token-fields',
      'color-wells', 'panels', 'going-full-screen', 'printing'
    ];
    this.addSectionsForPlatform(sections, 'macOS', macosSpecific, 'foundations');

    // watchOS-specific sections
    const watchosSpecific = [
      'designing-for-watchos', 'complications', 'watch-faces', 'digital-crown',
      'digit-entry-views', 'always-on', 'workouts'
    ];
    this.addSectionsForPlatform(sections, 'watchOS', watchosSpecific, 'foundations');

    // tvOS-specific sections
    const tvosSpecific = [
      'designing-for-tvos', 'focus-and-selection', 'remotes', 'top-shelf'
    ];
    this.addSectionsForPlatform(sections, 'tvOS', tvosSpecific, 'foundations');

    // visionOS-specific sections
    const visionosSpecific = [
      'designing-for-visionos', 'immersive-experiences', 'spatial-layout',
      'eyes', 'ornaments', 'materials'
    ];
    this.addSectionsForPlatform(sections, 'visionOS', visionosSpecific, 'foundations');

    // Add platform overview pages
    const platforms = ['ios', 'macos', 'watchos', 'tvos', 'visionos'];
    for (const platform of platforms) {
      sections.push({
        id: `${platform}-overview`,
        title: `Designing for ${platform}`,
        url: `${this.baseUrl}/${platform === 'ios' ? 'platforms/ios' : platform === 'macos' ? 'platforms/macos' : platform === 'watchos' ? 'platforms/watchos' : platform === 'tvos' ? 'platforms/tvos' : 'platforms/visionos'}`,
        platform: this.normalizePlatform(platform),
        category: 'foundations' as HIGCategory,
        lastUpdated: new Date()
      });
    }

    return sections;
  }

  /**
   * Helper to add sections for a specific platform
   */
  private addSectionsForPlatform(
    sections: HIGSection[], 
    platform: string, 
    sectionNames: string[], 
    category: HIGCategory
  ): void {
    for (const sectionName of sectionNames) {
      sections.push({
        id: `${sectionName}-${platform.toLowerCase()}`,
        title: this.formatTitle(sectionName),
        url: `${this.baseUrl}/${sectionName}`,
        platform: this.normalizePlatform(platform),
        category,
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Try HTTP-based discovery as supplementary strategy
   */
  private async tryHttpDiscovery(): Promise<HIGSection[]> {
    const sections: HIGSection[] = [];
    
    const platformPages = [
      { url: `${this.baseUrl}`, platform: 'universal' },
      { url: `${this.baseUrl}/platforms/ios`, platform: 'iOS' },
      { url: `${this.baseUrl}/platforms/macos`, platform: 'macOS' }
    ];

    for (const platformPage of platformPages) {
      try {
        const response = await fetch(platformPage.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: globalThis.AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const html = await response.text();
          const discoveredSections = this.parseLinksFromHTML(html, platformPage.platform as ApplePlatform);
          sections.push(...discoveredSections);
        }
      } catch (error) {
        console.warn(`[ComprehensiveDiscovery] Failed to fetch ${platformPage.platform}: ${error}`);
      }
    }

    return sections;
  }

  /**
   * Parse links from HTML (simplified version)
   */
  private parseLinksFromHTML(html: string, platform: ApplePlatform): HIGSection[] {
    const sections: HIGSection[] = [];
    const linkPattern = /href="([^"]*\/human-interface-guidelines\/[^"]*)"[^>]*>([^<]+)/g;
    
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const [, url, title] = match;
      const cleanUrl = url.startsWith('http') ? url : `https://developer.apple.com${url}`;
      
      if (!this.shouldSkipUrl(cleanUrl) && title && title.trim()) {
        const section = this.createSection(cleanUrl, title.trim(), platform);
        if (section) {
          sections.push(section);
        }
      }
    }

    return sections;
  }

  /**
   * Create a HIGSection from URL and title
   */
  private createSection(url: string, title: string, platform: ApplePlatform): HIGSection | null {
    try {
      const urlMatch = url.match(/\/human-interface-guidelines\/(.+)$/);
      if (!urlMatch) return null;

      const pathPart = urlMatch[1];
      const category = this.inferCategory(pathPart, title);
      const id = `${pathPart.replace(/[^a-z0-9]/gi, '-')}-${platform.toLowerCase()}`;

      return {
        id,
        title: this.formatTitle(title),
        url,
        platform,
        category,
        lastUpdated: new Date()
      };
    } catch {
      return null;
    }
  }

  /**
   * Infer category from path and title
   */
  private inferCategory(path: string, title: string): HIGCategory {
    const combined = (path + ' ' + title).toLowerCase();
    
    if (combined.includes('color') || combined.includes('material')) return 'color-and-materials';
    if (combined.includes('typography') || combined.includes('font')) return 'typography';
    if (combined.includes('layout') || combined.includes('spatial')) return 'layout';
    if (combined.includes('accessibility') || combined.includes('inclusion')) return 'foundations';
    if (combined.includes('button') || combined.includes('control') || combined.includes('visual')) return 'visual-design';
    if (combined.includes('navigation') || combined.includes('menu') || combined.includes('tab')) return 'navigation';
    if (combined.includes('alert') || combined.includes('sheet') || combined.includes('modal')) return 'presentation';
    if (combined.includes('text') || combined.includes('input') || combined.includes('field')) return 'selection-and-input';
    if (combined.includes('icon') || combined.includes('image') || combined.includes('symbol')) return 'icons-and-images';
    if (combined.includes('motion') || combined.includes('animation')) return 'motion';
    if (combined.includes('app') || combined.includes('technology') || combined.includes('api')) return 'technologies';
    
    return 'foundations';
  }

  /**
   * Normalize platform names
   */
  private normalizePlatform(platform: string): ApplePlatform {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'ios': return 'iOS';
      case 'macos': return 'macOS';
      case 'watchos': return 'watchOS';
      case 'tvos': return 'tvOS';
      case 'visionos': return 'visionOS';
      default: return 'universal';
    }
  }

  /**
   * Format titles consistently
   */
  private formatTitle(title: string): string {
    return title
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if URL should be skipped
   */
  private shouldSkipUrl(url: string): boolean {
    const skipPatterns = [
      '/whats-new', '/changelog', '#', 'javascript:', 'mailto:',
      '/platforms/', '/design/human-interface-guidelines/$',
      '/design/human-interface-guidelines$'
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Remove duplicate sections
   */
  private removeDuplicates(sections: HIGSection[]): HIGSection[] {
    const seen = new Set<string>();
    return sections.filter(section => {
      const key = `${section.url}-${section.platform}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}