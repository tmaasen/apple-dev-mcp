#!/usr/bin/env node

/**
 * Rebuild Search Index Script
 * 
 * Rebuilds the search index to use topic-first content organization
 * for better cross-platform search discovery
 */

import fs from 'fs/promises';
import path from 'path';
import { SearchIndexerService } from '../services/search-indexer.service.js';
import { ContentProcessorService } from '../services/content-processor.service.js';

interface ContentFile {
  filePath: string;
  fileName: string;
  isUniversal: boolean;
  platform: string;
}

async function main() {
  console.log('🔍 Apple HIG Search Index Rebuild');
  console.log('==================================');
  console.log('Rebuilding search index for topic-first content organization...\n');

  const projectRoot = process.cwd();
  const contentDir = path.join(projectRoot, 'content');
  const metadataDir = path.join(contentDir, 'metadata');

  try {
    // Initialize services
    const contentProcessor = new ContentProcessorService();
    const searchIndexer = new SearchIndexerService(contentProcessor);

    // Scan content directory for new structure
    console.log('📁 Scanning content directory...');
    const contentFiles = await scanContentDirectory(contentDir);
    
    console.log(`📊 Found ${contentFiles.length} content files:`);
    console.log(`   • Universal topics: ${contentFiles.filter(f => f.isUniversal).length}`);
    console.log(`   • Platform-specific: ${contentFiles.filter(f => !f.isUniversal).length}`);

    // Process all files and build index
    console.log('\n🔄 Processing content files...');
    let processedCount = 0;
    let universalCount = 0;
    let platformCount = 0;

    for (const contentFile of contentFiles) {
      try {
        const content = await fs.readFile(contentFile.filePath, 'utf8');
        const frontMatter = parseFrontMatter(content);
        
        if (!frontMatter.title || !frontMatter.url) {
          console.warn(`⚠️ Skipping ${contentFile.fileName}: missing title or URL`);
          continue;
        }

        // Create search entry
        const searchEntry = {
          id: frontMatter.id || generateId(frontMatter.title, contentFile.platform),
          title: frontMatter.title,
          platform: contentFile.isUniversal ? 'universal' : contentFile.platform,
          category: frontMatter.category || 'foundations',
          url: frontMatter.url,
          keywords: extractKeywords(content, frontMatter),
          snippet: generateSnippet(content, frontMatter.title),
          quality: {
            score: parseFloat(frontMatter.qualityScore) || 0.8,
            length: parseInt(frontMatter.contentLength) || content.length,
            structureScore: parseFloat(frontMatter.structureScore) || 0.5,
            appleTermsScore: calculateAppleTermsScore(content),
            codeExamplesCount: (content.match(/```/g) || []).length / 2,
            imageReferencesCount: (content.match(/!\[.*?\]/g) || []).length,
            headingCount: (content.match(/^#+\s/gm) || []).length,
            isFallbackContent: frontMatter.extractionMethod === 'fallback',
            extractionMethod: frontMatter.extractionMethod || 'enhanced-turndown',
            confidence: parseFloat(frontMatter.confidence) || 1.0
          },
          lastUpdated: frontMatter.lastUpdated ? new Date(frontMatter.lastUpdated) : new Date(),
          hasStructuredContent: content.includes('## Overview') || content.includes('## Specifications'),
          hasGuidelines: content.includes('guideline') || content.includes('recommendation'),
          hasExamples: content.includes('example') || content.includes('Example'),
          hasSpecifications: content.includes('## Specifications') || content.includes('dimensions'),
          conceptCount: extractConcepts(content).length
        };

        // Add to search index
        searchIndexer.addSection(searchEntry as any);
        
        processedCount++;
        if (contentFile.isUniversal) {
          universalCount++;
        } else {
          platformCount++;
        }

        // Log progress
        const prefix = contentFile.isUniversal ? '🌍' : '📱';
        const displayPath = contentFile.isUniversal ? contentFile.fileName : `${contentFile.platform}/${contentFile.fileName}`;
        console.log(`   ${prefix} ${displayPath} (quality: ${searchEntry.quality.score.toFixed(3)})`);

      } catch (error) {
        console.error(`❌ Failed to process ${contentFile.fileName}:`, error);
      }
    }

    // Generate search index
    console.log('\n🔨 Generating search index...');
    const searchIndex = searchIndexer.generateIndex();

    // Ensure metadata directory exists
    await fs.mkdir(metadataDir, { recursive: true });

    // Write search index
    const indexPath = path.join(metadataDir, 'search-index.json');
    await fs.writeFile(indexPath, JSON.stringify(searchIndex, null, 2));

    // Generate statistics
    const stats = generateIndexStats(searchIndex);
    const statsPath = path.join(metadataDir, 'index-statistics.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));

    // Success summary
    console.log('\n✅ Search index rebuild completed!');
    console.log('\n📊 Results:');
    console.log(`   • Total indexed: ${processedCount} files`);
    console.log(`   • Universal topics: ${universalCount}`);
    console.log(`   • Platform-specific: ${platformCount}`);
    console.log(`   • Index file: ${indexPath}`);

    console.log('\n🔍 Search Capabilities:');
    console.log('   • Topic-based search (e.g., "materials", "liquid glass")')
    console.log('   • Cross-platform discovery');
    console.log('   • Universal content prioritized in results');
    console.log('   • Platform filtering available');

    console.log('\n🧪 Test Commands:');
    console.log('   • Search "liquid glass" - should find materials.md');
    console.log('   • Search "buttons" - should find universal buttons.md');
    console.log('   • Search "complications" - should find watchOS-specific content');

  } catch (error) {
    console.error('❌ Search index rebuild failed:', error);
    process.exit(1);
  }
}

/**
 * Scan content directory for all markdown files
 */
async function scanContentDirectory(contentDir: string): Promise<ContentFile[]> {
  const files: ContentFile[] = [];

  // Scan root level for universal topics
  const rootFiles = await fs.readdir(contentDir);
  for (const fileName of rootFiles) {
    if (fileName.endsWith('.md')) {
      files.push({
        filePath: path.join(contentDir, fileName),
        fileName,
        isUniversal: true,
        platform: 'universal'
      });
    }
  }

  // Scan platforms directory
  const platformsDir = path.join(contentDir, 'platforms');
  try {
    const platforms = await fs.readdir(platformsDir, { withFileTypes: true });
    
    for (const platformDirent of platforms) {
      if (!platformDirent.isDirectory()) continue;
      
      const platform = platformDirent.name;
      const platformDir = path.join(platformsDir, platform);
      const platformFiles = await fs.readdir(platformDir);
      
      for (const fileName of platformFiles) {
        if (fileName.endsWith('.md')) {
          files.push({
            filePath: path.join(platformDir, fileName),
            fileName,
            isUniversal: false,
            platform
          });
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not scan platforms directory:', error);
  }

  return files;
}

/**
 * Parse markdown front matter
 */
function parseFrontMatter(content: string): Record<string, any> {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) return {};
  
  const frontMatter: Record<string, any> = {};
  const lines = frontMatterMatch[1].split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      try {
        frontMatter[key] = JSON.parse(value);
      } catch {
        frontMatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
  
  return frontMatter;
}

/**
 * Generate unique ID for content
 */
function generateId(title: string, platform: string): string {
  const cleanTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanTitle}-${platform.toLowerCase()}`;
}

/**
 * Extract keywords from content
 */
function extractKeywords(content: string, frontMatter: any): string[] {
  const keywords = new Set<string>();
  
  // Add existing keywords from front matter
  if (frontMatter.keywords && Array.isArray(frontMatter.keywords)) {
    frontMatter.keywords.forEach((k: string) => keywords.add(k.toLowerCase()));
  }
  
  // Extract keywords from title
  if (frontMatter.title) {
    frontMatter.title.toLowerCase().split(/\s+/).forEach((word: string) => {
      if (word.length > 2) keywords.add(word);
    });
  }
  
  // Extract key terms from content
  const textContent = content.replace(/^---[\s\S]*?---/, '').toLowerCase();
  
  // Apple-specific terms
  const appleTerms = [
    'ios', 'macos', 'watchos', 'tvos', 'visionos',
    'human interface guidelines', 'hig', 'apple',
    'button', 'navigation', 'accessibility', 'layout',
    'color', 'typography', 'material', 'glass', 'liquid glass'
  ];
  
  appleTerms.forEach(term => {
    if (textContent.includes(term)) {
      keywords.add(term);
    }
  });
  
  // Platform and category
  if (frontMatter.platform) keywords.add(frontMatter.platform.toLowerCase());
  if (frontMatter.category) keywords.add(frontMatter.category.toLowerCase());
  
  return Array.from(keywords);
}

/**
 * Generate content snippet
 */
function generateSnippet(content: string, title: string): string {
  // Extract first meaningful paragraph after front matter
  const bodyContent = content.replace(/^---[\s\S]*?---\n/, '');
  const paragraphs = bodyContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  for (const paragraph of paragraphs) {
    const cleaned = paragraph.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (cleaned.length > 50 && !cleaned.startsWith('##')) {
      return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '');
    }
  }
  
  return `${title} - Apple Human Interface Guidelines content.`;
}

/**
 * Calculate Apple terms score
 */
function calculateAppleTermsScore(content: string): number {
  const appleTerms = [
    'apple', 'ios', 'macos', 'watchos', 'tvos', 'visionos',
    'human interface guidelines', 'design', 'interface',
    'user experience', 'accessibility', 'guideline'
  ];
  
  const lowerContent = content.toLowerCase();
  const foundTerms = appleTerms.filter(term => lowerContent.includes(term));
  
  return Math.min(foundTerms.length / appleTerms.length, 1.0);
}

/**
 * Extract concepts from content
 */
function extractConcepts(content: string): string[] {
  const concepts = new Set<string>();
  
  // Extract from headings
  const headings = content.match(/^#+\s*(.+)$/gm) || [];
  headings.forEach(heading => {
    const text = heading.replace(/^#+\s*/, '').trim();
    if (text.length > 0) concepts.add(text);
  });
  
  // Extract from bold text (often concepts)
  const boldText = content.match(/\*\*(.*?)\*\*/g) || [];
  boldText.forEach(bold => {
    const text = bold.replace(/\*\*/g, '').trim();
    if (text.length > 2 && text.length < 50) concepts.add(text);
  });
  
  return Array.from(concepts);
}

/**
 * Generate index statistics
 */
function generateIndexStats(searchIndex: any): any {
  const entries = Object.values(searchIndex.keywordIndex || {});
  const platforms = new Set();
  const categories = new Set();
  let totalQuality = 0;
  let universalCount = 0;
  
  entries.forEach((entry: any) => {
    platforms.add(entry.platform);
    categories.add(entry.category);
    totalQuality += entry.quality?.score || 0;
    if (entry.platform === 'universal') universalCount++;
  });
  
  return {
    totalEntries: entries.length,
    universalTopics: universalCount,
    platformSpecificTopics: entries.length - universalCount,
    platforms: Array.from(platforms),
    categories: Array.from(categories),
    averageQuality: entries.length > 0 ? totalQuality / entries.length : 0,
    indexType: 'topic-first',
    generatedAt: new Date().toISOString(),
    searchCapabilities: {
      keywordSearch: true,
      topicBasedSearch: true,
      crossPlatformSearch: true,
      platformFiltering: true,
      categoryFiltering: true,
      qualityFiltering: true
    }
  };
}

// Run the script
main().catch(console.error);