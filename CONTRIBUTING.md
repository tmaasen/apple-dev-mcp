# Contributing to Apple HIG MCP Server

Thank you for your interest in contributing to the Apple Human Interface Guidelines MCP Server! This project helps developers access Apple's latest design guidelines directly within their AI-assisted development workflow using a hybrid static/dynamic content system.

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

- Node.js 20.0.0 or higher
- npm or yarn
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/apple-hig-mcp.git
   cd apple-hig-mcp
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

6. Generate static content (optional):
   ```bash
   npm run generate-content
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `fix/scraper-ios-button-extraction` - Bug fixes
- `feature/add-vision-pro-support` - New features
- `docs/update-installation-guide` - Documentation updates
- `scraper/update-selectors-for-new-layout` - Scraper maintenance
- `content/regenerate-static-content` - Static content updates

### Commit Messages

Write clear commit messages:
- `fix: update scraper selectors for new Apple HIG layout`
- `feat: add support for visionOS guidelines`
- `docs: improve installation instructions`
- `scraper: handle graceful degradation for failed requests`
- `content: regenerate static HIG content for Q2 updates`

## Common Contribution Types

### 📄 Static Content Updates (Most Important)

Our hybrid architecture prioritizes pre-generated static content for performance. The most valuable contributions are helping maintain and improve this content!

**When to update static content:**
- Apple releases new HIG updates
- GitHub Action content generation fails
- Content becomes stale (>6 months old)
- New Apple platforms or design systems are released

**How to update static content:**

1. **Trigger content regeneration:**
   ```bash
   npm run generate-content
   ```

2. **Test the generated content:**
   ```bash
   npm run validate-content
   npm run health-check
   ```

3. **Review generated files:**
   - Check `content/platforms/` for new/updated sections
   - Verify `content/metadata/` has updated indices
   - Ensure attribution is properly included

### 🔧 Scraper Fixes (Fallback System)

Scrapers now serve as fallback when static content is unavailable. Still important for reliability!

**When to fix scrapers:**
- Static content generation is failing
- New HIG sections aren't being discovered
- Content extraction returns empty results

**How to fix scrapers:**

1. Identify broken URLs in the content generation script
2. Update `scripts/generate-hig-content.ts` section discovery
3. Test with both static and dynamic modes:
   ```bash
   npm run generate-content  # Test static generation
   npm run health-check      # Test scraper fallback
   ```

### 🆕 New Features

Ideas for new features:
- Enhanced static content generation
- Better search index optimization
- Additional Apple platforms support
- Content freshness monitoring
- Historical HIG comparisons
- GitHub Action improvements

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

- [ ] Static content loads correctly (primary mode)
- [ ] Scraper fallback works when static content unavailable
- [ ] All MCP resources load correctly
- [ ] Search tool returns relevant results from static indices
- [ ] Component specs include proper Apple attribution
- [ ] Platform comparison works across different platforms
- [ ] Latest updates include current design system information
- [ ] Content generation script completes successfully

## Submitting Changes

### Pull Request Process

1. **Create a descriptive PR title:**
   - `Fix scraper selectors for iOS navigation guidelines`
   - `Add support for watchOS Liquid Glass components`

2. **Fill out the PR template completely**

3. **Ensure all checks pass:**
   - [ ] Tests pass
   - [ ] Linting passes
   - [ ] Build succeeds
   - [ ] Health check passes

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

## Static Content Generation

### Understanding the Hybrid System

Our architecture uses two content sources:

1. **Static Content (Primary)**: Pre-generated markdown files updated every 4 months
2. **Live Scraping (Fallback)**: Real-time content extraction when static unavailable

### Content Generation Workflow

```bash
# Generate all static content
npm run generate-content

# Validate generated content
npm run validate-content

# Test both static and fallback modes
npm run health-check
```

### Static Content Structure

```
content/
├── platforms/          # Platform-specific guidelines
│   ├── ios/           # iOS markdown files
│   ├── macos/         # macOS markdown files
│   └── ...
├── metadata/          # Search optimization
│   ├── search-index.json
│   ├── cross-references.json
│   └── generation-info.json
└── images/           # Future: visual assets
```

### Contributing to Content Generation

1. **Fix content extraction**: Update `scripts/generate-hig-content.ts`
2. **Improve search indices**: Enhance keyword extraction
3. **Add new platforms**: Extend platform discovery
4. **Optimize performance**: Improve generation speed

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

Thank you for helping make Apple's design guidelines more accessible to developers! 🍎✨