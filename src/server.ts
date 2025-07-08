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
import { CrawleeHIGService } from './services/crawlee-hig.service.js';
import { HIGResourceProvider } from './resources.js';
import { HIGToolProvider } from './tools.js';
import { HIGStaticContentProvider } from './static-content.js';
import { AppleDevAPIClient } from './services/apple-dev-api-client.service.js';
import { UpdateCheckerService } from './services/update-checker.service.js';

class AppleHIGMCPServer {
  private server: Server;
  private cache: HIGCache;
  private crawleeService: CrawleeHIGService;
  private staticContentProvider: HIGStaticContentProvider;
  private resourceProvider: HIGResourceProvider;
  private toolProvider: HIGToolProvider;
  private appleDevAPIClient: AppleDevAPIClient;
  private updateCheckerService: UpdateCheckerService;
  private useStaticContent: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'Apple Ecosystem MCP',
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
    // Validate environment
    await this.validateEnvironment();
    
    // Initialize static content if available
    await this.initializeStaticContent();

    // Initialize components
    this.cache = new HIGCache(3600); // 1 hour default TTL
    this.crawleeService = new CrawleeHIGService(this.cache);
    this.staticContentProvider = new HIGStaticContentProvider();
    this.appleDevAPIClient = new AppleDevAPIClient(this.cache);
    this.updateCheckerService = new UpdateCheckerService(this.cache, this.staticContentProvider);
    this.resourceProvider = new HIGResourceProvider(this.crawleeService, this.cache, this.staticContentProvider);
    this.toolProvider = new HIGToolProvider(this.crawleeService, this.cache, this.resourceProvider, this.staticContentProvider, this.appleDevAPIClient);

    this.setupHandlers();
  }

  /**
   * Validate runtime environment and configuration
   */
  private async validateEnvironment(): Promise<void> {
    const requiredNodeVersion = '18.0.0';
    const currentVersion = process.version.slice(1); // Remove 'v' prefix
    
    if (this.compareVersions(currentVersion, requiredNodeVersion) < 0) {
      throw new Error(`Node.js ${requiredNodeVersion} or higher is required. Current version: ${process.version}`);
    }

    // Validate dependencies are available
    try {
      await import('@crawlee/playwright');
      await import('playwright');
      await import('node-cache');
    } catch {
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
            name: 'list_technologies',
            description: 'List available Apple technologies, frameworks, and symbols',
            inputSchema: {
              type: 'object',
              properties: {
                includeDesignMapping: {
                  type: 'boolean',
                  description: 'Include related HIG design sections',
                  default: false,
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'],
                  description: 'Filter by target platform',
                },
                category: {
                  type: 'string',
                  enum: ['framework', 'symbol', 'all'],
                  description: 'Filter by technology category',
                  default: 'all',
                },
              },
              required: [],
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
            name: 'check_updates',
            description: 'Check for available updates for git repository, static content, and API documentation',
            inputSchema: {
              type: 'object',
              properties: {
                sources: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['git-repository', 'hig-static', 'api-documentation'],
                  },
                  description: 'Sources to check for updates',
                  default: ['git-repository', 'hig-static', 'api-documentation'],
                },
                includeChangelog: {
                  type: 'boolean',
                  description: 'Include changelog information when available',
                  default: false,
                },
              },
              required: [],
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
            name: 'search_wildcard',
            description: 'Advanced wildcard pattern search with * and ? support across design and technical documentation',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Wildcard pattern (* matches any sequence, ? matches single character)',
                },
                searchType: {
                  type: 'string',
                  enum: ['design', 'technical', 'both'],
                  description: 'Type of content to search',
                  default: 'both',
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
                  description: 'Filter by HIG category (design search only)',
                },
                framework: {
                  type: 'string',
                  description: 'Filter by framework name (technical search only)',
                },
                maxResults: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  default: 25,
                  description: 'Maximum number of results to return',
                },
                caseSensitive: {
                  type: 'boolean',
                  description: 'Enable case-sensitive pattern matching',
                  default: false,
                },
                wholeWordMatch: {
                  type: 'boolean',
                  description: 'Match whole words only',
                  default: false,
                },
              },
              required: ['pattern'],
            },
          },
          {
            name: 'get_cross_references',
            description: 'Get cross-reference mappings between design guidelines and technical implementations',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Component name or concept to find cross-references for',
                },
                type: {
                  type: 'string',
                  enum: ['component', 'concept', 'implementation'],
                  description: 'Type of cross-reference lookup',
                  default: 'component',
                },
                platform: {
                  type: 'string',
                  enum: ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'],
                  description: 'Filter by Apple platform',
                },
                framework: {
                  type: 'string',
                  description: 'Filter by framework name',
                },
                includeRelated: {
                  type: 'boolean',
                  description: 'Include related components and concepts',
                  default: true,
                },
                maxResults: {
                  type: 'number',
                  minimum: 1,
                  maximum: 50,
                  default: 20,
                  description: 'Maximum number of cross-references to return',
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

          case 'get_design_tokens': {
            result = await this.toolProvider.getDesignTokens(args as any);
            break;
          }

          case 'get_accessibility_requirements': {
            result = await this.toolProvider.getAccessibilityRequirements(args as any);
            break;
          }

          case 'get_technical_documentation': {
            result = await this.toolProvider.getTechnicalDocumentation(args as any);
            break;
          }

          case 'list_technologies': {
            result = await this.toolProvider.listTechnologies(args as any);
            break;
          }

          case 'search_technical_documentation': {
            result = await this.toolProvider.searchTechnicalDocumentation(args as any);
            break;
          }

          case 'check_updates': {
            result = await this.toolProvider.checkUpdates(args as any);
            break;
          }

          case 'search_unified': {
            result = await this.toolProvider.searchUnified(args as any);
            break;
          }

          case 'search_wildcard': {
            result = await this.toolProvider.searchWithWildcards(args as any);
            break;
          }

          case 'get_cross_references': {
            result = await this.toolProvider.getCrossReferences(args as any);
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
        console.log('🍎 Apple Ecosystem MCP Server starting...');
        console.log('📖 Providing complete Apple development guidance:');
        console.log('   • Human Interface Guidelines (design principles)');
        console.log('   • Technical Documentation (API reference)');
        console.log('   • Unified search across both sources');
        console.log('ℹ️  This server respects Apple\'s content and provides fair use access');
        console.log('ℹ️  for educational and development purposes.');
        console.log('');
      }
      
      // Initialize the server components
      await this.initialize();

      // Check for updates on startup (non-blocking)
      this.updateCheckerService.checkAndNotifyUpdates().catch(() => {
        // Silent fail - don't crash on startup update check issues
      });

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Apple Ecosystem MCP Server is ready!`);
        console.log(`   • Design Guidelines: ${this.useStaticContent ? 'Static Content' : 'Live Scraping'}`);
        console.log(`   • Technical Documentation: Apple API (cached)`);
        console.log(`   • Tools: ${this.toolProvider ? '11 tools available' : 'Initializing...'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Always log startup errors
      console.error('💥 Failed to start Apple Ecosystem MCP Server:', errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
      
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  // console.log('\n🛑 Shutting down Apple Ecosystem MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // console.log('\n🛑 Shutting down Apple Ecosystem MCP Server...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  // Always start the server regardless of arguments
  const server = new AppleHIGMCPServer();
  server.run().catch((error) => {
    console.error('💥 Failed to start Apple Ecosystem MCP Server:', error);
    process.exit(1);
  });
}