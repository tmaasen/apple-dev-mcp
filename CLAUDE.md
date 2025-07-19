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
- `npm run health-check` - Test dynamic scraping functionality
- `npm run test:automation` - Automated MCP server testing

### Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector dist/server.js
```

## Architecture Overview

The project uses a pure dynamic architecture with live content discovery and scraping:

### Core Components

1. **AppleHIGMCPServer** (`src/server.ts`) - Main MCP server entry point
   - Coordinates all components and handles MCP protocol communication
   - Sets up request handlers for resources and tools
   - Manages graceful startup/shutdown
   - Initializes dynamic content services

2. **CrawleeHIGService** (`src/services/crawlee-hig.service.ts`) - Primary content discovery engine
   - Uses Crawlee with Playwright for JavaScript-capable web scraping
   - Recursive discovery of ALL Apple HIG pages (2-level depth)
   - Smart content extraction with multiple fallback strategies
   - Handles Apple's complex SPA architecture

3. **HIGCache** (`src/cache.ts`) - Smart caching layer
   - TTL-based caching with graceful degradation
   - Backup cache entries for offline resilience 
   - Two-tier caching: fresh data + stale fallback data
   - Methods: `getWithGracefulFallback()`, `setWithGracefulDegradation()`

4. **HIGResourceProvider** (`src/resources.ts`) - MCP Resources implementation
   - Serves structured content via URIs like `hig://ios`, `hig://ios/buttons`
   - Platform-specific and category-specific resource organization
   - Uses dynamic content discovery
   - Generates comprehensive content with proper Apple attribution

5. **HIGToolsService** (`src/services/tools.service.ts`) - MCP Tools implementation
   - Interactive search with advanced keyword matching and intent recognition
   - 4 focused tools for design guidelines and technical documentation
   - Multi-factor relevance scoring (keyword + structure + context + synonym expansion)
   - Enhanced keyword search with synonym expansion and intelligent matching
   - Optimized for fast response times without external model dependencies

6. **ContentProcessor** (`src/services/content-processor.service.ts`) - Content processing pipeline
   - HTML to markdown conversion using Turndown.js (images removed for MCP efficiency)
   - Structured content extraction (overview, guidelines, examples, specifications)
   - Quality validation with comprehensive scoring and JavaScript error page detection
   - Apple-specific content pattern recognition and enhancement

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
                                   CrawleeHIGService → HIGCache → Apple's Website

Search Flow:
Query → HIGToolsService → Advanced Keyword Matching + Synonym Expansion
                            ↓
                    Multi-factor Scoring (keyword + synonym + structure + context)
                            ↓
                    Ranked Results (with intent recognition and boost factors)
```

### Content Discovery and Processing

```
User Request → CrawleeHIGService → Recursive Page Discovery (2-level depth)
                        ↓
                Playwright Browser Automation → Apple HIG Website
                        ↓
                Content Extraction + Quality Validation
                        ↓
                HIGCache (with graceful degradation)
                        ↓
                Structured Content Response
```

### Key Patterns

**Pure Dynamic Discovery**: The system discovers ALL Apple HIG pages dynamically using recursive crawling, ensuring complete coverage without maintaining static lists.

**JavaScript-Capable Scraping**: Uses Playwright for full browser automation to handle Apple's complex Single Page Application architecture.

**Graceful Degradation**: Multiple fallback layers ensure availability - cached content → live scraping → contextual fallback content.

**Smart Content Validation**: Advanced detection of JavaScript error pages and malformed content to ensure only clean, useful content is cached.

**Enhanced Keyword Search**: Multi-factor relevance scoring combines advanced keyword matching with synonym expansion, content structure analysis, and contextual relevance for superior search results.

**Intent Recognition**: Query analysis extracts user intent (find_component, find_guideline, compare_platforms, etc.) and entities (components, platforms, properties) for more accurate results.

**Optimized Performance**: The system uses intelligent caching with TTL-based expiration and graceful degradation for consistent performance.

**Respectful Scraping**: Rate limiting, appropriate user agents, and browser automation that respects Apple's website architecture.

**Attribution Compliance**: All content includes proper Apple attribution and fair use notices.

## Platform Support

The server supports all Apple platforms with specific categories:
- **Platforms**: iOS, macOS, watchOS, tvOS, visionOS, universal
- **Categories**: foundations, layout, navigation, presentation, selection-and-input, status, system-capabilities, visual-design, icons-and-images, color-and-materials, typography, motion, technologies

## Testing Strategy

### Unit Tests Structure
- `__tests__/cache.test.ts` - Cache functionality and TTL behavior
- `__tests__/scraper.test.ts` - Web scraping and content parsing
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
│   └── generation-info.json
```

**Generation Process:**
1. **Scrape all known HIG URLs** (~65 sections across all platforms)
2. **Process to AI-friendly markdown** with front matter metadata
3. **Generate search indices** for fast querying
4. **Create cross-references** between related sections
5. **Download and optimize images**

**Scheduled Updates:**
- **Every 4 months** via GitHub Action
- **Manual triggers** for immediate updates
- **Content validation** ensures quality and completeness

### Fallback Content Strategy (for scraping)
When Apple's website returns JavaScript placeholders, the scraper uses contextual fallback content:
- Button guidelines → `getButtonFallbackContent()`
- Navigation → `getNavigationFallbackContent()`
- Color → `getColorFallbackContent()`
- Typography → `getTypographyFallbackContent()`
- Layout → `getLayoutFallbackContent()`
- General → `getFallbackContent()`

### Known Sections Management
The content generator maintains a curated list of ~65 core HIG sections in `discoverSections()`. When adding new sections:
1. Add to the `knownSections` array with proper platform/category classification
2. Test the URL accessibility
3. Regenerate static content with `npm run generate-content`

## Error Handling

The system uses multiple layers of error resilience:
1. **Graceful cache degradation** - serves stale content when fresh fetches fail
2. **Fallback content** - contextual content when scraping fails completely  
3. **MCP error wrapping** - proper error codes for the MCP protocol
4. **Retry logic** - 3 attempts with exponential backoff for network requests

## Configuration

### Scraping Configuration
- Rate limiting: 1000ms between requests
- Timeout: 10 seconds per request
- Retry attempts: 3 with exponential backoff
- User agent: Educational/development purpose identification

### Cache Configuration
- Default TTL: 1 hour for normal content
- Resource list cache: 2 hours
- Section content cache: 2 hours
- Graceful degradation: 24x longer TTL for backup entries

## Static Content vs Live Scraping

### Performance Comparison
- **Static Content**: Instant responses, unlimited concurrency
- **Live Scraping**: 1-10 second delays, rate limited to 30 req/min

### Reliability Comparison
- **Static Content**: 99.9% availability, immune to Apple website changes
- **Live Scraping**: Dependent on Apple website availability and structure

### Content Freshness
- **Static Content**: Updated every 4 months (sufficient for HIG changes)
- **Live Scraping**: Real-time but often returns stale cached content

### When to Use Each
- **Static Content**: Default for all production use
- **Live Scraping**: Fallback when static content unavailable
- **Manual Generation**: When Apple announces major design updates

## Maintenance Notes

### Expected Maintenance
- **Static content updates**: Automatic every 4 months via GitHub Actions
- **Manual content updates**: When Apple announces major design changes
- **Scraper updates**: Only needed when static content fails (rare)
- **New platform support**: Add new platforms and regenerate content

### Content Generation System
Run `npm run generate-content` to:
- Scrape all current HIG content
- Generate optimized markdown files
- Create search indices and metadata
- Validate content completeness

**GitHub Action Triggers:**
- **Scheduled**: Every 4 months on the 1st at 2 AM UTC
- **Manual**: `workflow_dispatch` for immediate updates
- **Auto-PR**: Creates pull request for review when content changes

### Health Check System
Run `npm run health-check` to verify:
- Static content availability and freshness
- Fallback scraper functionality
- MCP server integration
- Content validation

When issues occur:
1. Check if static content exists and is current
2. Regenerate content with `npm run generate-content`
3. For scraper issues: update selectors in `cleanContent()` method
4. Test with `npm run health-check`

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