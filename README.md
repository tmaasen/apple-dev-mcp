# 🍎 Apple HIG MCP Server

[![Health Check](https://github.com/tmaasen/apple-hig-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tmaasen/apple-hig-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/apple-hig-mcp.svg)](https://www.npmjs.com/package/apple-hig-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A high-performance [Model Context Protocol](https://modelcontextprotocol.io/) server that provides instant access to Apple's Human Interface Guidelines with comprehensive design system coverage.

Perfect for developers using AI-assisted development who want fast, reliable access to Apple's design guidelines while building iOS, macOS, watchOS, tvOS, and visionOS applications.

## 📖 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🔧 Platform Setup](#-platform-setup)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Windsurf IDE](#windsurf-ide)
  - [VS Code (Preview)](#vs-code-preview)
  - [Configuration Notes](#configuration-notes)
- [🔧 Development Setup](#-development-setup)
- [📖 Usage Examples](#-usage-examples)
  - [MCP Resources](#mcp-resources)
  - [MCP Tools](#mcp-tools)
- [🎨 Current Apple Design System](#-current-apple-design-system)
- [🤝 Contributing](#-contributing)
- [⚖️ Legal & Attribution](#️-legal--attribution)
- [🧪 Testing](#-testing)
- [📦 API Reference](#-api-reference)
- [🐛 Troubleshooting](#-troubleshooting)
- [🙏 Acknowledgments](#-acknowledgments)

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

## 🔧 Platform-Specific Setup

### Claude Desktop

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-hig-mcp\\dist\\server.js"]
    }
  }
}
```

### Claude Code

#### Method 1: Command Line (Recommended)
```bash
# For local project scope
claude mcp add "Apple HIG" node /usr/local/lib/node_modules/apple-hig-mcp/dist/server.js

# For user-wide scope (available in all projects)
claude mcp add -s user "Apple HIG" node /usr/local/lib/node_modules/apple-hig-mcp/dist/server.js
```

#### Method 2: Project Configuration File  
Create `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"]
    }
  }
}
```

#### Method 3: NPX (Alternative)
```bash
claude mcp add "Apple HIG" npx -- -y apple-hig-mcp
```

### Cursor IDE

Create `.cursor/mcp.json` in your project root, or go to the Cursor settings where you have MCP integrations

**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-hig-mcp\\dist\\server.js"]
    }
  }
}
```

Find your exact path with:
```bash
npm list -g apple-hig-mcp
```

### Windsurf IDE

#### Setup Steps
1. Open Windsurf
2. Go to **Settings** → **Advanced** → **Cascade** → **Model Context Protocol**
3. Enable MCP
4. Click the **Hammer Icon** in the Cascade toolbar
5. Click **Configure** to open the MCP configuration file

#### Configuration
**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-hig-mcp\\dist\\server.js"]
    }
  }
}
```

### VS Code (Preview)

#### Prerequisites
- GitHub Copilot extension installed
- Agent mode enabled (`chat.agent.enabled: true`)

#### Configuration
Create `.vscode/mcp.json` in your workspace:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-hig-mcp\\dist\\server.js"]
    }
  }
}
```

#### Manage Servers
- Run `MCP: List Servers` to view status
- Use `MCP: Start/Stop/Restart` commands as needed

### Configuration Notes

#### Why Not NPX?
We recommend using the direct file path approach instead of `npx` for this MCP server because:
- **Optimized Dependencies**: This server uses efficient keyword-based search without heavy ML dependencies
- **Performance**: Direct file path execution is faster and more reliable
- **Consistency**: Avoids potential version conflicts and download delays
- **Enterprise Networks**: Direct paths work better with corporate firewalls and proxy configurations

If you prefer using `npx`, it's still supported but may experience longer startup times.

#### Environment Variables (Optional)
For development or debugging, add environment variables:
```json
{
  "mcpServers": {
    "Apple HIG": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-hig-mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "development",
        "SEARCH_CONFIG": "keyword-optimized"
      }
    }
  }
}
```

#### Configuration File Locations
- **Claude Desktop**: 
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%AppData%\Claude\claude_desktop_config.json`
- **Cursor**: `.cursor/mcp.json` in project root
- **Windsurf**: Accessible via Cascade settings
- **VS Code**: `.vscode/mcp.json` in workspace
- **Claude Code**: Accessible via `/settings` command

### Usage with MCP Inspector

Test the server interactively:

```bash
npx @modelcontextprotocol/inspector apple-hig-mcp
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

## 📖 Usage Examples

### MCP Resources

#### Platform Guidelines
```
hig://ios - Complete iOS Human Interface Guidelines
hig://macos - Complete macOS Human Interface Guidelines  
hig://watchos - Complete watchOS Human Interface Guidelines
hig://tvos - Complete tvOS Human Interface Guidelines
hig://visionos - Complete visionOS Human Interface Guidelines
hig://universal - Cross-platform design principles
```

#### Popular Topics (Cross-Platform)
```
hig://buttons - Button design guidelines
hig://accessibility - Accessibility requirements  
hig://color - Color usage principles
hig://typography - Typography guidelines
hig://layout - Layout and spacing
hig://materials - Materials including Liquid Glass
hig://navigation-and-search - Navigation patterns
```

#### Platform-Specific Resources
```
hig://ios/foundations - iOS design foundations
hig://ios/visual-design - iOS visual design elements
hig://ios/navigation - iOS navigation patterns
```

#### Special Resources
```
hig://updates/latest - Latest HIG updates and changes
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
| `hig://<platform>` | Complete platform guidelines (ios, macos, watchos, tvos, visionos) |
| `hig://<platform>/<category>` | Category-specific guidelines |
| `hig://universal` | Cross-platform design principles |
| `hig://<topic>` | Topic-specific guidelines (buttons, materials, etc.) |
| `hig://updates/latest` | Latest HIG changes and additions |

### Tools

| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `search_guidelines` | Search HIG content with enhanced keyword matching | `query`, `platform`, `category`, `limit` |
| `get_component_spec` | Get component specifications | `componentName`, `platform` |
| `get_design_tokens` | Get design system values | `component`, `platform`, `tokenType` |
| `get_accessibility_requirements` | Get accessibility guidelines | `component`, `platform` |

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


## 🙏 Acknowledgments

- Apple Inc. for creating comprehensive design guidelines
- [Model Context Protocol](https://modelcontextprotocol.io/) team for the excellent framework
- Open source community for contributions and maintenance

---

**Built with ❤️ for the developer community**

*Bringing Apple's design excellence directly to your AI-assisted development workflow.*