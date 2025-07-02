/**
 * Content Validation Test Suite
 * Validates that search index accurately represents actual content files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { HIGStaticContentProvider } from '../static-content.js';
import { HIGToolProvider } from '../tools.js';
import { HIGCache } from '../cache.js';
import { HIGResourceProvider } from '../resources.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';

describe('Content Validation Tests', () => {
  let staticProvider: HIGStaticContentProvider;
  let toolProvider: HIGToolProvider;
  let contentDir: string;
  let allContentFiles: string[] = [];

  beforeAll(async () => {
    staticProvider = new HIGStaticContentProvider();
    const cache = new HIGCache();
    const crawleeService = new CrawleeHIGService(cache);
    const resourceProvider = new HIGResourceProvider(crawleeService, cache, staticProvider);
    toolProvider = new HIGToolProvider(crawleeService, cache, resourceProvider, staticProvider);
    
    await staticProvider.initialize();
    
    // Get content directory
    contentDir = path.join(process.cwd(), 'content');
    
    // Scan all markdown files
    allContentFiles = await scanContentFiles(contentDir);
    console.log(`Found ${allContentFiles.length} content files to validate`);
  });

  async function scanContentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'metadata') {
          // Recursively scan subdirectories
          const subFiles = await scanContentFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}:`, error);
    }
    
    return files;
  }

  async function extractKeyTermsFromFile(filePath: string): Promise<{
    fileName: string;
    title: string;
    keyTerms: string[];
    concepts: string[];
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Extract title (first H1 or filename)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : fileName.replace(/-/g, ' ');
    
    // Extract key terms from content
    const keyTerms = new Set<string>();
    const concepts = new Set<string>();
    
    // Add filename as key term
    keyTerms.add(fileName.replace(/-/g, ' '));
    
    // Add title words
    title.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keyTerms.add(word);
    });
    
    // Extract headings as concepts
    const headings = content.match(/^#{1,3} (.+)$/gm) || [];
    headings.forEach(heading => {
      const text = heading.replace(/^#+\s*/, '').toLowerCase();
      concepts.add(text);
      text.split(/\s+/).forEach(word => {
        if (word.length > 2) keyTerms.add(word);
      });
    });
    
    // Extract Apple-specific terms
    const appleTerms = [
      'Face ID', 'Touch ID', 'Apple Pay', 'Sign in with Apple', 'Siri',
      'Dynamic Island', 'Control Center', 'Digital Crown', 'SF Symbols',
      'VoiceOver', 'Dynamic Type', 'CarPlay', 'HomeKit', 'HealthKit',
      'Game Center', 'Apple Watch', 'Apple TV', 'Vision Pro',
      'iPhone', 'iPad', 'Mac', 'MacBook', 'iMac'
    ];
    
    appleTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        keyTerms.add(term.toLowerCase());
      }
    });
    
    // Extract common UI terms
    const uiTerms = [
      'button', 'text field', 'navigation', 'menu', 'toolbar', 'tab bar',
      'slider', 'toggle', 'picker', 'alert', 'sheet', 'popover',
      'icon', 'image', 'color', 'typography', 'layout', 'accessibility',
      'gesture', 'animation', 'transition', 'hover', 'focus', 'selection'
    ];
    
    uiTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        keyTerms.add(term);
      }
    });
    
    return {
      fileName,
      title,
      keyTerms: Array.from(keyTerms),
      concepts: Array.from(concepts)
    };
  }

  describe('File Content Discoverability', () => {
    test('all major content files should be discoverable by their filename', async () => {
      const criticalFiles = [
        'buttons.md',
        'text-fields.md', 
        'navigation-bars.md',
        'tab-bars.md',
        'alerts.md',
        'accessibility.md',
        'color.md',
        'typography.md',
        'layout.md',
        'privacy.md',
        'sign-in-with-apple.md',
        'apple-pay.md',
        'siri.md',
        'gestures.md',
        'icons.md',
        'sf-symbols.md'
      ];

      for (const fileName of criticalFiles) {
        const searchTerm = fileName.replace('.md', '').replace(/-/g, ' ');
        const results = await toolProvider.searchGuidelines({ query: searchTerm, limit: 10 });
        
        expect(results.results.length).toBeGreaterThan(0);
        
        // The most relevant result should be the file itself
        const topResult = results.results[0];
        expect(topResult.title.toLowerCase()).toContain(searchTerm.split(' ')[0]);
        
        console.log(`✅ "${searchTerm}" → ${topResult.title} (score: ${topResult.relevanceScore})`);
      }
    });

    test('platform-specific content should be discoverable', async () => {
      const platformContent = [
        { platform: 'iOS', terms: ['home screen', 'multitasking', 'live activities'] },
        { platform: 'macOS', terms: ['menu bar', 'dock menus', 'windows'] },
        { platform: 'watchOS', terms: ['complications', 'digital crown', 'watch faces'] },
        { platform: 'tvOS', terms: ['focus and selection', 'top shelf', 'remote'] },
        { platform: 'visionOS', terms: ['spatial layout', 'immersive', 'ornaments'] }
      ];

      for (const { platform, terms } of platformContent) {
        for (const term of terms) {
          const results = await toolProvider.searchGuidelines({ 
            query: term, 
            platform: platform as any,
            limit: 5 
          });
          
          expect(results.results.length).toBeGreaterThan(0);
          console.log(`✅ ${platform} "${term}": ${results.results.length} results`);
        }
      }
    });
  });

  describe('Content Completeness Validation', () => {
    test('should validate that all content files have searchable terms', async () => {
      const fileAnalyses = await Promise.all(
        allContentFiles.slice(0, 20).map(extractKeyTermsFromFile) // Test subset for performance
      );

      let totalSearchable = 0;
      let totalUnsearchable = 0;

      for (const analysis of fileAnalyses) {
        let foundSearchableTerms = 0;
        
        // Test the most important terms from each file
        const importantTerms = analysis.keyTerms.slice(0, 5);
        
        for (const term of importantTerms) {
          if (term.length > 2) {
            const results = await toolProvider.searchGuidelines({ query: term, limit: 5 });
            if (results.results.length > 0) {
              foundSearchableTerms++;
            }
          }
        }
        
        if (foundSearchableTerms > 0) {
          totalSearchable++;
          console.log(`✅ ${analysis.fileName}: ${foundSearchableTerms}/${importantTerms.length} terms searchable`);
        } else {
          totalUnsearchable++;
          console.warn(`❌ ${analysis.fileName}: No searchable terms found!`);
          console.warn(`   Key terms: ${importantTerms.join(', ')}`);
        }
      }

      console.log(`\nContent Discoverability Summary:`);
      console.log(`  Searchable files: ${totalSearchable}`);
      console.log(`  Unsearchable files: ${totalUnsearchable}`);
      console.log(`  Coverage: ${((totalSearchable / (totalSearchable + totalUnsearchable)) * 100).toFixed(1)}%`);

      // At least 90% of content should be discoverable
      expect(totalSearchable / (totalSearchable + totalUnsearchable)).toBeGreaterThan(0.9);
    });

    test('should validate Apple technology coverage', async () => {
      const appleFeatures = [
        // Core Technologies
        { term: 'Face ID', expectedInFiles: ['privacy', 'sign-in-with-apple'] },
        { term: 'Touch ID', expectedInFiles: ['privacy', 'apple-pay'] },
        { term: 'Apple Pay', expectedInFiles: ['apple-pay'] },
        { term: 'Siri', expectedInFiles: ['siri'] },
        { term: 'Dynamic Island', expectedInFiles: ['live-activities'] },
        { term: 'Digital Crown', expectedInFiles: ['digital-crown'] },
        { term: 'SF Symbols', expectedInFiles: ['sf-symbols'] },
        { term: 'VoiceOver', expectedInFiles: ['accessibility'] },
        { term: 'CarPlay', expectedInFiles: ['carplay'] },
        
        // Platform Features
        { term: 'Control Center', expectedInFiles: ['designing-for-ios'] },
        { term: 'Dock', expectedInFiles: ['dock-menus'] },
        { term: 'Menu Bar', expectedInFiles: ['the-menu-bar'] },
        { term: 'Complications', expectedInFiles: ['complications'] },
        { term: 'Top Shelf', expectedInFiles: ['top-shelf'] }
      ];

      for (const feature of appleFeatures) {
        const results = await toolProvider.searchGuidelines({ query: feature.term, limit: 10 });
        
        expect(results.results.length).toBeGreaterThan(0);
        
        // Check if expected files are in results
        const resultTitles = results.results.map(r => r.id || r.title.toLowerCase());
        const foundExpectedFiles = feature.expectedInFiles.some(expectedFile => 
          resultTitles.some(title => title.includes(expectedFile))
        );
        
        if (!foundExpectedFiles) {
          console.warn(`⚠️ ${feature.term}: Expected files not found in top results`);
          console.warn(`   Expected: ${feature.expectedInFiles.join(', ')}`);
          console.warn(`   Found: ${resultTitles.slice(0, 3).join(', ')}`);
        } else {
          console.log(`✅ ${feature.term}: Found expected content`);
        }
      }
    });
  });

  describe('Search Quality Validation', () => {
    test('should validate relevance scoring quality', async () => {
      const testCases = [
        {
          query: 'buttons',
          expectedTopResult: 'buttons',
          minScore: 10
        },
        {
          query: 'sign in with apple',
          expectedTopResult: 'sign in with apple',
          minScore: 15
        },
        {
          query: 'navigation bars',
          expectedTopResult: 'navigation bars',
          minScore: 10
        },
        {
          query: 'accessibility',
          expectedTopResult: 'accessibility',
          minScore: 10
        },
        {
          query: 'privacy',
          expectedTopResult: 'privacy',
          minScore: 15
        }
      ];

      for (const testCase of testCases) {
        const results = await toolProvider.searchGuidelines({ 
          query: testCase.query, 
          limit: 5 
        });
        
        expect(results.results.length).toBeGreaterThan(0);
        
        const topResult = results.results[0];
        expect(topResult.relevanceScore).toBeGreaterThan(testCase.minScore);
        
        // Check if the top result matches expected content
        const titleMatch = topResult.title.toLowerCase().includes(testCase.expectedTopResult);
        const idMatch = topResult.id?.includes(testCase.expectedTopResult.replace(/\s+/g, '-'));
        
        expect(titleMatch || idMatch).toBe(true);
        
        console.log(`✅ "${testCase.query}" → ${topResult.title} (score: ${topResult.relevanceScore})`);
      }
    });

    test('should validate synonym and alternative term coverage', async () => {
      const synonymPairs = [
        { primary: 'toggle', alternatives: ['switch'] },
        { primary: 'button', alternatives: ['btn', 'control'] },
        { primary: 'text field', alternatives: ['input', 'textbox'] },
        { primary: 'navigation bar', alternatives: ['navbar', 'header'] },
        { primary: 'popover', alternatives: ['popup', 'tooltip'] },
        { primary: 'activity indicator', alternatives: ['spinner', 'loading'] },
        { primary: 'tab bar', alternatives: ['tabs', 'tabbed navigation'] }
      ];

      for (const { primary, alternatives } of synonymPairs) {
        const primaryResults = await toolProvider.searchGuidelines({ query: primary, limit: 5 });
        expect(primaryResults.results.length).toBeGreaterThan(0);
        
        for (const alternative of alternatives) {
          const altResults = await toolProvider.searchGuidelines({ query: alternative, limit: 5 });
          
          if (altResults.results.length === 0) {
            console.warn(`⚠️ Synonym gap: "${alternative}" (for ${primary}) returns no results`);
          } else {
            // Check if results overlap (should find similar content)
            const primaryIds = new Set(primaryResults.results.map(r => r.id));
            const altIds = new Set(altResults.results.map(r => r.id));
            const overlap = Array.from(primaryIds).some(id => altIds.has(id));
            
            if (overlap) {
              console.log(`✅ Synonym working: "${alternative}" → similar to "${primary}"`);
            } else {
              console.warn(`⚠️ Synonym mismatch: "${alternative}" doesn't find similar content to "${primary}"`);
            }
          }
        }
      }
    });
  });

  describe('Edge Case Coverage', () => {
    test('should handle complex multi-word queries', async () => {
      const complexQueries = [
        'navigation bar button placement guidelines',
        'accessibility color contrast requirements',
        'dark mode color scheme implementation',
        'iOS multitasking split view design',
        'macOS menu bar icon sizing standards',
        'watchOS complication layout constraints'
      ];

      for (const query of complexQueries) {
        const results = await toolProvider.searchGuidelines({ query, limit: 5 });
        
        expect(results.results.length).toBeGreaterThan(0);
        console.log(`✅ Complex query "${query}": ${results.results.length} results`);
      }
    });

    test('should handle technical implementation terms', async () => {
      const technicalTerms = [
        'safe area insets',
        'layout margins', 
        'content priority',
        'trait collections',
        'size classes',
        'dynamic type scaling',
        'auto layout constraints',
        'stack view distribution'
      ];

      let foundCount = 0;
      
      for (const term of technicalTerms) {
        const results = await toolProvider.searchGuidelines({ query: term, limit: 5 });
        
        if (results.results.length > 0) {
          foundCount++;
          console.log(`✅ Technical term "${term}": ${results.results.length} results`);
        } else {
          console.warn(`⚠️ Technical term "${term}": No results found`);
        }
      }

      // At least 50% of technical terms should find related content
      expect(foundCount / technicalTerms.length).toBeGreaterThan(0.5);
    });
  });
});