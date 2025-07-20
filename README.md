<div align="center">
  <img src="icon.png" width="128" height="128" alt="Apple Dev MCP Icon">
  
  # 🍎 Apple Dev MCP Server

  [![Health Check](https://github.com/tmaasen/apple-dev-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tmaasen/apple-dev-mcp/actions/workflows/ci.yml)
  [![npm version](https://img.shields.io/npm/v/apple-dev-mcp.svg)](https://www.npmjs.com/package/apple-dev-mcp)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

  **Complete Apple development guidance for AI assistants**
  
  Combines Human Interface Guidelines (design) with Technical Documentation (API reference) for all Apple platforms.
</div>

## ✨ Features

- **🎨 Complete Coverage**: HIG design guidelines + Apple API documentation for iOS, macOS, watchOS, tvOS, visionOS
- **⚡ Smart Caching**: Fast responses via intelligent caching with graceful degradation
- **🔍 Smart Search**: Unified search across design and technical content
- **🤖 Enhanced Search**: Advanced search combining design principles with technical implementation
- **🔄 Always Current**: Dynamic content discovery ensures latest Apple guidelines

## 🚀 Quick Start

### Option 1: Claude Desktop Extension (Recommended)
1. Download `apple-dev-mcp.dxt` from [releases](https://github.com/tmaasen/apple-dev-mcp/releases)
2. Double-click to install in Claude Desktop
3. Restart Claude Desktop
4. Start using Apple development guidance!

### Option 2: Traditional Installation
```bash
npm install -g apple-dev-mcp
```

## 🔧 Configuration

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `claude_desktop_config.json`:
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
</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add "Apple-Dev" node /usr/local/lib/node_modules/apple-dev-mcp/dist/server.js
```
</details>

<details>
<summary><strong>Cursor / Windsurf / VS Code</strong></summary>

Create `.cursor/mcp.json`, windsurf config, or `.vscode/mcp.json`:
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
</details>

**Find your path**: `npm list -g apple-dev-mcp`  
**Windows users**: Replace with `C:\Users\YourUsername\AppData\Roaming\npm\node_modules\apple-dev-mcp\dist\server.js`

## 📖 Usage

### Available Tools (3 core tools)

**Design Guidelines Search**
- `search_human_interface_guidelines` - Search Apple HIG with platform filters
  - Returns full content (not snippets) for AI-friendly responses
  - Covers all Apple platforms: iOS, macOS, watchOS, tvOS, visionOS

**Technical Documentation Search**
- `search_technical_documentation` - Search Apple API documentation
  - Framework-specific searches (SwiftUI, UIKit, AppKit, etc.)
  - Symbol and method lookups with code examples

**Unified Search**
- `search_unified` - Combined design + technical documentation search
  - Cross-references design guidelines with implementation details
  - Perfect for end-to-end development guidance

### Examples

**Search Design Guidelines:**
```json
{
  "name": "search_human_interface_guidelines",
  "arguments": {
    "query": "Tab Bars",
    "platform": "iOS"
  }
}
```

**Search Technical Documentation:**
```json
{
  "name": "search_technical_documentation",
  "arguments": {
    "query": "Button",
    "framework": "SwiftUI"
  }
}
```

**Unified Search:**
```json
{
  "name": "search_unified",
  "arguments": {
    "query": "navigation",
    "platform": "iOS"
  }
}
```

## 🧪 Testing

```bash
npm test                # Run test suite
npm run health-check    # Test functionality

# Interactive testing
npx @modelcontextprotocol/inspector apple-dev-mcp
```

## 🤝 Contributing

We welcome contributions! The most needed help:

1. **Scraper fixes** when Apple changes their website
2. **New features** and **bug fixes**  
3. **Documentation** improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## ⚖️ Legal & Attribution

This project operates under fair use principles for educational purposes. All content includes proper Apple attribution and respects their intellectual property.

> Content sourced from Apple's Human Interface Guidelines.  
> © Apple Inc. All rights reserved. Provided for educational purposes.

## 🙏 Acknowledgments

- [MightyDillah](https://github.com/MightyDillah/apple-doc-mcp) for inspiration
- Apple Inc. for comprehensive design guidelines
- [Model Context Protocol](https://modelcontextprotocol.io/) team
- Open source community for contributions

---

**Built with ❤️ for the developer community**

*Bringing Apple's design excellence directly to your AI-assisted development workflow.*