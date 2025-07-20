#!/usr/bin/env node

/**
 * MCP Debug Tool
 * 
 * Helps diagnose common MCP setup and content issues
 */

import { StaticContentSearchService } from '../dist/services/static-content-search.service.js';

console.log('🔧 Apple Dev MCP Diagnostic Tool');
console.log('================================');

async function runDiagnostics() {
  try {
    console.log('\n📋 1. Initializing search service...');
    const service = new StaticContentSearchService();
    
    console.log('\n📋 2. Checking content availability...');
    const isAvailable = await service.isContentAvailable();
    console.log(`   Content available: ${isAvailable ? '✅' : '❌'}`);
    
    if (isAvailable) {
      const stats = await service.getContentStats();
      console.log(`   Content files: ${stats.sections}`);
      console.log(`   Content size: ${stats.totalSize}`);
    }
    
    console.log('\n📋 3. Testing search functionality...');
    const testQueries = [
      'searching',
      'button guidelines',
      'alert design patterns',
      'picker interface design'
    ];
    
    for (const query of testQueries) {
      console.log(`\n   Testing: "${query}"`);
      const results = await service.searchContent(query, 'iOS', undefined, 1);
      if (results.length > 0) {
        console.log(`   ✅ Found: ${results[0].title} (score: ${results[0].relevanceScore.toFixed(3)})`);
        
        // Check if it's fallback content
        if (results[0].id.includes('fallback')) {
          console.log(`   ⚠️  WARNING: Returning fallback content - static content may not be properly loaded`);
        }
      } else {
        console.log(`   ❌ No results found`);
      }
    }
    
    console.log('\n📋 4. Final diagnosis...');
    
    if (!isAvailable) {
      console.log('❌ ISSUE: Static content not found');
      console.log('💡 SOLUTION: Ensure the content/ directory is included in your MCP installation');
      console.log('   - If using npm: Make sure content/ is in the published package');
      console.log('   - If using local build: Verify content/ exists in the correct location');
      console.log('   - Check that content/metadata/search-index.json exists');
    } else {
      console.log('✅ MCP is working correctly!');
      console.log('   Static content is loaded and search is functioning properly.');
    }
    
  } catch (error) {
    console.log('❌ ERROR during diagnostics:', error.message);
    console.log('💡 This indicates a setup or configuration issue');
  }
}

runDiagnostics();