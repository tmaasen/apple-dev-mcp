# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apple Human Interface Guidelines MCP (Model Context Protocol) server that provides AI-powered access to Apple's design guidelines. It scrapes content from Apple's HIG website and serves it through MCP resources and tools for AI assistants like Claude.

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
- `npm run health-check` - Test scraper functionality

### Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector dist/server.js
```

## Architecture Overview

The project follows a layered architecture with clear separation of concerns:

### Core Components

1. **AppleHIGMCPServer** (`src/server.ts`) - Main MCP server entry point
   - Coordinates all components and handles MCP protocol communication
   - Sets up request handlers for resources and tools
   - Manages graceful startup/shutdown

2. **HIGScraper** (`src/scraper.ts`) - Web scraping engine
   - Respectful scraping with rate limiting (1 second delays)
   - Intelligent fallback content when Apple's SPA fails to load
   - Maintains curated list of known HIG sections (~850 URLs)
   - Converts HTML to clean markdown format

3. **HIGCache** (`src/cache.ts`) - Smart caching layer
   - TTL-based caching with graceful degradation
   - Backup cache entries for offline resilience 
   - Two-tier caching: fresh data + stale fallback data
   - Methods: `getWithGracefulFallback()`, `setWithGracefulDegradation()`

4. **HIGResourceProvider** (`src/resources.ts`) - MCP Resources implementation
   - Serves structured content via URIs like `hig://ios`, `hig://ios/buttons`
   - Platform-specific and category-specific resource organization
   - Generates comprehensive content with proper Apple attribution

5. **HIGToolProvider** (`src/tools.ts`) - MCP Tools implementation
   - Interactive search, component specs, platform comparison
   - Four main tools: `search_guidelines`, `get_component_spec`, `compare_platforms`, `get_latest_updates`
   - Enhanced with Liquid Glass design system information

### Data Flow

```
MCP Client → AppleHIGMCPServer → HIGResourceProvider/HIGToolProvider → HIGScraper → HIGCache → Apple's Website
```

### Key Patterns

**Graceful Degradation**: The system prioritizes availability over freshness. If Apple's website is unavailable, it serves cached content or contextual fallback content rather than failing.

**Respectful Scraping**: Rate limiting, appropriate user agents, and fallback to known URLs when Apple's SPA architecture prevents dynamic discovery.

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

### Mocking
- `__mocks__/node-fetch.ts` - HTTP request mocking for tests
- Tests should mock external dependencies and focus on business logic

## Content Management

### Fallback Content Strategy
When Apple's website returns JavaScript placeholders, the scraper uses contextual fallback content:
- Button guidelines → `getButtonFallbackContent()`
- Navigation → `getNavigationFallbackContent()`
- Color → `getColorFallbackContent()`
- Typography → `getTypographyFallbackContent()`
- Layout → `getLayoutFallbackContent()`
- General → `getFallbackContent()`

### Known Sections Management
The scraper maintains a curated list of ~50 core HIG sections in `discoverSections()`. When adding new sections:
1. Add to the `knownSections` array with proper platform/category classification
2. Test the URL accessibility
3. Update tests accordingly

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

## Maintenance Notes

### Expected Maintenance
- **Scraper updates**: Apple changes their website 2-4 times per year requiring selector updates
- **New platform support**: Add new platforms as Apple releases them
- **Health monitoring**: Daily automated checks via GitHub Actions

### Health Check System
Run `npm run health-check` to verify:
- Apple website accessibility
- Core URL functionality
- Scraper parsing accuracy
- Cache performance

When scraper issues occur:
1. Check recent Apple website changes
2. Update selectors in `cleanContent()` method
3. Add/update fallback content if needed
4. Test with `npm run health-check`