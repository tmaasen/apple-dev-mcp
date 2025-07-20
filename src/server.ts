#!/usr/bin/env node

/**
 * Apple Dev MCP Server
 * 
 * A Model Context Protocol server that provides complete Apple development guidance,
 * combining Human Interface Guidelines (design) with Technical Documentation (API).
 * 
 * @author Tanner Maasen
 * @license MIT
 */

// Aggressively silence all logging to prevent MCP protocol interference
process.env.CRAWLEE_LOG_LEVEL = 'OFF';
process.env.DEBUG = '';
process.env.PLAYWRIGHT_BROWSERS_PATH = '';
process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
process.env.CRAWLEE_VERBOSE_LOG = '0';
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';

// Silence console methods during MCP mode
if (process.env.NODE_ENV !== 'development') {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.error = () => {}; // Also silence error logs
}

// Override process.stderr.write to catch any stderr leakage
const originalStderrWrite = process.stderr.write;
process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
  // Only allow MCP protocol errors through, block everything else
  if (typeof chunk === 'string' && chunk.includes('jsonrpc')) {
    return originalStderrWrite.call(this, chunk, encoding, callback);
  }
  // Silently ignore all other stderr output
  if (typeof callback === 'function') callback();
  return true;
};

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
import { CrawleeHIGService } from './services/crawlee-hig.service.js';
import { HIGResourceProvider } from './resources.js';
import { HIGToolProvider } from './tools.js';
import { AppleContentAPIClient } from './services/apple-content-api-client.service.js';

class AppleHIGMCPServer {
  private server: Server;
  private cache: HIGCache;
  private crawleeService: CrawleeHIGService;
  private resourceProvider: HIGResourceProvider;
  private toolProvider: HIGToolProvider;
  private appleContentAPIClient: AppleContentAPIClient;

  constructor() {
    this.server = new Server(
      {
        name: 'Apple Dev MCP',
        version: '2.0.0',
        description: 'Complete Apple development guidance: Human Interface Guidelines (design) + Technical Documentation (API) for iOS, macOS, watchOS, tvOS, and visionOS',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );
  }

  /**
   * Initialize the server asynchronously
   */
  async initialize(): Promise<void> {
      // Only do minimal validation during startup to avoid DXT timeout
      // All heavy initialization is deferred until first request
      
      // Quick environment check (no external dependencies or imports)
      const requiredNodeVersion = '18.0.0';
      const currentVersion = process.version.slice(1);
      if (this.compareVersions(currentVersion, requiredNodeVersion) < 0) {
        throw new Error(`Node.js ${requiredNodeVersion} or higher is required. Current version: ${process.version}`);
      }

      // Initialize components with lazy loading - don't access content directory yet
      this.cache = new HIGCache(3600);
      this.crawleeService = new CrawleeHIGService(this.cache);
      this.appleContentAPIClient = new AppleContentAPIClient(this.cache);
      this.resourceProvider = new HIGResourceProvider(this.crawleeService, this.cache);
      this.toolProvider = new HIGToolProvider(this.crawleeService, this.cache, this.resourceProvider, this.appleContentAPIClient);

      this.setupHandlers();
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
   * Set up MCP request handlers with comprehensive error handling
   */
  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list resources: ${errorMessage}`
        );
      }
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const { uri } = request.params;
        
        // Validate URI format
        if (!uri || typeof uri !== 'string') {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid or missing URI parameter');
        }
        
        if (!uri.startsWith('hig://')) {
          throw new McpError(ErrorCode.InvalidRequest, `Unsupported URI scheme. Expected 'hig://', got: ${uri}`);
        }
        
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
            name: 'search_human_interface_guidelines',
            title: 'Search HIG Guidelines',
            description: 'Search Apple Human Interface Guidelines by keywords',
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
                  description: 'Optional: Filter by Apple platform',
                },
              },
              required: ['query'],
            },
          },
          // TODO: Future release - re-enable with static content integration
          // For now, users should search "accessibility" + component through regular HIG search
          // {
          //   name: 'get_accessibility_requirements',
          //   title: 'Get Accessibility Requirements',
          //   description: 'Get accessibility requirements and guidelines for specific components',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       component: {
          //         type: 'string',
          //         description: 'Component name (e.g., "Button", "Navigation Bar", "Tab Bar")',
          //       },
          //       platform: {
          //         type: 'string',
          //         enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
          //         description: 'Target platform',
          //       },
          //     },
          //     required: ['component', 'platform'],
          //   },
          // },
          {
            name: 'search_technical_documentation',
            title: 'Search Technical Documentation',
            description: 'Search Apple technical documentation and API references',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (API names, symbols, frameworks)',
                },
                framework: {
                  type: 'string',
                  description: 'Optional: Search within specific framework (e.g., "SwiftUI", "UIKit")',
                },
                platform: {
                  type: 'string',
                  description: 'Optional: Filter by platform (iOS, macOS, etc.)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'search_unified',
            title: 'Unified Search',
            description: 'Unified search across both HIG design guidelines and technical documentation',
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
                  description: 'Optional: Filter by Apple platform',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        // Validate tool name
        if (!name || typeof name !== 'string') {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid or missing tool name');
        }
        
        // Validate arguments
        if (args && typeof args !== 'object') {
          throw new McpError(ErrorCode.InvalidRequest, 'Tool arguments must be an object');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;
        
        switch (name) {
          case 'search_human_interface_guidelines': {
            result = await this.toolProvider.searchHumanInterfaceGuidelines(args as any);
            break;
          }
          // TODO: Future release - re-enable with static content integration
          // case 'get_accessibility_requirements': {
          //   result = await this.toolProvider.getAccessibilityRequirements(args as any);
          //   break;
          // }
          case 'search_technical_documentation': {
            result = await this.toolProvider.searchTechnicalDocumentation(args as any);
            break;
          }
          case 'search_unified': {
            result = await this.toolProvider.searchUnified(args as any);
            break;
          }
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
      // Minimal startup logging for fast DXT validation
      
      // Initialize the server components (minimal, fast startup)
      await this.initialize();

      const transport = new StdioServerTransport();
      
      // Add error handling for transport
      transport.onclose = () => {
      };

      transport.onerror = (_error) => {
      };

      await this.server.connect(transport);
    } catch {
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  // Always start the server regardless of arguments
  const server = new AppleHIGMCPServer();
  server.run().catch(() => {
    process.exit(1);
  });
}