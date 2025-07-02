/**
 * Comprehensive Content Coverage Test Suite
 * Ensures all major HIG content is discoverable through search
 */

import { HIGStaticContentProvider } from '../static-content.js';
import { HIGToolProvider } from '../tools.js';
import { HIGCache } from '../cache.js';
import { HIGResourceProvider } from '../resources.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';

describe('Comprehensive Content Coverage Tests', () => {
  let staticProvider: HIGStaticContentProvider;
  let toolProvider: HIGToolProvider;

  beforeAll(async () => {
    staticProvider = new HIGStaticContentProvider();
    const cache = new HIGCache();
    const crawleeService = new CrawleeHIGService(cache);
    const resourceProvider = new HIGResourceProvider(crawleeService, cache, staticProvider);
    toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider, staticProvider);
    await staticProvider.initialize();
  });

  // Helper function to test search terms
  const testSearchTerm = async (term: string, expectedMinResults: number = 1, description?: string) => {
    const results = await toolProvider.searchGuidelines({ query: term, limit: 10 });
    expect(results.results.length).toBeGreaterThanOrEqual(expectedMinResults);
    
    if (results.results.length === 0) {
      console.error(`❌ No results for "${term}" ${description ? `(${description})` : ''}`);
    } else {
      console.log(`✅ "${term}": ${results.results.length} results - ${results.results[0].title}`);
    }
    
    return results;
  };

  describe('Foundation Components & Concepts', () => {
    test.each([
      // Core Design Foundations
      ['accessibility', 2, 'Universal design principles'],
      ['inclusion', 1, 'Inclusive design'],
      ['privacy', 1, 'Privacy guidelines'],
      ['color', 2, 'Color system'],
      ['typography', 2, 'Text and fonts'],
      ['layout', 2, 'Spatial organization'],
      ['materials', 1, 'Glass and blur effects'],
      ['motion', 1, 'Animation and transitions'],
      ['dark mode', 1, 'Appearance adaptation'],
      ['branding', 1, 'Apple branding guidelines'],
      
      // Typography Related
      ['san francisco font', 1, 'Apple system font'],
      ['dynamic type', 1, 'Scalable text'],
      ['text hierarchy', 1, 'Typography scale'],
      
      // Layout & Spacing
      ['grid system', 1, 'Layout grids'],
      ['spacing', 2, 'Layout spacing'],
      ['margins', 1, 'Content margins'],
      ['safe area', 1, 'Layout safe areas'],
    ])('should find results for foundation concept: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Navigation Components', () => {
    test.each([
      // Primary Navigation
      ['navigation bars', 1, 'Top navigation'],
      ['tab bars', 1, 'Bottom navigation'],
      ['sidebars', 1, 'Side navigation'],
      ['toolbars', 1, 'Tool organization'],
      ['menus', 1, 'Contextual menus'],
      ['context menus', 1, 'Right-click menus'],
      ['search fields', 1, 'Search interface'],
      
      // Navigation Patterns
      ['navigation hierarchy', 1, 'Nav structure'],
      ['breadcrumbs', 1, 'Navigation trail'],
      ['back button', 1, 'Navigation back'],
    ])('should find results for navigation: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Input Controls & Forms', () => {
    test.each([
      // Basic Controls
      ['buttons', 1, 'Action buttons'],
      ['text fields', 1, 'Text input'],
      ['text views', 1, 'Multi-line text'],
      ['pickers', 1, 'Value selection'],
      ['segmented controls', 1, 'Option selection'],
      ['sliders', 1, 'Value adjustment'],
      ['toggles', 1, 'Binary controls'],
      ['switches', 1, 'Toggle controls'],
      ['steppers', 1, 'Incremental input'],
      
      // Form Concepts
      ['form validation', 1, 'Input validation'],
      ['error messages', 1, 'Error feedback'],
      ['placeholder text', 1, 'Input hints'],
      ['required fields', 1, 'Mandatory input'],
      
      // Button Types
      ['primary button', 1, 'Main action button'],
      ['secondary button', 1, 'Secondary actions'],
      ['destructive button', 1, 'Dangerous actions'],
      ['call to action', 1, 'CTA buttons'],
    ])('should find results for input control: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Layout & Content Organization', () => {
    test.each([
      // Layout Components
      ['collections', 1, 'Content collections'],
      ['lists and tables', 1, 'Data lists'],
      ['split views', 1, 'Multi-pane layout'],
      ['scroll views', 1, 'Scrollable content'],
      ['grids', 1, 'Grid layouts'],
      
      // Content Patterns
      ['infinite scroll', 1, 'Continuous scrolling'],
      ['pull to refresh', 1, 'Refresh gesture'],
      ['swipe actions', 1, 'Swipe gestures'],
      ['card layout', 1, 'Card-based design'],
      ['list design', 1, 'List interfaces'],
    ])('should find results for layout: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Visual Elements & Media', () => {
    test.each([
      // Icons & Images
      ['app icons', 1, 'Application icons'],
      ['icons', 1, 'Interface icons'],
      ['sf symbols', 1, 'Apple symbol library'],
      ['images', 1, 'Graphics and photos'],
      ['live photos', 1, 'Motion photos'],
      
      // Progress & Status
      ['progress indicators', 1, 'Loading progress'],
      ['activity indicators', 1, 'Loading spinners'],
      ['loading states', 1, 'Loading UI'],
      ['empty states', 1, 'No content states'],
      
      // Data Visualization
      ['charts', 1, 'Data charts'],
      ['gauges', 1, 'Measurement displays'],
      ['rating indicators', 1, 'Star ratings'],
      
      // Visual Feedback
      ['badges', 1, 'Notification badges'],
      ['status indicators', 1, 'Status display'],
    ])('should find results for visual element: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Modal & Presentation Components', () => {
    test.each([
      // Modal Types
      ['alerts', 1, 'System alerts'],
      ['action sheets', 1, 'Choice sheets'],
      ['popovers', 1, 'Contextual popups'],
      ['sheets', 1, 'Modal sheets'],
      ['modality', 1, 'Modal patterns'],
      
      // Notification Types
      ['notifications', 1, 'System notifications'],
      ['banners', 1, 'Notification banners'],
      ['toast messages', 1, 'Brief notifications'],
      
      // Dialog Patterns
      ['confirmation dialog', 1, 'Confirm actions'],
      ['error dialog', 1, 'Error messages'],
      ['permission requests', 1, 'Privacy permissions'],
    ])('should find results for presentation: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Apple Technologies & Services', () => {
    test.each([
      // Authentication & Security
      ['sign in with apple', 1, 'Apple authentication'],
      ['apple pay', 1, 'Payment processing'],
      ['face id', 1, 'Facial authentication'],
      ['touch id', 1, 'Fingerprint authentication'],
      ['biometric authentication', 1, 'Bio auth'],
      ['keychain', 1, 'Credential storage'],
      ['passkeys', 1, 'Password replacement'],
      
      // Core Services
      ['siri', 1, 'Voice assistant'],
      ['icloud', 1, 'Cloud storage'],
      ['tap to pay', 1, 'NFC payments'],
      ['wallet', 1, 'Digital wallet'],
      ['apple id', 1, 'Apple account'],
      
      // Development Frameworks
      ['healthkit', 1, 'Health integration'],
      ['homekit', 1, 'Home automation'],
      ['machine learning', 1, 'AI/ML patterns'],
      ['augmented reality', 1, 'AR experiences'],
      ['game center', 1, 'Gaming social'],
      ['maps', 1, 'Location services'],
      ['shareplay', 1, 'Shared experiences'],
      ['nfc', 1, 'Near-field communication'],
      
      // Media & Content
      ['carplay', 1, 'Car interface'],
    ])('should find results for Apple technology: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Platform-Specific Features', () => {
    describe('iOS/iPadOS Features', () => {
      test.each([
        ['home screen', 1, 'iOS home screen'],
        ['quick actions', 1, '3D Touch shortcuts'],
        ['live activities', 1, 'Dynamic Island'],
        ['dynamic island', 1, 'iPhone 14 Pro feature'],
        ['multitasking', 1, 'iPad multitasking'],
        ['split view', 1, 'iPad split screen'],
        ['slide over', 1, 'iPad overlay'],
        ['control center', 1, 'iOS control panel'],
        ['notification center', 1, 'iOS notifications'],
        ['widgets', 1, 'Home screen widgets'],
        ['app clips', 1, 'Lightweight apps'],
        ['shortcuts', 1, 'Siri shortcuts'],
      ])('should find iOS feature: %s', async (term, minResults, description) => {
        await testSearchTerm(term, minResults, description);
      });
    });

    describe('macOS Features', () => {
      test.each([
        ['menu bar', 1, 'Mac top menu'],
        ['dock', 1, 'Mac dock'],
        ['windows', 1, 'Mac windows'],
        ['panels', 1, 'Utility windows'],
        ['full screen', 1, 'Mac full screen'],
        ['column view', 1, 'Finder columns'],
        ['outline view', 1, 'Mac tree view'],
        ['color wells', 1, 'Mac color picker'],
        ['combo boxes', 1, 'Mac dropdowns'],
        ['disclosure controls', 1, 'Mac expand/collapse'],
        ['path controls', 1, 'File path navigation'],
        ['printing', 1, 'Mac print dialog'],
      ])('should find macOS feature: %s', async (term, minResults, description) => {
        await testSearchTerm(term, minResults, description);
      });
    });

    describe('watchOS Features', () => {
      test.each([
        ['complications', 1, 'Watch face widgets'],
        ['digital crown', 1, 'Watch crown input'],
        ['always on', 1, 'Always-on display'],
        ['watch faces', 1, 'Watch customization'],
        ['workouts', 1, 'Fitness tracking'],
        ['digit entry', 1, 'Number input'],
      ])('should find watchOS feature: %s', async (term, minResults, description) => {
        await testSearchTerm(term, minResults, description);
      });
    });

    describe('tvOS Features', () => {
      test.each([
        ['focus and selection', 1, 'TV navigation'],
        ['siri remote', 1, 'Apple TV remote'],
        ['top shelf', 1, 'Featured content'],
        ['tv interface', 1, 'Television UI'],
      ])('should find tvOS feature: %s', async (term, minResults, description) => {
        await testSearchTerm(term, minResults, description);
      });
    });

    describe('visionOS Features', () => {
      test.each([
        ['spatial layout', 1, '3D interface'],
        ['immersive experiences', 1, '360 experiences'],
        ['eye tracking', 1, 'Gaze interaction'],
        ['ornaments', 1, 'UI attachments'],
        ['spatial materials', 1, '3D materials'],
        ['vision pro', 1, 'Apple headset'],
      ])('should find visionOS feature: %s', async (term, minResults, description) => {
        await testSearchTerm(term, minResults, description);
      });
    });
  });

  describe('Interaction Patterns & Gestures', () => {
    test.each([
      // Touch Interactions
      ['gestures', 1, 'Touch gestures'],
      ['touch targets', 1, 'Tap areas'],
      ['touch target size', 1, 'Minimum touch size'],
      ['tap gesture', 1, 'Single tap'],
      ['long press', 1, 'Press and hold'],
      ['swipe gesture', 1, 'Swipe interaction'],
      ['pinch gesture', 1, 'Zoom gesture'],
      ['pan gesture', 1, 'Drag gesture'],
      
      // States & Feedback
      ['hover states', 1, 'Mouse hover'],
      ['focus states', 1, 'Keyboard focus'],
      ['pressed states', 1, 'Button press'],
      ['disabled states', 1, 'Inactive controls'],
      ['selection states', 1, 'Selected items'],
      
      // Interaction Patterns
      ['drag and drop', 1, 'Drag interaction'],
      ['multi-touch', 1, 'Multiple fingers'],
      ['keyboard navigation', 1, 'Keyboard control'],
      ['voice control', 1, 'Voice interaction'],
    ])('should find results for interaction: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Accessibility & Inclusive Design', () => {
    test.each([
      // Accessibility Features
      ['voiceover', 1, 'Screen reader'],
      ['voice control', 1, 'Voice commands'],
      ['switch control', 1, 'Switch navigation'],
      ['assistive touch', 1, 'Touch assistance'],
      ['magnifier', 1, 'Screen magnification'],
      ['high contrast', 1, 'Contrast enhancement'],
      ['reduce motion', 1, 'Motion sensitivity'],
      ['button shapes', 1, 'Visual button indicators'],
      
      // WCAG & Standards
      ['wcag', 1, 'Web accessibility'],
      ['color contrast', 1, 'Contrast ratios'],
      ['alt text', 1, 'Image descriptions'],
      ['screen reader', 1, 'Assistive technology'],
      ['keyboard shortcuts', 1, 'Accessibility shortcuts'],
      
      // Inclusive Design
      ['cognitive accessibility', 1, 'Cognitive support'],
      ['motor accessibility', 1, 'Motor impairments'],
      ['visual accessibility', 1, 'Vision impairments'],
      ['hearing accessibility', 1, 'Hearing impairments'],
    ])('should find results for accessibility: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Content & Writing', () => {
    test.each([
      // Content Strategy
      ['writing guidelines', 1, 'Content writing'],
      ['voice and tone', 1, 'Brand voice'],
      ['microcopy', 1, 'UI text'],
      ['error messages', 1, 'Error communication'],
      ['onboarding', 1, 'First-time experience'],
      ['help documentation', 1, 'User help'],
      
      // Localization
      ['internationalization', 1, 'Global design'],
      ['localization', 1, 'Language adaptation'],
      ['right to left', 1, 'RTL languages'],
      ['text expansion', 1, 'Translation space'],
      
      // Content Types
      ['empty states', 1, 'No content'],
      ['placeholder content', 1, 'Content placeholders'],
      ['loading content', 1, 'Loading states'],
      ['feedback messages', 1, 'User feedback'],
    ])('should find results for content: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Performance & Loading States', () => {
    test.each([
      ['loading', 1, 'Loading states'],
      ['performance', 1, 'App performance'],
      ['optimization', 1, 'UI optimization'],
      ['launch screens', 1, 'App startup'],
      ['splash screens', 1, 'Loading screens'],
      ['skeleton screens', 1, 'Content placeholders'],
      ['progressive loading', 1, 'Incremental loading'],
      ['caching', 1, 'Content caching'],
    ])('should find results for performance: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Common UI Patterns & Synonyms', () => {
    test.each([
      // Synonym Testing
      ['switch', 1, 'Toggle control synonym'],
      ['dropdown', 1, 'Picker synonym'],
      ['popup', 1, 'Popover synonym'],
      ['modal', 1, 'Sheet synonym'],
      ['spinner', 1, 'Activity indicator synonym'],
      ['checkbox', 1, 'Toggle synonym'],
      ['radio button', 1, 'Selection control'],
      ['tabs', 1, 'Tab bar synonym'],
      ['navbar', 1, 'Navigation bar synonym'],
      ['toolbar', 1, 'Tool bar synonym'],
      
      // Common Patterns
      ['master detail', 1, 'Split view pattern'],
      ['card view', 1, 'Card layout'],
      ['list view', 1, 'List interface'],
      ['grid view', 1, 'Grid layout'],
      ['table view', 1, 'Data table'],
      ['form design', 1, 'Form layout'],
      ['dashboard', 1, 'Overview interface'],
      ['settings screen', 1, 'Preferences'],
      ['profile screen', 1, 'User profile'],
      ['search interface', 1, 'Search UI'],
    ])('should find results for common pattern: %s', async (term, minResults, description) => {
      await testSearchTerm(term, minResults, description);
    });
  });

  describe('Cross-Platform Consistency Tests', () => {
    test('should find platform-specific implementations of common components', async () => {
      const platforms = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'];
      
      for (const platform of platforms) {
        const results = await toolProvider.searchGuidelines({ 
          query: 'buttons', 
          platform: platform as any,
          limit: 5 
        });
        
        // Each platform should have some button guidance
        expect(results.results.length).toBeGreaterThan(0);
        console.log(`✅ ${platform} buttons: ${results.results.length} results`);
      }
    });

    test('should find navigation patterns across platforms', async () => {
      const navigationTerms = ['navigation', 'menu', 'toolbar'];
      
      for (const term of navigationTerms) {
        const allResults = await toolProvider.searchGuidelines({ query: term, limit: 10 });
        const iosResults = await toolProvider.searchGuidelines({ query: term, platform: 'iOS', limit: 10 });
        const macResults = await toolProvider.searchGuidelines({ query: term, platform: 'macOS', limit: 10 });
        
        expect(allResults.results.length).toBeGreaterThan(0);
        console.log(`✅ ${term}: All=${allResults.results.length}, iOS=${iosResults.results.length}, macOS=${macResults.results.length}`);
      }
    });
  });

  describe('Edge Cases & Error Conditions', () => {
    test('should handle very specific technical terms', async () => {
      const technicalTerms = [
        'dynamic type scaling',
        'trait collection',
        'responder chain',
        'layout margins',
        'safe area insets',
        'content hugging priority',
        'compression resistance',
        'autolayout constraints',
      ];

      for (const term of technicalTerms) {
        const results = await toolProvider.searchGuidelines({ query: term, limit: 5 });
        // Even technical terms should find some related content
        if (results.results.length === 0) {
          console.warn(`⚠️ No results for technical term: "${term}"`);
        } else {
          console.log(`✅ Technical term "${term}": ${results.results.length} results`);
        }
      }
    });

    test('should handle compound search queries', async () => {
      const compoundQueries = [
        'iOS navigation bar buttons',
        'macOS menu bar design',
        'watchOS complications layout',
        'accessibility color contrast',
        'dark mode color schemes',
        'responsive layout design',
      ];

      for (const query of compoundQueries) {
        const results = await toolProvider.searchGuidelines({ query, limit: 5 });
        expect(results.results.length).toBeGreaterThan(0);
        console.log(`✅ Compound query "${query}": ${results.results.length} results`);
      }
    });
  });
});