#!/usr/bin/env tsx

/**
 * HIG Content Generator
 * 
 * Scrapes all Apple Human Interface Guidelines content and generates
 * optimized static files for the MCP server.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { HIGCache } from '../src/cache.js';
import { HIGScraper } from '../src/scraper.js';
import { HIGSection, ApplePlatform, HIGCategory } from '../src/types.js';

interface ContentMetadata {
  lastUpdated: string;
  totalSections: number;
  sectionsByPlatform: Record<ApplePlatform, number>;
  sectionsByCategory: Record<HIGCategory, number>;
  totalSize: number;
  generationDuration: number;
}

interface SearchIndex {
  [key: string]: {
    id: string;
    title: string;
    platform: ApplePlatform;
    category: HIGCategory;
    url: string;
    keywords: string[];
    snippet: string;
  };
}

interface CrossReferences {
  [sectionId: string]: {
    relatedSections: string[];
    backlinks: string[];
    tags: string[];
  };
}

class HIGContentGenerator {
  private cache: HIGCache;
  private scraper: HIGScraper;
  private contentDir: string;
  private forceUpdate: boolean;
  private sections: HIGSection[] = [];
  private searchIndex: SearchIndex = {};
  private crossReferences: CrossReferences = {};

  constructor() {
    this.cache = new HIGCache(3600); // 1 hour TTL
    this.scraper = new HIGScraper(this.cache);
    this.contentDir = path.join(process.cwd(), 'content');
    this.forceUpdate = process.env.FORCE_UPDATE === 'true';
  }

  /**
   * Main entry point for content generation
   */
  async generate(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🍎 Starting HIG content generation...');
    console.log(`📅 Force update: ${this.forceUpdate}`);
    console.log(`📁 Output directory: ${this.contentDir}`);
    
    try {
      // Step 1: Discover all HIG sections
      await this.discoverSections();
      
      // Step 2: Create directory structure
      await this.createDirectoryStructure();
      
      // Step 3: Generate content for each section
      await this.generateSectionContent();
      
      // Step 4: Generate search indices
      await this.generateSearchIndex();
      
      // Step 5: Generate cross-references
      await this.generateCrossReferences();
      
      // Step 6: Generate metadata
      const duration = Date.now() - startTime;
      await this.generateMetadata(duration);
      
      console.log(`✅ Content generation completed in ${duration}ms`);
      console.log(`📊 Generated ${this.sections.length} sections`);
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Discover all HIG sections to scrape
   */
  private async discoverSections(): Promise<void> {
    console.log('🔍 Discovering HIG sections...');
    
    this.sections = await this.scraper.discoverSections();
    
    console.log(`📋 Found ${this.sections.length} sections:`);
    
    const platformCounts = this.sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} sections`);
    });
  }

  /**
   * Create directory structure for organized content
   */
  private async createDirectoryStructure(): Promise<void> {
    console.log('📁 Creating directory structure...');
    
    const platforms: ApplePlatform[] = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS', 'universal'];
    
    // Create main directories
    await fs.mkdir(path.join(this.contentDir, 'platforms'), { recursive: true });
    await fs.mkdir(path.join(this.contentDir, 'metadata'), { recursive: true });
    await fs.mkdir(path.join(this.contentDir, 'images'), { recursive: true });
    
    // Create platform directories
    for (const platform of platforms) {
      await fs.mkdir(path.join(this.contentDir, 'platforms', platform.toLowerCase()), { recursive: true });
      await fs.mkdir(path.join(this.contentDir, 'images', platform.toLowerCase()), { recursive: true });
    }
  }

  /**
   * Generate content for each section
   */
  private async generateSectionContent(): Promise<void> {
    console.log('📝 Generating section content...');
    
    const concurrency = 3; // Limit concurrent requests
    const batches = this.chunkArray(this.sections, concurrency);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} sections)`);
      
      await Promise.all(batch.map(section => this.processSectionContent(section)));
      
      // Rate limiting between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Process content for a single section
   */
  private async processSectionContent(section: HIGSection): Promise<void> {
    try {
      const sectionWithContent = await this.scraper.fetchSectionContent(section);
      
      if (!sectionWithContent.content) {
        console.warn(`⚠️  No content for section: ${section.title}`);
        return;
      }
      
      // Generate filename
      const filename = this.generateFilename(section);
      const filePath = path.join(
        this.contentDir,
        'platforms',
        section.platform.toLowerCase(),
        filename
      );
      
      // Enhance content with metadata
      const enhancedContent = this.enhanceContent(sectionWithContent);
      
      // Write content to file
      await fs.writeFile(filePath, enhancedContent, 'utf-8');
      
      // Add to search index
      this.addToSearchIndex(sectionWithContent);
      
      console.log(`✓ Generated: ${section.platform}/${filename}`);
      
    } catch (error) {
      console.error(`❌ Failed to process section ${section.title}:`, error);
    }
  }

  /**
   * Generate a clean filename for a section
   */
  private generateFilename(section: HIGSection): string {
    const cleanTitle = section.title
      .replace(/^(iOS|macOS|watchOS|tvOS|visionOS)\s+/i, '') // Remove platform prefix
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    return `${cleanTitle}.md`;
  }

  /**
   * Enhance content with metadata and formatting
   */
  private enhanceContent(section: HIGSection): string {
    const frontMatter = [
      '---',
      `title: "${section.title}"`,
      `platform: ${section.platform}`,
      `category: ${section.category}`,
      `url: ${section.url}`,
      `id: ${section.id}`,
      `lastUpdated: ${section.lastUpdated?.toISOString() || new Date().toISOString()}`,
      '---',
      ''
    ].join('\n');
    
    const content = section.content || '';
    
    // Add table of contents for long content
    const toc = this.generateTableOfContents(content);
    
    // Add attribution
    const attribution = [
      '',
      '---',
      '',
      '**Attribution Notice**',
      '',
      `This content is sourced from Apple's Human Interface Guidelines: ${section.url}`,
      '',
      '© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple\\'s content.',
      '',
      'For the most up-to-date and official information, please refer to Apple\\'s official documentation.',
      ''
    ].join('\n');
    
    return frontMatter + toc + content + attribution;
  }

  /**
   * Generate table of contents for content
   */
  private generateTableOfContents(content: string): string {
    const headings = content.match(/^#+\s+.+$/gm);
    
    if (!headings || headings.length < 3) {
      return ''; // Don't add TOC for short content
    }
    
    const toc = ['## Table of Contents', ''];
    
    headings.forEach(heading => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s+/, '');
      const anchor = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      
      const indent = '  '.repeat(Math.max(0, level - 2));
      toc.push(`${indent}- [${text}](#${anchor})`);
    });
    
    toc.push('', '');
    
    return toc.join('\n');
  }

  /**
   * Add section to search index
   */
  private addToSearchIndex(section: HIGSection): void {
    const content = section.content || '';
    
    // Extract keywords from title and content
    const keywords = this.extractKeywords(section.title + ' ' + content);
    
    // Generate snippet
    const snippet = this.generateSnippet(content);
    
    this.searchIndex[section.id] = {
      id: section.id,
      title: section.title,
      platform: section.platform,
      category: section.category,
      url: section.url,
      keywords,
      snippet
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    // Count word frequency
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 
      'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'with', 'this',
      'that', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much',
      'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long',
      'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
    ];
    
    return stopWords.includes(word);
  }

  /**
   * Generate snippet from content
   */
  private generateSnippet(content: string, maxLength: number = 200): string {
    // Remove markdown formatting for snippet
    const cleanContent = content
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    
    // Find sentence boundary near maxLength
    const snippet = cleanContent.substring(0, maxLength);
    const lastSentence = snippet.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.7) {
      return snippet.substring(0, lastSentence + 1);
    }
    
    return snippet + '...';
  }

  /**
   * Generate search index file
   */
  private async generateSearchIndex(): Promise<void> {
    console.log('🔍 Generating search index...');
    
    const indexPath = path.join(this.contentDir, 'metadata', 'search-index.json');
    await fs.writeFile(indexPath, JSON.stringify(this.searchIndex, null, 2));
    
    console.log(`✓ Search index generated with ${Object.keys(this.searchIndex).length} entries`);
  }

  /**
   * Generate cross-references between sections
   */
  private async generateCrossReferences(): Promise<void> {
    console.log('🔗 Generating cross-references...');
    
    // Simple cross-reference generation based on shared keywords
    for (const [sectionId, indexEntry] of Object.entries(this.searchIndex)) {
      const relatedSections: string[] = [];
      const tags: string[] = [];
      
      // Find related sections by shared keywords
      for (const [otherId, otherEntry] of Object.entries(this.searchIndex)) {
        if (sectionId === otherId) continue;
        
        const sharedKeywords = indexEntry.keywords.filter(keyword => 
          otherEntry.keywords.includes(keyword)
        );
        
        if (sharedKeywords.length >= 2) {
          relatedSections.push(otherId);
        }
      }
      
      // Generate tags based on category and platform
      tags.push(indexEntry.category);
      if (indexEntry.platform !== 'universal') {
        tags.push(indexEntry.platform);
      }
      
      this.crossReferences[sectionId] = {
        relatedSections: relatedSections.slice(0, 5), // Limit to top 5
        backlinks: [], // Will be populated in a second pass
        tags
      };
    }
    
    // Generate backlinks
    for (const [sectionId, refs] of Object.entries(this.crossReferences)) {
      refs.relatedSections.forEach(relatedId => {
        if (this.crossReferences[relatedId]) {
          this.crossReferences[relatedId].backlinks.push(sectionId);
        }
      });
    }
    
    const refsPath = path.join(this.contentDir, 'metadata', 'cross-references.json');
    await fs.writeFile(refsPath, JSON.stringify(this.crossReferences, null, 2));
    
    console.log('✓ Cross-references generated');
  }

  /**
   * Generate metadata about the content generation
   */
  private async generateMetadata(duration: number): Promise<void> {
    console.log('📊 Generating metadata...');
    
    const totalSize = await this.calculateDirectorySize(this.contentDir);
    
    const metadata: ContentMetadata = {
      lastUpdated: new Date().toISOString(),
      totalSections: this.sections.length,
      sectionsByPlatform: this.sections.reduce((acc, section) => {
        acc[section.platform] = (acc[section.platform] || 0) + 1;
        return acc;
      }, {} as Record<ApplePlatform, number>),
      sectionsByCategory: this.sections.reduce((acc, section) => {
        acc[section.category] = (acc[section.category] || 0) + 1;
        return acc;
      }, {} as Record<HIGCategory, number>),
      totalSize,
      generationDuration: duration
    };
    
    const metadataPath = path.join(this.contentDir, 'metadata', 'generation-info.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✓ Metadata generated');
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * Calculate directory size in bytes
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await this.calculateDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
}

// Run content generation
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new HIGContentGenerator();
  generator.generate().catch((error) => {
    console.error('💥 Content generation failed:', error);
    process.exit(1);
  });
}