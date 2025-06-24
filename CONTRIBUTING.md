# Contributing to Apple HIG MCP Server

Thank you for your interest in contributing to the Apple Human Interface Guidelines MCP Server! This project helps developers access Apple's latest design guidelines, including the Liquid Glass design system, directly within their AI-assisted development workflow.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Common Contribution Types](#common-contribution-types)
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

## Making Changes

### Branch Naming

Use descriptive branch names:
- `fix/scraper-ios-button-extraction` - Bug fixes
- `feature/add-vision-pro-support` - New features
- `docs/update-installation-guide` - Documentation updates
- `scraper/update-selectors-for-new-layout` - Scraper maintenance

### Commit Messages

Write clear commit messages:
- `fix: update scraper selectors for new Apple HIG layout`
- `feat: add support for visionOS guidelines`
- `docs: improve installation instructions`
- `scraper: handle graceful degradation for failed requests`

## Common Contribution Types

### 🔧 Scraper Fixes (Most Common)

Apple occasionally updates their website structure, breaking our content extraction. These are the most valuable community contributions!

**When to fix scrapers:**
- Daily health checks are failing
- Content extraction returns empty or malformed results
- New HIG sections aren't being discovered

**How to fix scrapers:**

1. Identify the broken URL by checking the failing tests or issues
2. Open the URL in your browser to verify if it exists
3. Update the URLs in the `knownSections` array in `src/scraper.ts`:
   ```typescript
   // Update or add new HIG section URLs
   const knownSections = [
     { title: 'iOS Navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/ios/app-architecture/navigation', platform: 'iOS', category: 'navigation' },
     // Add new sections here
   ];
   ```

4. Test locally:
   ```bash
   npm run build
   npm run health-check
   ```

5. Submit a PR with the updated URLs

**Note**: Since Apple's HIG website is now a Single Page Application (SPA), we maintain a curated list of stable URLs rather than scraping dynamically.

### 🆕 New Features

Ideas for new features:
- Support for additional Apple platforms
- Enhanced search capabilities
- Better content formatting
- Integration with design tools
- Historical HIG comparisons

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

- [ ] All MCP resources load correctly
- [ ] Search tool returns relevant results
- [ ] Component specs include proper Apple attribution
- [ ] Platform comparison works across different platforms
- [ ] Latest updates include Liquid Glass information
- [ ] Error handling works gracefully when Apple's site is unavailable

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
© Apple Inc. All rights reserved. Provided for educational purposes.
For official information, visit: https://developer.apple.com/design/human-interface-guidelines/
---
```

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