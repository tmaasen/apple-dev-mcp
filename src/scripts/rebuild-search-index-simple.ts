#!/usr/bin/env node

/**
 * Simple Search Index Rebuild Script
 * 
 * Directly rebuilds the search index JSON from the new topic-first content structure
 */

import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🔍 Rebuilding Search Index for Topic-First Structure');
  console.log('===================================================');

  const projectRoot = process.cwd();
  const contentDir = path.join(projectRoot, 'content');
  const metadataDir = path.join(contentDir, 'metadata');
  const indexPath = path.join(metadataDir, 'search-index.json');

  try {
    // Scan all content files
    const allFiles = await scanAllContentFiles(contentDir);
    console.log(`📁 Found ${allFiles.length} content files`);

    // Build search index
    const searchIndex = {
      metadata: {
        version: "2.0-topic-first",
        totalSections: allFiles.length,
        semanticEnabled: false,
        semanticStats: {
          totalIndexedSections: 0,
          isInitialized: false,
          modelLoaded: false,
          config: {}
        },
        lastUpdated: new Date().toISOString(),
        indexType: "topic-first-keyword"
      },
      keywordIndex: {} as Record<string, any>,
      searchCapabilities: {
        keywordSearch: true,
        semanticSearch: false,
        structuredContentSearch: true,
        conceptSearch: false,
        intentRecognition: false,
        crossPlatformSearch: true,
        categoryFiltering: true,
        qualityFiltering: true,
        topicFirstSearch: true
      }
    };

    let universalCount = 0;
    let platformCount = 0;

    // Process each file
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file.filePath, 'utf8');
        const frontMatter = parseFrontMatter(content);
        
        if (!frontMatter.title || !frontMatter.url) {
          console.warn(`⚠️ Skipping ${file.fileName}: missing title or URL`);
          continue;
        }

        // Create search entry
        const entry = {
          id: frontMatter.id || generateId(frontMatter.title, file.platform),
          title: frontMatter.title,
          platform: file.isUniversal ? 'universal' : file.platform,
          category: frontMatter.category || 'foundations',
          url: frontMatter.url,
          keywords: extractKeywords(content, frontMatter, file),
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
          lastUpdated: frontMatter.lastUpdated || new Date().toISOString(),
          hasStructuredContent: content.includes('## Overview') || content.includes('## Specifications'),
          hasGuidelines: content.includes('guideline') || content.includes('recommendation'),
          hasExamples: content.includes('example') || content.includes('Example'),
          hasSpecifications: content.includes('## Specifications') || content.includes('dimensions'),
          conceptCount: extractConcepts(content).length
        };

        // Add to search index
        searchIndex.keywordIndex[entry.id] = entry;
        
        if (file.isUniversal) {
          universalCount++;
        } else {
          platformCount++;
        }

        // Log progress
        const prefix = file.isUniversal ? '🌍' : '📱';
        const displayPath = file.isUniversal ? file.fileName : `${file.platform}/${file.fileName}`;
        console.log(`   ${prefix} ${displayPath} (${entry.keywords.length} keywords)`);

      } catch (error) {
        console.error(`❌ Failed to process ${file.fileName}:`, error);
      }
    }

    // Update metadata
    searchIndex.metadata.totalSections = Object.keys(searchIndex.keywordIndex).length;

    // Write search index
    await fs.mkdir(metadataDir, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(searchIndex, null, 2));

    // Test key searches
    console.log('\n🧪 Testing key searches...');
    const testSearches = [
      'liquid glass',
      'materials',
      'buttons', 
      'complications',
      'visionos'
    ];

    for (const query of testSearches) {
      const results = searchInIndex(searchIndex.keywordIndex, query);
      console.log(`   "${query}": ${results.length} results`);
      if (results.length > 0) {
        console.log(`      • ${results[0].title} (${results[0].platform})`);
      }
    }

    console.log('\n✅ Search index rebuild completed!');
    console.log(`📊 Indexed ${searchIndex.metadata.totalSections} sections:`);
    console.log(`   • Universal topics: ${universalCount}`);
    console.log(`   • Platform-specific: ${platformCount}`);
    console.log(`📄 Index file: ${indexPath}`);

  } catch (error) {
    console.error('❌ Search index rebuild failed:', error);
    process.exit(1);
  }
}

interface ContentFile {
  filePath: string;
  fileName: string;
  isUniversal: boolean;
  platform: string;
}

async function scanAllContentFiles(contentDir: string): Promise<ContentFile[]> {
  const files: ContentFile[] = [];

  // Root level files (universal topics)
  try {
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
  } catch (error) {
    console.warn('⚠️ Could not read root content directory:', error);
  }

  // Platform-specific files
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

function generateId(title: string, platform: string): string {
  const cleanTitle = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanTitle}-${platform.toLowerCase()}`;
}

function extractKeywords(content: string, frontMatter: any, file: ContentFile): string[] {
  const keywords = new Set<string>();
  
  // Add existing keywords from front matter
  if (frontMatter.keywords && Array.isArray(frontMatter.keywords)) {
    frontMatter.keywords.forEach((k: string) => keywords.add(k.toLowerCase()));
  }
  
  // Add title words
  if (frontMatter.title) {
    frontMatter.title.toLowerCase().split(/\s+/).forEach((word: string) => {
      if (word.length > 2) keywords.add(word);
    });
  }
  
  // Extract key terms from content
  const textContent = content.replace(/^---[\s\S]*?---/, '').toLowerCase();
  
  // Important Apple/HIG terms
  const importantTerms = [
    'liquid glass', 'glass', 'liquid', 'material', 'materials',
    'ios', 'macos', 'watchos', 'tvos', 'visionos', 'universal',
    'apple', 'human interface guidelines', 'hig', 'design',
    'button', 'buttons', 'navigation', 'accessibility', 'layout',
    'color', 'typography', 'interface', 'user experience',
    'complications', 'watch face', 'digital crown',
    'spatial', 'immersive', 'ornaments', 'eyes'
  ];
  
  importantTerms.forEach(term => {
    if (textContent.includes(term)) {
      keywords.add(term);
    }
  });
  
  // Platform and category
  if (frontMatter.platform) keywords.add(frontMatter.platform.toLowerCase());
  if (frontMatter.category) keywords.add(frontMatter.category.toLowerCase());
  if (file.platform && file.platform !== 'universal') keywords.add(file.platform.toLowerCase());
  
  // File-specific terms
  const fileName = file.fileName.replace('.md', '');
  fileName.split('-').forEach(part => {
    if (part.length > 2) keywords.add(part);
  });
  
  return Array.from(keywords);
}

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

function extractConcepts(content: string): string[] {
  const concepts = new Set<string>();
  
  // Extract from headings
  const headings = content.match(/^#+\s*(.+)$/gm) || [];
  headings.forEach(heading => {
    const text = heading.replace(/^#+\s*/, '').trim();
    if (text.length > 0) concepts.add(text);
  });
  
  // Extract from bold text
  const boldText = content.match(/\*\*(.*?)\*\*/g) || [];
  boldText.forEach(bold => {
    const text = bold.replace(/\*\*/g, '').trim();
    if (text.length > 2 && text.length < 50) concepts.add(text);
  });
  
  return Array.from(concepts);
}

function searchInIndex(keywordIndex: Record<string, any>, query: string): any[] {
  const queryLower = query.toLowerCase();
  const results = [];

  for (const entry of Object.values(keywordIndex)) {
    let score = 0;
    
    // Check title
    if (entry.title.toLowerCase().includes(queryLower)) {
      score += 2;
    }
    
    // Check keywords
    const keywordMatches = entry.keywords.filter((k: string) => 
      k.includes(queryLower) || queryLower.includes(k)
    ).length;
    score += keywordMatches * 0.5;
    
    // Check snippet
    if (entry.snippet.toLowerCase().includes(queryLower)) {
      score += 1;
    }
    
    if (score > 0) {
      results.push({ ...entry, score });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

main().catch(console.error);