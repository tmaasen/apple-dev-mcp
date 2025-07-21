/**
 * Content Coverage Validation Tests
 * 
 * These tests validate that our MCP can effectively handle queries for ALL available
 * content in the repository, identifying gaps and ensuring comprehensive field coverage.
 */

import { HIGToolProvider } from '../tools.js';
import { HIGCache } from '../cache.js';
import { StaticContentSearchService } from '../services/static-content-search.service.js';

describe('Content Coverage Validation', () => {
  let cache: HIGCache;
  let toolProvider: HIGToolProvider;
  let searchService: StaticContentSearchService;

  beforeEach(() => {
    cache = new HIGCache(60);
    toolProvider = new HIGToolProvider(cache);
    searchService = new StaticContentSearchService('content');
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Platform-Specific Content Validation', () => {
    /**
     * Validate that our search can find platform-specific content effectively.
     * Based on content analysis: iOS (6), macOS (17), tvOS (4), visionOS (6), watchOS (7)
     */

    describe('macOS Specialized Components', () => {
      test('should find macOS-specific interface elements', async () => {
        const macOSQueries = [
          'color wells design guidelines macOS',
          'combo boxes interface design macOS',
          'column views layout patterns macOS',
          'disclosure controls design macOS',
          'dock menus interaction patterns',
          'image wells interface design',
          'outline views data presentation',
          'panels window management macOS',
          'path controls navigation macOS',
          'pop up buttons design patterns',
          'pull down buttons interface',
          'token fields input design',
          'windows management design patterns'
        ];

        for (const query of macOSQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'macOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
          
          // Should prioritize macOS content
          const macOSResults = result.results.filter(r => 
            r.platform === 'macOS' || r.platform === 'universal'
          );
          expect(macOSResults.length).toBeGreaterThan(0);
          
          // Should have reasonable relevance for macOS-specific queries
          expect(result.results[0].relevanceScore).toBeGreaterThan(0.3);
        }
      });

      test('should find macOS system integration patterns', async () => {
        const systemQueries = [
          'macOS menu bar design guidelines',
          'full screen mode design patterns',
          'printing interface design macOS',
          'dock integration patterns'
        ];

        for (const query of systemQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'macOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
          expect(result.results[0].relevanceScore).toBeGreaterThan(0.2);
        }
      });
    });

    describe('watchOS Specialized Patterns', () => {
      test('should find watchOS-specific interaction patterns', async () => {
        const watchQueries = [
          'digital crown interaction patterns',
          'watch complications design guidelines',
          'always on display design patterns',
          'digit entry views watchOS',
          'watch faces design guidelines',
          'workouts interface design patterns'
        ];

        for (const query of watchQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'watchOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
          
          const watchResults = result.results.filter(r => 
            r.platform === 'watchOS' || r.platform === 'universal'
          );
          expect(watchResults.length).toBeGreaterThan(0);
        }
      });
    });

    describe('visionOS Spatial Design', () => {
      test('should find visionOS spatial design patterns', async () => {
        const visionQueries = [
          'visionOS spatial layout design',
          'immersive experiences design guidelines',
          'visionOS materials design patterns',
          'eye tracking interface design',
          'ornaments spatial design visionOS'
        ];

        for (const query of visionQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'visionOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
          
          const visionResults = result.results.filter(r => 
            r.platform === 'visionOS' || r.platform === 'universal'
          );
          expect(visionResults.length).toBeGreaterThan(0);
        }
      });
    });

    describe('tvOS Focus and Remote Patterns', () => {
      test('should find tvOS-specific interaction patterns', async () => {
        const tvQueries = [
          'tvOS focus and selection patterns',
          'remote control interaction design',
          'top shelf design guidelines tvOS'
        ];

        for (const query of tvQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'tvOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
        }
      });
    });

    describe('iOS Specialized Features', () => {
      test('should find iOS-specific patterns', async () => {
        const iOSQueries = [
          'iOS app icons design guidelines',
          'home screen quick actions design',
          'iOS multitasking interface patterns',
          'permission requesting design iOS',
          'iOS settings interface design'
        ];

        for (const query of iOSQueries) {
          const result = await toolProvider.searchHumanInterfaceGuidelines({
            query,
            platform: 'iOS'
          });

          expect(result.results.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Universal Content Deep Coverage', () => {
    /**
     * Test coverage of all 73 universal content files to ensure no gaps
     */

    describe('Advanced Interaction Patterns', () => {
      test('should find all stepper and control variations', async () => {
        const controlQueries = [
          'steppers increment decrement design',
          'segmented controls selection patterns',
          'sliders continuous value selection',
          'rating indicators feedback design'
        ];

        for (const query of controlQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
          expect(result[0].relevanceScore).toBeGreaterThan(0.4);
        }
      });

      test('should find complex layout patterns', async () => {
        const layoutQueries = [
          'split views adaptive layout design',
          'scroll views content organization',
          'collections grid layout patterns',
          'lists and tables data presentation'
        ];

        for (const query of layoutQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Advanced Visual and Motion Design', () => {
      test('should find sophisticated visual design patterns', async () => {
        const visualQueries = [
          'SF Symbols iconography guidelines',
          'materials visual effects design',
          'motion animation design principles',
          'typography hierarchical design'
        ];

        for (const query of visualQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
          expect(result[0].relevanceScore).toBeGreaterThan(0.3);
        }
      });
    });

    describe('Platform Integration and Services', () => {
      test('should find Apple ecosystem integration patterns', async () => {
        const integrationQueries = [
          'Apple Pay payment interface design',
          'Sign in with Apple authentication',
          'HealthKit data presentation patterns',
          'HomeKit device control interface',
          'CarPlay automotive interface design',
          'Siri voice interface integration',
          'Wallet passes design guidelines',
          'SharePlay collaborative features',
          'NFC Near Field Communication design'
        ];

        for (const query of integrationQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
          
          // These are specialized features, so slightly lower threshold
          expect(result[0].relevanceScore).toBeGreaterThan(0.2);
        }
      });

      test('should find modern iOS features', async () => {
        const modernFeatures = [
          'widgets home screen design',
          'live activities real time updates',
          'app clips lightweight experiences',
          'tap to pay on iPhone design'
        ];

        for (const query of modernFeatures) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Specialized Data and Content Patterns', () => {
      test('should find advanced data presentation', async () => {
        const dataQueries = [
          'charts data visualization design',
          'gauges measurement display',
          'live photos interactive media',
          'augmented reality AR interface',
          'machine learning ML interface design'
        ];

        for (const query of dataQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
        }
      });

      test('should find specialized content types', async () => {
        const contentQueries = [
          'activity views sharing interface',
          'boxes container design patterns',
          'labels text presentation design',
          'text views rich text editing',
          'images media presentation patterns'
        ];

        for (const query of contentQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Business and Commerce Patterns', () => {
      test('should find commerce and business interface patterns', async () => {
        const commerceQueries = [
          'in app purchase design guidelines',
          'Game Center social gaming interface',
          'Maps location interface design',
          'branding identity design guidelines'
        ];

        for (const query of commerceQueries) {
          const result = await searchService.searchContent(query, 'iOS', undefined, 3);
          expect(result.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Cross-Platform Content Relationships', () => {
    /**
     * Test that cross-references work and related content is discoverable
     */

    test('should find related content across platforms', async () => {
      // Test spatial layout relationships (universal + visionOS)
      const spatialResult = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'spatial layout design patterns',
        platform: 'visionOS'
      });

      expect(spatialResult.results.length).toBeGreaterThan(0);
      
      // Should find both visionOS-specific and universal spatial content
      const hasVisionOS = spatialResult.results.some(r => r.platform === 'visionOS');
      const hasUniversal = spatialResult.results.some(r => r.platform === 'universal');
      expect(hasVisionOS || hasUniversal).toBe(true);
    });

    test('should find color-related content across platforms', async () => {
      // Test color relationships (universal + macOS color wells)
      const colorResult = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'color design guidelines',
        platform: 'macOS'
      });

      expect(colorResult.results.length).toBeGreaterThan(0);
      
      // Should prioritize relevant color content
      const colorContent = colorResult.results.filter(r => 
        r.title.toLowerCase().includes('color') || 
        r.content.toLowerCase().includes('color')
      );
      expect(colorContent.length).toBeGreaterThan(0);
    });

    test('should handle view-related queries across platforms', async () => {
      // Test view relationships (activity views, column views, outline views)
      const viewQueries = [
        'activity views sharing design',
        'column views data organization',
        'outline views hierarchical data'
      ];

      for (const query of viewQueries) {
        const result = await toolProvider.searchHumanInterfaceGuidelines({
          query,
          platform: 'macOS'
        });

        expect(result.results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Content Quality and Completeness', () => {
    /**
     * Validate that all content is substantial and properly formatted
     */

    test('should return substantial content for all major categories', async () => {
      const categories = [
        'accessibility design guidelines',
        'privacy design principles', 
        'inclusion design guidelines',
        'feedback interaction design',
        'gestures touch interaction',
        'inputs user input design',
        'launching app launch experience',
        'loading progress design',
        'modality presentation design',
        'toolbars action organization'
      ];

      for (const category of categories) {
        const result = await searchService.searchContent(category, 'iOS', undefined, 1);
        expect(result.length).toBeGreaterThan(0);
        
        const topResult = result[0];
        expect(topResult.content.length).toBeGreaterThan(300);
        expect(topResult.relevanceScore).toBeGreaterThan(0.3);
      }
    });

    test('should handle edge case and niche content queries', async () => {
      const edgeCases = [
        'digit entry views specialized input',
        'ornaments spatial interface elements',
        'complications watch face widgets',
        'top shelf tvOS content preview',
        'remotes input device design',
        'eyes gaze interaction visionOS'
      ];

      for (const query of edgeCases) {
        const result = await searchService.searchContent(query, undefined, undefined, 3);
        expect(result.length).toBeGreaterThan(0);
        
        // Edge cases may have lower relevance but should still be found
        expect(result[0].relevanceScore).toBeGreaterThan(0.1);
      }
    });
  });

  describe('Performance Under Load', () => {
    /**
     * Test performance with diverse content queries
     */

    test('should handle diverse platform queries efficiently', async () => {
      const diverseQueries = [
        { query: 'button design', platform: 'iOS' },
        { query: 'combo boxes', platform: 'macOS' },
        { query: 'complications', platform: 'watchOS' },
        { query: 'focus selection', platform: 'tvOS' },
        { query: 'spatial layout', platform: 'visionOS' },
        { query: 'accessibility', platform: 'universal' }
      ];

      const startTime = Date.now();
      
      const results = await Promise.all(
        diverseQueries.map(({ query, platform }) => 
          toolProvider.searchHumanInterfaceGuidelines({ query, platform: platform as any })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All queries should succeed
      results.forEach(result => {
        expect(result.results.length).toBeGreaterThan(0);
      });

      // Should complete within reasonable time for 6 diverse queries
      expect(duration).toBeLessThan(8000);
    });

    test('should maintain quality across content categories', async () => {
      const categoryQueries = [
        'interactive elements design patterns',
        'navigation interface design',
        'data presentation visualization',
        'modal overlay design patterns', 
        'input form design guidelines',
        'visual design principles',
        'user experience patterns',
        'platform features integration',
        'system services design'
      ];

      for (const query of categoryQueries) {
        const result = await searchService.searchContent(query, 'iOS', undefined, 2);
        expect(result.length).toBeGreaterThan(0);
        
        // All categories should have good relevance
        expect(result[0].relevanceScore).toBeGreaterThan(0.4);
        
        // Should find substantial content
        expect(result[0].content.length).toBeGreaterThan(200);
      }
    });
  });
});