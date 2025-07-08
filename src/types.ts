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
  structuredContent?: StructuredHIGContent;
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
  touchTarget?: string;
  minimumSize?: string;
}

// Enhanced structured content interfaces for Phase 1
export interface StructuredHIGContent {
  overview: string;           // What this component/concept is
  guidelines: string[];       // Best practices and rules  
  examples: string[];         // Concrete usage examples
  specifications?: ComponentSpec; // Technical details
  relatedConcepts: string[];  // Cross-references to other HIG sections
  platformSpecific?: {        // Platform-specific variations
    [platform: string]: {
      guidelines?: string[];
      examples?: string[];
      specifications?: ComponentSpec;
    };
  };
}

export interface EnhancedHIGSection extends HIGSection {
  structuredContent?: StructuredHIGContent;
  rawHtml?: string;           // Store original HTML for debugging
  processingMetrics?: {
    extractionTime: number;
    contentLength: number;
    structureScore: number;   // How well-structured the content is
    cleaningScore: number;    // How much cleaning was needed
  };
}

// Content processing result
export interface ProcessedContentResult {
  cleanedMarkdown: string;
  structuredContent: StructuredHIGContent;
  quality: ContentQualityMetrics;
  processingMetrics: {
    extractionTime: number;
    contentLength: number;
    structureScore: number;
    cleaningScore: number;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  platform: ApplePlatform;
  category?: HIGCategory;
  relevanceScore: number;
  snippet: string;
  type: 'section' | 'component' | 'guideline';
  highlights?: string[];
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

// Phase 2: Semantic Search Enhancement Types
export interface SemanticSearchResult extends SearchResult {
  semanticScore: number;      // Vector similarity score
  keywordScore: number;       // Traditional keyword matching score
  structureScore: number;     // Score based on content structure match
  contextualScore: number;    // Score based on contextual understanding
  combinedScore: number;      // Final weighted relevance score
  searchTerms: string[];      // Extracted terms from query
  matchedConcepts: string[];  // Semantic concepts that matched
}

export interface QueryAnalysis {
  originalQuery: string;
  processedQuery: string;     // Normalized/cleaned query
  intent: SearchIntent;       // What the user is trying to find
  entities: EntityMatch[];    // Named entities found in query
  keywords: string[];         // Important keywords extracted
  concepts: string[];         // Semantic concepts identified
  platform?: ApplePlatform;  // Platform inferred from query
  category?: HIGCategory;     // Category inferred from query
}

export interface EntityMatch {
  text: string;              // Original text from query
  type: EntityType;          // Type of entity
  confidence: number;        // Confidence in the match
  normalizedValue?: string;  // Standardized form
}

export type EntityType = 
  | 'component'              // UI components (button, navigation, etc.)
  | 'platform'              // Apple platforms
  | 'property'               // Design properties (color, spacing, etc.)
  | 'action'                 // User actions (tap, swipe, etc.)
  | 'concept'                // Design concepts (accessibility, etc.)
  | 'measurement'            // Dimensions, sizes, etc.

export type SearchIntent = 
  | 'find_component'         // Looking for specific UI component
  | 'find_guideline'         // Looking for design guidelines
  | 'compare_platforms'      // Comparing across platforms
  | 'find_specification'     // Looking for technical specs
  | 'find_example'           // Looking for examples/patterns
  | 'troubleshoot'           // Solving a design problem
  | 'general_search'         // Broad/unclear intent

export interface EmbeddingVector {
  values: number[];          // The actual embedding vector
  dimension: number;         // Vector dimension
  model: string;             // Model used to generate embedding
}

export interface SemanticIndex {
  sectionId: string;
  embeddings: {
    title: EmbeddingVector;
    overview: EmbeddingVector;
    guidelines: EmbeddingVector;
    fullContent: EmbeddingVector;
  };
  metadata: {
    platform: ApplePlatform;
    category: HIGCategory;
    concepts: string[];       // Key concepts for this section
    lastUpdated: Date;
    qualityScore: number;
  };
}

export interface SearchConfig {
  semanticWeight: number;     // Weight for semantic similarity (0-1)
  keywordWeight: number;      // Weight for keyword matching (0-1)
  structureWeight: number;    // Weight for structure matching (0-1)
  contextWeight: number;      // Weight for contextual relevance (0-1)
  minSemanticThreshold: number; // Minimum semantic similarity to consider
  maxResults: number;         // Maximum results to return
  boostFactors: {            // Boost scores for certain matches
    exactTitle: number;
    platformMatch: number;
    categoryMatch: number;
    recentContent: number;
  };
}

export interface TechnicalDocumentation {
  id: string;
  symbol: string;
  framework: string;
  symbolKind: string;
  platforms: string[];
  abstract: string;
  apiReference: string;
  codeExamples: string[];
  relatedSymbols: string[];
  url: string;
  lastUpdated: Date;
}

export interface TechnicalSearchResult {
  title: string;
  description: string;
  path: string;
  framework: string;
  symbolKind?: string;
  platforms?: string;
  url: string;
  relevanceScore: number;
  type: 'technical';
}

export interface UnifiedSearchResult {
  id: string;
  title: string;
  type: 'design' | 'technical' | 'combined';
  url: string;
  relevanceScore: number;
  snippet: string;
  
  // Design content (from existing HIG system)
  designContent?: {
    platform: ApplePlatform;
    category?: HIGCategory;
    guidelines?: string[];
    specifications?: ComponentSpec;
  };
  
  // Technical content (from Apple API)
  technicalContent?: {
    framework: string;
    symbolKind: string;
    platforms: string[];
    abstract: string;
    codeExamples: string[];
  };
  
  // Combined guidance (fusion of both)
  combinedGuidance?: {
    designPrinciples: string[];
    implementationSteps: string[];
    crossPlatformConsiderations: string[];
    accessibilityNotes: string[];
  };
}

export interface DesignTechnicalMapping {
  designGuideline: string;
  designUrl: string;
  relatedSymbols: string[];
  implementationExamples: string[];
  platforms: ApplePlatform[];
  mappingConfidence: number; // 0-1 confidence in the mapping
}

export interface CrossReferenceEntry {
  id: string;
  sourceType: 'design' | 'technical';
  sourceId: string;
  targetType: 'design' | 'technical';
  targetId: string;
  relationshipType: 'implements' | 'related' | 'example' | 'platform-specific';
  confidence: number;
  lastUpdated: Date;
}

export interface FrameworkInfo {
  name: string;
  description: string;
  platforms: string[];
  topicSections: string[];
  url: string;
  relatedHIGSections?: string[];
}

export interface UpdateCheckResult {
  source: 'hig-static' | 'api-documentation' | 'git-repository';
  isUpdateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  lastChecked: Date;
  updateInstructions?: string;
  changelog?: string[];
}

// Enhanced MCP Tool interfaces for technical documentation

export interface GetTechnicalDocumentationArgs {
  path: string;
  includeDesignGuidance?: boolean;
  includeRelatedSymbols?: boolean;
  includeCodeExamples?: boolean;
}

export interface SearchUnifiedArgs {
  query: string;
  searchType?: 'design' | 'technical' | 'both';
  platform?: ApplePlatform;
  category?: HIGCategory;
  framework?: string;
  symbolType?: string;
  includeImplementation?: boolean;
  limit?: number;
}

export interface ListTechnologiesArgs {
  includeDesignMapping?: boolean;
  platform?: ApplePlatform;
  category?: 'framework' | 'symbol' | 'all';
}

export interface GetImplementationGuideArgs {
  componentName: string;
  platform?: ApplePlatform;
  includeAccessibility?: boolean;
  includeCodeExamples?: boolean;
}

export interface CheckUpdatesArgs {
  sources?: ('hig-static' | 'api-documentation' | 'git-repository')[];
  includeChangelog?: boolean;
}

// Content Fusion Types

export interface ContentFusionResult {
  id: string;
  title: string;
  type: 'implementation-guide' | 'component-spec' | 'platform-comparison';
  
  designSection: {
    principles: string[];
    specifications: ComponentSpec;
    guidelines: string[];
    examples: string[];
  };
  
  technicalSection: {
    framework: string;
    symbol: string;
    apiReference: string;
    codeExamples: string[];
    platforms: string[];
  };
  
  fusedGuidance: {
    overview: string;
    implementationSteps: string[];
    bestPractices: string[];
    commonPitfalls: string[];
    accessibilityConsiderations: string[];
    platformDifferences: string[];
  };
  
  lastUpdated: Date;
  confidenceScore: number;
}

export interface WildcardSearchPattern {
  pattern: string;
  type: 'prefix' | 'suffix' | 'contains' | 'exact';
  caseSensitive: boolean;
}

export interface EnhancedCacheEntry<T> extends CacheEntry<T> {
  source: 'hig-static' | 'api-documentation' | 'scraped' | 'fused';
  quality: number;
  lastValidated: Date;
  invalidationRules: string[];
}

// Git Update Types (adapted from MightyDillah's approach)

export interface GitUpdateStatus {
  branch: string;
  status: string;
  behindCount: number;
  aheadCount: number;
  localCommit: string;
  remoteCommit: string;
  hasUpdates: boolean;
  hasLocalChanges: boolean;
  lastChecked: Date;
}

export interface UpdateNotification {
  type: 'info' | 'warning' | 'error';
  message: string;
  actionRequired?: boolean;
  instructions?: string[];
}