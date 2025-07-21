# Contributing to Apple Dev MCP Server

Thank you for your interest in contributing to the Apple Dev MCP Server! This project provides complete Apple development guidance, combining Human Interface Guidelines (design) with Technical Documentation (API) for all Apple platforms, delivered through both Desktop Extensions and traditional MCP integration.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Common Contribution Types](#common-contribution-types)
- [Static Content Generation](#static-content-generation)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Apple Content Guidelines](#apple-content-guidelines)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/apple-dev-mcp.git
   cd apple-dev-mcp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Test the server with MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector dist/server.js
   ```

6. Build Desktop Extension (optional):
   ```bash
   npm run build:extension
   ```

7. Test the server functionality:
   ```bash
   npm test
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `fix/scraper-ios-button-extraction` - Bug fixes
- `feature/add-visionos-support` - New features
- `feature/desktop-extension-improvements` - Desktop Extension features
- `docs/update-installation-guide` - Documentation updates
- `scraper/update-selectors-for-new-layout` - Scraper maintenance
- `scraper/improve-content-discovery` - Content discovery improvements

### Commit Messages

Write clear commit messages:
- `fix: update scraper selectors for new Apple HIG layout`
- `feat: add support for visionOS guidelines`
- `docs: improve installation instructions`
- `scraper: handle graceful degradation for failed requests`
- `scraper: improve dynamic content discovery for new sections`

## Common Contribution Types

### 🔍 Content Discovery Improvements (Most Important)

Our pure dynamic architecture discovers content in real-time. The most valuable contributions are helping improve content discovery and processing!

**When to improve content discovery:**
- Apple releases new HIG sections or changes website structure
- JavaScript error pages are detected
- Content extraction fails for specific pages
- New Apple platforms or design systems are released

**How to improve content discovery:**

1. **Test server functionality:**
   ```bash
   npm test
   ```

2. **Test specific content extraction:**
   ```bash
   npm run test:automation
   ```

3. **Monitor discovery performance:**
   - Check CrawleeHIGService logs for failed discoveries
   - Verify ContentProcessor handles new page structures
   - Ensure JavaScript error page detection works correctly

### 🔧 Content Processing Fixes

The dynamic architecture relies on robust content processing. Important for reliability!

**When to fix content processing:**
- JavaScript error pages are being cached
- New HIG sections aren't being discovered
- Content extraction returns malformed results

**How to fix content processing:**

1. Identify failed content extraction patterns
2. Update `ContentProcessor` for new page structures
3. Test the functionality:
   ```bash
   npm test                  # Test server functionality
   npm run test:automation   # Test processing pipeline
   ```

### 🆕 New Features

Ideas for new features:
- **Desktop Extension improvements**: Better UX, configuration options
- **Unified search enhancements**: Improved design + technical integration
- **Enhanced dynamic content discovery**: Better performance and coverage
- **Advanced search capabilities**: Cross-reference improvements, wildcard patterns
- **Additional Apple platforms support**: New platforms and frameworks
- **Cache optimization**: Improved TTL strategies and invalidation
- **Performance monitoring**: Better tracking of discovery and processing metrics

### 📚 Documentation

Help improve:
- Installation guides
- Usage examples
- API documentation
- Troubleshooting guides

### 🐛 Bug Fixes

Common issues:
- Error handling improvements
- Performance optimizations
- Cache management
- Memory leaks

## Testing

### Local Testing

1. **Build and run:**
   ```bash
   npm run build
   npm run dev
   ```

2. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector dist/server.js
   ```

3. **Run automated tests:**
   ```bash
   npm test
   npm run lint
   ```

### Testing Scrapers

When fixing scrapers, test with real URLs:

```bash
# Test specific URLs manually
node -e "
const { HIGScraper } = require('./dist/scraper.js');
const { HIGCache } = require('./dist/cache.js');
const scraper = new HIGScraper(new HIGCache());
scraper.discoverSections().then(console.log);
"
```

### Manual Testing Checklist

- [ ] **Desktop Extension**: `.dxt` builds and installs correctly in Claude Desktop
- [ ] **Dynamic content discovery** works correctly for all platforms
- [ ] **Content processing** handles JavaScript error pages properly  
- [ ] **MCP resources** load correctly (`hig://ios`, `hig://buttons`, etc.)
- [ ] **Search tools** return relevant results from dynamic content
- [ ] **Unified search tools** (`search_unified`) work
- [ ] **Technical Documentation tools** integrate properly with API docs
- [ ] **Component specs** include proper Apple attribution
- [ ] **Cross-platform features** work across iOS, macOS, watchOS, tvOS, visionOS
- [ ] **Cache performance** provides reasonable response times

## Submitting Changes

### Pull Request Process

1. **Create a descriptive PR title:**
   - `Fix scraper selectors for iOS navigation guidelines`
   - `Add support for watchOS design tokens extraction`
   - `Improve Desktop Extension manifest and build process`
   - `Enhance content fusion for SwiftUI components`

2. **Fill out the PR template completely**

3. **Ensure all checks pass:**
   - [ ] Tests pass (`npm test`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Build succeeds (`npm run build`)
   - [ ] Desktop Extension builds (`npm run build:extension`)
   - [ ] Tests pass (`npm test`)

4. **Wait for review** - Maintainers will review PRs within a few days

### Review Criteria

PRs are evaluated based on:
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it well-structured and maintainable?
- **Testing**: Are there appropriate tests?
- **Documentation**: Is it properly documented?
- **Apple Guidelines**: Does it respect Apple's content properly?

## Apple Content Guidelines

### Important Legal Considerations

This project provides a smart wrapper around Apple's public documentation under fair use principles. All contributors must:

1. **Maintain Attribution**: Never remove Apple copyright notices
2. **Fair Use Only**: Don't republish entire sections verbatim
3. **Educational Purpose**: Keep focus on development/educational use
4. **Respectful Scraping**: Don't overload Apple's servers

### Content Handling Rules

- ✅ **DO**: Extract and reformat content for AI consumption
- ✅ **DO**: Add helpful context and cross-references
- ✅ **DO**: Include proper attribution in all responses
- ❌ **DON'T**: Claim ownership of Apple's content
- ❌ **DON'T**: Remove copyright notices
- ❌ **DON'T**: Create mirrors of Apple's documentation

### Attribution Template

All content responses must include:

```markdown
---
**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines.
© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
---
```

## Dynamic Content Discovery

### Understanding the Pure Dynamic System

Our architecture uses live content discovery:

1. **Dynamic Discovery**: Real-time crawling of ALL Apple HIG pages
2. **Smart Caching**: TTL-based caching with graceful degradation
3. **Content Processing**: JavaScript-capable extraction with quality validation

### Content Discovery Workflow

```bash
# Test server functionality
npm test

# Test content processing pipeline
npm run test:automation

# Monitor performance
npm run dev  # Check logs for discovery patterns
```

### Dynamic Content Flow

```
User Request → CrawleeHIGService → Recursive Page Discovery
                    ↓
            Playwright Browser → Apple HIG Website
                    ↓
            Content Extraction → Quality Validation
                    ↓
            HIGCache (TTL-based) → Structured Response
```

### Contributing to Content Discovery

1. **Fix content extraction**: Update `ContentProcessor` service
2. **Improve discovery patterns**: Enhance `CrawleeHIGService` crawling
3. **Add error detection**: Expand JavaScript error page detection
4. **Optimize performance**: Improve caching strategies

## Getting Help

- **Questions**: Open a discussion or issue
- **Bug Reports**: Use the bug report template
- **Feature Ideas**: Use the feature request template
- **Scraper Issues**: Use the scraper issue template

## Recognition

Contributors are recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Special thanks for scraper maintenance

---

Thank you for helping make Apple's complete development guidance more accessible to developers! 🍎✨

## Desktop Extension Development

### Building Extensions

The project supports modern Desktop Extension (`.dxt`) distribution:

```bash
# Build the extension
npm run build:extension

# Test extension locally
# 1. Install the generated apple-dev-mcp.dxt in Claude Desktop
# 2. Restart Claude Desktop
# 3. Test the tools and resources
```

### Extension Structure

- **Manifest**: `manifest.json` - DXT specification compliant
- **Icon**: `icon.png` - Abstract design (trademark-safe)
- **Server**: `dist/server.js` - MCP server entry point
- **Dependencies**: Node.js modules and MCP server runtime
- **Build Script**: `scripts/build-extension.js` - Extension packaging

### Contributing to Extensions

- **Manifest improvements**: Better user configuration options
- **Icon design**: Updates to the abstract icon design
- **Build process**: Enhanced packaging and validation
- **Documentation**: Installation and usage guides