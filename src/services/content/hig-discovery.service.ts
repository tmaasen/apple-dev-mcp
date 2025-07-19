/**
 * HIG Discovery Service
 * 
 * Comprehensive discovery service that identifies all Apple HIG sections
 * across all platforms using known URL patterns and structures.
 */

import type { HIGSection, ApplePlatform, HIGCategory } from '../../types.js';

export class ContentHIGDiscoveryService {
  private readonly baseUrl = 'https://developer.apple.com/design/human-interface-guidelines';

  /**
   * Discover all HIG sections using comprehensive known structure
   */
  async discoverSections(): Promise<HIGSection[]> {
    console.log('🔍 Discovering HIG sections...');
    
    const discoveredSections: HIGSection[] = [];

    // Universal/Cross-platform sections
    discoveredSections.push(...this.getUniversalSections());
    
    // Platform-specific sections
    discoveredSections.push(...this.getPlatformSpecificSections());
    
    console.log(`📋 Discovered ${discoveredSections.length} HIG sections`);
    
    return discoveredSections;
  }

  private getUniversalSections(): HIGSection[] {
    const sections: HIGSection[] = [];

    // Foundations
    const foundations = [
      'accessibility', 'inclusion', 'privacy', 'branding'
    ];
    this.addSections(sections, 'universal', foundations, 'foundations');

    // Layout & Design
    const layout = [
      'layout', 'spatial-layout', 'typography', 'color', 'icons', 'images', 'motion', 'materials'
    ];
    this.addSections(sections, 'universal', layout, 'layout');

    // Interaction
    const interaction = [
      'inputs', 'gestures', 'feedback', 'loading', 'onboarding', 'launching'
    ];
    this.addSections(sections, 'universal', interaction, 'selection-and-input');

    // Navigation
    const navigation = [
      'navigation-and-search', 'searching', 'modality'
    ];
    this.addSections(sections, 'universal', navigation, 'navigation');

    // Presentation
    const presentation = [
      'alerts', 'action-sheets', 'activity-views', 'sheets', 'popovers'
    ];
    this.addSections(sections, 'universal', presentation, 'presentation');

    // Visual Design Components
    const components = [
      'buttons', 'menus', 'toolbars', 'tab-bars', 'navigation-bars', 'sliders', 
      'steppers', 'toggles', 'pickers', 'progress-indicators', 'labels', 
      'text-fields', 'text-views', 'lists-and-tables', 'collections', 'scroll-views',
      'split-views', 'boxes', 'gauges', 'charts', 'rating-indicators',
      'segmented-controls', 'search-fields', 'sidebars'
    ];
    this.addSections(sections, 'universal', components, 'visual-design');

    // Technologies
    const technologies = [
      'app-clips', 'app-shortcuts', 'apple-pay', 'carplay', 'healthkit', 'homekit',
      'icloud', 'in-app-purchase', 'machine-learning', 'maps', 'nfc', 'siri',
      'wallet', 'augmented-reality', 'game-center', 'live-activities', 
      'live-photos', 'notifications', 'shareplay', 'sign-in-with-apple',
      'tap-to-pay-on-iphone', 'widgets', 'sf-symbols'
    ];
    this.addSections(sections, 'universal', technologies, 'technologies');

    return sections;
  }

  private getPlatformSpecificSections(): HIGSection[] {
    const sections: HIGSection[] = [];

    // iOS-specific sections
    const iosSpecific = [
      'designing-for-ios', 'app-icons', 'home-screen-quick-actions', 
      'multitasking', 'requesting-permission', 'settings'
    ];
    this.addSections(sections, 'iOS', iosSpecific, 'foundations');

    // macOS-specific sections  
    const macosSpecific = [
      'designing-for-macos', 'the-menu-bar', 'dock-menus', 'column-views',
      'outline-views', 'combo-boxes', 'disclosure-controls', 'image-wells',
      'path-controls', 'pop-up-buttons', 'pull-down-buttons', 'token-fields',
      'color-wells', 'panels', 'going-full-screen', 'printing', 'windows'
    ];
    this.addSections(sections, 'macOS', macosSpecific, 'foundations');

    // watchOS-specific sections
    const watchosSpecific = [
      'designing-for-watchos', 'complications', 'watch-faces', 'digital-crown',
      'digit-entry-views', 'always-on', 'workouts'
    ];
    this.addSections(sections, 'watchOS', watchosSpecific, 'foundations');

    // tvOS-specific sections
    const tvosSpecific = [
      'designing-for-tvos', 'focus-and-selection', 'remotes', 'top-shelf'
    ];
    this.addSections(sections, 'tvOS', tvosSpecific, 'foundations');

    // visionOS-specific sections
    const visionosSpecific = [
      'designing-for-visionos', 'eyes', 'immersive-experiences',
      'spatial-layout', 'materials', 'ornaments'
    ];
    this.addSections(sections, 'visionOS', visionosSpecific, 'foundations');

    return sections;
  }

  private addSections(
    sections: HIGSection[], 
    platform: ApplePlatform, 
    slugs: string[], 
    category: HIGCategory
  ): void {
    for (const slug of slugs) {
      sections.push({
        id: `${platform.toLowerCase()}-${slug}`,
        title: this.slugToTitle(slug),
        url: `${this.baseUrl}/${slug}`,
        platform,
        category,
        content: '', // Will be populated during scraping
        lastUpdated: new Date()
      });
    }
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get platform-specific content directory path
   */
  getPlatformDirectory(platform: ApplePlatform): string {
    const platformMap: Record<ApplePlatform, string> = {
      'iOS': 'ios',
      'macOS': 'macos', 
      'watchOS': 'watchos',
      'tvOS': 'tvos',
      'visionOS': 'visionos',
      'universal': 'universal'
    };
    
    return platformMap[platform] || 'universal';
  }

  /**
   * Generate filename for a section
   */
  generateFilename(section: HIGSection): string {
    const slug = section.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${slug}.md`;
  }
}