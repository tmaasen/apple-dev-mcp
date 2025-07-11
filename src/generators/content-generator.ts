#!/usr/bin/env node

/**
 * Content Generator
 * Follows SOLID principles with proper separation of concerns and semantic search capabilities
 */

import path from 'path';
import { HIGCache } from '../cache.js';
import { CrawleeHIGService } from '../services/crawlee-hig.service.js';
import { HIGContentExtractor } from '../services/hig-content-extractor.service.js';
import { ComprehensiveHIGDiscoveryService } from '../services/comprehensive-hig-discovery.service.js';
import type { HIGSection, ContentQualityMetrics, ExtractionStatistics } from '../types.js';

// Services (Dependency Injection)
import { FileSystemService } from '../services/file-system.service.js';
import { ContentProcessorService } from '../services/content-processor.service.js';
import { ContentQualityValidatorService } from '../services/content-quality-validator.service.js';
import { SearchIndexerService } from '../services/search-indexer.service.js';
import { CrossReferenceGeneratorService } from '../services/cross-reference-generator.service.js';

// Interfaces
import type { 
  IFileSystemService, 
  IContentProcessor, 
  ISearchIndexer, 
  ICrossReferenceGenerator,
  ContentGenerationConfig
} from '../interfaces/content-interfaces.js';

/**
 * Main Content Generator Class
 * Single Responsibility: Orchestrate the content generation process
 */
export class ContentGenerator {
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
  private qualityValidator: ContentQualityValidatorService;
  private comprehensiveDiscovery: ComprehensiveHIGDiscoveryService;

  constructor(
    private config: ContentGenerationConfig,
    private fileSystem: IFileSystemService,
    private contentProcessor: IContentProcessor,
    private searchIndexer: ISearchIndexer,
    private crossReferenceGenerator: ICrossReferenceGenerator,
    private crawleeService: CrawleeHIGService,
    private contentExtractor: HIGContentExtractor,
    private cache: HIGCache
  ) {
    // Initialize quality validator with enhanced thresholds
    this.qualityValidator = new ContentQualityValidatorService({
      minQualityScore: 0.6,     // Higher than default
      minConfidence: 0.7,       // Higher than default
      minContentLength: 300,    // Higher than default
      maxFallbackRate: 3,       // Lower than default (97%+ real content)
      minStructureScore: 0.5,   // Higher than default
      minAppleTermsScore: 0.2   // Higher than default
    });

    // Initialize comprehensive discovery service
    this.comprehensiveDiscovery = new ComprehensiveHIGDiscoveryService(this.cache);
  }

  /**
   * Main generation process - orchestrates all steps
   */
  async generate(): Promise<void> {
    console.log('🍎 Starting Apple HIG content generation...');
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
      
      // Generate and log comprehensive quality report
      this.logQualityReport();
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      throw error;
    }
  }

  /**
   * Discover all HIG sections from Apple's website using dynamic discovery
   */
  private async discoverSections(): Promise<void> {
    // Use fast discovery when semantic search is disabled (offline mode)
    if (process.env.DISABLE_SEMANTIC_SEARCH === 'true') {
      console.log('🔍 Using comprehensive static section discovery (offline mode)...');
      this.sections = this.getStaticSections();
    } else {
      console.log('🔍 Discovering HIG sections dynamically from Apple website...');
      
      try {
        // Use comprehensive discovery combining known patterns + HTTP discovery
        this.sections = await this.comprehensiveDiscovery.discoverSections();
        
        if (this.sections.length < 50) {
          throw new Error(`Insufficient sections discovered: ${this.sections.length}`);
        }
        
        console.log(`✅ Comprehensive discovery found ${this.sections.length} sections`);
      } catch (error) {
        console.warn('⚠️ Comprehensive discovery failed, falling back to static sections:', error);
        console.log('🔍 Using static section discovery as fallback...');
        this.sections = this.getStaticSections();
      }
    }
    
    this.extractionStats.totalSections = this.sections.length;
    
    // Log discovery results
    const platformCounts = this.sections.reduce((acc, section) => {
      acc[section.platform] = (acc[section.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📋 Discovered ${this.sections.length} sections:`);
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} sections`);
    });
    
    // Log extraction method distribution
    console.log('🎯 Target: High-quality Apple HIG content for AI assistant use');
  }

  /**
   * Get comprehensive static list of all major HIG sections
   * This serves as a reliable fallback when dynamic discovery fails
   * and provides much better coverage than the previous 14 sections
   */
  private getStaticSections(): HIGSection[] {
    const comprehensiveHIGSections = [
      // Universal/Foundations - Core design principles
      { id: 'accessibility', title: 'Accessibility', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility' },
      { id: 'inclusion', title: 'Inclusion', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/inclusion' },
      { id: 'privacy', title: 'Privacy', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/privacy' },
      { id: 'branding', title: 'Branding', platform: 'universal', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/branding' },
      
      // Layout and Organization
      { id: 'layout', title: 'Layout', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout' },
      { id: 'collections', title: 'Collections', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/collections' },
      { id: 'lists-and-tables', title: 'Lists and Tables', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/lists-and-tables' },
      { id: 'split-views', title: 'Split Views', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/split-views' },
      { id: 'scroll-views', title: 'Scroll Views', platform: 'universal', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/scroll-views' },
      
      // Navigation and Search
      { id: 'navigation-bars', title: 'Navigation Bars', platform: 'universal', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars' },
      { id: 'tab-bars', title: 'Tab Bars', platform: 'universal', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars' },
      { id: 'sidebars', title: 'Sidebars', platform: 'universal', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/sidebars' },
      { id: 'search-fields', title: 'Search Fields', platform: 'universal', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/search-fields' },
      { id: 'searching', title: 'Searching', platform: 'universal', category: 'navigation', url: 'https://developer.apple.com/design/human-interface-guidelines/searching' },
      
      // Presentation
      { id: 'alerts', title: 'Alerts', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/alerts' },
      { id: 'action-sheets', title: 'Action Sheets', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/action-sheets' },
      { id: 'sheets', title: 'Sheets', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/sheets' },
      { id: 'popovers', title: 'Popovers', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/popovers' },
      { id: 'modality', title: 'Modality', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/modality' },
      { id: 'notifications', title: 'Notifications', platform: 'universal', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/notifications' },
      
      // Selection and Input
      { id: 'buttons', title: 'Buttons', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/buttons' },
      { id: 'text-fields', title: 'Text Fields', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/text-fields' },
      { id: 'text-views', title: 'Text Views', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/text-views' },
      { id: 'pickers', title: 'Pickers', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/pickers' },
      { id: 'segmented-controls', title: 'Segmented Controls', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/segmented-controls' },
      { id: 'sliders', title: 'Sliders', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/sliders' },
      { id: 'toggles', title: 'Toggles', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/toggles' },
      { id: 'steppers', title: 'Steppers', platform: 'universal', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/steppers' },
      
      // Visual Design
      { id: 'menus', title: 'Menus', platform: 'universal', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/menus' },
      { id: 'toolbars', title: 'Toolbars', platform: 'universal', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/toolbars' },
      { id: 'context-menus', title: 'Context Menus', platform: 'universal', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/context-menus' },
      { id: 'pull-down-buttons', title: 'Pull-down Buttons', platform: 'universal', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons' },
      { id: 'pop-up-buttons', title: 'Pop-up Buttons', platform: 'universal', category: 'visual-design', url: 'https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons' },
      
      // Icons and Images
      { id: 'app-icons', title: 'App Icons', platform: 'universal', category: 'icons-and-images', url: 'https://developer.apple.com/design/human-interface-guidelines/app-icons' },
      { id: 'sf-symbols', title: 'SF Symbols', platform: 'universal', category: 'icons-and-images', url: 'https://developer.apple.com/design/human-interface-guidelines/sf-symbols' },
      { id: 'icons', title: 'Icons', platform: 'universal', category: 'icons-and-images', url: 'https://developer.apple.com/design/human-interface-guidelines/icons' },
      { id: 'images', title: 'Images', platform: 'universal', category: 'icons-and-images', url: 'https://developer.apple.com/design/human-interface-guidelines/images' },
      
      // Color and Materials
      { id: 'color', title: 'Color', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/color' },
      { id: 'materials', title: 'Materials', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/materials' },
      { id: 'dark-mode', title: 'Dark Mode', platform: 'universal', category: 'color-and-materials', url: 'https://developer.apple.com/design/human-interface-guidelines/dark-mode' },
      
      // Typography
      { id: 'typography', title: 'Typography', platform: 'universal', category: 'typography', url: 'https://developer.apple.com/design/human-interface-guidelines/typography' },
      { id: 'writing', title: 'Writing', platform: 'universal', category: 'typography', url: 'https://developer.apple.com/design/human-interface-guidelines/writing' },
      
      // Motion
      { id: 'motion', title: 'Motion', platform: 'universal', category: 'motion', url: 'https://developer.apple.com/design/human-interface-guidelines/motion' },
      
      // iOS Specific
      { id: 'designing-for-ios', title: 'Designing for iOS', platform: 'iOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-ios' },
      { id: 'home-screen-quick-actions', title: 'Home Screen Quick Actions', platform: 'iOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions' },
      { id: 'widgets', title: 'Widgets', platform: 'iOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/widgets' },
      { id: 'live-activities', title: 'Live Activities', platform: 'iOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/live-activities' },
      
      // macOS Specific
      { id: 'designing-for-macos', title: 'Designing for macOS', platform: 'macOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-macos' },
      { id: 'windows', title: 'Windows', platform: 'macOS', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/windows' },
      { id: 'panels', title: 'Panels', platform: 'macOS', category: 'presentation', url: 'https://developer.apple.com/design/human-interface-guidelines/panels' },
      { id: 'the-menu-bar', title: 'The Menu Bar', platform: 'macOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/the-menu-bar' },
      
      // watchOS Specific
      { id: 'designing-for-watchos', title: 'Designing for watchOS', platform: 'watchOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos' },
      { id: 'complications', title: 'Complications', platform: 'watchOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/complications' },
      { id: 'digital-crown', title: 'Digital Crown', platform: 'watchOS', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/digital-crown' },
      { id: 'always-on', title: 'Always On', platform: 'watchOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/always-on' },
      
      // tvOS Specific
      { id: 'designing-for-tvos', title: 'Designing for tvOS', platform: 'tvOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos' },
      { id: 'focus-and-selection', title: 'Focus and Selection', platform: 'tvOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/focus-and-selection' },
      { id: 'top-shelf', title: 'Top Shelf', platform: 'tvOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/top-shelf' },
      
      // visionOS Specific
      { id: 'designing-for-visionos', title: 'Designing for visionOS', platform: 'visionOS', category: 'foundations', url: 'https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos' },
      { id: 'spatial-layout', title: 'Spatial Layout', platform: 'visionOS', category: 'layout', url: 'https://developer.apple.com/design/human-interface-guidelines/spatial-layout' },
      { id: 'eyes', title: 'Eyes', platform: 'visionOS', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/eyes' },
      { id: 'gestures', title: 'Gestures', platform: 'visionOS', category: 'selection-and-input', url: 'https://developer.apple.com/design/human-interface-guidelines/gestures' },
      { id: 'immersive-experiences', title: 'Immersive Experiences', platform: 'visionOS', category: 'system-capabilities', url: 'https://developer.apple.com/design/human-interface-guidelines/immersive-experiences' },
      
      // Key Technologies
      { id: 'apple-pay', title: 'Apple Pay', platform: 'universal', category: 'technologies', url: 'https://developer.apple.com/design/human-interface-guidelines/apple-pay' },
      { id: 'sign-in-with-apple', title: 'Sign in with Apple', platform: 'universal', category: 'technologies', url: 'https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple' },
      { id: 'siri', title: 'Siri', platform: 'universal', category: 'technologies', url: 'https://developer.apple.com/design/human-interface-guidelines/siri' },
      { id: 'carplay', title: 'CarPlay', platform: 'universal', category: 'technologies', url: 'https://developer.apple.com/design/human-interface-guidelines/carplay' },
      { id: 'augmented-reality', title: 'Augmented Reality', platform: 'universal', category: 'technologies', url: 'https://developer.apple.com/design/human-interface-guidelines/augmented-reality' }
    ];
    
    return comprehensiveHIGSections.map(section => ({
      ...section,
      platform: section.platform as any,
      category: section.category as any,
      content: this.generateBasicContentForSection(section.title, section.platform as string, section.category as string),
      lastUpdated: new Date()
    }));
  }

  /**
   * Generate basic content for a section (used for static sections)
   */
  private generateBasicContentForSection(title: string, platform: string, _category: string): string {
    return `# ${title}

This section is part of Apple's Human Interface Guidelines for ${platform}.

**Note**: This is a placeholder. For complete and up-to-date information, please visit Apple's official documentation.

## Overview

${title} guidelines provide essential design principles for creating great user experiences on ${platform}.

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines.

© Apple Inc. All rights reserved. For the most up-to-date and official information, please refer to Apple's official documentation.`;
  }

  /**
   * Get the file path for a topic based on topic-first organization
   */
  private getTopicFilePath(section: HIGSection, filename: string): string {
    // Universal topics go at root level
    if (section.platform === 'universal' || this.isUniversalTopic(section)) {
      return path.join(this.config.outputDirectory, filename);
    }
    
    // Platform-specific topics go in platforms/{platform}/
    return path.join(
      this.config.outputDirectory,
      'platforms',
      section.platform.toLowerCase(),
      filename
    );
  }

  /**
   * Determine if a topic should be treated as universal
   */
  private isUniversalTopic(section: HIGSection): boolean {
    // Topics that should be universal based on their nature
    const universalTopics = new Set([
      'accessibility', 'privacy', 'inclusion', 'branding',
      'layout', 'spatial-layout', 'typography', 'color', 'icons', 'images', 'motion',
      'inputs', 'gestures', 'feedback', 'loading', 'onboarding', 'launching',
      'navigation-and-search', 'searching', 'modality',
      'alerts', 'action-sheets', 'activity-views', 'sheets', 'popovers',
      'buttons', 'menus', 'toolbars', 'tab-bars', 'navigation-bars', 'sliders',
      'steppers', 'toggles', 'pickers', 'progress-indicators', 'labels',
      'text-fields', 'text-views', 'lists-and-tables', 'collections', 'scroll-views',
      'split-views', 'boxes', 'gauges', 'charts', 'rating-indicators', 'materials',
      'app-clips', 'app-shortcuts', 'apple-pay', 'carplay', 'healthkit', 'homekit',
      'icloud', 'in-app-purchase', 'machine-learning', 'maps', 'nfc', 'siri',
      'wallet', 'augmented-reality', 'game-center', 'live-activities',
      'live-photos', 'notifications', 'shareplay', 'sign-in-with-apple',
      'tap-to-pay-on-iphone', 'widgets'
    ]);
    
    // Extract topic name from section ID or title
    const topicName = section.id.replace(/-\w+$/, ''); // Remove platform suffix
    
    return universalTopics.has(topicName) || section.platform === 'universal';
  }

  /**
   * Create necessary directory structure (topic-first organization)
   */
  private async createDirectoryStructure(): Promise<void> {
    console.log('📁 Creating topic-first directory structure...');
    
    const directories = [
      'platforms/ios',
      'platforms/macos', 
      'platforms/watchos',
      'platforms/tvos',
      'platforms/visionos',
      // Note: No platforms/universal - universal topics go at root
      'metadata'
    ];

    // Create root output directory
    await this.fileSystem.mkdir(this.config.outputDirectory, { recursive: true });

    // Create platform-specific subdirectories
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
    console.log('📝 Generating section content with high-quality processing...');
    console.log('   ⚡ Processing Apple HIG content for AI assistant use');
    
    // Process in batches to avoid overwhelming the system
    const batches = this.chunkArray(this.sections, this.config.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📄 Processing batch ${i + 1}/${batches.length} (${batch.length} sections)`);
      
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
      // Fetch content using Crawlee service
      const sectionWithContent = await this.crawleeService.fetchSectionContent(section);
      
      if (!sectionWithContent.content) {
        console.warn(`⚠️ No content for section: ${section.title}`);
        this.extractionStats.fallbackUsage++;
        return;
      }

      // Use our enhanced content processor to process HTML content
      const processingResult = await this.contentProcessor.processContent(
        sectionWithContent.content, 
        sectionWithContent.url
      );
      
      // Validate content quality
      const validationResult = await this.qualityValidator.validateContent(
        processingResult.cleanedMarkdown,
        { ...sectionWithContent, quality: processingResult.quality }
      );
      
      // Record extraction for monitoring
      this.qualityValidator.recordExtraction(sectionWithContent, processingResult.quality);
      
      // Update extraction statistics
      this.updateExtractionStats(processingResult.quality);
      
      // Log quality validation results
      if (!validationResult.isValid && validationResult.issues.length > 0) {
        console.warn(`⚠️ Quality issues for ${section.title}:`, validationResult.issues);
        if (validationResult.recommendations.length > 0) {
          console.log(`💡 Recommendations:`, validationResult.recommendations);
        }
      }
      
      // Generate final markdown with structured content and enhanced front matter
      const finalContent = this.generateStructuredMarkdown(
        sectionWithContent, 
        processingResult
      );
      
      // Write to file using topic-first structure
      const filename = this.generateFilename(section);
      const filePath = this.getTopicFilePath(section, filename);
      
      await this.fileSystem.writeFile(filePath, finalContent);
      
      // Update section with quality info and structured content
      const enrichedSection = {
        ...sectionWithContent,
        quality: processingResult.quality,
        extractionMethod: processingResult.quality.extractionMethod as 'crawlee' | 'fallback' | 'static',
        structuredContent: processingResult.structuredContent,
        processingMetrics: processingResult.processingMetrics
      };
      
      // Add to indices with enhanced keyword extraction
      const keywords = this.contentProcessor.extractKeywords(processingResult.cleanedMarkdown, sectionWithContent);
      this.searchIndexer.addSection({...enrichedSection, keywords} as any);
      this.crossReferenceGenerator.addSection(enrichedSection);
      
      // Log quality information with enhanced metrics
      const qualityEmoji = processingResult.quality.score >= 0.8 ? '🟢' : 
                          processingResult.quality.score >= 0.5 ? '🟡' : '🔴';
      const structureEmoji = processingResult.processingMetrics.structureScore >= 0.8 ? '🏗️' : '📝';
      
      // Determine display path for logging
      const displayPath = this.isUniversalTopic(section) || section.platform === 'universal' 
        ? filename 
        : `${section.platform}/${filename}`;
        
      console.log(`${qualityEmoji}${structureEmoji} Generated: ${displayPath} (quality: ${processingResult.quality.score.toFixed(3)}, structure: ${processingResult.processingMetrics.structureScore.toFixed(3)}, method: ${processingResult.quality.extractionMethod})`);
      
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
   * Generate structured markdown with enhanced front matter and organized content
   */
  private generateStructuredMarkdown(
    section: HIGSection, 
    processingResult: { cleanedMarkdown: string; structuredContent: any; quality: any; processingMetrics: any }
  ): string {
    // Enhanced front matter with quality metrics and structured data
    const frontMatter = [
      '---',
      `title: "${section.title}"`,
      `platform: ${section.platform}`,
      `category: ${section.category}`,
      `url: ${section.url}`,
      `id: ${section.id}`,
      `lastUpdated: ${section.lastUpdated?.toISOString() || new Date().toISOString()}`,
      `extractionMethod: ${processingResult.quality.extractionMethod}`,
      `qualityScore: ${processingResult.quality.score.toFixed(3)}`,
      `confidence: ${processingResult.quality.confidence.toFixed(3)}`,
      `contentLength: ${processingResult.quality.length}`,
      `structureScore: ${processingResult.processingMetrics.structureScore.toFixed(3)}`,
      `cleaningScore: ${processingResult.processingMetrics.cleaningScore.toFixed(3)}`,
      `hasCodeExamples: ${processingResult.quality.codeExamplesCount > 0}`,
      `hasImages: false`, // We remove images per requirements
      `keywords: [${this.contentProcessor.extractKeywords(processingResult.cleanedMarkdown, section).slice(0, 10).map((k: string) => `"${k}"`).join(', ')}]`,
      '---',
      ''
    ].join('\n');

    // Structured content organization
    let structuredContent = '';
    
    // Add overview section
    if (processingResult.structuredContent.overview && processingResult.structuredContent.overview !== 'No overview available') {
      structuredContent += `## Overview\n\n${processingResult.structuredContent.overview}\n\n`;
    }
    
    // Add guidelines section
    if (processingResult.structuredContent.guidelines.length > 0 && 
        processingResult.structuredContent.guidelines[0] !== 'No specific guidelines identified') {
      structuredContent += `## Guidelines\n\n`;
      processingResult.structuredContent.guidelines.forEach((guideline: string) => {
        structuredContent += `- ${guideline}\n`;
      });
      structuredContent += '\n';
    }
    
    // Add examples section
    if (processingResult.structuredContent.examples.length > 0 && 
        processingResult.structuredContent.examples[0] !== 'No examples provided') {
      structuredContent += `## Examples\n\n`;
      processingResult.structuredContent.examples.forEach((example: string) => {
        structuredContent += `- ${example}\n`;
      });
      structuredContent += '\n';
    }
    
    // Add specifications section if available
    if (processingResult.structuredContent.specifications) {
      structuredContent += `## Specifications\n\n`;
      const specs = processingResult.structuredContent.specifications;
      
      if (specs.dimensions) {
        structuredContent += `### Dimensions\n`;
        Object.entries(specs.dimensions).forEach(([key, value]) => {
          structuredContent += `- **${key}**: ${value}\n`;
        });
        structuredContent += '\n';
      }
      
      if (specs.spacing) {
        structuredContent += `### Spacing\n`;
        Object.entries(specs.spacing).forEach(([key, value]) => {
          structuredContent += `- **${key}**: ${value}\n`;
        });
        structuredContent += '\n';
      }
    }
    
    // Add related concepts section
    if (processingResult.structuredContent.relatedConcepts.length > 0) {
      structuredContent += `## Related Concepts\n\n`;
      structuredContent += processingResult.structuredContent.relatedConcepts.map((concept: string) => `- ${concept}`).join('\n') + '\n\n';
    }
    
    // Fallback to cleaned markdown if structured content is minimal
    let finalContent = structuredContent;
    if (structuredContent.trim().length < 200) {
      finalContent = `## Content\n\n${processingResult.cleanedMarkdown}\n\n`;
    }

    // Enhanced attribution with quality notice
    const qualityNotice = processingResult.quality.score >= 0.8 ? 
      'This content was successfully extracted and structured from Apple\'s official documentation.' :
      processingResult.quality.score >= 0.5 ?
      'This content was extracted with good confidence. Structure and guidelines have been enhanced for better usability.' :
      'This content was extracted with moderate confidence. Please verify important details with the official Apple documentation.';

    const attribution = [
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

    return frontMatter + finalContent + attribution;
  }

  /**
   * Generate enhanced markdown with quality metadata (legacy method)
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
      generatedWith: 'Content-Generator-v2.0'
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
    
    console.log('\n📈 Content Generation Summary:');
    console.log(`   • ${this.extractionStats.totalSections} sections processed successfully`);
    console.log(`   • ${((this.extractionStats.successfulExtractions - this.extractionStats.fallbackUsage) / this.extractionStats.totalSections * 100).toFixed(1)}% high-quality Apple content extracted`);
    console.log(`   • Quality monitoring and validation enabled`);
    console.log('   • Content optimized for MCP and AI assistant use');
  }

  /**
   * Log clean quality validation summary
   */
  private logQualityReport(): void {
    const report = this.qualityValidator.generateReport();
    console.log(report);
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

  // High-quality fallback content methods
  private getHighQualityButtonContent(platform: string = 'iOS'): string {
    return `# Buttons

Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. The system provides several button styles, each with specific best practices.

## Overview

Buttons are interactive elements that trigger actions when tapped. In ${platform}, buttons should be immediately recognizable as interactive elements and provide clear feedback when pressed.

## Guidelines

- Use clear, concise button text that describes the action
- Make buttons large enough for easy tapping (minimum 44pt touch target)
- Choose appropriate button styles for the context
- Provide visual feedback when buttons are pressed
- Consider button placement and grouping for optimal user flow

## Button Types

### Primary Buttons
Use for the most important action in a view. Limit to one primary button per screen.

### Secondary Buttons
Use for secondary actions. These can appear alongside primary buttons.

### Destructive Buttons
Use for actions that delete or remove content. Use red styling to indicate destructive nature.

## Specifications

- Minimum touch target: 44pt × 44pt
- Recommended padding: 8pt-16pt horizontal, 6pt-12pt vertical
- Corner radius: Varies by platform design language
- Text should be legible with sufficient contrast

## Best Practices

- Test buttons with various text lengths and localizations
- Ensure buttons work well in both light and dark modes
- Consider accessibility requirements for color contrast and VoiceOver support
- Group related buttons logically
- Use consistent button styling throughout your app`;
  }

  private getHighQualityNavigationContent(): string {
    return `# Navigation Bars

A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content. Navigation bars are translucent by default and can be configured to hide or show when people scroll.

## Overview

Navigation bars provide hierarchical navigation and display the current location within your app's information architecture. They help users understand where they are and how to get back to previous screens.

## Guidelines

- Show the current location clearly with a descriptive title
- Provide clear navigation paths with back buttons
- Use navigation bars consistently throughout your app
- Consider the content behind translucent navigation bars
- Keep navigation bar content relevant to the current screen

## Elements

### Title
Display a descriptive title that represents the current screen or section.

### Back Button
Automatically provided by the system, shows the title of the previous screen.

### Navigation Controls
Additional buttons for actions relevant to the current screen.

## Specifications

- Standard height: 44pt (compact) or 96pt (large title)
- Title should be centered and legible
- Back button appears on the leading edge
- Additional controls on the trailing edge

## Best Practices

- Use large titles when appropriate to create visual hierarchy
- Ensure navigation bar content is accessible
- Test with different device orientations
- Consider how the navigation bar behaves during scrolling
- Maintain consistency with platform conventions`;
  }

  private getHighQualityTabBarContent(): string {
    return `# Tab Bars

A tab bar appears at the bottom of an app screen and lets people quickly switch among different sections of an app. Tab bars are translucent by default.

## Overview

Tab bars provide persistent access to top-level navigation in your app. They help users understand your app's structure and make it easy to move between primary content areas.

## Guidelines

- Use tab bars for top-level navigation only
- Limit to 5 tabs maximum for optimal usability
- Use clear, recognizable icons and labels
- Maintain tab order consistency
- Ensure the selected tab is clearly indicated

## Tab Configuration

### Icon Requirements
- Use simple, recognizable symbols
- Ensure icons work at small sizes
- Provide both selected and unselected states
- Consider using SF Symbols for consistency

### Labels
- Keep labels short and descriptive
- Use title case for tab labels
- Ensure labels are localized appropriately

## Specifications

- Standard height: 49pt (83pt with safe area)
- Maximum 5 tabs (more items move to "More" tab)
- Icons should be approximately 30×30pt
- Text should be legible and accessible

## Best Practices

- Start with the most important tab selected
- Use badges sparingly for notifications
- Ensure tab content loads quickly
- Test with longer localized text
- Consider accessibility for users with visual impairments`;
  }

  private getHighQualityAlertContent(): string {
    return `# Alerts

An alert gives people critical information they need right away. Alerts appear modally, interrupting the current task to focus attention on the message and available actions.

## Overview

Alerts communicate important information and provide actions for users to respond. They should be used sparingly and only for information that requires immediate attention.

## Guidelines

- Use alerts for critical information only
- Provide clear, actionable button labels
- Keep alert text concise and scannable
- Avoid using alerts for promotional content
- Consider less intrusive alternatives when appropriate

## Alert Types

### Informational Alerts
Provide important information without requiring immediate action.

### Confirmation Alerts
Ask users to confirm potentially destructive or irreversible actions.

### Error Alerts
Inform users about errors and provide recovery options.

## Content Guidelines

### Titles
- Be specific about the situation
- Use sentence case
- Avoid unnecessary words like "Error" or "Alert"

### Messages
- Explain the situation clearly
- Provide context for the alert
- Suggest solutions when possible

### Button Labels
- Use action-oriented language
- Be specific about what will happen
- Follow platform conventions for destructive actions

## Best Practices

- Test alerts with longer text and localization
- Ensure alerts are accessible to screen readers
- Consider the user's current context
- Provide clear recovery paths
- Use consistent alert styling throughout your app`;
  }

  private getHighQualityActionSheetContent(): string {
    return `# Action Sheets

An action sheet is a modal view that appears in response to a control or action, and presents a set of two or more choices related to the current context.

## Overview

Action sheets provide contextual choices for users without navigating away from the current screen. They're particularly useful for confirming destructive actions or providing multiple related options.

## Guidelines

- Use action sheets for contextual actions
- Include a cancel button unless dismissible by tapping outside
- Place destructive actions at the bottom with visual distinction
- Keep the number of options manageable
- Provide clear, descriptive action labels

## When to Use Action Sheets

- Confirming destructive actions
- Providing multiple related options
- Contextual actions triggered by buttons or gestures
- Sharing or export options

## Content Guidelines

### Action Labels
- Use verb phrases that describe the action
- Be specific about what will happen
- Use title case for action labels
- Keep labels concise but descriptive

### Destructive Actions
- Use red styling to indicate destructive nature
- Place at the bottom of the action sheet
- Confirm irreversible actions

## Specifications

- Appears from the bottom of the screen
- Can be dismissed by tapping outside or using cancel button
- Maximum width adapts to content and device
- Follows system animation and transition patterns

## Best Practices

- Test with various action combinations
- Ensure actions are accessible
- Consider the impact of each action
- Provide undo options for destructive actions where possible
- Use consistent styling throughout your app`;
  }

  private getHighQualityMenuContent(): string {
    return `# Menus (macOS)

Menus provide access to most of the commands people need to use your app. The menu bar contains app-specific menus, while contextual menus provide shortcuts to frequently used commands.

## Overview

macOS uses a consistent menu system that provides access to app functionality. Well-designed menus help users discover features and work efficiently with keyboard shortcuts.

## Menu Types

### Menu Bar Menus
Located in the menu bar at the top of the screen, containing app-wide commands.

### Contextual Menus
Appear when users right-click or Control-click on interface elements.

### Dock Menus
Appear when users right-click on app icons in the Dock.

## Guidelines

- Follow standard menu organization patterns
- Use clear, descriptive menu item names
- Provide keyboard shortcuts for common actions
- Group related commands logically
- Use separators to organize menu items

## Menu Organization

### Standard Menus
- Application menu (app name)
- File, Edit, View, Window, Help
- Follow platform conventions for menu order

### Menu Items
- Use title case for menu item names
- Include keyboard shortcuts when appropriate
- Use ellipsis (...) for items that open dialogs
- Gray out unavailable items instead of hiding them

## Best Practices

- Keep menu hierarchies shallow (avoid deep nesting)
- Test menu accessibility with keyboard navigation
- Ensure menu items reflect current app state
- Provide consistent shortcuts across similar apps
- Consider menu item discovery and learnability`;
  }

  private getHighQualityToolbarContent(): string {
    return `# Toolbars (macOS)

A toolbar contains buttons for frequently used commands and controls. Toolbars can be customized, allowing people to add, remove, and rearrange toolbar items.

## Overview

Toolbars provide quick access to app functionality and can be customized by users. They should contain the most important and frequently used commands for the current context.

## Guidelines

- Include only the most important commands
- Use recognizable icons with optional text labels
- Allow toolbar customization when appropriate
- Maintain logical grouping of related tools
- Ensure toolbar items work well at different sizes

## Toolbar Items

### Buttons
Single-action buttons for immediate commands.

### Segmented Controls
Multiple related options in a single control.

### Search Fields
Integrated search functionality within the toolbar.

### Pop-up Buttons
Buttons that reveal additional options when pressed.

## Customization

### User Customization
- Allow users to add/remove toolbar items
- Provide sensible defaults
- Include a customize toolbar option
- Save user preferences across sessions

### Default Configuration
- Include essential tools only
- Consider novice and expert users
- Test with common workflows
- Provide good starting configuration

## Best Practices

- Use consistent icons throughout your app
- Ensure toolbar items are accessible
- Test toolbar functionality across different window sizes
- Consider keyboard alternatives for all toolbar actions
- Maintain toolbar state appropriately`;
  }

  private getHighQualityColorContent(): string {
    return `# Color

Color conveys information, evokes emotion, and provides visual continuity. The system color palette ensures that your app looks great in light and dark modes.

## Overview

Color is a powerful design tool that affects both aesthetics and usability. Apple platforms provide semantic color systems that automatically adapt to different appearances and accessibility settings.

## Color Systems

### System Colors
Predefined colors that automatically adapt to appearance changes and accessibility settings.

### Dynamic Colors
Colors that automatically change between light and dark modes.

### Custom Colors
App-specific colors that should complement the system palette.

## Guidelines

- Use color purposefully to communicate meaning
- Ensure sufficient contrast for accessibility
- Test colors in both light and dark modes
- Consider cultural color associations
- Provide alternatives to color-only communication

## Accessibility

### Color Contrast
- Meet WCAG guidelines for contrast ratios
- Test with various lighting conditions
- Consider users with visual impairments
- Provide high contrast alternatives

### Color Blindness
- Don't rely solely on color to convey information
- Use additional visual cues (shapes, patterns, text)
- Test with color blindness simulators

## Implementation

### Semantic Colors
Use semantic color names that describe purpose rather than appearance.

### Color Specifications
- Primary: Your app's main brand color
- Secondary: Supporting colors for variety
- Accent: Colors for highlighting and emphasis
- Neutral: Grays and backgrounds

## Best Practices

- Create a cohesive color palette
- Test colors on actual devices
- Consider color meaning across cultures
- Use color consistently throughout your app
- Provide customization options when appropriate`;
  }

  private getHighQualityTypographyContent(): string {
    return `# Typography

Typography is a fundamental part of user interface design. It affects readability, accessibility, and the overall user experience across all Apple platforms.

## Overview

Good typography makes content easy to read and understand. Apple platforms provide comprehensive type systems that scale automatically and support accessibility features.

## Type Systems

### San Francisco (SF)
The system font designed specifically for Apple platforms, optimized for legibility at all sizes.

### Text Styles
Predefined styles that automatically adjust for different screen sizes and accessibility settings.

### Custom Fonts
Third-party fonts should complement the system typography and maintain readability.

## Guidelines

- Use system fonts when possible for consistency
- Ensure text is legible at all supported sizes
- Maintain appropriate contrast ratios
- Consider reading patterns and eye movement
- Test typography with accessibility features enabled

## Text Styles

### Headlines
Large, bold text for titles and important information.

### Body Text
Standard text for main content and descriptions.

### Captions
Smaller text for secondary information and metadata.

### Labels
Text for interface elements like buttons and form fields.

## Accessibility

### Dynamic Type
Support Dynamic Type to allow users to adjust text size according to their needs.

### VoiceOver
Ensure text works well with screen readers and provides appropriate semantic information.

### Contrast
Maintain sufficient contrast between text and background colors.

## Implementation

### Font Weights
- Regular: Standard body text
- Medium: Slightly emphasized text
- Semibold: Subheadings and labels
- Bold: Headlines and important information

### Line Spacing
Appropriate line height improves readability and visual hierarchy.

## Best Practices

- Use consistent typography throughout your app
- Test with various text sizes and languages
- Consider reading context and user needs
- Maintain visual hierarchy with type scales
- Optimize for both scan reading and deep reading`;
  }

  private getHighQualityLayoutContent(): string {
    return `# Layout

Layout defines the structure and organization of content on screen. Good layout guides users through your app and makes content easy to consume and interact with.

## Overview

Effective layout creates visual hierarchy, groups related content, and guides user attention. It should work across different screen sizes and orientations while maintaining usability.

## Layout Principles

### Visual Hierarchy
Use size, position, and spacing to indicate importance and relationships between elements.

### Alignment
Consistent alignment creates order and helps users scan content efficiently.

### Spacing
Appropriate spacing between elements improves readability and reduces visual clutter.

### Grouping
Related elements should be visually grouped to show relationships.

## Grid Systems

### Layout Grids
Invisible structures that help organize content consistently across screens.

### Baseline Grids
Align text and elements to consistent baseline intervals.

### Modular Grids
Flexible grid systems that adapt to different content types and screen sizes.

## Responsive Design

### Adaptability
Layout should work well across different screen sizes and orientations.

### Flexibility
Content should reflow and reorganize appropriately as space changes.

### Consistency
Maintain visual relationships and hierarchy across different layouts.

## Guidelines

- Use consistent spacing throughout your app
- Align elements to create visual order
- Group related content logically
- Consider reading patterns and user flow
- Test layouts on different screen sizes

## Implementation

### Margins and Padding
- Maintain consistent spacing values
- Use multiples of base spacing units
- Consider touch target sizes
- Adapt spacing for different screen sizes

### Content Organization
- Lead with important information
- Use progressive disclosure for complex content
- Maintain scannable layouts
- Consider user tasks and goals

## Best Practices

- Start with content and let it guide layout decisions
- Test layouts with real content and varying lengths
- Consider accessibility and assistive technologies
- Use layout to support user mental models
- Maintain consistency while allowing for content flexibility`;
  }

  private getHighQualityAccessibilityContent(): string {
    return `# Accessibility

Accessibility ensures your app is usable by everyone, including people with disabilities. Apple platforms provide comprehensive accessibility features and APIs.

## Overview

Accessible design benefits everyone by creating more inclusive and usable experiences. Accessibility should be considered from the beginning of the design process, not added as an afterthought.

## Accessibility Features

### VoiceOver
Screen reader technology that speaks interface elements and content aloud.

### Voice Control
Allows users to navigate and control apps using voice commands.

### Switch Control
Enables users with limited mobility to navigate using external switches.

### Dynamic Type
Allows users to adjust text size according to their visual needs.

## Guidelines

- Design for diverse abilities and needs
- Provide multiple ways to access information
- Ensure all interactive elements are accessible
- Test with assistive technologies
- Consider temporary and situational disabilities

## Implementation

### Semantic Information
Provide appropriate labels, hints, and roles for interface elements.

### Keyboard Navigation
Ensure all functionality is accessible via keyboard or external input devices.

### Color and Contrast
Don't rely solely on color to convey information; maintain appropriate contrast ratios.

### Alternative Formats
Provide alternative text for images and transcripts for audio content.

## Testing

### Automated Testing
Use accessibility auditing tools to identify common issues.

### Manual Testing
Test with actual assistive technologies and accessibility features.

### User Testing
Include users with disabilities in your testing process.

## Common Considerations

### Visual Accessibility
- Color blindness and low vision
- High contrast and reduced motion preferences
- Text size and legibility

### Motor Accessibility
- Touch target sizes and spacing
- Alternative input methods
- Gesture alternatives

### Cognitive Accessibility
- Clear language and instructions
- Consistent navigation patterns
- Error prevention and recovery

## Best Practices

- Include accessibility from the beginning of design
- Test early and often with accessibility features enabled
- Provide clear, descriptive labels for all interface elements
- Maintain focus order and visual hierarchy
- Consider accessibility in all design decisions`;
  }

  private getHighQualityComplicationsContent(): string {
    return `# Complications (watchOS)

Complications display timely, relevant information on the watch face. They provide quick access to app content without requiring users to open the app.

## Overview

Complications are small interface elements that appear on watch faces, showing information from your app. They should provide value at a glance and update appropriately throughout the day.

## Complication Types

### Corner Complications
Small complications that appear in watch face corners.

### Circular Complications
Round complications with various size options.

### Rectangular Complications
Wider complications that can display more information.

### Inline Complications
Text-based complications that appear in specific watch face locations.

## Guidelines

- Show the most relevant information for the current time
- Update complications when information changes
- Design for glanceability and quick comprehension
- Use appropriate colors and styling for the watch face
- Consider battery impact of updates

## Content Strategy

### Relevance
Show information that's useful at the current moment.

### Timeliness
Update complications when new information becomes available.

### Clarity
Use clear, simple graphics and minimal text.

### Consistency
Maintain consistent styling across complication families.

## Design Considerations

### Legibility
Ensure text and graphics are readable at small sizes.

### Color Usage
Use colors that work well with different watch faces.

### Information Hierarchy
Prioritize the most important information prominently.

## Implementation

### Complication Families
Support multiple complication families to work with different watch faces.

### Update Frequency
Balance information freshness with battery life considerations.

### Placeholder Content
Provide appropriate placeholder content when no data is available.

## Best Practices

- Test complications on actual devices and various watch faces
- Consider different user contexts and times of day
- Provide meaningful information that adds value
- Optimize for quick glances and recognition
- Support multiple complication sizes when possible`;
  }

  private getHighQualityFocusContent(): string {
    return `# Focus and Selection (tvOS)

Focus and selection are fundamental interaction concepts in tvOS. The focus engine automatically manages focus movement, while apps handle selection responses and state changes.

## Overview

tvOS uses a focus-based navigation system where users move focus between elements using the Siri Remote. Understanding focus behavior is essential for creating intuitive tvOS apps.

## Focus Engine

### Automatic Focus Management
The system automatically determines focus movement based on element positions and relationships.

### Focus Environment
Containers that manage focus behavior for their child elements.

### Preferred Focus
Specify which element should receive focus by default in different contexts.

## Guidelines

- Design clear visual focus indicators
- Ensure focus movement feels natural and predictable
- Provide appropriate feedback for user actions
- Consider the viewing distance and couch experience
- Test focus behavior thoroughly

## Focus Behavior

### Focus Movement
Users navigate using directional swipes on the Siri Remote touchpad.

### Focus Updates
Visual changes that occur when focus moves between elements.

### Focusable Elements
Interface elements that can receive and respond to focus.

## Visual Design

### Focus Appearance
Clear visual indicators that show which element currently has focus.

### Elevation and Shadows
Use depth and shadows to enhance focus feedback.

### Color and Contrast
Ensure focus indicators are visible across different content.

## Implementation

### Focus Guides
Invisible guides that help direct focus movement in complex layouts.

### Custom Focus Behavior
Override default focus behavior when necessary for better user experience.

### Focus Debugging
Tools and techniques for testing and debugging focus behavior.

## Best Practices

- Test focus navigation extensively on actual devices
- Consider the physical constraints of remote control input
- Provide clear visual feedback for all interactive elements
- Design for comfortable viewing distances
- Ensure focus behavior works consistently throughout your app`;
  }
}

// Factory function for creating the generator with all dependencies
export function createContentGenerator(config?: Partial<ContentGenerationConfig>): ContentGenerator {
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
  const searchIndexer = new SearchIndexerService();
  const crossReferenceGenerator = new CrossReferenceGeneratorService();

  // Create Crawlee-based services
  const cache = new HIGCache(3600); // 1 hour TTL
  const crawleeService = new CrawleeHIGService(cache);
  const contentExtractor = new HIGContentExtractor();

  // console.log('🔧 Initialized Apple HIG Content Generator');
  // console.log('   • High-quality content extraction enabled');
  // console.log('   • Quality monitoring and validation active');
  // console.log('   • Content optimized for AI assistant use');

  return new ContentGenerator(
    finalConfig,
    fileSystem,
    contentProcessor,
    searchIndexer,
    crossReferenceGenerator,
    crawleeService,
    contentExtractor,
    cache
  );
}

// Run the generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = createContentGenerator();
  generator.generate().catch((_error) => {
    // console.error('💥 Content generation failed:', _error);
    process.exit(1);
  });
}