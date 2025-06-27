# 🍎 Apple HIG MCP Server

[![Health Check](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/apple-hig-mcp.svg)](https://www.npmjs.com/package/apple-hig-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A high-performance [Model Context Protocol](https://modelcontextprotocol.io/) server that provides instant access to Apple's Human Interface Guidelines with comprehensive design system coverage.

Perfect for developers using AI-assisted development who want fast, reliable access to Apple's design guidelines while building iOS, macOS, watchOS, tvOS, and visionOS applications.

## ✨ Features

- ⚡ **Ultra-Fast**: Instant responses via pre-generated static content (no scraping delays)
- 🔍 **Smart Search**: Advanced search with pre-built indices for sub-second results
- 📱 **Multi-Platform**: Comprehensive coverage of all Apple platforms (iOS, macOS, watchOS, tvOS, visionOS)
- 🎨 **Current Design System**: Always up-to-date with Apple's latest design language
- 🔄 **Auto-Updated**: Content refreshed every 4 months via GitHub Actions
- 🛡️ **Highly Reliable**: 99.9% uptime with intelligent fallback to live scraping
- 🤖 **AI-Optimized**: Clean markdown format optimized for AI consumption
- 📊 **Scalable**: Handles unlimited concurrent users with consistent performance
- 🙏 **Respectful**: Follows fair use principles with proper Apple attribution

## 🚀 Quick Start

### Installation

```bash
npm install -g apple-hig-mcp
```

### Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "apple-hig": {
      "command": "apple-hig-mcp",
      "args": []
    }
  }
}
```

### Usage with Claude Code

Add to Claude Code:

```bash
claude mcp add apple-hig apple-hig-mcp
```

### Usage with MCP Inspector

Test the server interactively:

```bash
npx @modelcontextprotocol/inspector apple-hig-mcp
```

## 🔧 Development Setup

### Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tannermaasen/apple-hig-mcp.git
   cd apple-hig-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector dist/server.js
   ```

## 📖 Usage Examples

### MCP Resources

Access complete platform guidelines:

```
hig://ios - Complete iOS Human Interface Guidelines
hig://macos - Complete macOS Human Interface Guidelines  
hig://watchos - Complete watchOS Human Interface Guidelines
hig://tvos - Complete tvOS Human Interface Guidelines
hig://visionos - Complete visionOS Human Interface Guidelines

hig://ios/navigation - iOS navigation guidelines
hig://ios/color-and-materials - iOS color and materials guidelines

hig://updates/latest-design-system - Latest design system updates
hig://updates/latest - Most recent HIG updates
```

### MCP Tools

#### Search Guidelines
```json
{
  "name": "search_guidelines",
  "arguments": {
    "query": "button design",
    "platform": "iOS",
    "category": "visual-design",
    "limit": 10
  }
}
```

#### Get Component Specifications
```json
{
  "name": "get_component_spec",
  "arguments": {
    "componentName": "Navigation Bar",
    "platform": "iOS"
  }
}
```

#### Compare Across Platforms
```json
{
  "name": "compare_platforms",
  "arguments": {
    "componentName": "Button",
    "platforms": ["iOS", "macOS", "watchOS"]
  }
}
```

#### Get Latest Updates
```json
{
  "name": "get_latest_updates",
  "arguments": {
    "since": "2025-06-01",
    "platform": "iOS",
    "limit": 20
  }
}
```

## 🎨 Current Apple Design System

This server includes comprehensive coverage of Apple's latest design language:

- **Advanced Materials**: Access guidelines for implementing modern visual elements
- **Adaptive Interface**: Learn how elements intelligently adapt between contexts
- **Enhanced Rendering**: Understand dynamic visual effects and interactions
- **System-wide Implementation**: Guidelines for buttons, navigation, and entire interfaces
- **Developer APIs**: Information about updated SwiftUI, UIKit, and AppKit support

## 🏗️ Architecture

### Hybrid Static/Dynamic System

```
┌─────────────────┐    ┌──────────────────┐
│   MCP Client    │    │  Apple HIG MCP   │
│   (Claude)      │◄──►│     Server       │
└─────────────────┘    └──────────────────┘
                              │
                              ▼
                 ┌──────────────────────────────┐
                 │     Static Content Provider    │  ◄── PRIMARY
                 │    (Instant Markdown Files)   │
                 └──────────────────────────────┘
                              │ (fallback)
                              ▼
                 ┌──────────────────────────────┐
                 │       Live Scraper + Cache      │  ◄── FALLBACK
                 │      (Apple's HIG Website)      │
                 └──────────────────────────────┘
```

### Content Generation Pipeline

```
GitHub Action (Every 4 Months)
    │
    ▼
┌───────────────────────────────────────────┐
│           Content Generator Script            │
│  • Scrapes all ~65 HIG sections              │
│  • Generates AI-optimized markdown files    │
│  • Creates search indices & cross-refs      │
└───────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────┐
│              Static Content Files             │
│  content/platforms/{ios,macos,watchos}/      │
│  content/metadata/{search,references}/       │
└───────────────────────────────────────────┘
```

### Key Components

#### Core MCP Server
- **HIGStaticContentProvider**: Primary content source loading pre-generated markdown files
- **HIGScraper**: Fallback content extraction with intelligent selectors and rate limiting
- **HIGCache**: Smart caching layer with TTL and graceful degradation (for scraping)
- **HIGResourceProvider**: MCP resources with static-first, scraping-fallback architecture
- **HIGToolProvider**: Interactive tools using pre-built search indices for fast results

#### Content Generation Architecture (SOLID Principles)
- **EnhancedContentGenerator**: Main orchestrator following dependency injection
- **FileSystemService**: Single responsibility for file operations
- **ContentProcessorService**: Processes and cleans content
- **SearchIndexerService**: Generates search indices
- **CrossReferenceGeneratorService**: Creates cross-references between sections
- **ContentScraperService**: Enhanced extraction from Apple's SPA website
- **ContentEnhancementStrategies**: Strategy pattern for platform-specific enhancements

## ⚡ Performance & Reliability

### Static vs Live Performance

| Metric | Live Scraping | Static Content |
|--------|---------------|----------------|
| **Response Time** | 1-10 seconds | < 50ms (instant) |
| **Concurrent Users** | 30 req/min limit | Unlimited |
| **Availability** | ~95% (depends on Apple) | ~99.9% |
| **Cache Misses** | Frequent delays | Never (pre-generated) |
| **Apple Website Dependency** | Real-time | None during runtime |

### Content Freshness Strategy

- **Automated Updates**: GitHub Action runs every 4 months
- **Manual Triggers**: Immediate updates when Apple announces changes
- **Intelligent Monitoring**: Content age warnings for >6 months
- **Fallback Coverage**: Live scraping ensures 100% availability

### Static Content Structure

```
content/
├── platforms/           # Organized by Apple platform
│   ├── ios/            # iOS-specific guidelines
│   │   ├── buttons.md
│   │   ├── navigation.md
│   │   └── typography.md
│   ├── macos/          # macOS guidelines
│   └── watchos/        # watchOS guidelines
├── metadata/           # Search optimization
│   ├── search-index.json      # Pre-built search indices
│   ├── cross-references.json  # Related content links
│   └── generation-info.json   # Content metadata
└── images/            # Visual assets (future)
```

Each markdown file includes:
- **Front matter**: Structured metadata (platform, category, URL, etc.)
- **AI-optimized content**: Clean formatting, proper headers, cross-references
- **Code examples**: SwiftUI/UIKit snippets with proper accessibility
- **Design specifications**: Colors, spacing, typography, sizing guidelines
- **Attribution**: Proper Apple attribution and fair use notices
- **Table of contents**: For longer sections

### Current Architecture (2025)

The content generation system follows modular service architecture:

```
src/
├── generators/
│   └── content-generator.ts            # Main content generation orchestrator
├── services/                           # Specialized services
│   ├── file-system.service.ts
│   ├── content-processor.service.ts
│   ├── search-indexer.service.ts
│   ├── semantic-search.service.ts
│   ├── tools.service.ts
│   └── crawlee-hig.service.ts
├── interfaces/                         # Type definitions
│   └── content-interfaces.ts
└── static-content.ts                   # Static content provider
```

**Benefits of the current architecture:**
- ✅ **Hybrid Performance**: Static content for speed + live scraping fallback
- ✅ **Semantic Search**: TensorFlow-powered intelligent search capabilities  
- ✅ **Modular**: Each service has a clear, focused responsibility
- ✅ **Reliable**: Multiple fallback layers ensure high availability

## 🤝 Contributing

We welcome contributions! This project relies on community help for maintenance, especially when Apple updates their website structure.

### Common Contributions Needed

1. **Scraper Fixes** (Most Important): When Apple changes their website, scrapers need updates
2. **New Features**: Enhanced search, new platforms, better formatting
3. **Bug Fixes**: Performance improvements, error handling
4. **Documentation**: Better examples, troubleshooting guides

### Quick Start for Contributors

1. Check [open issues](https://github.com/tannermaasen/apple-hig-mcp/issues) for scraper failures
2. Use the [scraper issue template](https://github.com/tannermaasen/apple-hig-mcp/issues/new?template=scraper_issue.md) to report problems
3. See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines

## 📋 Maintenance

### Health Monitoring

- **Daily Health Checks**: Automated testing of scraper functionality
- **Dependency Updates**: Regular security and dependency updates
- **Community Issues**: GitHub issue tracking for quick problem identification

### Expected Maintenance Level

- **Automated**: Content caching, health monitoring, dependency updates
- **Community-Driven**: Scraper fixes when Apple changes their website (estimated 2-4times/year)
- **Maintainer Time**: ~2-4 hours/month for oversight

## ⚖️ Legal & Attribution

### Fair Use & Attribution

This project operates under fair use principles for educational and development purposes:

- ✅ **Smart wrapper** around Apple's public documentation
- ✅ **Proper attribution** in all content responses
- ✅ **Educational purpose** for developers
- ✅ **Respectful scraping** with rate limiting

### Attribution Notice

All content served by this server includes proper attribution:

> This content is sourced from Apple's Human Interface Guidelines.  
> © Apple Inc. All rights reserved. Provided for educational purposes.  
> For official information, visit: https://developer.apple.com/design/human-interface-guidelines/

### Disclaimer

This project is not affiliated with Apple Inc. and does not claim ownership of Apple's content. It provides a technical interface to publicly available documentation under fair use principles.

## 🧪 Testing

### Automated Tests
```bash
npm test              # Run test suite
npm run lint          # Code linting
npm run health-check  # Test scraper functionality
```

### Manual Testing
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/server.js

# Test specific functionality
npm run dev           # Start development server
```

## 📦 API Reference

### Resources

| URI Pattern | Description |
|-------------|-------------|
| `hig://<platform>` | Complete platform guidelines |
| `hig://<platform>/<category>` | Category-specific guidelines |
| `hig://updates/liquid-glass` | Liquid Glass design system |
| `hig://updates/latest` | Latest HIG updates |

### Tools

| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `search_guidelines` | Search HIG content | `query`, `platform`, `category` |
| `get_component_spec` | Get component details | `componentName`, `platform` |
| `compare_platforms` | Compare across platforms | `componentName`, `platforms[]` |
| `get_latest_updates` | Get recent changes | `since`, `platform`, `limit` |

## 🐛 Troubleshooting

### Common Issues

**Scraper not working?**
- Check if Apple's website is accessible
- Look for recent website structure changes
- Check [existing issues](https://github.com/tannermaasen/apple-hig-mcp/issues)

**Empty or incomplete content?**
- Clear cache and retry
- Check network connectivity
- Report as a [scraper issue](https://github.com/tannermaasen/apple-hig-mcp/issues/new?template=scraper_issue.md)

**Performance issues?**
- Check cache configuration
- Monitor memory usage
- Adjust request rate limiting

## 📞 Support

- **Bug Reports**: [Issue Tracker](https://github.com/tannermaasen/apple-hig-mcp/issues)
- **Feature Requests**: [Feature Template](https://github.com/tannermaasen/apple-hig-mcp/issues/new?template=feature_request.md)
- **Scraper Issues**: [Scraper Template](https://github.com/tannermaasen/apple-hig-mcp/issues/new?template=scraper_issue.md)
- **Discussions**: [GitHub Discussions](https://github.com/tannermaasen/apple-hig-mcp/discussions)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Apple Inc. for creating comprehensive design guidelines
- [Model Context Protocol](https://modelcontextprotocol.io/) team for the excellent framework
- Open source community for contributions and maintenance

---

**Built with ❤️ for the developer community**

*Bringing Apple's design excellence directly to your AI-assisted development workflow.*