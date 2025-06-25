/**
 * Types for Apple Human Interface Guidelines MCP Server
 */

export interface HIGSection {
  id: string;
  title: string;
  url: string;
  platform: ApplePlatform;
  category: HIGCategory;
  content?: string;
  lastUpdated?: Date;
  quality?: ContentQualityMetrics;
  extractionMethod?: 'crawlee' | 'fallback' | 'static';
}

export interface HIGComponent {
  id: string;
  title: string;
  description: string;
  platforms: ApplePlatform[];
  url: string;
  specifications?: ComponentSpec;
  guidelines?: string[];
  examples?: string[];
  lastUpdated?: Date;
}

export interface ComponentSpec {
  dimensions?: {
    width?: string;
    height?: string;
    minWidth?: string;
    minHeight?: string;
  };
  spacing?: {
    padding?: string;
    margin?: string;
  };
  typography?: {
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  platform: ApplePlatform;
  relevanceScore: number;
  snippet: string;
  type: 'section' | 'component' | 'guideline';
}

export interface HIGUpdate {
  id: string;
  title: string;
  description: string;
  url: string;
  date: Date;
  platform: ApplePlatform;
  type: 'new' | 'updated' | 'deprecated';
  category: HIGCategory;
}

export type ApplePlatform = 
  | 'iOS' 
  | 'macOS' 
  | 'watchOS' 
  | 'tvOS' 
  | 'visionOS'
  | 'universal';

export type HIGCategory = 
  | 'foundations'
  | 'layout'
  | 'navigation'
  | 'presentation'
  | 'selection-and-input'
  | 'status'
  | 'system-capabilities'
  | 'visual-design'
  | 'icons-and-images'
  | 'color-and-materials'
  | 'typography'
  | 'motion'
  | 'technologies';

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

export interface ScrapingConfig {
  baseUrl: string;
  userAgent: string;
  requestDelay: number;
  retryAttempts: number;
  timeout: number;
}

export interface HIGResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: string;
}

// MCP Tool interfaces
export interface SearchGuidelinesArgs {
  query: string;
  platform?: ApplePlatform;
  category?: HIGCategory;
  limit?: number;
}

export interface GetComponentSpecArgs {
  componentName: string;
  platform?: ApplePlatform;
}

export interface ComparePlatformsArgs {
  componentName: string;
  platforms: ApplePlatform[];
}

export interface GetLatestUpdatesArgs {
  since?: string; // ISO date string
  platform?: ApplePlatform;
  limit?: number;
}

// Crawlee Integration Types
export interface ContentQualityMetrics {
  score: number; // 0-1, where 1 is highest quality
  length: number;
  structureScore: number;
  appleTermsScore: number;
  codeExamplesCount: number;
  imageReferencesCount: number;
  headingCount: number;
  isFallbackContent: boolean;
  extractionMethod: string;
  confidence: number;
}

export interface ProcessedContent {
  content: string;
  summary: string;
  tableOfContents: string;
  codeExamples: string[];
  imageReferences: string[];
  relatedSections: string[];
  keywords: string[];
  quality: ContentQualityMetrics;
}

export interface DiscoveredLink {
  url: string;
  title: string;
  platform: ApplePlatform;
  category: HIGCategory;
  depth: number;
}

export interface DiscoveryConfig {
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
  respectfulDelay: number;
  cacheKey: string;
  cacheTTL: number;
}

export interface ContentExtractionResult {
  content: string;
  quality: number;
  extractionMethod: 'crawlee' | 'fallback';
  timestamp: Date;
}

export interface CrawleeConfig extends ScrapingConfig {
  maxConcurrency: number;
  browserOptions: {
    headless: boolean;
    viewport: { width: number; height: number };
    args: string[];
  };
  waitOptions: {
    networkIdle: number;
    timeout: number;
  };
}

// Quality Validation Types
export interface QualityValidationResult {
  isValid: boolean;
  score: number;
  confidence: number;
  issues: string[];
  recommendations: string[];
}

export interface ExtractionStatistics {
  totalSections: number;
  successfulExtractions: number;
  fallbackUsage: number;
  averageQuality: number;
  averageConfidence: number;
  extractionSuccessRate: number;
}