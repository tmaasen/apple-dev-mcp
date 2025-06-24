# 🍎 Apple HIG MCP Server

[![CI](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/ci.yml)
[![Health Check](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/daily-health-check.yml/badge.svg)](https://github.com/tannermaasen/apple-hig-mcp/actions/workflows/daily-health-check.yml)
[![npm version](https://img.shields.io/npm/v/apple-hig-mcp.svg)](https://www.npmjs.com/package/apple-hig-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A [Model Context Protocol](https://modelcontextprotocol.io/) server that provides up-to-date access to Apple's Human Interface Guidelines, including the latest **Liquid Glass design system** introduced at WWDC 2025.

Perfect for developers using AI-assisted development who want direct access to Apple's design guidelines while building iOS, macOS, watchOS, tvOS, and visionOS applications.

## ✨ Features

- 🔍 **Smart Search**: Find design guidelines by keywords, components, or concepts
- 📱 **Multi-Platform**: Supports all Apple platforms (iOS, macOS, watchOS, tvOS, visionOS)
- 🎨 **Liquid Glass Ready**: Includes the latest WWDC 2025 design system updates
- 🔄 **Auto-Updated**: Intelligent caching with graceful degradation
- 🤖 **AI-Friendly**: Optimized for AI consumption with clean markdown output
- ⚡ **Fast**: Local caching reduces API calls and improves performance
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

### Usage with MCP Inspector

Test the server interactively:

```bash
npx @modelcontextprotocol/inspector apple-hig-mcp
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
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

hig://updates/liquid-glass - Latest Liquid Glass design system
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

## 🎨 Liquid Glass Design System

This server includes comprehensive coverage of Apple's new Liquid Glass design language introduced at WWDC 2025:

- **Translucent Materials**: Access guidelines for implementing glass-like visual elements
- **Adaptive Colors**: Learn how colors intelligently adapt between light and dark environments
- **Real-time Rendering**: Understand dynamic highlights and specular effects
- **System-wide Implementation**: Guidelines for buttons, navigation, and entire interfaces
- **Developer APIs**: Information about updated SwiftUI, UIKit, and AppKit support

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │    │  Apple HIG MCP   │    │  Apple's HIG    │
│   (Claude)      │◄──►│     Server       │◄──►│    Website      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Local Cache    │
                       │ (Smart Caching)  │
                       └──────────────────┘
```

### Key Components

- **HIGScraper**: Intelligent content extraction with multiple fallback selectors
- **HIGCache**: Smart caching with TTL and graceful degradation
- **HIGResourceProvider**: MCP resources for structured content access
- **HIGToolProvider**: Interactive tools for searching and comparing guidelines

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