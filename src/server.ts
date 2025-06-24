#!/usr/bin/env node

/**
 * Apple Human Interface Guidelines MCP Server
 * 
 * A Model Context Protocol server that provides up-to-date access to Apple's
 * Human Interface Guidelines, including the latest Liquid Glass design system.
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

class AppleHIGMCPServer {
  private server: Server;
  private cache: HIGCache;
  private scraper: HIGScraper;
  private resourceProvider: HIGResourceProvider;
  private toolProvider: HIGToolProvider;

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

    // Initialize components
    this.cache = new HIGCache(3600); // 1 hour default TTL
    this.scraper = new HIGScraper(this.cache);
    this.resourceProvider = new HIGResourceProvider(this.scraper, this.cache);
    this.toolProvider = new HIGToolProvider(this.scraper, this.cache, this.resourceProvider);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        console.log('[AppleHIGMCP] Listing resources...');
        const resources = await this.resourceProvider.listResources();
        
        return {
          resources: resources.map(resource => ({
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType,
          }))
        };
      } catch (error) {
        console.error('[AppleHIGMCP] Failed to list resources:', error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const { uri } = request.params;
        console.log(`[AppleHIGMCP] Reading resource: ${uri}`);
        
        const resource = await this.resourceProvider.getResource(uri);
        
        if (!resource) {
          throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
        }

        return {
          contents: [{
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.content,
          }]
        };
      } catch (error) {
        console.error(`[AppleHIGMCP] Failed to read resource ${request.params.uri}:`, error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        console.log(`[AppleHIGMCP] Calling tool: ${name}`);

        switch (name) {
          case 'search_guidelines': {
            const result = await this.toolProvider.searchGuidelines(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          }

          case 'get_component_spec': {
            const result = await this.toolProvider.getComponentSpec(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          }

          case 'compare_platforms': {
            const result = await this.toolProvider.comparePlatforms(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          }

          case 'get_latest_updates': {
            const result = await this.toolProvider.getLatestUpdates(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[AppleHIGMCP] Tool call failed for ${request.params.name}:`, error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  async run(): Promise<void> {
    console.log('🍎 Apple Human Interface Guidelines MCP Server starting...');
    console.log('📖 Providing up-to-date access to Apple design guidelines');
    console.log('✨ Including the latest Liquid Glass design system from WWDC 2025');
    console.log('');
    console.log('ℹ️  This server respects Apple\'s content and provides fair use access');
    console.log('ℹ️  for educational and development purposes.');
    console.log('');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('🚀 Apple HIG MCP Server is ready!');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Apple HIG MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Apple HIG MCP Server...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AppleHIGMCPServer();
  server.run().catch((error) => {
    console.error('💥 Failed to start Apple HIG MCP Server:', error);
    process.exit(1);
  });
}