# 🍎 Apple Dev MCP Server

[![Health Check](https://github.com/tmaasen/apple-dev-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tmaasen/apple-dev-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/apple-dev-mcp.svg)](https://www.npmjs.com/package/apple-dev-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) server that provides complete Apple development guidance, combining Human Interface Guidelines (design principles) with Technical Documentation (API reference) for all Apple platforms.

Perfect for developers using AI-assisted development who want unified access to both Apple's design guidelines and technical documentation while building iOS, macOS, watchOS, tvOS, and visionOS applications.

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

### 🎨 Complete Apple Ecosystem Coverage
- **Design Guidelines**: Human Interface Guidelines for all Apple platforms
- **Technical Documentation**: Apple API documentation and technical references
- **Content Fusion**: Intelligent combination of design principles with technical implementation
- **Cross-Platform Support**: iOS, macOS, watchOS, tvOS, and visionOS

### ⚡ Performance & Reliability
- **Ultra-Fast**: Instant responses via pre-generated static content (no scraping delays)
- **Smart Search**: Advanced search with pre-built indices and wildcard pattern support
- **Intelligent Fallback**: 99.9% uptime with graceful degradation to live scraping
- **Scalable**: Handles unlimited concurrent users with consistent performance

### 🔍 Advanced Search Capabilities
- **Unified Search**: Search across both design and technical content simultaneously
- **Wildcard Patterns**: Support for * and ? pattern matching
- **Cross-References**: Intelligent mapping between design concepts and technical implementations
- **Enhanced Keyword Search**: Synonym expansion and context-aware relevance scoring

### 🚀 AI-Powered Development Tools
- **Fused Guidance**: Comprehensive guides combining design principles with technical implementation
- **Implementation Guides**: Step-by-step guides from design to deployment
- **Code Examples**: Real SwiftUI, UIKit, and AppKit code samples
- **Best Practices**: Platform-specific guidance and common pitfall avoidance

### 🔄 Always Current
- **Auto-Updated**: Content refreshed every 4 months via GitHub Actions
- **Current Design System**: Always up-to-date with Apple's latest design language
- **API Documentation**: Latest technical documentation and framework updates
- **Quality Assurance**: Comprehensive validation and testing pipeline

### 🤖 AI-Optimized
- **Clean Markdown**: Optimized format for AI consumption
- **Structured Data**: Consistent formatting across all content types
- **MCP Integration**: Native Model Context Protocol support
- **Respectful Usage**: Follows fair use principles with proper Apple attribution

## 🚀 Quick Start

### Installation

```bash
npm install -g apple-dev-mcp
```

## 🔧 Platform-Specific Setup

### Claude Desktop

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-dev-mcp\\dist\\server.js"]
    }
  }
}
```

### Claude Code

#### Method 1: Command Line (Recommended)
```bash
# For local project scope
claude mcp add "Apple Dev" node /usr/local/lib/node_modules/apple-dev-mcp/dist/server.js

# For user-wide scope (available in all projects)
claude mcp add -s user "Apple Ecosystem" node /usr/local/lib/node_modules/apple-dev-mcp/dist/server.js
```

#### Method 2: Project Configuration File  
Create `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"]
    }
  }
}
```

#### Method 3: NPX (Alternative)
```bash
claude mcp add "Apple Dev" npx -- -y apple-dev-mcp
```

### Cursor IDE

Create `.cursor/mcp.json` in your project root, or go to the Cursor settings where you have MCP integrations

**macOS/Linux:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-dev-mcp\\dist\\server.js"]
    }
  }
}
```

Find your exact path with:
```bash
npm list -g apple-dev-mcp
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
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-dev-mcp\\dist\\server.js"]
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
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "Apple Dev": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\apple-dev-mcp\\dist\\server.js"]
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
    "Apple Dev": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/apple-dev-mcp/dist/server.js"],
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
npx @modelcontextprotocol/inspector apple-dev-mcp
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

### MCP Tools (13 Available)

The Apple Ecosystem MCP server provides 13 tools available across four categories:

#### 🎨 Design Guidelines Tools

**Search Guidelines**
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

**Get Component Specifications**
```json
{
  "name": "get_component_spec",
  "arguments": {
    "componentName": "Navigation Bar",
    "platform": "iOS"
  }
}
```

**Get Design Tokens**
```json
{
  "name": "get_design_tokens",
  "arguments": {
    "component": "Button",
    "platform": "iOS",
    "tokenType": "all"
  }
}
```

**Get Accessibility Requirements**
```json
{
  "name": "get_accessibility_requirements",
  "arguments": {
    "component": "Button",
    "platform": "iOS"
  }
}
```

#### 🔧 Technical Documentation Tools

**Get Technical Documentation**
```json
{
  "name": "get_technical_documentation",
  "arguments": {
    "path": "documentation/SwiftUI/Button",
    "includeDesignGuidance": true,
    "includeCodeExamples": true
  }
}
```

**List Technologies**
```json
{
  "name": "list_technologies",
  "arguments": {
    "platform": "iOS",
    "category": "framework",
    "includeDesignMapping": true
  }
}
```

**Search Technical Documentation**
```json
{
  "name": "search_technical_documentation",
  "arguments": {
    "query": "Button*",
    "framework": "SwiftUI",
    "platform": "iOS",
    "maxResults": 20
  }
}
```

#### 🔄 Unified & Advanced Search Tools

**Unified Search**
```json
{
  "name": "search_unified",
  "arguments": {
    "query": "navigation patterns",
    "platform": "iOS",
    "includeDesign": true,
    "includeTechnical": true,
    "maxResults": 20
  }
}
```

**Wildcard Search**
```json
{
  "name": "search_wildcard",
  "arguments": {
    "pattern": "Button*Style",
    "searchType": "both",
    "platform": "iOS",
    "maxResults": 25
  }
}
```

**Get Cross-References**
```json
{
  "name": "get_cross_references",
  "arguments": {
    "query": "Button",
    "type": "component",
    "platform": "iOS",
    "includeRelated": true
  }
}
```

**Check Updates**
```json
{
  "name": "check_updates",
  "arguments": {
    "sources": ["git-repository", "hig-static", "api-documentation"],
    "includeChangelog": true
  }
}
```

#### 🚀 AI-Powered Content Fusion Tools

**Generate Fused Guidance**
```json
{
  "name": "generate_fused_guidance",
  "arguments": {
    "component": "Button",
    "platform": "iOS",
    "framework": "SwiftUI",
    "complexity": "intermediate",
    "includeCodeExamples": true,
    "includeAccessibility": true,
    "includeStepByStep": true
  }
}
```

**Generate Implementation Guide**
```json
{
  "name": "generate_implementation_guide",
  "arguments": {
    "component": "Navigation",
    "platform": "macOS",
    "framework": "AppKit",
    "useCase": "document-based app",
    "includeDesignPhase": true,
    "includeImplementationPhase": true,
    "includeValidationPhase": true
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

1. Check [open issues](https://github.com/tannermaasen/apple-dev-mcp/issues) for scraper failures
2. Use the [scraper issue template](https://github.com/tannermaasen/apple-dev-mcp/issues/new?template=scraper_issue.md) to report problems
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

### Tools (13 Available)

#### Design Guidelines Tools
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `search_guidelines` | Search HIG content with enhanced keyword matching | `query`, `platform`, `category`, `limit` |
| `get_component_spec` | Get detailed component specifications | `componentName`, `platform` |
| `get_design_tokens` | Get design system values (colors, spacing, typography) | `component`, `platform`, `tokenType` |
| `get_accessibility_requirements` | Get accessibility guidelines for components | `component`, `platform` |

#### Technical Documentation Tools
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `get_technical_documentation` | Get Apple API documentation and symbols | `path`, `includeDesignGuidance`, `includeCodeExamples` |
| `list_technologies` | List available Apple frameworks and technologies | `platform`, `category`, `includeDesignMapping` |
| `search_technical_documentation` | Search technical docs with wildcard support | `query`, `framework`, `platform`, `maxResults` |

#### Unified & Advanced Search Tools
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `search_unified` | Search across both design and technical content | `query`, `platform`, `includeDesign`, `includeTechnical` |
| `search_wildcard` | Advanced pattern search with * and ? wildcards | `pattern`, `searchType`, `platform`, `maxResults` |
| `get_cross_references` | Get mappings between design and technical content | `query`, `type`, `platform`, `includeRelated` |
| `check_updates` | Check for content and repository updates | `sources`, `includeChangelog` |

#### AI-Powered Content Fusion Tools
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `generate_fused_guidance` | Generate comprehensive design + technical guidance | `component`, `platform`, `framework`, `complexity` |
| `generate_implementation_guide` | Generate step-by-step implementation guides | `component`, `platform`, `framework`, `useCase` |

## 🐛 Troubleshooting

### Common Issues

**Scraper not working?**
- Check if Apple's website is accessible
- Look for recent website structure changes
- Check [existing issues](https://github.com/tannermaasen/apple-dev-mcp/issues)

**Empty or incomplete content?**
- Clear cache and retry
- Check network connectivity
- Report as a [scraper issue](https://github.com/tannermaasen/apple-dev-mcp/issues/new?template=scraper_issue.md)

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