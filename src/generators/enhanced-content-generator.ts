#!/usr/bin/env node

/**
 * Enhanced Content Generator
 * Refactored to follow SOLID principles with proper separation of concerns
 */

import path from 'path';
import { HIGCache } from '../cache.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGContentExtractor } from '../services/hig-content-extractor.service.js';
import { HIGSection, ContentQualityMetrics, ExtractionStatistics } from '../types.js';

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
  private extractionStats: ExtractionStatistics = {
    totalSections: 0,
    successfulExtractions: 0,
    fallbackUsage: 0,
    averageQuality: 0,
    averageConfidence: 0,
    extractionSuccessRate: 0
  };

  constructor(
    private config: ContentGenerationConfig,
    private fileSystem: IFileSystemService,
    private contentProcessor: IContentProcessor,
    private searchIndexer: ISearchIndexer,
    private crossReferenceGenerator: ICrossReferenceGenerator,
    private crawleeService: CrawleeHIGService,
    private contentExtractor: HIGContentExtractor
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
      
      // Log extraction statistics and SLA compliance
      this.logExtractionResults();
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      throw error;
    }
  }

  /**
   * Discover all HIG sections from Apple's website using dynamic discovery
   */
  private async discoverSections(): Promise<void> {
    console.log('🔍 Discovering HIG sections dynamically...');
    
    this.sections = await this.crawleeService.discoverSections();
    this.extractionStats.totalSections = this.sections.length;
    
    // Log discovery results
    const platformCounts = this.sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📋 Dynamically discovered ${this.sections.length} sections:`);
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} sections`);
    });
    
    // Log extraction method distribution
    console.log('🎯 Target: 95%+ real content extraction (≤5% fallback usage)');
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
   * Process a single section with enhanced quality monitoring
   */
  private async processSection(section: HIGSection): Promise<void> {
    try {
      console.log(`🔍 Processing: ${section.title}`);
      
      // Fetch content using Crawlee service
      const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
      
      if (!sectionWithContent.content) {
        console.warn(`⚠️ No content for section: ${section.title}`);
        this.extractionStats.fallbackUsage++;
        return;
      }

      // Extract and analyze content quality
      const processedContent = await this.contentExtractor.extractContent(
        sectionWithContent.content, 
        sectionWithContent
      );
      
      // Update extraction statistics
      this.updateExtractionStats(processedContent.quality);
      
      // Apply content enhancements
      const enhancers = ContentEnhancerFactory.getEnhancers(sectionWithContent);
      let enhancedContent = processedContent.content;
      for (const enhancer of enhancers) {
        enhancedContent = enhancer.enhance(enhancedContent, sectionWithContent);
      }

      // Generate final markdown with enhanced front matter and attribution
      const finalContent = this.generateEnhancedMarkdown(
        sectionWithContent, 
        enhancedContent, 
        processedContent
      );
      
      // Write to file
      const filename = this.generateFilename(section);
      const filePath = path.join(
        this.config.outputDirectory,
        'platforms',
        section.platform.toLowerCase(),
        filename
      );
      
      await this.fileSystem.writeFile(filePath, finalContent);
      
      // Update section with quality info
      const enrichedSection = {
        ...sectionWithContent,
        quality: processedContent.quality,
        extractionMethod: processedContent.quality.extractionMethod as 'crawlee' | 'fallback' | 'static'
      };
      
      // Add to indices
      this.searchIndexer.addSection(enrichedSection);
      this.crossReferenceGenerator.addSection(enrichedSection);
      
      // Log quality information
      const qualityEmoji = processedContent.quality.score >= 0.8 ? '🟢' : 
                          processedContent.quality.score >= 0.5 ? '🟡' : '🔴';
      console.log(`${qualityEmoji} Generated: ${section.platform}/${filename} (quality: ${processedContent.quality.score.toFixed(2)}, method: ${processedContent.quality.extractionMethod})`);
      
    } catch (error) {
      console.error(`❌ Failed to process section ${section.title}:`, error);
      this.extractionStats.fallbackUsage++;
    }
  }

  /**
   * Update extraction statistics
   */
  private updateExtractionStats(quality: ContentQualityMetrics): void {
    this.extractionStats.successfulExtractions++;
    
    if (quality.isFallbackContent || quality.extractionMethod === 'fallback') {
      this.extractionStats.fallbackUsage++;
    }
    
    // Update running averages
    const currentCount = this.extractionStats.successfulExtractions;
    this.extractionStats.averageQuality = 
      ((this.extractionStats.averageQuality * (currentCount - 1)) + quality.score) / currentCount;
    this.extractionStats.averageConfidence = 
      ((this.extractionStats.averageConfidence * (currentCount - 1)) + quality.confidence) / currentCount;
    
    // Calculate success rate
    this.extractionStats.extractionSuccessRate = 
      ((this.extractionStats.successfulExtractions - this.extractionStats.fallbackUsage) / 
       this.extractionStats.successfulExtractions) * 100;
  }

  /**
   * Generate enhanced markdown with quality metadata
   */
  private generateEnhancedMarkdown(
    section: HIGSection, 
    content: string, 
    processedContent: any
  ): string {
    // Enhanced front matter with quality metrics
    const frontMatter = [
      '---',
      `title: "${section.title}"`,
      `platform: ${section.platform}`,
      `category: ${section.category}`,
      `url: ${section.url}`,
      `id: ${section.id}`,
      `lastUpdated: ${section.lastUpdated?.toISOString() || new Date().toISOString()}`,
      `extractionMethod: ${processedContent.quality.extractionMethod}`,
      `qualityScore: ${processedContent.quality.score.toFixed(3)}`,
      `confidence: ${processedContent.quality.confidence.toFixed(3)}`,
      `contentLength: ${processedContent.quality.length}`,
      `hasCodeExamples: ${processedContent.quality.codeExamplesCount > 0}`,
      `hasImages: ${processedContent.quality.imageReferencesCount > 0}`,
      `keywords: [${processedContent.keywords.slice(0, 10).map((k: string) => `"${k}"`).join(', ')}]`,
      '---',
      ''
    ].join('\n');

    // Enhanced table of contents (if available)
    let tableOfContents = '';
    if (processedContent.tableOfContents) {
      tableOfContents = processedContent.tableOfContents + '\n';
    }

    // Content summary (if available and high quality)
    let summary = '';
    if (processedContent.summary && processedContent.quality.score > 0.5) {
      summary = `## Summary\n\n${processedContent.summary}\n\n`;
    }

    // Enhanced attribution with quality notice
    const qualityNotice = processedContent.quality.score >= 0.8 ? 
      'This content was successfully extracted from Apple\'s official documentation.' :
      processedContent.quality.isFallbackContent ?
      '⚠️ This content uses fallback information. For the most accurate and complete information, please visit the official Apple documentation.' :
      'This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.';

    const attribution = [
      '',
      '---',
      '',
      '**Attribution Notice**',
      '',
      `This content is sourced from Apple's Human Interface Guidelines: ${section.url}`,
      '',
      qualityNotice,
      '',
      '© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple\'s content.',
      '',
      'For the most up-to-date and official information, please refer to Apple\'s official documentation.',
      ''
    ].join('\n');

    return frontMatter + tableOfContents + summary + content + attribution;
  }

  /**
   * Generate final markdown with front matter and attribution (legacy method)
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
   * Generate metadata files with extraction statistics
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

    // Generate enhanced generation info with extraction statistics
    const totalSize = await this.fileSystem.calculateDirectorySize(this.config.outputDirectory);
    const enhancedMetadata = {
      lastUpdated: new Date().toISOString(),
      totalSections: this.sections.length,
      sectionsByPlatform: this.groupByPlatform(),
      sectionsByCategory: this.groupByCategory(),
      totalSize,
      generationDuration: Date.now() - this.startTime,
      extractionStatistics: this.extractionStats,
      qualityMetrics: {
        fallbackUsageRate: (this.extractionStats.fallbackUsage / this.extractionStats.totalSections) * 100,
        slaCompliance: this.extractionStats.extractionSuccessRate >= 95,
        averageQuality: this.extractionStats.averageQuality,
        averageConfidence: this.extractionStats.averageConfidence
      },
      generatedWith: 'Crawlee-Enhanced-Content-Generator-v2.0'
    };

    await this.fileSystem.writeFile(
      path.join(this.config.outputDirectory, 'metadata', 'generation-info.json'),
      JSON.stringify(enhancedMetadata, null, 2)
    );
    
    // Generate extraction statistics file
    await this.fileSystem.writeFile(
      path.join(this.config.outputDirectory, 'metadata', 'extraction-statistics.json'),
      JSON.stringify(this.extractionStats, null, 2)
    );
    
    console.log('✓ Enhanced metadata generated');
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Extraction success rate: ${this.extractionStats.extractionSuccessRate.toFixed(1)}%`);
  }

  /**
   * Log extraction results and SLA compliance
   */
  private logExtractionResults(): void {
    const fallbackRate = (this.extractionStats.fallbackUsage / this.extractionStats.totalSections) * 100;
    const slaCompliant = this.extractionStats.extractionSuccessRate >= 95;
    
    console.log('\n🎯 Extraction Results Summary:');
    console.log('================================');
    console.log(`📊 Total sections: ${this.extractionStats.totalSections}`);
    console.log(`✅ Successful extractions: ${this.extractionStats.successfulExtractions}`);
    console.log(`🔄 Fallback content used: ${this.extractionStats.fallbackUsage} (${fallbackRate.toFixed(1)}%)`);
    console.log(`🎨 Real content rate: ${this.extractionStats.extractionSuccessRate.toFixed(1)}%`);
    console.log(`⭐ Average quality score: ${this.extractionStats.averageQuality.toFixed(3)}`);
    console.log(`🔒 Average confidence: ${this.extractionStats.averageConfidence.toFixed(3)}`);
    
    console.log(`\n🎯 SLA Target: ≥95% real content extraction`);
    if (slaCompliant) {
      console.log('✅ SLA ACHIEVED! Extraction rate exceeds 95% target.');
    } else {
      console.log(`❌ SLA NOT MET. Current rate: ${this.extractionStats.extractionSuccessRate.toFixed(1)}% (target: ≥95%)`);
      console.log('🔧 Consider reviewing extraction patterns or Apple website changes.');
    }
    
    console.log('\n🚀 Quality Improvements vs Legacy System:');
    console.log(`   • Dynamic section discovery: ${this.extractionStats.totalSections} sections found automatically`);
    console.log(`   • JavaScript-capable extraction: ${((this.extractionStats.successfulExtractions - this.extractionStats.fallbackUsage) / this.extractionStats.totalSections * 100).toFixed(1)}% real Apple content`);
    console.log(`   • Quality monitoring: All content scored and validated`);
    console.log('   • Respectful crawling: Rate-limited and stealth operation');
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

  // Create Crawlee-based services
  const cache = new HIGCache(3600); // 1 hour TTL
  const crawleeService = new CrawleeHIGService(cache);
  const contentExtractor = new HIGContentExtractor();

  console.log('🔧 Initialized Crawlee-Enhanced Content Generator v2.0');
  console.log('   • Dynamic section discovery enabled');
  console.log('   • JavaScript-capable content extraction');
  console.log('   • Quality monitoring and validation');
  console.log('   • 95%+ real content SLA target');

  return new EnhancedContentGenerator(
    finalConfig,
    fileSystem,
    contentProcessor,
    searchIndexer,
    crossReferenceGenerator,
    crawleeService,
    contentExtractor
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