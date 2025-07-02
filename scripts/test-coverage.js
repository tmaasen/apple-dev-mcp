#!/usr/bin/env node
/**
 * Quick Coverage Test Script
 * Tests core search functionality without Jest complexity
 */

import { HIGStaticContentProvider } from '../dist/static-content.js';
import { HIGToolProvider } from '../dist/tools.js';
import { HIGCache } from '../dist/cache.js';
import { HIGResourceProvider } from '../dist/resources.js';
import { CrawleeHIGService } from '../dist/services/crawlee-hig.service.js';

async function runCoverageTests() {
  console.log('🔍 Running Content Coverage Tests...\n');

  // Initialize providers
  const staticProvider = new HIGStaticContentProvider();
  const cache = new HIGCache();
  const resourceProvider = new HIGResourceProvider(staticProvider, undefined, cache);
  const crawleeService = new CrawleeHIGService(cache);
  const toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider, staticProvider);

  await staticProvider.initialize();

  // Test critical terms that users commonly search for
  const criticalTerms = [
    // Authentication (previously failing)
    'authentication', 'login', 'sign in with apple', 'privacy', 'security',
    'face id', 'touch id', 'biometric authentication', 'apple pay',
    
    // Core Components  
    'buttons', 'text fields', 'navigation bars', 'tab bars', 'alerts',
    'icons', 'images', 'colors', 'typography', 'layout',
    
    // Platform Features
    'ios design', 'macos windows', 'watchos complications', 'tvos focus',
    'visionos spatial', 'dynamic island', 'control center', 'siri',
    
    // Accessibility
    'accessibility', 'voiceover', 'color contrast', 'keyboard navigation',
    
    // Common Patterns
    'forms', 'lists', 'tables', 'menus', 'toolbars', 'gestures',
    'loading states', 'error messages', 'modals', 'popovers'
  ];

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  for (const term of criticalTerms) {
    try {
      const results = await toolProvider.searchGuidelines({ query: term, limit: 5 });
      
      if (results.results.length > 0) {
        passCount++;
        console.log(`✅ "${term}": ${results.results.length} results - ${results.results[0].title}`);
      } else {
        failCount++;
        failures.push(term);
        console.log(`❌ "${term}": NO RESULTS`);
      }
    } catch (error) {
      failCount++;
      failures.push(term);
      console.log(`❌ "${term}": ERROR - ${error.message}`);
    }
  }

  // Test component spec functionality (was broken before)
  console.log('\n🔧 Testing Component Specs...');
  
  const componentTests = [
    { name: 'Text Field', platform: 'iOS' },
    { name: 'Button', platform: 'iOS' },
    { name: 'Navigation Bar', platform: 'iOS' }
  ];

  for (const test of componentTests) {
    try {
      const spec = await toolProvider.getComponentSpec({
        componentName: test.name,
        platform: test.platform
      });
      
      if (spec && spec.title) {
        console.log(`✅ ${test.name} spec: ${spec.title}`);
      } else {
        console.log(`⚠️ ${test.name} spec: Limited content`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} spec: ERROR - ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 Coverage Test Summary:');
  console.log(`✅ Passing: ${passCount}/${criticalTerms.length} (${((passCount/criticalTerms.length)*100).toFixed(1)}%)`);
  console.log(`❌ Failing: ${failCount}/${criticalTerms.length}`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failed terms:');
    failures.forEach(term => console.log(`   - ${term}`));
  }

  // Test platform-specific searches
  console.log('\n🎯 Platform-Specific Coverage:');
  const platforms = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'];
  
  for (const platform of platforms) {
    const results = await toolProvider.searchGuidelines({ 
      query: 'design guidelines', 
      platform: platform,
      limit: 3 
    });
    console.log(`${platform}: ${results.results.length} design guideline results`);
  }

  // Overall health check
  const overallScore = (passCount / criticalTerms.length) * 100;
  console.log(`\n🎯 Overall Content Discoverability: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 95) {
    console.log('🎉 EXCELLENT: Content is highly discoverable!');
  } else if (overallScore >= 85) {
    console.log('✅ GOOD: Most content is discoverable');
  } else if (overallScore >= 70) {
    console.log('⚠️ FAIR: Some content gaps need attention');
  } else {
    console.log('❌ POOR: Significant discoverability issues');
  }

  return overallScore >= 90;
}

runCoverageTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });