<div align="center">
  <img src="icon.svg" width="128" height="128" alt="Apple Dev MCP Icon">
  
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
- **⚡ Ultra-Fast**: Instant responses via pre-generated static content (no scraping delays)
- **🔍 Smart Search**: Unified search across design and technical content with wildcard support
- **🤖 AI-Powered Tools**: Fused guidance combining design principles with technical implementation
- **🔄 Always Current**: Auto-updated content every 4 months via GitHub Actions

## 🚀 Quick Start

### Option 1: Claude Desktop Extension (Recommended)
1. Download `apple-dev-mcp.dxt` from [releases](https://github.com/tannermaasen/apple-dev-mcp/releases)
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
claude mcp add "Apple Dev" node /usr/local/lib/node_modules/apple-dev-mcp/dist/server.js
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

### Resources
```
hig://ios              # Complete iOS guidelines
hig://macos            # Complete macOS guidelines  
hig://buttons          # Button design guidelines
hig://accessibility    # Accessibility requirements
hig://ios/foundations  # iOS-specific foundations
```

### Key Tools (13 available)

**Search & Discovery**
- `search_guidelines` - Search HIG with platform/category filters
- `search_unified` - Search both design and technical content
- `search_wildcard` - Pattern search with * and ? wildcards

**Design Guidance**
- `get_component_spec` - Detailed component specifications
- `get_design_tokens` - Colors, spacing, typography values
- `get_accessibility_requirements` - Accessibility guidelines

**Technical Documentation**
- `get_technical_documentation` - Apple API docs with code examples
- `search_technical_documentation` - Search frameworks and symbols

**AI-Powered Fusion**
- `generate_fused_guidance` - Comprehensive design + technical guides
- `generate_implementation_guide` - Step-by-step implementation guides

### Example
```json
{
  "name": "generate_fused_guidance",
  "arguments": {
    "component": "Button",
    "platform": "iOS", 
    "framework": "SwiftUI",
    "includeCodeExamples": true
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