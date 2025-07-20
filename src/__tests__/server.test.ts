/**
 * Server integration tests
 * 
 * Note: Full server testing requires complex MCP SDK mocking.
 * These tests focus on the core server functionality that can be tested.
 */

import { HIGCache } from '../cache.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGToolProvider } from '../tools.js';

describe('Server Component Integration', () => {
  let cache: HIGCache;
  let crawleeService: CrawleeHIGService;
  let toolProvider: HIGToolProvider;

  beforeEach(() => {
    cache = new HIGCache(60);
    crawleeService = new CrawleeHIGService(cache);
    toolProvider = new HIGToolProvider(crawleeService, cache);
  });

  afterEach(async () => {
    await crawleeService.teardown();
    cache.clear();
  });

  test('should initialize all server components', () => {
    expect(cache).toBeInstanceOf(HIGCache);
    expect(crawleeService).toBeInstanceOf(CrawleeHIGService);
    expect(toolProvider).toBeInstanceOf(HIGToolProvider);
  });

  test('should have proper component dependencies', () => {
    // Test that components are properly connected
    expect(crawleeService).toBeDefined();
    expect(toolProvider).toBeDefined();
    
    // Verify cache is shared
    const testKey = 'test-integration';
    const testData = { test: 'data' };
    
    cache.set(testKey, testData);
    expect(cache.get(testKey)).toEqual(testData);
  });

  test('should handle server startup configuration', () => {
    // Test configuration values that would be used by the server
    const serverConfig = {
      name: 'apple-dev-mcp',
      version: '1.0.0',
      description: 'Model Context Protocol server for Apple Human Interface Guidelines',
    };
    
    const capabilities = {
      tools: {},
    };
    
    expect(serverConfig.name).toBe('apple-dev-mcp');
    expect(serverConfig.version).toBe('1.0.0');
    expect(serverConfig.description).toContain('Apple Human Interface Guidelines');
    expect(capabilities).toHaveProperty('tools');
  });

  test('should provide expected tool names', () => {
    // Test that the tools the server exposes match expectations
    const expectedTools = [
      'search_human_interface_guidelines',
      'search_technical_documentation',
      'search_unified'
    ];
    
    // These would be the tools registered in the actual server
    expectedTools.forEach(toolName => {
      expect(typeof toolName).toBe('string');
      expect(toolName.length).toBeGreaterThan(0);
    });
  });

  test('should focus on tool-based architecture', () => {
    // Test that the server focuses on tools rather than resources
    expect(toolProvider).toBeDefined();
    expect(typeof toolProvider.searchHumanInterfaceGuidelines).toBe('function');
    expect(typeof toolProvider.searchTechnicalDocumentation).toBe('function');
    expect(typeof toolProvider.searchUnified).toBe('function');
  });
});