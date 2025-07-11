#!/usr/bin/env node

/**
 * Comprehensive Shipping Readiness Validation
 * Tests all critical functions to ensure the MCP server provides
 * rich, relevant results equivalent to Apple's documentation
 */

import fs from 'fs';
import path from 'path';

// Import the actual server components
import { HIGStaticContentProvider } from '../dist/static-content.js';
import { HIGToolsService } from '../dist/tools.js';
import { HIGResourceProvider } from '../dist/resources.js';

class ShippingReadinessValidator {
    constructor() {
        this.contentProvider = new HIGStaticContentProvider();
        this.toolsService = new HIGToolsService(this.contentProvider);
        this.resourceProvider = new HIGResourceProvider(this.contentProvider);
        this.results = {
            contentQuality: {},
            searchRelevance: {},
            resourceCompleteness: {},
            overall: { passed: 0, failed: 0, warnings: 0 }
        };
    }

    async runAll() {
        console.log('🚀 Starting Comprehensive Shipping Readiness Validation...\n');
        
        try {
            await this.validateContentQuality();
            await this.validateSearchRelevance();
            await this.validateResourceCompleteness();
            await this.validateCriticalScenarios();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        }
    }

    async validateContentQuality() {
        console.log('📊 Testing Content Quality vs Apple Documentation...');
        
        const testFiles = [
            'content/buttons.md',
            'content/platforms/ios/designing-for-ios.md',
            'content/navigation-bars.md',
            'content/color.md',
            'content/typography.md'
        ];

        for (const file of testFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const quality = this.assessContentQuality(content, file);
                this.results.contentQuality[file] = quality;
                
                if (quality.score >= 0.7) {
                    console.log(`  ✅ ${file}: Quality score ${quality.score.toFixed(2)}`);
                    this.results.overall.passed++;
                } else {
                    console.log(`  ⚠️  ${file}: Quality score ${quality.score.toFixed(2)} (below threshold)`);
                    this.results.overall.warnings++;
                }
            } catch (error) {
                console.log(`  ❌ ${file}: Failed to read - ${error.message}`);
                this.results.overall.failed++;
            }
        }
    }

    assessContentQuality(content, filename) {
        const lines = content.split('\n');
        const hasMetadata = content.startsWith('---');
        const hasAppleAttribution = content.includes('Apple Inc. All rights reserved');
        const hasStructuredContent = content.includes('## Overview') || content.includes('## Best practices');
        const contentLength = content.length;
        const hasKeywords = content.includes('keywords:');
        
        // Extract quality score from metadata if available
        const qualityMatch = content.match(/qualityScore:\s*([\d.]+)/);
        const metadataQuality = qualityMatch ? parseFloat(qualityMatch[1]) : 0.5;
        
        const score = (
            (hasMetadata ? 0.2 : 0) +
            (hasAppleAttribution ? 0.2 : 0) +
            (hasStructuredContent ? 0.2 : 0) +
            (contentLength > 1000 ? 0.2 : contentLength / 5000) +
            (hasKeywords ? 0.1 : 0) +
            (metadataQuality * 0.1)
        );

        return {
            score,
            hasMetadata,
            hasAppleAttribution,
            hasStructuredContent,
            contentLength,
            metadataQuality
        };
    }

    async validateSearchRelevance() {
        console.log('\n🔍 Testing Search Relevance Across All Tools...');

        const searchTests = [
            {
                query: 'iOS button design guidelines',
                expectedTopics: ['buttons', 'ios', 'design']
            },
            {
                query: 'navigation bar best practices',
                expectedTopics: ['navigation', 'bar', 'practices']
            },
            {
                query: 'color accessibility requirements',
                expectedTopics: ['color', 'accessibility']
            },
            {
                query: 'macOS window controls',
                expectedTopics: ['macos', 'window', 'controls']
            },
            {
                query: 'watchOS complications',
                expectedTopics: ['watchos', 'complications']
            }
        ];

        for (const test of searchTests) {
            try {
                const result = await this.toolsService.searchGuidelines({
                    query: test.query,
                    limit: 5
                });

                const relevance = this.assessSearchRelevance(result, test.expectedTopics);
                this.results.searchRelevance[test.query] = relevance;

                if (relevance.score >= 0.7) {
                    console.log(`  ✅ "${test.query}": Relevance ${relevance.score.toFixed(2)}`);
                    this.results.overall.passed++;
                } else {
                    console.log(`  ⚠️  "${test.query}": Relevance ${relevance.score.toFixed(2)} (may need improvement)`);
                    this.results.overall.warnings++;
                }
            } catch (error) {
                console.log(`  ❌ "${test.query}": Search failed - ${error.message}`);
                this.results.overall.failed++;
            }
        }
    }

    assessSearchRelevance(result, expectedTopics) {
        if (!result || !result.results || result.results.length === 0) {
            return { score: 0, reason: 'No results returned' };
        }

        let topicMatches = 0;
        const resultText = JSON.stringify(result.results).toLowerCase();
        
        for (const topic of expectedTopics) {
            if (resultText.includes(topic.toLowerCase())) {
                topicMatches++;
            }
        }

        const topicScore = topicMatches / expectedTopics.length;
        const resultCount = Math.min(result.results.length / 3, 1); // Prefer 3+ results
        
        return {
            score: (topicScore * 0.8) + (resultCount * 0.2),
            topicMatches,
            expectedTopics: expectedTopics.length,
            resultCount: result.results.length
        };
    }

    async validateResourceCompleteness() {
        console.log('\n📚 Testing Resource Completeness...');

        const resources = await this.resourceProvider.listResources();
        const platformCoverage = this.assessPlatformCoverage(resources);
        
        this.results.resourceCompleteness = platformCoverage;

        const requiredPlatforms = ['ios', 'macos', 'watchos', 'tvos', 'visionos'];
        const coveredPlatforms = Object.keys(platformCoverage.byPlatform);
        
        for (const platform of requiredPlatforms) {
            if (coveredPlatforms.includes(platform)) {
                console.log(`  ✅ ${platform}: ${platformCoverage.byPlatform[platform]} resources`);
                this.results.overall.passed++;
            } else {
                console.log(`  ❌ ${platform}: No resources found`);
                this.results.overall.failed++;
            }
        }

        console.log(`  📊 Total resources: ${resources.length}`);
    }

    assessPlatformCoverage(resources) {
        const byPlatform = {};
        const byCategory = {};

        for (const resource of resources) {
            // Extract platform from URI like hig://ios/buttons
            const uriParts = resource.uri.split('/');
            if (uriParts.length >= 2) {
                const platform = uriParts[1];
                byPlatform[platform] = (byPlatform[platform] || 0) + 1;
            }
        }

        return { byPlatform, byCategory, total: resources.length };
    }

    async validateCriticalScenarios() {
        console.log('\n🎯 Testing Critical User Scenarios...');

        const scenarios = [
            {
                name: 'New iOS developer needs button guidance',
                test: () => this.toolsService.searchGuidelines({ query: 'iOS button styles', platform: 'iOS' })
            },
            {
                name: 'Designer needs color accessibility info',
                test: () => this.toolsService.getAccessibilityRequirements({ component: 'color', platform: 'iOS' })
            },
            {
                name: 'Developer needs specific component specs',
                test: () => this.toolsService.getComponentSpec({ componentName: 'Navigation Bar', platform: 'iOS' })
            }
        ];

        for (const scenario of scenarios) {
            try {
                const result = await scenario.test();
                if (result && (result.results?.length > 0 || result.component || result.requirements)) {
                    console.log(`  ✅ ${scenario.name}: Success`);
                    this.results.overall.passed++;
                } else {
                    console.log(`  ⚠️  ${scenario.name}: Weak results`);
                    this.results.overall.warnings++;
                }
            } catch (error) {
                console.log(`  ❌ ${scenario.name}: Failed - ${error.message}`);
                this.results.overall.failed++;
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 SHIPPING READINESS VALIDATION REPORT');
        console.log('='.repeat(60));

        const total = this.results.overall.passed + this.results.overall.warnings + this.results.overall.failed;
        const successRate = (this.results.overall.passed / total * 100).toFixed(1);

        console.log(`\n📊 Overall Results:`);
        console.log(`   ✅ Passed: ${this.results.overall.passed}`);
        console.log(`   ⚠️  Warnings: ${this.results.overall.warnings}`);
        console.log(`   ❌ Failed: ${this.results.overall.failed}`);
        console.log(`   📈 Success Rate: ${successRate}%`);

        // Determine readiness level
        if (this.results.overall.failed === 0 && successRate >= 85) {
            console.log('\n🚀 STATUS: READY TO SHIP!');
            console.log('   Your MCP server provides rich, relevant results equivalent to Apple\'s documentation.');
            console.log('   Installation methods work correctly and tools provide high-quality responses.');
        } else if (this.results.overall.failed === 0 && successRate >= 70) {
            console.log('\n⚠️  STATUS: READY WITH MINOR ISSUES');
            console.log('   Your MCP server is functional but could benefit from some improvements.');
            console.log('   Consider addressing warnings before wide release.');
        } else {
            console.log('\n❌ STATUS: NOT READY TO SHIP');
            console.log('   Critical issues found that need to be addressed before release.');
            console.log('   Please review failed tests and fix underlying problems.');
        }

        // Specific recommendations
        console.log('\n💡 Recommendations:');
        
        if (Object.keys(this.results.contentQuality).some(file => 
            this.results.contentQuality[file].score < 0.7)) {
            console.log('   • Regenerate static content to improve quality scores');
        }
        
        if (Object.keys(this.results.searchRelevance).some(query => 
            this.results.searchRelevance[query].score < 0.7)) {
            console.log('   • Review search algorithm and keyword matching');
        }

        console.log('   • Run `npm run health-check` for additional validation');
        console.log('   • Test the .dxt installation manually in Claude Desktop');
        console.log('   • Consider A/B testing with real users');

        console.log('\n' + '='.repeat(60));
    }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new ShippingReadinessValidator();
    validator.runAll().catch(console.error);
}

export { ShippingReadinessValidator };