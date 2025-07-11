#!/usr/bin/env node

/**
 * Apple Dev MCP Server
 * 
 * A Model Context Protocol server that provides complete Apple development guidance,
 * combining Human Interface Guidelines (design) with Technical Documentation (API).
 * 
 * @version 2.0.0
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
import { CrawleeHIGService } from './services/crawlee-hig.service.js';
import { HIGResourceProvider } from './resources.js';
import { HIGToolProvider } from './tools.js';
import { HIGStaticContentProvider } from './static-content.js';
import { AppleDevAPIClient } from './services/apple-dev-api-client.service.js';

class AppleHIGMCPServer {
  private server: Server;
  private cache: HIGCache;
  private crawleeService: CrawleeHIGService;
  private staticContentProvider: HIGStaticContentProvider;
  private resourceProvider: HIGResourceProvider;
  private toolProvider: HIGToolProvider;
  private appleDevAPIClient: AppleDevAPIClient;
  private useStaticContent: boolean = false;

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
    try {
      // Only do minimal validation during startup to avoid DXT timeout
      // All heavy initialization is deferred until first request
      
      // Quick environment check (no external dependencies or imports)
      const requiredNodeVersion = '18.0.0';
      const currentVersion = process.version.slice(1);
      if (this.compareVersions(currentVersion, requiredNodeVersion) < 0) {
        throw new Error(`Node.js ${requiredNodeVersion} or higher is required. Current version: ${process.version}`);
      }

      // Initialize components with lazy loading - don't access content directory yet
      this.staticContentProvider = new HIGStaticContentProvider();
      this.cache = new HIGCache(3600);
      this.crawleeService = new CrawleeHIGService(this.cache);
      this.appleDevAPIClient = new AppleDevAPIClient(this.cache);
      this.resourceProvider = new HIGResourceProvider(this.crawleeService, this.cache, this.staticContentProvider);
      this.toolProvider = new HIGToolProvider(this.crawleeService, this.cache, this.resourceProvider, this.staticContentProvider, this.appleDevAPIClient);

      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize Apple Dev MCP Server:', error);
      throw error;
    }
  }

  /**
   * Lazy initialization of static content (called on first request)
   */
  private async initializeContentOnDemand(): Promise<void> {
    if (this.useStaticContent !== false) {
      return; // Already initialized or attempted
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Static content initialization timeout')), 10000);
      });

      const initPromise = (async () => {
        const isAvailable = await this.staticContentProvider.isAvailable();
        if (isAvailable) {
          await this.staticContentProvider.initialize();
          this.useStaticContent = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Static HIG content initialized on demand');
          }
        } else {
          this.useStaticContent = false;
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️  Static content not available. Using live scraping fallback.');
          }
        }
      })();

      await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      this.useStaticContent = false;
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Failed to initialize static content:', error);
        console.log('ℹ️  Falling back to live scraping.');
      }
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
   * Set up MCP request handlers with comprehensive error handling
   */
  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        // Initialize content on first request
        await this.initializeContentOnDemand();
        
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
        // Initialize content on first request
        await this.initializeContentOnDemand();
        
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
            name: 'get_design_tokens',
            description: 'Get design system values (colors, spacing, typography) for specific components',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component name (e.g., "Button", "Navigation Bar", "Tab Bar")',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
                  description: 'Target platform',
                },
                tokenType: {
                  type: 'string',
                  enum: ['colors', 'spacing', 'typography', 'dimensions', 'all'],
                  description: 'Type of design tokens to retrieve',
                  default: 'all'
                }
              },
              required: ['component', 'platform'],
            },
          },
          {
            name: 'get_accessibility_requirements',
            description: 'Get accessibility requirements and guidelines for specific components',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component name (e.g., "Button", "Navigation Bar", "Tab Bar")',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
                  description: 'Target platform',
                },
              },
              required: ['component', 'platform'],
            },
          },
          {
            name: 'get_technical_documentation',
            description: 'Get Apple API documentation for frameworks and symbols with optional design guidance',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Documentation path (e.g., "documentation/SwiftUI/Button") or symbol path',
                },
                includeDesignGuidance: {
                  type: 'boolean',
                  description: 'Include related design guidelines from HIG',
                  default: false,
                },
                includeRelatedSymbols: {
                  type: 'boolean',
                  description: 'Include related symbols and references',
                  default: true,
                },
                includeCodeExamples: {
                  type: 'boolean',
                  description: 'Include code examples when available',
                  default: true,
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'search_technical_documentation',
            description: 'Search Apple technical documentation with wildcard support',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (supports wildcards: * and ?)',
                },
                framework: {
                  type: 'string',
                  description: 'Search within specific framework only',
                },
                symbolType: {
                  type: 'string',
                  description: 'Filter by symbol type (class, protocol, struct, etc.)',
                },
                platform: {
                  type: 'string',
                  description: 'Filter by platform (iOS, macOS, etc.)',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results (default: 20)',
                  minimum: 1,
                  maximum: 100,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'search_unified',
            description: 'Unified search across both HIG design guidelines and technical documentation with cross-references',
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
                includeDesign: {
                  type: 'boolean',
                  description: 'Include design guidelines in search',
                  default: true,
                },
                includeTechnical: {
                  type: 'boolean',
                  description: 'Include technical documentation in search',
                  default: true,
                },
                maxResults: {
                  type: 'number',
                  minimum: 1,
                  maximum: 50,
                  default: 20,
                  description: 'Maximum number of unified results to return',
                },
                maxDesignResults: {
                  type: 'number',
                  minimum: 1,
                  maximum: 25,
                  default: 10,
                  description: 'Maximum number of design results to fetch',
                },
                maxTechnicalResults: {
                  type: 'number',
                  minimum: 1,
                  maximum: 25,
                  default: 10,
                  description: 'Maximum number of technical results to fetch',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'generate_fused_guidance',
            description: 'Generate comprehensive fused guidance combining design principles with technical implementation details',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component name (e.g., "Button", "Navigation Bar", "Text Field")',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
                  description: 'Target platform for the component',
                  default: 'iOS',
                },
                framework: {
                  type: 'string',
                  description: 'Framework to use (e.g., "SwiftUI", "UIKit", "AppKit")',
                },
                useCase: {
                  type: 'string',
                  description: 'Specific use case or context for the component',
                },
                complexity: {
                  type: 'string',
                  enum: ['beginner', 'intermediate', 'advanced'],
                  description: 'Complexity level for the guidance',
                  default: 'intermediate',
                },
                includeCodeExamples: {
                  type: 'boolean',
                  description: 'Include code examples in the guidance',
                  default: true,
                },
                includeAccessibility: {
                  type: 'boolean',
                  description: 'Include accessibility guidance',
                  default: true,
                },
                includeTestingGuidance: {
                  type: 'boolean',
                  description: 'Include testing recommendations',
                  default: true,
                },
                includeStepByStep: {
                  type: 'boolean',
                  description: 'Include step-by-step implementation guide',
                  default: true,
                },
              },
              required: ['component'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Initialize content on first request
        await this.initializeContentOnDemand();
        
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;
        
        switch (name) {
          case 'search_guidelines': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.searchGuidelines(args as any);
            break;
          }

          case 'get_component_spec': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.getComponentSpec(args as any);
            break;
          }

          case 'get_design_tokens': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.getDesignTokens(args as any);
            break;
          }

          case 'get_accessibility_requirements': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.getAccessibilityRequirements(args as any);
            break;
          }

          case 'get_technical_documentation': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.getTechnicalDocumentation(args as any);
            break;
          }


          case 'search_technical_documentation': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.searchTechnicalDocumentation(args as any);
            break;
          }


          case 'search_unified': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.searchUnified(args as any);
            break;
          }



          case 'generate_fused_guidance': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.toolProvider.generateFusedGuidance(args as any);
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
      // Minimal startup logging for fast DXT validation
      if (process.env.NODE_ENV === 'development') {
        console.log('🍎 Apple Dev MCP Server starting (fast mode)...');
      }
      
      // Initialize the server components (minimal, fast startup)
      await this.initialize();

      const transport = new StdioServerTransport();
      
      // Add error handling for transport
      transport.onclose = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 MCP transport closed');
        }
      };

      transport.onerror = (error) => {
        console.error('🔥 MCP transport error:', error);
      };

      await this.server.connect(transport);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Apple Dev MCP Server ready! Content will initialize on first request.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Always log startup errors to stderr for Claude Desktop debugging
      console.error('💥 Failed to start Apple Dev MCP Server:', errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
      
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  // console.log('\n🛑 Shutting down Apple Dev MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // console.log('\n🛑 Shutting down Apple Dev MCP Server...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  // Always start the server regardless of arguments
  const server = new AppleHIGMCPServer();
  server.run().catch((error) => {
    console.error('💥 Failed to start Apple Dev MCP Server:', error);
    process.exit(1);
  });
}