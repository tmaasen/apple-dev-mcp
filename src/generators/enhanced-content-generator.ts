#!/usr/bin/env node

/**
 * Enhanced Content Generator
 * Refactored to follow SOLID principles with proper separation of concerns
 */

import path from 'path';
import { HIGCache } from '../cache.js';
import { HIGScraper } from '../scraper.js';
import { HIGSection } from '../types.js';

// Services (Dependency Injection)
import { FileSystemService } from '../services/file-system.service.js';
import { ContentProcessorService } from '../services/content-processor.service.js';
import { SearchIndexerService } from '../services/search-indexer.service.js';
import { CrossReferenceGeneratorService } from '../services/cross-reference-generator.service.js';
import { ContentEnhancerFactory } from '../strategies/content-enhancement-strategies.js';

// Interfaces
import { 
  IFileSystemService, 
  IContentProcessor, 
  ISearchIndexer, 
  ICrossReferenceGenerator,
  ContentGenerationConfig,
  GenerationMetadata
} from '../interfaces/content-interfaces.js';

/**
 * Main Content Generator Class
 * Single Responsibility: Orchestrate the content generation process
 */
export class EnhancedContentGenerator {
  private sections: HIGSection[] = [];
  private readonly startTime: number = Date.now();

  constructor(
    private config: ContentGenerationConfig,
    private fileSystem: IFileSystemService,
    private contentProcessor: IContentProcessor,
    private searchIndexer: ISearchIndexer,
    private crossReferenceGenerator: ICrossReferenceGenerator,
    private scraper: HIGScraper
  ) {}

  /**
   * Main generation process - orchestrates all steps
   */
  async generate(): Promise<void> {
    console.log('🍎 Starting enhanced HIG content generation...');
    console.log(`📁 Output directory: ${this.config.outputDirectory}`);
    
    try {
      // Step 1: Discovery
      await this.discoverSections();
      
      // Step 2: Setup
      await this.createDirectoryStructure();
      
      // Step 3: Content generation
      await this.generateContent();
      
      // Step 4: Metadata generation
      await this.generateMetadata();
      
      const duration = Date.now() - this.startTime;
      console.log(`✅ Content generation completed in ${duration}ms`);
      console.log(`📊 Generated ${this.sections.length} sections`);
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      throw error;
    }
  }

  /**
   * Discover all HIG sections from Apple's website
   */
  private async discoverSections(): Promise<void> {
    console.log('🔍 Discovering HIG sections...');
    
    this.sections = await this.scraper.discoverSections();
    
    // Log discovery results
    const platformCounts = this.sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📋 Found ${this.sections.length} sections:`);
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} sections`);
    });
  }

  /**
   * Create necessary directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    console.log('📁 Creating directory structure...');
    
    const directories = [
      'platforms/ios',
      'platforms/macos', 
      'platforms/watchos',
      'platforms/tvos',
      'platforms/visionos',
      'platforms/universal',
      'metadata',
      'images/ios',
      'images/macos',
      'images/watchos',
      'images/tvos',
      'images/visionos',
      'images/universal'
    ];

    for (const dir of directories) {
      await this.fileSystem.mkdir(
        path.join(this.config.outputDirectory, dir),
        { recursive: true }
      );
    }
  }

  /**
   * Generate content for all sections
   */
  private async generateContent(): Promise<void> {
    console.log('📝 Generating section content...');
    
    // Process in batches to avoid overwhelming the system
    const batches = this.chunkArray(this.sections, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} sections)`);
      
      // Process batch in parallel
      await Promise.all(batch.map(section => this.processSection(section)));
      
      // Rate limiting between batches
      if (i < batches.length - 1) {
        await this.delay(this.config.rateLimitDelay);
      }
    }
  }

  /**
   * Process a single section
   */
  private async processSection(section: HIGSection): Promise<void> {
    try {
      // Fetch content from scraper
      const sectionWithContent = await this.scraper.fetchSectionContent(section);
      
      if (!sectionWithContent.content) {
        console.warn(`⚠️ No content for section: ${section.title}`);
        return;
      }

      // Process content
      let processedContent = await this.contentProcessor.process(sectionWithContent);
      
      // Apply content enhancements
      const enhancers = ContentEnhancerFactory.getEnhancers(sectionWithContent);
      for (const enhancer of enhancers) {
        processedContent = enhancer.enhance(processedContent, sectionWithContent);
      }

      // Generate final markdown with front matter and attribution
      const finalContent = this.generateFinalMarkdown(sectionWithContent, processedContent);
      
      // Write to file
      const filename = this.generateFilename(section);
      const filePath = path.join(
        this.config.outputDirectory,
        'platforms',
        section.platform.toLowerCase(),
        filename
      );
      
      await this.fileSystem.writeFile(filePath, finalContent);
      
      // Add to indices
      this.searchIndexer.addSection(sectionWithContent);
      this.crossReferenceGenerator.addSection(sectionWithContent);
      
      console.log(`✓ Generated: ${section.platform}/${filename}`);
      
    } catch (error) {
      console.error(`❌ Failed to process section ${section.title}:`, error);
    }
  }

  /**
   * Generate final markdown with front matter and attribution
   */
  private generateFinalMarkdown(section: HIGSection, content: string): string {
    // Front matter
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

    // Table of contents
    const toc = this.generateTableOfContents(content);

    // Attribution
    const attribution = [
      '',
      '---',
      '',
      '**Attribution Notice**',
      '',
      `This content is sourced from Apple's Human Interface Guidelines: ${section.url}`,
      '',
      '© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple\'s content.',
      '',
      'For the most up-to-date and official information, please refer to Apple\'s official documentation.',
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
   * Generate metadata files
   */
  private async generateMetadata(): Promise<void> {
    console.log('📊 Generating metadata...');
    
    // Generate search index
    const searchIndex = this.searchIndexer.generateIndex();
    await this.fileSystem.writeFile(
      path.join(this.config.outputDirectory, 'metadata', 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );
    console.log(`✓ Search index generated with ${Object.keys(searchIndex).length} entries`);

    // Generate cross-references
    const crossReferences = this.crossReferenceGenerator.generateReferences();
    await this.fileSystem.writeFile(
      path.join(this.config.outputDirectory, 'metadata', 'cross-references.json'),
      JSON.stringify(crossReferences, null, 2)
    );
    console.log('✓ Cross-references generated');

    // Generate generation info
    const totalSize = await this.fileSystem.calculateDirectorySize(this.config.outputDirectory);
    const metadata: GenerationMetadata = {
      lastUpdated: new Date().toISOString(),
      totalSections: this.sections.length,
      sectionsByPlatform: this.groupByPlatform(),
      sectionsByCategory: this.groupByCategory(),
      totalSize,
      generationDuration: Date.now() - this.startTime
    };

    await this.fileSystem.writeFile(
      path.join(this.config.outputDirectory, 'metadata', 'generation-info.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log('✓ Metadata generated');
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  // Utility methods

  private generateFilename(section: HIGSection): string {
    const cleanTitle = section.title
      .replace(/^(iOS|macOS|watchOS|tvOS|visionOS)\s+/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${cleanTitle}.md`;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private groupByPlatform(): Record<string, number> {
    return this.sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByCategory(): Record<string, number> {
    return this.sections.reduce((acc, section) => {
      acc[section.category] = (acc[section.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Factory function for creating the generator with all dependencies
export function createContentGenerator(config?: Partial<ContentGenerationConfig>): EnhancedContentGenerator {
  const defaultConfig: ContentGenerationConfig = {
    outputDirectory: path.join(process.cwd(), 'content'),
    batchSize: 3,
    rateLimitDelay: 2000,
    forceUpdate: process.argv.includes('--force'),
    maxRetries: 3
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Create services with dependency injection
  const fileSystem = new FileSystemService();
  const contentProcessor = new ContentProcessorService();
  const searchIndexer = new SearchIndexerService(contentProcessor);
  const crossReferenceGenerator = new CrossReferenceGeneratorService();

  // Create scraper dependencies
  const cache = new HIGCache(3600); // 1 hour TTL
  const scraper = new HIGScraper(cache);

  return new EnhancedContentGenerator(
    finalConfig,
    fileSystem,
    contentProcessor,
    searchIndexer,
    crossReferenceGenerator,
    scraper
  );
}

// Run the generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = createContentGenerator();
  generator.generate().catch((error) => {
    console.error('💥 Content generation failed:', error);
    process.exit(1);
  });
}