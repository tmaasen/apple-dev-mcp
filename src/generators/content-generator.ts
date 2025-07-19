#!/usr/bin/env node

/**
 * Content Generator
 * 
 * Generates static HIG content by scraping Apple's website and converting to markdown files
 * with search indices and cross-references for fast, reliable MCP serving.
 */

import path from 'path';
import { HIGCache } from '../cache.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { ContentHIGDiscoveryService } from '../services/content/hig-discovery.service.js';
import { ContentProcessorService } from '../services/content/content-processor.service.js';
import { FileSystemService } from '../services/content/file-system.service.js';
import { SearchIndexerService } from '../services/content/search-indexer.service.js';
import type { HIGSection } from '../types.js';

export interface ContentGenerationConfig {
  outputDirectory: string;
  maxConcurrentScrapes: number;
  enableQualityValidation: boolean;
  minQualityThreshold: number;
}

export class ContentGenerator {
  private readonly config: ContentGenerationConfig;
  private readonly cache: HIGCache;
  private readonly crawleeService: CrawleeHIGService;
  private readonly discoveryService: ContentHIGDiscoveryService;
  private readonly contentProcessor: ContentProcessorService;
  private readonly fileSystem: FileSystemService;
  private readonly searchIndexer: SearchIndexerService;
  private readonly startTime = Date.now();

  constructor(config: Partial<ContentGenerationConfig> = {}) {
    this.config = {
      outputDirectory: 'content',
      maxConcurrentScrapes: 3,
      enableQualityValidation: true,
      minQualityThreshold: 0.5,
      ...config
    };

    // Initialize services
    this.cache = new HIGCache(3600); // 1 hour cache for generation
    this.crawleeService = new CrawleeHIGService(this.cache);
    this.discoveryService = new ContentHIGDiscoveryService();
    this.contentProcessor = new ContentProcessorService();
    this.fileSystem = new FileSystemService();
    this.searchIndexer = new SearchIndexerService();
  }

  /**
   * Main generation process
   */
  async generate(): Promise<void> {
    console.log('🍎 Starting Apple HIG content generation...');
    console.log(`📁 Output directory: ${this.config.outputDirectory}`);
    
    try {
      // Step 1: Discover all HIG sections
      const sections = await this.discoveryService.discoverSections();
      console.log(`📋 Found ${sections.length} sections to process`);

      // Step 2: Create directory structure
      await this.createDirectoryStructure();

      // Step 3: Scrape and process content
      const processedContent = await this.scrapeAndProcessContent(sections);

      // Step 4: Generate search indices and metadata
      await this.generateSearchIndices(sections, processedContent);

      // Step 5: Write generation report
      await this.writeGenerationReport(sections, processedContent);

      const duration = Math.round((Date.now() - this.startTime) / 1000);
      console.log(`✅ Content generation completed in ${duration}s`);
      console.log(`📊 Successfully processed ${processedContent.size}/${sections.length} sections`);
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      throw error;
    }
  }

  private async createDirectoryStructure(): Promise<void> {
    console.log('📁 Creating directory structure...');
    
    const directories = [
      this.config.outputDirectory,
      path.join(this.config.outputDirectory, 'platforms'),
      path.join(this.config.outputDirectory, 'platforms', 'ios'),
      path.join(this.config.outputDirectory, 'platforms', 'macos'),
      path.join(this.config.outputDirectory, 'platforms', 'watchos'),
      path.join(this.config.outputDirectory, 'platforms', 'tvos'),
      path.join(this.config.outputDirectory, 'platforms', 'visionos'),
      path.join(this.config.outputDirectory, 'universal'),
      path.join(this.config.outputDirectory, 'metadata')
    ];

    for (const dir of directories) {
      await this.fileSystem.mkdir(dir, { recursive: true });
    }
  }

  private async scrapeAndProcessContent(sections: HIGSection[]): Promise<Map<string, any>> {
    console.log('🔍 Scraping and processing content...');
    
    const processedContent = new Map<string, any>();
    const semaphore = new Semaphore(this.config.maxConcurrentScrapes);

    // Process sections in batches to avoid overwhelming Apple's servers
    const batches = this.createBatches(sections, this.config.maxConcurrentScrapes);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`⚡ Processing batch ${i + 1}/${batches.length} (${batch.length} sections)`);
      
      const batchPromises = batch.map(section => 
        semaphore.acquire(() => this.processSingleSection(section))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect successful results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          processedContent.set(batch[index].id, result.value);
        } else {
          console.warn(`⚠️  Failed to process: ${batch[index].title}`);
        }
      });

      // Small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return processedContent;
  }

  private async processSingleSection(section: HIGSection): Promise<any | null> {
    try {
      // Scrape content using existing crawlee service
      const scrapedSection = await this.crawleeService.fetchSectionContent(section);
      
      if (!scrapedSection?.content) {
        console.warn(`⚠️  No content scraped for: ${section.title}`);
        return null;
      }

      // Update section with scraped content
      section.content = scrapedSection.content;

      // Process content
      const processed = await this.contentProcessor.processContent(scrapedSection.content, section);
      
      // Quality validation
      if (this.config.enableQualityValidation && 
          processed.quality.score < this.config.minQualityThreshold) {
        console.warn(`⚠️  Low quality content (${(processed.quality.score * 100).toFixed(1)}%): ${section.title}`);
        
        // Still save it but mark as low quality
      }

      // Write markdown file
      await this.writeMarkdownFile(section, processed);
      
      console.log(`✅ Processed: ${section.title} (${(processed.quality.score * 100).toFixed(1)}% quality)`);
      
      return processed;
      
    } catch (error) {
      console.error(`❌ Error processing ${section.title}:`, error);
      return null;
    }
  }

  private async writeMarkdownFile(section: HIGSection, processed: any): Promise<void> {
    const platformDir = this.discoveryService.getPlatformDirectory(section.platform);
    const filename = this.discoveryService.generateFilename(section);
    
    let filePath: string;
    if (section.platform === 'universal') {
      filePath = path.join(this.config.outputDirectory, 'universal', filename);
    } else {
      filePath = path.join(this.config.outputDirectory, 'platforms', platformDir, filename);
    }
    
    const fullContent = processed.frontMatter + processed.cleanedMarkdown;
    await this.fileSystem.writeFile(filePath, fullContent);
  }

  private async generateSearchIndices(sections: HIGSection[], processedContent: Map<string, any>): Promise<void> {
    console.log('📊 Generating search indices and metadata...');
    
    // Generate search index
    const searchIndex = this.searchIndexer.generateSearchIndex(sections, processedContent);
    const searchIndexPath = path.join(this.config.outputDirectory, 'metadata', 'search-index.json');
    await this.fileSystem.writeFile(searchIndexPath, JSON.stringify(searchIndex, null, 2));

    // Generate cross-references
    const crossReferences = this.searchIndexer.generateCrossReferences(sections, processedContent);
    const crossRefPath = path.join(this.config.outputDirectory, 'metadata', 'cross-references.json');
    await this.fileSystem.writeFile(crossRefPath, JSON.stringify(crossReferences, null, 2));

    // Generate metadata
    const metadata = this.searchIndexer.generateMetadata(sections, processedContent);
    const metadataPath = path.join(this.config.outputDirectory, 'metadata', 'generation-info.json');
    await this.fileSystem.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`📋 Generated search index with ${searchIndex.length} entries`);
    console.log(`🔗 Generated ${crossReferences.length} cross-references`);
  }

  private async writeGenerationReport(sections: HIGSection[], processedContent: Map<string, any>): Promise<void> {
    const successful = processedContent.size;
    const failed = sections.length - successful;
    const avgQuality = Array.from(processedContent.values())
      .reduce((sum, p) => sum + (p.quality?.score || 0), 0) / processedContent.size;

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      statistics: {
        totalSections: sections.length,
        successful,
        failed,
        successRate: Math.round((successful / sections.length) * 100),
        averageQuality: Math.round(avgQuality * 100)
      },
      config: this.config,
      platforms: [...new Set(sections.map(s => s.platform))],
      categories: [...new Set(sections.map(s => s.category))]
    };

    const reportPath = path.join(this.config.outputDirectory, 'generation-report.json');
    await this.fileSystem.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📋 Generation Report:');
    console.log(`   Processed: ${successful}/${sections.length} sections (${report.statistics.successRate}%)`);
    console.log(`   Average Quality: ${report.statistics.averageQuality}%`);
    console.log(`   Duration: ${Math.round(report.duration / 1000)}s`);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

/**
 * Simple semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--;
        this.executeTask(task, resolve, reject);
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          this.executeTask(task, resolve, reject);
        });
      }
    });
  }

  private async executeTask<T>(
    task: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void
  ): Promise<void> {
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.permits++;
      if (this.waitQueue.length > 0) {
        const nextTask = this.waitQueue.shift()!;
        nextTask();
      }
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ContentGenerator({
    outputDirectory: process.argv[2] || 'content',
    maxConcurrentScrapes: parseInt(process.argv[3]) || 3
  });
  
  generator.generate().catch(error => {
    console.error('Content generation failed:', error);
    process.exit(1);
  });
}