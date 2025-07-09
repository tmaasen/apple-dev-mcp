# Security Policy

## Supported Versions

We support the latest major version of the Apple Dev MCP Server with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x: (deprecated)   |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in the Apple Dev MCP Server, please report it responsibly:

### How to Report

1. **Create a GitHub issue** for security vulnerabilities
2. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability within 7 days
- **Resolution**: Critical vulnerabilities will be patched within 30 days
- **Disclosure**: We will coordinate disclosure timing with you

### Scope

This security policy covers:
- The core MCP server functionality
- Desktop Extension (`.dxt`) packaging and installation
- Content processing and scraping components
- Content fusion and AI-powered tools
- Static content generation and caching
- Technical documentation integration
- Data handling and storage

### Out of Scope

- Third-party dependencies (report to their maintainers)
- Issues requiring physical access to systems
- Social engineering attacks

## Security Best Practices

When using the Apple Dev MCP Server:

### For Desktop Extensions
1. **Verified Downloads**: Only install `.dxt` files from official GitHub releases
2. **Extension Validation**: Verify manifest.json contents before installation
3. **Regular Updates**: Keep extensions updated to latest versions
4. **Permissions Review**: Review extension permissions and network access

### For Traditional MCP Integration
1. **Keep Updated**: Always use the latest version (`npm update apple-dev-mcp`)
2. **Network Security**: Use HTTPS when possible for content fetching
3. **Access Control**: Limit MCP server access to trusted clients
4. **Monitoring**: Monitor for unusual activity or errors
5. **Content Validation**: Verify content integrity and Apple attribution

### For Developers
1. **Static Content**: Prefer static content over live scraping for security
2. **API Limits**: Respect Apple's API rate limits and terms of service
3. **Data Handling**: Never log or store sensitive user data
4. **Error Handling**: Implement proper error handling to prevent information leakage

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities (with their permission).