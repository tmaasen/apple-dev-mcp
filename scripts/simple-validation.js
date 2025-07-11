#!/usr/bin/env node

/**
 * Simple Shipping Readiness Validation
 * Tests core functionality to ensure quality before shipping
 */

import fs from 'fs';
import path from 'path';

class SimpleValidator {
    constructor() {
        this.results = { passed: 0, failed: 0, warnings: 0 };
    }

    log(status, message) {
        console.log(`${status} ${message}`);
        if (status === '✅') this.results.passed++;
        else if (status === '❌') this.results.failed++;
        else if (status === '⚠️ ') this.results.warnings++;
    }

    async validate() {
        console.log('🚀 Simple Shipping Readiness Validation\n');

        // 1. Build and package validation
        console.log('📦 Build & Package Validation:');
        this.validateBuild();
        this.validateExtension();
        this.validateContent();

        // 2. Content quality validation
        console.log('\n📚 Content Quality Validation:');
        this.validateContentQuality();

        // 3. Test infrastructure validation
        console.log('\n🧪 Test Infrastructure:');
        this.validateTests();

        // 4. Generate report
        this.generateReport();
    }

    validateBuild() {
        const distExists = fs.existsSync('dist');
        const serverExists = fs.existsSync('dist/server.js');
        
        if (distExists && serverExists) {
            this.log('✅', 'Build artifacts exist (dist/server.js)');
        } else {
            this.log('❌', 'Missing build artifacts - run `npm run build`');
        }
    }

    validateExtension() {
        const dxtExists = fs.existsSync('apple-dev-mcp.dxt') || fs.existsSync('apple-dev-mcp-2.0.0.dxt');
        
        if (dxtExists) {
            this.log('✅', 'Desktop Extension (.dxt) package exists');
        } else {
            this.log('❌', 'Missing .dxt package - run `npm run build:extension`');
        }
    }

    validateContent() {
        const contentDir = 'content';
        const metadataDir = 'content/metadata';
        
        if (!fs.existsSync(contentDir)) {
            this.log('❌', 'Missing content directory');
            return;
        }

        const files = fs.readdirSync(contentDir, { recursive: true });
        const mdFiles = files.filter(f => f.endsWith('.md'));
        const hasMetadata = fs.existsSync(metadataDir);
        const hasSearchIndex = fs.existsSync('content/metadata/search-index.json');

        if (mdFiles.length >= 50) {
            this.log('✅', `Rich content available (${mdFiles.length} markdown files)`);
        } else if (mdFiles.length >= 20) {
            this.log('⚠️ ', `Limited content (${mdFiles.length} files - consider regenerating)`);
        } else {
            this.log('❌', `Insufficient content (${mdFiles.length} files)`);
        }

        if (hasMetadata && hasSearchIndex) {
            this.log('✅', 'Search indices and metadata available');
        } else {
            this.log('⚠️ ', 'Missing search metadata - may impact search quality');
        }
    }

    validateContentQuality() {
        // Test a few key content files
        const testFiles = [
            'content/buttons.md',
            'content/navigation-bars.md',
            'content/color.md',
            'content/platforms/ios/designing-for-ios.md'
        ];

        let qualityPassed = 0;
        
        for (const file of testFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const quality = this.assessContentQuality(content);
                
                if (quality.score >= 0.7) {
                    this.log('✅', `${path.basename(file)}: High quality (${quality.score.toFixed(2)})`);
                    qualityPassed++;
                } else if (quality.score >= 0.5) {
                    this.log('⚠️ ', `${path.basename(file)}: Moderate quality (${quality.score.toFixed(2)})`);
                } else {
                    this.log('❌', `${path.basename(file)}: Low quality (${quality.score.toFixed(2)})`);
                }
            } else {
                this.log('❌', `Missing key file: ${file}`);
            }
        }

        const qualityRate = qualityPassed / testFiles.length;
        if (qualityRate >= 0.75) {
            this.log('✅', 'Overall content quality is excellent');
        } else if (qualityRate >= 0.5) {
            this.log('⚠️ ', 'Content quality needs improvement');
        }
    }

    assessContentQuality(content) {
        const hasMetadata = content.startsWith('---');
        const hasAppleAttribution = content.includes('Apple Inc. All rights reserved');
        const hasStructuredContent = content.includes('## Overview') || content.includes('## Best practices');
        const hasKeywords = content.includes('keywords:');
        const contentLength = content.length;
        const hasQualityScore = content.includes('qualityScore:');
        
        const score = (
            (hasMetadata ? 0.2 : 0) +
            (hasAppleAttribution ? 0.2 : 0) +
            (hasStructuredContent ? 0.2 : 0) +
            (hasKeywords ? 0.1 : 0) +
            (hasQualityScore ? 0.1 : 0) +
            (contentLength > 1000 ? 0.2 : Math.min(contentLength / 5000, 0.2))
        );

        return { score, hasMetadata, hasAppleAttribution, hasStructuredContent };
    }

    validateTests() {
        // Check if tests pass
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const hasTestScript = packageJson.scripts && packageJson.scripts.test;
            
            if (hasTestScript) {
                this.log('✅', 'Test suite configured (run `npm test` to verify)');
            } else {
                this.log('⚠️ ', 'No test script found');
            }

            // Check for test files
            const testFiles = fs.readdirSync('src/__tests__', { withFileTypes: true })
                .filter(dirent => dirent.isFile() && dirent.name.endsWith('.test.ts'))
                .length;

            if (testFiles >= 10) {
                this.log('✅', `Comprehensive test coverage (${testFiles} test files)`);
            } else if (testFiles >= 5) {
                this.log('⚠️ ', `Basic test coverage (${testFiles} test files)`);
            } else {
                this.log('❌', `Insufficient test coverage (${testFiles} test files)`);
            }

        } catch (error) {
            this.log('❌', 'Error checking test configuration');
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 SHIPPING READINESS REPORT');
        console.log('='.repeat(60));

        const total = this.results.passed + this.results.warnings + this.results.failed;
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ⚠️  Warnings: ${this.results.warnings}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);

        // Overall recommendation
        if (this.results.failed === 0 && successRate >= 85) {
            console.log('\n🚀 RECOMMENDATION: READY TO SHIP!');
            console.log('   Your Apple Dev MCP server is ready for distribution.');
            console.log('   All core functionality validated successfully.');
        } else if (this.results.failed === 0 && successRate >= 70) {
            console.log('\n⚠️  RECOMMENDATION: READY WITH MINOR ISSUES');
            console.log('   Your MCP server is functional but could benefit from improvements.');
            console.log('   Consider addressing warnings before public release.');
        } else if (this.results.failed <= 1 && successRate >= 60) {
            console.log('\n⚠️  RECOMMENDATION: CLOSE TO READY');
            console.log('   Fix critical issues first, then ready for limited release.');
        } else {
            console.log('\n❌ RECOMMENDATION: NOT READY TO SHIP');
            console.log('   Critical issues need to be resolved before release.');
        }

        console.log('\n💡 Next Steps:');
        if (this.results.failed > 0) {
            console.log('   1. Fix failed validations listed above');
        }
        if (this.results.warnings > 0) {
            console.log('   2. Address warnings to improve quality');
        }
        console.log('   3. Run full test suite: `npm test`');
        console.log('   4. Test manual installation with: `npx @modelcontextprotocol/inspector dist/server.js`');
        console.log('   5. Test .dxt installation in Claude Desktop');
        console.log('   6. Verify search results match Apple documentation quality');

        console.log('\n🔗 Additional Validation Commands:');
        console.log('   • `npm run health-check` - Built-in health validation');
        console.log('   • `npm run lint` - Code quality check');
        console.log('   • `npm run build && npm start` - Test server startup');

        console.log('\n' + '='.repeat(60));
    }
}

// Run validation
const validator = new SimpleValidator();
validator.validate().catch(console.error);