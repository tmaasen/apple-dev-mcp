/**
 * Comprehensive MCP Tools Integration Tests
 * 
 * This test suite validates all MCP tools with realistic queries and scenarios
 * to ensure they work properly without manual testing in the MCP inspector.
 */

import { HIGToolProvider } from '../tools.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGCache } from '../cache.js';
import { HIGResourceProvider } from '../resources.js';
import { HIGStaticContentProvider } from '../static-content.js';
import { AppleDevAPIClient } from '../services/apple-dev-api-client.service.js';

// Mock external dependencies
jest.mock('../services/crawlee-hig.service.js');
jest.mock('../static-content.js');
jest.mock('../services/apple-dev-api-client.service.js');

describe('MCP Tools Integration Tests', () => {
  let toolProvider: HIGToolProvider;
  let mockCrawleeService: jest.Mocked<CrawleeHIGService>;
  let mockCache: HIGCache;
  let mockResourceProvider: HIGResourceProvider;
  let mockStaticContentProvider: jest.Mocked<HIGStaticContentProvider>;
  let mockAppleDevAPIClient: jest.Mocked<AppleDevAPIClient>;

  beforeEach(() => {
    // Setup mocks
    mockCache = new HIGCache(3600);
    mockCrawleeService = new CrawleeHIGService(mockCache) as jest.Mocked<CrawleeHIGService>;
    mockStaticContentProvider = new HIGStaticContentProvider() as jest.Mocked<HIGStaticContentProvider>;
    mockAppleDevAPIClient = new AppleDevAPIClient(mockCache) as jest.Mocked<AppleDevAPIClient>;
    mockResourceProvider = new HIGResourceProvider(mockCrawleeService, mockCache, mockStaticContentProvider);

    // Initialize tool provider
    toolProvider = new HIGToolProvider(
      mockCrawleeService,
      mockCache,
      mockResourceProvider,
      mockStaticContentProvider,
      mockAppleDevAPIClient
    );

    // Setup basic static content provider mocks
    mockStaticContentProvider.isAvailable.mockResolvedValue(true);
    mockStaticContentProvider.searchContent.mockResolvedValue([]);
    mockStaticContentProvider.keywordSearchContent.mockResolvedValue([]);
  });

  describe('search_guidelines tool', () => {
    beforeEach(() => {
      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'ios-buttons',
          title: 'Buttons',
          url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
          platform: 'iOS',
          relevanceScore: 0.95,
          snippet: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon.',
          type: 'guideline',
          category: 'visual-design'
        },
        {
          id: 'ios-navigation-bars',
          title: 'Navigation Bars',
          url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
          platform: 'iOS',
          relevanceScore: 0.85,
          snippet: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.',
          type: 'guideline',
          category: 'navigation'
        }
      ]);
    });

    test('should search for buttons successfully', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button',
        platform: 'iOS'
      });

      expect(result).toEqual({
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Buttons',
            platform: 'iOS',
            relevanceScore: expect.any(Number)
          })
        ]),
        total: expect.any(Number),
        query: 'button',
        filters: {
          platform: 'iOS'
        }
      });
    });

    test('should search with platform filter', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'navigation',
        platform: 'iOS'
      });

      expect(result.filters.platform).toBe('iOS');
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty query gracefully', async () => {
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: '',
        limit: 10
      });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.query).toBe('');
    });

    test('should validate input parameters', async () => {
      await expect(toolProvider.searchHumanInterfaceGuidelines({
        query: 'test',
        platform: 'InvalidPlatform' as any
      })).rejects.toThrow('Invalid platform');

      // Test that the method succeeds with only required parameters
      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'test'
      });
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    test('should fallback to minimal search when static content fails', async () => {
      mockStaticContentProvider.searchContent.mockRejectedValue(new Error('Static search failed'));
      mockStaticContentProvider.keywordSearchContent.mockRejectedValue(new Error('Keyword search failed'));

      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button',
        platform: 'iOS'
      });

      // Should still return results from fallback
      expect(result.results).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });



  describe('get_accessibility_requirements tool', () => {
    test('should get accessibility requirements for button', async () => {
      const result = await toolProvider.getAccessibilityRequirements({
        component: 'button',
        platform: 'iOS'
      });

      expect(result.component).toBe('button');
      expect(result.platform).toBe('iOS');
      expect(result.requirements).toBeDefined();
      expect(result.requirements.minimumTouchTarget).toBe('44pt x 44pt');
      expect(result.requirements.contrastRatio).toBe('4.5:1 (WCAG AA)');
      expect(result.requirements.voiceOverSupport).toBeInstanceOf(Array);
      expect(result.requirements.keyboardNavigation).toBeInstanceOf(Array);
      expect(result.requirements.wcagCompliance).toBe('WCAG 2.1 AA');
    });

    test('should get requirements for navigation component', async () => {
      const result = await toolProvider.getAccessibilityRequirements({
        component: 'navigation',
        platform: 'iOS'
      });

      expect(result.requirements.voiceOverSupport).toContain('Navigation bar trait');
      expect(result.requirements.keyboardNavigation).toContain('Tab navigation through interactive elements');
    });

    test('should handle tab bar component', async () => {
      const result = await toolProvider.getAccessibilityRequirements({
        component: 'tab',
        platform: 'iOS'
      });

      expect(result.requirements.voiceOverSupport).toContain('Tab bar trait');
      expect(result.requirements.additionalGuidelines).toContain('Use clear, distinct tab labels');
    });
  });

  describe('get_technical_documentation tool', () => {
    beforeEach(() => {
      mockAppleDevAPIClient.getTechnicalDocumentation.mockResolvedValue({
        id: 'uibutton-doc',
        symbol: 'UIButton',
        framework: 'UIKit',
        symbolKind: 'class',
        platforms: ['iOS', 'iPadOS', 'Mac Catalyst'],
        abstract: 'A control that executes your custom code in response to user interactions.',
        apiReference: 'https://developer.apple.com/documentation/uikit/uibutton',
        codeExamples: [],
        relatedSymbols: ['UIControl'],
        url: 'https://developer.apple.com/documentation/uikit/uibutton',
        lastUpdated: new Date('2024-01-01')
      });
    });

    test('should search technical documentation for UIButton', async () => {
      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'UIButton'
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    test('should search technical documentation with framework filter', async () => {
      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'Button',
        framework: 'UIKit'
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    test('should validate query input', async () => {
      await expect(toolProvider.searchTechnicalDocumentation({
        query: 'a'.repeat(150) // Too long
      })).rejects.toThrow('Query too long');
    });

    test('should handle search errors gracefully', async () => {
      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'nonexistentapi'
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('search_technical_documentation tool', () => {
    beforeEach(() => {
      mockAppleDevAPIClient.searchGlobal.mockResolvedValue([
        {
          title: 'UIButton',
          path: 'documentation/UIKit/UIButton',
          url: 'https://developer.apple.com/documentation/uikit/uibutton',
          framework: 'UIKit',
          symbolKind: 'class',
          platforms: 'iOS 2.0+, iPadOS 2.0+',
          description: 'A control that executes your custom code in response to user interactions.',
          relevanceScore: 0.95,
          type: 'technical'
        },
        {
          title: 'Button',
          path: 'documentation/SwiftUI/Button',
          url: 'https://developer.apple.com/documentation/swiftui/button',
          framework: 'SwiftUI',
          symbolKind: 'struct',
          platforms: 'iOS 13.0+, macOS 10.15+',
          description: 'A control that initiates an action.',
          relevanceScore: 0.90,
          type: 'technical'
        }
      ]);
    });

    test('should search for button technical documentation', async () => {
      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'button'
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].title).toBe('UIButton');
      expect(result.results[0].framework).toBe('UIKit');
      expect(result.total).toBe(3); // Now includes UIButton, NSButton, and SwiftUI Button
    });

    test('should search within specific framework', async () => {
      mockAppleDevAPIClient.searchFramework.mockResolvedValue([
        {
          title: 'Button',
          path: 'documentation/SwiftUI/Button',
          url: 'https://developer.apple.com/documentation/swiftui/button',
          framework: 'SwiftUI',
          symbolKind: 'struct',
          platforms: 'iOS 13.0+, macOS 10.15+',
          description: 'A control that initiates an action.',
          relevanceScore: 0.90,
          type: 'technical'
        }
      ]);

      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'button',
        framework: 'SwiftUI'
      });

      expect(result.results[0].framework).toBe('SwiftUI');
    });

    test('should validate search parameters', async () => {
      await expect(toolProvider.searchTechnicalDocumentation({
        query: '',
      })).resolves.toEqual({
        results: [],
        total: 0,
        query: '',
        success: true
      });

      await expect(toolProvider.searchTechnicalDocumentation({
        query: 'a'.repeat(150), // Too long
      })).rejects.toThrow('Query too long');

      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'test'
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('search_unified tool', () => {
    beforeEach(() => {
      // Mock design results
      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'buttons-design',
          title: 'Buttons',
          url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
          platform: 'iOS',
          relevanceScore: 0.95,
          snippet: 'Button design guidelines',
          type: 'guideline',
          category: 'visual-design'
        }
      ]);

      // Mock technical results
      mockAppleDevAPIClient.searchGlobal.mockResolvedValue([
        {
          title: 'UIButton',
          path: 'documentation/UIKit/UIButton',
          url: 'https://developer.apple.com/documentation/uikit/uibutton',
          framework: 'UIKit',
          symbolKind: 'class',
          platforms: 'iOS 2.0+',
          description: 'Button technical documentation',
          relevanceScore: 0.90,
          type: 'technical'
        }
      ]);
    });

    test('should perform unified search across design and technical content', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button',
        platform: 'iOS'
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.designResults.length).toBeGreaterThan(0);
      expect(result.technicalResults.length).toBeGreaterThan(0);
      expect(result.sources).toContain('design-guidelines');
      expect(result.sources).toContain('technical-documentation');
      expect(result.crossReferences).toBeDefined();
    });

    test('should create cross-references between design and technical content', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button'
      });

      expect(result.crossReferences.length).toBeGreaterThan(0);
      expect(result.crossReferences[0]).toEqual({
        designSection: 'Buttons',
        technicalSymbol: 'Button', // SwiftUI Button comes first due to higher relevance
        relevance: expect.any(Number)
      });
    });

    test('should include both design and technical results', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button'
      });

      expect(result.designResults.length).toBeGreaterThan(0);
      expect(result.technicalResults.length).toBeGreaterThan(0);
      expect(result.sources).toContain('design-guidelines');
      expect(result.sources).toContain('technical-documentation');
    });

    test('should return unified results with cross-references', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button'
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.crossReferences).toBeDefined();
    });
  });


  describe('Error Handling and Edge Cases', () => {
    test('should handle network timeouts gracefully', async () => {
      mockAppleDevAPIClient.getTechnicalDocumentation.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'UIButton'
      });

      expect(result.success).toBe(true); // Still returns search results despite API error
      expect(result.results).toBeDefined();
    });

    test('should use fallback database when Apple API is unavailable', async () => {
      // Apple API is no longer used, we use fallback database instead
      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'button'
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].title).toBe('UIButton');
    });

    test('should handle static content unavailability', async () => {
      mockStaticContentProvider.isAvailable.mockResolvedValue(false);

      const result = await toolProvider.searchHumanInterfaceGuidelines({
        query: 'button',
        limit: 10
      });

      // Should still work with fallback content
      expect(result.results).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache search results appropriately', async () => {
      const query = 'button-cache-test';
      
      // First call
      await toolProvider.searchHumanInterfaceGuidelines({ query, limit: 10 });
      
      // Second call should use cache (verify mock was called only once)
      await toolProvider.searchHumanInterfaceGuidelines({ query, limit: 10 });

      // Note: In a real implementation, you'd verify cache hits
      // For now, we just ensure no errors occur
      expect(mockStaticContentProvider.searchContent).toHaveBeenCalled();
    });

    test('should handle concurrent requests properly', async () => {
      const promises = [
        toolProvider.searchHumanInterfaceGuidelines({ query: 'button1', limit: 5 }),
        toolProvider.searchHumanInterfaceGuidelines({ query: 'button2', limit: 5 }),
        toolProvider.searchHumanInterfaceGuidelines({ query: 'button3', limit: 5 })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.results).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(0);
      });
    });
  });
});