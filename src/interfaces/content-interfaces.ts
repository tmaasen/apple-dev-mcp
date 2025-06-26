/**
 * Core interfaces for content generation system
 * Following SOLID principles with clear separation of concerns
 */

import type { 
  HIGSection, 
  HIGCategory, 
  ApplePlatform, 
  SearchResult,
  ContentQualityMetrics,
  ProcessedContent,
  QualityValidationResult,
  ExtractionStatistics
} from '../types.js';

// Single Responsibility: File system operations only
export interface IFileSystemService {
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<{ size: number; isDirectory(): boolean }>;
  calculateDirectorySize(path: string): Promise<number>;
}

// Single Responsibility: Content processing only
export interface IContentProcessor {
  process(section: HIGSection): Promise<string>;
  processContent(html: string, url: string): Promise<any>; // Enhanced processing method
  extractSnippet(content: string, maxLength?: number): string;
  extractKeywords(content: string, section: HIGSection): string[];
}

// Single Responsibility: Content enhancement strategies
export interface IContentEnhancer {
  canEnhance(section: HIGSection): boolean;
  enhance(content: string, section: HIGSection): string;
}

// Single Responsibility: Search indexing only
export interface ISearchIndexer {
  addSection(section: HIGSection): void;
  generateIndex(): Record<string, any>;
  clear(): void;
}

// Single Responsibility: Cross-reference generation only
export interface ICrossReferenceGenerator {
  addSection(section: HIGSection): void;
  generateReferences(): Record<string, any>;
  clear(): void;
}


// Single Responsibility: Content quality assessment
export interface IContentQualityValidator {
  validateContent(content: string, section: HIGSection): Promise<QualityValidationResult>;
  calculateQualityScore(content: string): number;
  isHighQualityContent(metrics: ContentQualityMetrics): boolean;
}

// Single Responsibility: Advanced content extraction
export interface IAdvancedContentExtractor {
  extractContent(rawContent: string, section: HIGSection): Promise<ProcessedContent>;
  extractCodeExamples(content: string): string[];
  extractImageReferences(content: string): string[];
  generateSummary(content: string, section: HIGSection): string;
}

// Single Responsibility: Crawlee-based scraping
export interface ICrawleeHIGService {
  discoverSections(): Promise<HIGSection[]>;
  fetchSectionContent(section: HIGSection): Promise<HIGSection>;
  searchContent(query: string, platform?: ApplePlatform, category?: HIGCategory, limit?: number): Promise<SearchResult[]>;
}

// Single Responsibility: Extraction statistics and monitoring
export interface IExtractionMonitor {
  recordExtraction(section: HIGSection, quality: ContentQualityMetrics): void;
  getStatistics(): ExtractionStatistics;
  generateReport(): string;
}

// Configuration value object
export interface ContentGenerationConfig {
  readonly outputDirectory: string;
  readonly batchSize: number;
  readonly rateLimitDelay: number;
  readonly forceUpdate: boolean;
  readonly maxRetries: number;
}

// Metadata value object
export interface GenerationMetadata {
  readonly lastUpdated: string;
  readonly totalSections: number;
  readonly sectionsByPlatform: Record<ApplePlatform, number>;
  readonly sectionsByCategory: Record<HIGCategory, number>;
  readonly totalSize: number;
  readonly generationDuration: number;
}