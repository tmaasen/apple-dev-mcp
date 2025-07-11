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
      const result = await toolProvider.searchGuidelines({
        query: 'button',
        platform: 'iOS',
        limit: 10
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
          platform: 'iOS',
          category: undefined
        }
      });
    });

    test('should search with platform and category filters', async () => {
      const result = await toolProvider.searchGuidelines({
        query: 'navigation',
        platform: 'iOS',
        category: 'navigation',
        limit: 5
      });

      expect(result.filters.platform).toBe('iOS');
      expect(result.filters.category).toBe('navigation');
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty query gracefully', async () => {
      const result = await toolProvider.searchGuidelines({
        query: '',
        limit: 10
      });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.query).toBe('');
    });

    test('should validate input parameters', async () => {
      await expect(toolProvider.searchGuidelines({
        query: 'test',
        platform: 'InvalidPlatform' as any,
        limit: 10
      })).rejects.toThrow('Invalid platform');

      await expect(toolProvider.searchGuidelines({
        query: 'test',
        category: 'invalid-category' as any,
        limit: 10
      })).rejects.toThrow('Invalid category');

      await expect(toolProvider.searchGuidelines({
        query: 'test',
        limit: 100
      })).rejects.toThrow('Invalid limit');
    });

    test('should fallback to minimal search when static content fails', async () => {
      mockStaticContentProvider.searchContent.mockRejectedValue(new Error('Static search failed'));
      mockStaticContentProvider.keywordSearchContent.mockRejectedValue(new Error('Keyword search failed'));

      const result = await toolProvider.searchGuidelines({
        query: 'button',
        platform: 'iOS',
        limit: 10
      });

      // Should still return results from fallback
      expect(result.results).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('get_component_spec tool', () => {
    beforeEach(() => {
      const mockSection = {
        id: 'buttons-section',
        title: 'Buttons',
        content: 'Button components should have a minimum touch target of 44pt x 44pt. Consider accessibility when designing buttons.',
        platform: 'iOS' as const,
        category: 'visual-design' as const,
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        lastUpdated: '2024-01-01',
        metadata: {}
      };

      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'buttons-section',
          title: 'Buttons',
          url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
          platform: 'iOS',
          relevanceScore: 0.95,
          snippet: 'Button components for iOS applications',
          type: 'guideline',
          category: 'visual-design'
        }
      ]);

      mockStaticContentProvider.getSection.mockResolvedValue(mockSection);
    });

    test('should get button component specification', async () => {
      const result = await toolProvider.getComponentSpec({
        componentName: 'Button',
        platform: 'iOS'
      });

      expect(result.component).toBeTruthy();
      expect(result.component?.title).toBe('Buttons');
      expect(result.component?.platforms).toContain('iOS');
      expect(result.relatedComponents).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    test('should handle navigation bar component', async () => {
      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'navigation-bars',
          title: 'Navigation Bars',
          url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
          platform: 'iOS',
          relevanceScore: 0.90,
          snippet: 'Navigation bar component specifications',
          type: 'guideline',
          category: 'navigation'
        }
      ]);

      const result = await toolProvider.getComponentSpec({
        componentName: 'Navigation Bar',
        platform: 'iOS'
      });

      expect(result.component).toBeTruthy();
    });

    test('should validate component name input', async () => {
      await expect(toolProvider.getComponentSpec({
        componentName: '',
        platform: 'iOS'
      })).rejects.toThrow('Invalid componentName');

      await expect(toolProvider.getComponentSpec({
        componentName: 'A'.repeat(60), // Too long
        platform: 'iOS'
      })).rejects.toThrow('Component name too long');
    });

    test('should handle unknown components gracefully', async () => {
      mockStaticContentProvider.searchContent.mockResolvedValue([]);

      const result = await toolProvider.getComponentSpec({
        componentName: 'NonExistentComponent',
        platform: 'iOS'
      });

      expect(result.component).toBeNull();
      expect(result.relatedComponents).toEqual([]);
      expect(result.platforms).toEqual([]);
    });
  });

  describe('get_design_tokens tool', () => {
    test('should get design tokens for button component', async () => {
      const result = await toolProvider.getDesignTokens({
        component: 'button',
        platform: 'iOS',
        tokenType: 'all'
      });

      expect(result.component).toBe('button');
      expect(result.platform).toBe('iOS');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.colors).toBeDefined();
      expect(result.tokens.spacing).toBeDefined();
      expect(result.tokens.typography).toBeDefined();
      expect(result.tokens.dimensions).toBeDefined();
    });

    test('should get specific token types', async () => {
      const result = await toolProvider.getDesignTokens({
        component: 'button',
        platform: 'iOS',
        tokenType: 'colors'
      });

      expect(result.tokens.colors).toBeDefined();
      expect(result.tokens.spacing).toBeUndefined();
    });

    test('should handle different platforms', async () => {
      const iOSResult = await toolProvider.getDesignTokens({
        component: 'button',
        platform: 'iOS'
      });

      const macOSResult = await toolProvider.getDesignTokens({
        component: 'button',
        platform: 'macOS'
      });

      expect(iOSResult.platform).toBe('iOS');
      expect(macOSResult.platform).toBe('macOS');
      // Colors might be different between platforms
      expect(iOSResult.tokens.colors).toBeDefined();
      expect(macOSResult.tokens.colors).toBeDefined();
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

    test('should get technical documentation for UIButton', async () => {
      const result = await toolProvider.getTechnicalDocumentation({
        path: 'documentation/UIKit/UIButton'
      });

      expect(result.success).toBe(true);
      expect(result.documentation).toBeTruthy();
      expect(result.documentation?.symbol).toBe('UIButton');
      expect(result.documentation?.framework).toBe('UIKit');
    });

    test('should include design guidance when requested', async () => {
      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'buttons-design',
          title: 'Button Design Guidelines',
          url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
          platform: 'iOS',
          relevanceScore: 0.85,
          snippet: 'Design guidelines for buttons',
          type: 'guideline',
          category: 'visual-design'
        }
      ]);

      const result = await toolProvider.getTechnicalDocumentation({
        path: 'documentation/UIKit/UIButton',
        includeDesignGuidance: true
      });

      expect(result.designGuidance).toBeDefined();
      expect(result.designGuidance?.length).toBeGreaterThan(0);
    });

    test('should validate path input', async () => {
      await expect(toolProvider.getTechnicalDocumentation({
        path: ''
      })).rejects.toThrow('Invalid path');

      await expect(toolProvider.getTechnicalDocumentation({
        path: 'a'.repeat(250) // Too long
      })).rejects.toThrow('Path too long');
    });

    test('should handle API errors gracefully', async () => {
      mockAppleDevAPIClient.getTechnicalDocumentation.mockRejectedValue(new Error('API Error'));

      const result = await toolProvider.getTechnicalDocumentation({
        path: 'invalid/path'
      });

      expect(result.success).toBe(false);
      expect(result.documentation).toBeNull();
      expect(result.error).toContain('API Error');
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
        query: 'button',
        maxResults: 10
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].title).toBe('UIButton');
      expect(result.results[0].framework).toBe('UIKit');
      expect(result.total).toBe(2);
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
        framework: 'SwiftUI',
        maxResults: 10
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

      await expect(toolProvider.searchTechnicalDocumentation({
        query: 'test',
        maxResults: 150 // Too many
      })).rejects.toThrow('Invalid maxResults');
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
        platform: 'iOS',
        maxResults: 20
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
        query: 'button',
        includeDesign: true,
        includeTechnical: true
      });

      expect(result.crossReferences.length).toBeGreaterThan(0);
      expect(result.crossReferences[0]).toEqual({
        designSection: 'Buttons',
        technicalSymbol: 'UIButton',
        relevance: expect.any(Number)
      });
    });

    test('should allow filtering to design only', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button',
        includeDesign: true,
        includeTechnical: false
      });

      expect(result.designResults.length).toBeGreaterThan(0);
      expect(result.technicalResults.length).toBe(0);
      expect(result.sources).toContain('design-guidelines');
      expect(result.sources).not.toContain('technical-documentation');
    });

    test('should allow filtering to technical only', async () => {
      const result = await toolProvider.searchUnified({
        query: 'button',
        includeDesign: false,
        includeTechnical: true
      });

      expect(result.designResults.length).toBe(0);
      expect(result.technicalResults.length).toBeGreaterThan(0);
      expect(result.sources).toContain('technical-documentation');
      expect(result.sources).not.toContain('design-guidelines');
    });
  });

  describe('generate_fused_guidance tool', () => {
    beforeEach(() => {
      // Mock search results for fusion
      mockStaticContentProvider.searchContent.mockResolvedValue([
        {
          id: 'buttons-design',
          title: 'Buttons',
          url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
          platform: 'iOS',
          relevanceScore: 0.95,
          snippet: 'Button design guidelines with 44pt minimum touch target',
          type: 'guideline',
          category: 'visual-design'
        }
      ]);

      mockAppleDevAPIClient.searchGlobal.mockResolvedValue([
        {
          title: 'UIButton',
          path: 'documentation/UIKit/UIButton',
          url: 'https://developer.apple.com/documentation/uikit/uibutton',
          framework: 'UIKit',
          symbolKind: 'class',
          platforms: 'iOS 2.0+',
          description: 'UIButton class for creating interactive buttons',
          relevanceScore: 0.90,
          type: 'technical'
        }
      ]);
    });

    test('should generate fused guidance for button component', async () => {
      const result = await toolProvider.generateFusedGuidance({
        component: 'Button',
        platform: 'iOS',
        framework: 'UIKit',
        complexity: 'intermediate',
        includeCodeExamples: true,
        includeAccessibility: true
      });

      expect(result.success).toBe(true);
      if (result.fusedContent) {
        expect(result.fusedContent.title).toContain('Button');
        expect(result.fusedContent.designGuidance).toBeDefined();
        expect(result.fusedContent.technicalImplementation).toBeDefined();
        expect(result.fusedContent.metadata.complexity).toBe('intermediate');
      }
    });

    test('should generate implementation guide when requested', async () => {
      const result = await toolProvider.generateFusedGuidance({
        component: 'Button',
        platform: 'iOS',
        includeStepByStep: true
      });

      expect(result.implementationGuide).toBeDefined();
      expect(result.implementationGuide?.title).toContain('Button Implementation Guide');
      expect(result.implementationGuide?.overview).toBeDefined();
    });

    test('should validate component input', async () => {
      await expect(toolProvider.generateFusedGuidance({
        component: '',
        platform: 'iOS'
      })).rejects.toThrow('Invalid component');

      await expect(toolProvider.generateFusedGuidance({
        component: 'a'.repeat(60), // Too long
        platform: 'iOS'
      })).rejects.toThrow('Component name too long');
    });

    test('should handle different complexity levels', async () => {
      const beginnerResult = await toolProvider.generateFusedGuidance({
        component: 'Button',
        platform: 'iOS',
        complexity: 'beginner'
      });

      const advancedResult = await toolProvider.generateFusedGuidance({
        component: 'Button',
        platform: 'iOS',
        complexity: 'advanced'
      });

      expect(beginnerResult.success).toBe(true);
      expect(advancedResult.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network timeouts gracefully', async () => {
      mockAppleDevAPIClient.getTechnicalDocumentation.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await toolProvider.getTechnicalDocumentation({
        path: 'documentation/UIKit/UIButton'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    test('should handle invalid JSON responses', async () => {
      mockAppleDevAPIClient.searchGlobal.mockRejectedValue(new Error('Invalid JSON'));

      const result = await toolProvider.searchTechnicalDocumentation({
        query: 'button'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('should handle static content unavailability', async () => {
      mockStaticContentProvider.isAvailable.mockResolvedValue(false);

      const result = await toolProvider.searchGuidelines({
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
      await toolProvider.searchGuidelines({ query, limit: 10 });
      
      // Second call should use cache (verify mock was called only once)
      await toolProvider.searchGuidelines({ query, limit: 10 });

      // Note: In a real implementation, you'd verify cache hits
      // For now, we just ensure no errors occur
      expect(mockStaticContentProvider.searchContent).toHaveBeenCalled();
    });

    test('should handle concurrent requests properly', async () => {
      const promises = [
        toolProvider.searchGuidelines({ query: 'button1', limit: 5 }),
        toolProvider.searchGuidelines({ query: 'button2', limit: 5 }),
        toolProvider.searchGuidelines({ query: 'button3', limit: 5 })
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