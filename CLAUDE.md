# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apple Dev MCP (Model Context Protocol) server that provides complete Apple development guidance, combining Human Interface Guidelines (design principles) with Technical Documentation (API reference) for all Apple platforms. It serves comprehensive content through both traditional MCP integration and modern Desktop Extensions (.dxt) for AI assistants like Claude.

## Development Commands

### Build and Test
- `npm run build` - Compile TypeScript to JavaScript in `dist/`
- `npm run clean:build` - Clean and rebuild the project
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Fix linting issues automatically

### Development
- `npm run dev` - Start development server using tsx
- `npm start` - Run compiled server from `dist/`
- `npm run test:automation` - Automated MCP server testing

### Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector dist/server.js
```

## Architecture Overview

The project uses a static content architecture with pre-built markdown files and optimized search indices. All content is pre-processed and cached for instant access without external dependencies:

### Core Components

1. **AppleHIGMCPServer** (`src/server.ts`) - Main MCP server entry point
   - Coordinates all components and handles MCP protocol communication
   - Sets up request handlers for resources and tools
   - Manages graceful startup/shutdown
   - Initializes static content services

2. **StaticContentSearchService** (`src/services/static-content-search.service.ts`) - Primary content search engine
   - Fast search across 113+ pre-processed Apple HIG sections
   - Smart keyword matching with synonym expansion
   - Platform-specific filtering and relevance scoring
   - No external dependencies required

3. **HIGCache** (`src/cache.ts`) - Smart caching layer
   - TTL-based caching with graceful degradation
   - Backup cache entries for offline resilience 
   - Two-tier caching: fresh data + stale fallback data
   - Methods: `getWithGracefulFallback()`, `setWithGracefulDegradation()`

4. **HIGResourceProvider** (`src/resources.ts`) - MCP Resources implementation
   - Serves structured content via URIs like `hig://ios`, `hig://ios/buttons`
   - Platform-specific and category-specific resource organization
   - Uses static content from pre-built markdown files
   - Generates comprehensive content with proper Apple attribution

5. **HIGToolsService** (`src/services/tools.service.ts`) - MCP Tools implementation
   - Interactive search with advanced keyword matching and intent recognition
   - 4 focused tools for design guidelines and technical documentation
   - Multi-factor relevance scoring (keyword + structure + context + synonym expansion)
   - Enhanced keyword search with synonym expansion and intelligent matching
   - Optimized for fast response times without external model dependencies

6. **ContentProcessor** (`src/services/content-processor.service.ts`) - Content processing pipeline
   - Markdown content structuring and validation
   - Quality assurance for pre-processed content
   - Apple-specific content pattern recognition and enhancement
   - Structured content organization (overview, guidelines, examples, specifications)

7. **AppleDevAPIClient** (`src/services/apple-dev-api-client.service.ts`) - Technical documentation integration
   - Provides access to Apple's API documentation and technical references
   - Integrates with design guidelines for comprehensive development guidance
   - Caches technical content for performance optimization

8. **Desktop Extension Support** (`scripts/build-extension.js`, `manifest.json`) - Modern distribution
   - Builds DXT-compliant Desktop Extensions for one-click installation
   - Packages server and dependencies in portable .dxt format
   - Includes proper manifest, icon, and validation for Claude Desktop integration

### Data Flow

```
MCP Client → AppleHIGMCPServer → HIGResourceProvider/HIGToolsService
                                            ↓
                                   StaticContentSearchService → HIGCache → Pre-built Content

Search Flow:
Query → HIGToolsService → Advanced Keyword Matching + Synonym Expansion
                            ↓
                    Multi-factor Scoring (keyword + synonym + structure + context)
                            ↓
                    Ranked Results (with intent recognition and boost factors)
```

### Content Processing and Delivery

```
User Request → StaticContentSearchService → Search Index Lookup
                        ↓
                Pre-built Markdown Files (113+ sections) → Content Filtering
                        ↓
                Relevance Scoring + Context Matching
                        ↓
                HIGCache (with graceful degradation)
                        ↓
                Structured Content Response
```

### Key Patterns

**Static Content Architecture**: The system serves 113+ pre-processed Apple HIG sections from optimized markdown files, ensuring instant responses and complete coverage.

**Pre-built Search Indices**: Uses generated search metadata for fast keyword matching and content lookup without external dependencies.

**Graceful Degradation**: Multiple fallback layers ensure availability - static content → cached responses → built-in fallback content.

**Content Quality Assurance**: Pre-validated markdown content ensures consistent quality and format across all Apple platforms and sections.

**Enhanced Keyword Search**: Multi-factor relevance scoring combines advanced keyword matching with synonym expansion, content structure analysis, and contextual relevance for superior search results.

**Intent Recognition**: Query analysis extracts user intent (find_component, find_guideline, compare_platforms, etc.) and entities (components, platforms, properties) for more accurate results.

**Optimized Performance**: The system uses intelligent caching with TTL-based expiration and graceful degradation for consistent performance.

**Efficient Content Delivery**: Direct API calls for technical documentation and instant static content serving without rate limiting concerns.

**Attribution Compliance**: All content includes proper Apple attribution and fair use notices.

## Platform Support

The server supports all Apple platforms with specific categories:
- **Platforms**: iOS, macOS, watchOS, tvOS, visionOS, universal
- **Categories**: foundations, layout, navigation, presentation, selection-and-input, status, system-capabilities, visual-design, icons-and-images, color-and-materials, typography, motion, technologies

## Testing Strategy

### Unit Tests Structure
- `__tests__/cache.test.ts` - Cache functionality and TTL behavior
- `__tests__/static-content.test.ts` - Static content loading and search functionality
- `__tests__/resources.test.ts` - MCP resource generation
- `__tests__/tools.test.ts` - MCP tool functionality
- `__tests__/server.test.ts` - Integration testing
- `__tests__/content-fusion.test.ts` - Content fusion capabilities
- `__tests__/desktop-extension.test.ts` - Desktop Extension building and validation
- `__tests__/comprehensive-coverage.test.ts` - 220+ search scenario coverage

### Mocking
- `__mocks__/node-fetch.ts` - HTTP request mocking for tests
- Tests should mock external dependencies and focus on business logic

## Content Management

### Static Content Generation
The system uses GitHub Actions to generate optimized static content:

**Content Structure:**
```
content/
├── platforms/           # Platform-specific markdown files
│   ├── ios/
│   ├── macos/
│   └── ...
├── metadata/           # Search indices and metadata
│   ├── search-index.json
│   ├── cross-references.json
│   └── content-metadata.json
```

**Generation Process:**
1. **113+ pre-processed HIG sections** across all Apple platforms
2. **AI-friendly markdown** with structured front matter metadata
3. **Optimized search indices** for instant keyword matching
4. **Cross-reference mappings** between related sections
5. **Optimized content delivery** without external image dependencies

**Scheduled Updates:**
- **Every 4 months** via GitHub Action
- **Manual triggers** for immediate updates
- **Content validation** ensures quality and completeness

### Built-in Fallback Content Strategy
When static content is unavailable, the system provides built-in contextual fallback content:
- Button guidelines → `getButtonFallbackContent()`
- Navigation → `getNavigationFallbackContent()`
- Color → `getColorFallbackContent()`
- Typography → `getTypographyFallbackContent()`
- Layout → `getLayoutFallbackContent()`
- General → `getFallbackContent()`

### Content Coverage
The system provides comprehensive coverage of 113+ Apple HIG sections across all platforms. Content is organized by:
1. **Platform classification** (iOS, macOS, watchOS, tvOS, visionOS, universal)
2. **Category organization** (foundations, layout, navigation, etc.)
3. **Cross-platform references** for consistent design patterns

## Error Handling

The system uses multiple layers of error resilience:
1. **Graceful cache degradation** - serves stale content when fresh responses fail
2. **Built-in fallback content** - contextual content when static content is unavailable  
3. **MCP error wrapping** - proper error codes for the MCP protocol
4. **Static content backup** - local content always available without network dependencies

## Configuration

### Static Content Configuration
- Content location: `content/platforms/` directory structure
- Search indices: `content/metadata/` for fast lookups
- Cross-references: Pre-built relationship mappings
- No rate limiting required for static content access

### Cache Configuration
- Default TTL: 1 hour for normal content
- Resource list cache: 2 hours
- Section content cache: 2 hours
- Graceful degradation: 24x longer TTL for backup entries

## Static Content Architecture

### Performance Benefits
- **Instant responses**: No network delays or rate limiting
- **Unlimited concurrency**: Serves multiple requests simultaneously
- **Predictable performance**: Consistent response times across all queries
- **Offline capability**: Full functionality without internet connectivity

### Reliability Benefits
- **99.9% availability**: No dependency on Apple website status
- **Immune to changes**: Unaffected by Apple website structure modifications
- **Version controlled**: All content changes tracked and reviewable
- **Deterministic behavior**: Consistent results across environments

### Content Management
- **Comprehensive coverage**: 113+ sections across all Apple platforms
- **Regular updates**: Automated content refresh every 4 months
- **Quality assurance**: Pre-validated and structured content
- **Technical integration**: Direct API calls for Apple developer documentation

## Maintenance Notes

### Expected Maintenance
- **Static content updates**: Automatic every 4 months via GitHub Actions
- **Manual content updates**: When Apple announces major design changes
- **Search index optimization**: Periodic improvements to search algorithms
- **New platform support**: Add new platforms and update content structure

### Content Update System
The system maintains static content through:
- **Pre-built markdown files**: 113+ sections ready for instant access
- **Optimized search indices**: Fast keyword and semantic matching
- **Cross-reference metadata**: Relationship mappings between sections
- **Content validation**: Quality assurance for all Apple HIG content

**Update Schedule:**
- **Quarterly updates**: Every 4 months via automated process
- **Emergency updates**: When Apple releases major design changes
- **Version tracking**: All content changes reviewed and documented

### System Validation
The system provides built-in validation for:
- **Static content availability**: Verify all 113+ sections are accessible
- **Search index integrity**: Ensure search metadata is complete
- **MCP server integration**: Test all tools and resources
- **Cross-reference accuracy**: Validate relationship mappings

When issues occur:
1. Check if static content directory structure is intact
2. Verify search indices in `content/metadata/` are current
3. Test MCP server functionality with automated test suite
4. Review content quality and completeness metrics

## Desktop Extension Distribution

### Extension Building
The project supports modern Desktop Extension (.dxt) distribution alongside traditional npm packages:

```bash
# Build extension
npm run build:extension

# Creates: apple-dev-mcp.dxt (0.78 MB)
# Contains: server, content, dependencies, manifest, icon
```

### Extension Structure
- **manifest.json** - DXT specification compliant metadata
- **icon.png** - Abstract design (trademark-safe)
- **dist/server.js** - Compiled MCP server
- **content/** - Static Apple content
- **package.json** - Dependencies and metadata

### Distribution Methods
1. **Desktop Extension (Recommended)**: One-click installation via .dxt file
2. **Traditional NPM**: Standard MCP server installation
3. **Dual Distribution**: Both methods supported simultaneously

### Installation Process
1. User downloads apple-dev-mcp.dxt from GitHub releases
2. Double-click installs extension in Claude Desktop
3. Restart Claude Desktop
4. Full Apple development guidance available instantly

### Key Benefits
- **Zero Configuration**: No JSON editing required
- **Instant Access**: Pre-bundled content and dependencies
- **Automatic Updates**: Through GitHub releases
- **Professional Distribution**: Modern extension ecosystem integration