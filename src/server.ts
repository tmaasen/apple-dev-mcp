#!/usr/bin/env node

/**
 * Apple Human Interface Guidelines MCP Server
 * 
 * A Model Context Protocol server that provides up-to-date access to Apple's
 * Human Interface Guidelines with comprehensive design system coverage.
 * 
 * @version 1.0.0
 * @author Tanner Maasen
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { HIGCache } from './cache.js';
import { HIGScraper } from './scraper.js';
import { HIGResourceProvider } from './resources.js';
import { HIGToolProvider } from './tools.js';
import { HIGStaticContentProvider } from './static-content.js';

class AppleHIGMCPServer {
  private server: Server;
  private cache: HIGCache;
  private scraper: HIGScraper;
  private staticContentProvider: HIGStaticContentProvider;
  private resourceProvider: HIGResourceProvider;
  private toolProvider: HIGToolProvider;
  private useStaticContent: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'apple-hig-mcp',
        version: '1.0.0',
        description: 'Model Context Protocol server for Apple Human Interface Guidelines',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Validate environment
    this.validateEnvironment();
    
    // Initialize static content if available
    this.initializeStaticContent();

    // Initialize components
    this.cache = new HIGCache(3600); // 1 hour default TTL
    this.scraper = new HIGScraper(this.cache);
    this.staticContentProvider = new HIGStaticContentProvider();
    this.resourceProvider = new HIGResourceProvider(this.scraper, this.cache, this.staticContentProvider);
    this.toolProvider = new HIGToolProvider(this.scraper, this.cache, this.resourceProvider, this.staticContentProvider);

    this.setupHandlers();
  }

  /**
   * Validate runtime environment and configuration
   */
  private validateEnvironment(): void {
    const requiredNodeVersion = '18.0.0';
    const currentVersion = process.version.slice(1); // Remove 'v' prefix
    
    if (this.compareVersions(currentVersion, requiredNodeVersion) < 0) {
      throw new Error(`Node.js ${requiredNodeVersion} or higher is required. Current version: ${process.version}`);
    }

    // Validate dependencies are available
    try {
      require('cheerio');
      require('node-fetch');
      require('node-cache');
    } catch (error) {
      throw new Error(`Missing required dependencies. Run 'npm install' to install dependencies.`);
    }
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }
  
  /**
   * Initialize static content provider if available
   */
  private async initializeStaticContent(): Promise<void> {
    try {
      const isAvailable = await this.staticContentProvider.isAvailable();
      
      if (isAvailable) {
        await this.staticContentProvider.initialize();
        this.useStaticContent = true;
        
        // Check if content is stale
        const isStale = this.staticContentProvider.isContentStale();
        const metadata = this.staticContentProvider.getMetadata();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Static HIG content initialized');
          console.log(`📊 Content: ${metadata?.totalSections || 0} sections`);
          console.log(`📅 Last updated: ${metadata?.lastUpdated ? new Date(metadata.lastUpdated).toLocaleDateString() : 'unknown'}`);
          
          if (isStale) {
            console.log('⚠️  Content is stale (>6 months old). Consider running content generation.');
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️  Static content not available. Using live scraping fallback.');
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Failed to initialize static content:', error);
        console.log('ℹ️  Falling back to live scraping.');
      }
    }
  }

  /**
   * Set up MCP request handlers with comprehensive error handling
   */
  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const startTime = Date.now();
        const resources = await this.resourceProvider.listResources();
        const duration = Date.now() - startTime;
        
        // Log performance metrics (disabled in production to avoid console pollution)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AppleHIGMCP] Listed ${resources.length} resources in ${duration}ms`);
        }
        
        return {
          resources: resources.map(resource => ({
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType,
          }))
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error('[AppleHIGMCP] Failed to list resources:', error);
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list resources: ${errorMessage}`
        );
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const { uri } = request.params;
        const startTime = Date.now();
        
        // Validate URI format
        if (!uri || typeof uri !== 'string') {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid or missing URI parameter');
        }
        
        if (!uri.startsWith('hig://')) {
          throw new McpError(ErrorCode.InvalidRequest, `Unsupported URI scheme. Expected 'hig://', got: ${uri}`);
        }
        
        const resource = await this.resourceProvider.getResource(uri);
        const duration = Date.now() - startTime;
        
        if (!resource) {
          throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`[AppleHIGMCP] Read resource ${uri} in ${duration}ms`);
        }

        return {
          contents: [{
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.content,
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[AppleHIGMCP] Failed to read resource ${request.params.uri}:`, error);
        }
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource: ${errorMessage}`
        );
      }
    });

    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_guidelines',
            description: 'Search Apple Human Interface Guidelines by keywords, with optional platform and category filters',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (keywords, component names, design concepts)',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'],
                  description: 'Filter by Apple platform',
                },
                category: {
                  type: 'string',
                  enum: [
                    'foundations', 'layout', 'navigation', 'presentation',
                    'selection-and-input', 'status', 'system-capabilities',
                    'visual-design', 'icons-and-images', 'color-and-materials',
                    'typography', 'motion', 'technologies'
                  ],
                  description: 'Filter by HIG category',
                },
                limit: {
                  type: 'number',
                  minimum: 1,
                  maximum: 50,
                  default: 10,
                  description: 'Maximum number of results to return',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_component_spec',
            description: 'Get detailed specifications and guidelines for a specific UI component',
            inputSchema: {
              type: 'object',
              properties: {
                componentName: {
                  type: 'string',
                  description: 'Name of the UI component (e.g., "Button", "Navigation Bar", "Tab Bar")',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'],
                  description: 'Target platform for the component',
                },
              },
              required: ['componentName'],
            },
          },
          {
            name: 'compare_platforms',
            description: 'Compare how a UI component or design pattern differs across Apple platforms',
            inputSchema: {
              type: 'object',
              properties: {
                componentName: {
                  type: 'string',
                  description: 'Name of the component to compare across platforms',
                },
                platforms: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
                  },
                  minItems: 2,
                  description: 'Platforms to compare',
                },
              },
              required: ['componentName', 'platforms'],
            },
          },
          {
            name: 'get_latest_updates',
            description: 'Get the latest updates to Apple\'s Human Interface Guidelines, including Liquid Glass design system changes',
            inputSchema: {
              type: 'object',
              properties: {
                since: {
                  type: 'string',
                  format: 'date',
                  description: 'Get updates since this date (ISO format)',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'],
                  description: 'Filter updates by platform',
                },
                limit: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  default: 20,
                  description: 'Maximum number of updates to return',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        const startTime = Date.now();
        
        // Validate tool name
        if (!name || typeof name !== 'string') {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid or missing tool name');
        }
        
        // Validate arguments
        if (args && typeof args !== 'object') {
          throw new McpError(ErrorCode.InvalidRequest, 'Tool arguments must be an object');
        }

        let result: any;
        
        switch (name) {
          case 'search_guidelines': {
            result = await this.toolProvider.searchGuidelines(args as any);
            break;
          }

          case 'get_component_spec': {
            result = await this.toolProvider.getComponentSpec(args as any);
            break;
          }

          case 'compare_platforms': {
            result = await this.toolProvider.comparePlatforms(args as any);
            break;
          }

          case 'get_latest_updates': {
            result = await this.toolProvider.getLatestUpdates(args as any);
            break;
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        const duration = Date.now() - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AppleHIGMCP] Tool '${name}' executed in ${duration}ms`);
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[AppleHIGMCP] Tool call failed for ${request.params.name}:`, error);
        }
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Start the MCP server with proper error handling and logging
   */
  async run(): Promise<void> {
    try {
      // Development-only startup logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🍎 Apple Human Interface Guidelines MCP Server starting...');
        console.log('📖 Providing up-to-date access to Apple design guidelines');
        console.log('ℹ️  This server respects Apple\'s content and provides fair use access');
        console.log('ℹ️  for educational and development purposes.');
        console.log('');
      }
      
      // Initialize static content before starting the server
      await this.initializeStaticContent();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Apple HIG MCP Server is ready! (Mode: ${this.useStaticContent ? 'Static Content' : 'Live Scraping'})`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Always log startup errors
      console.error('💥 Failed to start Apple HIG MCP Server:', errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
      
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  // console.log('\n🛑 Shutting down Apple HIG MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // console.log('\n🛑 Shutting down Apple HIG MCP Server...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AppleHIGMCPServer();
  server.run().catch((_error) => {
    // console.error('💥 Failed to start Apple HIG MCP Server:', error);
    process.exit(1);
  });
}