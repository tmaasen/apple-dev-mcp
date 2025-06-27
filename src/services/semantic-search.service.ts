/**
 * SemanticSearchService
 * 
 * Implements semantic search using TensorFlow Universal Sentence Encoder
 * for vector similarity matching combined with traditional keyword search.
 */

// import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import compromise from 'compromise';

import type { 
  HIGSection,
  SemanticSearchResult,
  QueryAnalysis,
  EntityMatch,
  // EntityType,
  SearchIntent,
  EmbeddingVector,
  SemanticIndex,
  SearchConfig,
  ApplePlatform,
  HIGCategory
} from '../types.js';

export class SemanticSearchService {
  private model: use.UniversalSentenceEncoder | null = null;
  private semanticIndices: Map<string, SemanticIndex> = new Map();
  private isInitialized = false;
  
  private readonly defaultConfig: SearchConfig = {
    semanticWeight: 0.4,      // Primary: semantic understanding
    keywordWeight: 0.3,       // Secondary: keyword matching  
    structureWeight: 0.2,     // Tertiary: content structure
    contextWeight: 0.1,       // Quaternary: contextual relevance
    minSemanticThreshold: 0.3, // Minimum similarity to consider
    maxResults: 20,
    boostFactors: {
      exactTitle: 2.0,        // Double score for exact title matches
      platformMatch: 1.5,     // 50% boost for platform matches
      categoryMatch: 1.3,     // 30% boost for category matches
      recentContent: 1.2      // 20% boost for recently updated content
    }
  };

  constructor(private config: Partial<SearchConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    
    // Skip initialization if explicitly disabled or likely to fail
    if (process.env.DISABLE_SEMANTIC_SEARCH === 'true') {
      console.log('[SemanticSearch] ⚡ Disabled via environment variable');
      this.model = null;
      this.isInitialized = false;
      return;
    }
    
    console.log('[SemanticSearch] Initializing with TensorFlow Universal Sentence Encoder');
  }

  /**
   * Initialize the semantic search service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Skip if disabled
    if (process.env.DISABLE_SEMANTIC_SEARCH === 'true') {
      console.log('[SemanticSearch] Skipping initialization (DISABLE_SEMANTIC_SEARCH=true)');
      this.model = null;
      this.isInitialized = false;
      return;
    }
    
    // Add process timeout to prevent hanging
    const initTimeoutMs = 8000; // Much shorter total timeout
    const initTimeout = setTimeout(() => {
      console.log('[SemanticSearch] ⚡ Using keyword search only (timeout)');
      this.model = null;
      this.isInitialized = false;
    }, initTimeoutMs);

    // Quick fail-fast check for offline mode or network issues
    try {
      // Much simpler and faster connectivity check
      const controller = new globalThis.AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2s
      
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD', 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Network check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('[SemanticSearch] ⚡ Network unavailable, using keyword search only');
      console.log(error);
      this.model = null;
      this.isInitialized = false;
      clearTimeout(initTimeout);
      return;
    }

    try {
      // Attempt to load model with shorter timeout
      const modelTimeoutMs = 5000; // Much shorter timeout
      const modelController = new globalThis.AbortController();
      const modelTimeoutId = setTimeout(() => {
        modelController.abort();
      }, modelTimeoutMs);
      
      try {
        this.model = await use.load();
        clearTimeout(modelTimeoutId);
        this.isInitialized = true;
        console.log('[SemanticSearch] ✅ Enhanced search enabled');
      } catch (modelError) {
        clearTimeout(modelTimeoutId);
        throw modelError;
      }
    } catch (error) {
      console.log('[SemanticSearch] ⚡ Using keyword search only');
      console.log(error);
      this.model = null;
      this.isInitialized = false;
      // Don't throw - allow graceful fallback to keyword search
    }
    
    // Clear the initialization timeout
    clearTimeout(initTimeout);
  }

  /**
   * Index a section for semantic search
   */
  async indexSection(section: HIGSection): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.model) {
      // Silently skip indexing if model is not available
      return;
    }

    try {
      // Extract text components for embedding
      const title = section.title || '';
      const content = section.content || '';
      
      // Extract structured content if available
      const structuredContent = (section as any).structuredContent;
      const overview = structuredContent?.overview || '';
      const guidelines = structuredContent?.guidelines?.join(' ') || '';
      
      // Generate embeddings for different text components
      const [titleEmbedding, overviewEmbedding, guidelinesEmbedding, fullContentEmbedding] = 
        await Promise.all([
          this.generateEmbedding(title),
          this.generateEmbedding(overview),
          this.generateEmbedding(guidelines),
          this.generateEmbedding(content)
        ]);

      // Extract key concepts using NLP
      const concepts = this.extractConcepts(content);

      // Create semantic index entry
      const semanticIndex: SemanticIndex = {
        sectionId: section.id,
        embeddings: {
          title: titleEmbedding,
          overview: overviewEmbedding,
          guidelines: guidelinesEmbedding,
          fullContent: fullContentEmbedding
        },
        metadata: {
          platform: section.platform,
          category: section.category,
          concepts,
          lastUpdated: section.lastUpdated || new Date(),
          qualityScore: section.quality?.score || 0.5
        }
      };

      this.semanticIndices.set(section.id, semanticIndex);
      
      console.log(`[SemanticSearch] ✓ Indexed section: ${section.title} (${concepts.length} concepts)`);
    } catch (error) {
      console.error(`[SemanticSearch] ❌ Failed to index section ${section.id}:`, error);
    }
  }

  /**
   * Perform semantic search
   */
  async search(
    query: string, 
    sections: HIGSection[], 
    platform?: ApplePlatform, 
    category?: HIGCategory,
    limit: number = 10
  ): Promise<SemanticSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.model) {
      console.warn('[SemanticSearch] Model not available, returning empty results for semantic search');
      return [];
    }

    try {
      // Analyze the query to understand intent and extract entities
      const queryAnalysis = await this.analyzeQuery(query, platform, category);
      console.log(`[SemanticSearch] Query analysis: ${queryAnalysis.intent} (${queryAnalysis.entities.length} entities)`);

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(queryAnalysis.processedQuery);

      // Calculate semantic scores for all indexed sections
      const results: SemanticSearchResult[] = [];

      for (const section of sections) {
        const semanticIndex = this.semanticIndices.get(section.id);
        if (!semanticIndex) {
          // Section not indexed yet, index it now
          await this.indexSection(section);
          continue;
        }

        // Calculate multiple similarity scores
        const semanticScore = this.calculateSemanticSimilarity(queryEmbedding, semanticIndex);
        const keywordScore = this.calculateKeywordScore(queryAnalysis, section);
        const structureScore = this.calculateStructureScore(queryAnalysis, section);
        const contextualScore = this.calculateContextualScore(queryAnalysis, semanticIndex);

        // Apply filtering
        if (semanticScore < this.config.minSemanticThreshold) continue;
        if (platform && section.platform !== platform && section.platform !== 'universal') continue;
        if (category && section.category !== category) continue;

        // Calculate combined score with weights
        let combinedScore = (
          semanticScore * this.config.semanticWeight +
          keywordScore * this.config.keywordWeight +
          structureScore * this.config.structureWeight +
          contextualScore * this.config.contextWeight
        );

        // Apply boost factors
        combinedScore = this.applyBoostFactors(combinedScore, queryAnalysis, section, semanticIndex);

        // Create search result
        const result: SemanticSearchResult = {
          id: section.id,
          title: section.title,
          url: section.url,
          platform: section.platform,
          relevanceScore: combinedScore,
          snippet: this.generateSnippet(section, queryAnalysis),
          type: this.determineResultType(section, queryAnalysis),
          semanticScore,
          keywordScore,
          structureScore,
          contextualScore,
          combinedScore,
          searchTerms: queryAnalysis.keywords,
          matchedConcepts: this.findMatchedConcepts(queryAnalysis, semanticIndex)
        };

        results.push(result);
      }

      // Sort by combined score and return top results
      const sortedResults = results
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, Math.min(limit, this.config.maxResults));

      console.log(`[SemanticSearch] Found ${sortedResults.length} results for "${query}"`);
      return sortedResults;

    } catch (error) {
      console.error('[SemanticSearch] Search failed:', error);
      return [];
    }
  }

  /**
   * Analyze query to understand intent and extract entities
   */
  private async analyzeQuery(
    query: string, 
    platform?: ApplePlatform, 
    category?: HIGCategory
  ): Promise<QueryAnalysis> {
    // Clean and normalize the query
    const processedQuery = query.toLowerCase().trim();
    
    // Use compromise for NLP analysis
    const doc = compromise(query);
    
    // Extract entities
    const entities: EntityMatch[] = [];
    
    // Extract component entities
    const componentTerms = ['button', 'navigation', 'tab', 'menu', 'slider', 'picker', 'table', 'list', 'view', 'controller'];
    componentTerms.forEach(term => {
      if (processedQuery.includes(term)) {
        entities.push({
          text: term,
          type: 'component',
          confidence: 0.8,
          normalizedValue: term
        });
      }
    });

    // Extract platform entities
    const platformTerms: ApplePlatform[] = ['iOS', 'macOS', 'watchOS', 'tvOS', 'visionOS'];
    platformTerms.forEach(plat => {
      if (processedQuery.includes(plat.toLowerCase())) {
        entities.push({
          text: plat.toLowerCase(),
          type: 'platform',
          confidence: 0.9,
          normalizedValue: plat
        });
      }
    });

    // Extract property entities
    const propertyTerms = ['color', 'spacing', 'typography', 'font', 'size', 'padding', 'margin'];
    propertyTerms.forEach(prop => {
      if (processedQuery.includes(prop)) {
        entities.push({
          text: prop,
          type: 'property',
          confidence: 0.7,
          normalizedValue: prop
        });
      }
    });

    // Determine search intent
    const intent = this.determineSearchIntent(processedQuery, entities);
    
    // Extract keywords using compromise
    const topics = doc.topics().out('array') as string[];
    const nouns = doc.nouns().out('array') as string[];
    const adjectives = doc.adjectives().out('array') as string[];
    const totalKeywords = topics.concat(nouns, adjectives).filter((word: string) => word.length > 2);
    const keywords = totalKeywords;

    // Extract concepts (simplified approach)
    const concepts = this.extractConcepts(processedQuery);

    return {
      originalQuery: query,
      processedQuery,
      intent,
      entities,
      keywords: [...new Set(keywords)], // Remove duplicates
      concepts,
      platform: platform || this.inferPlatform(entities),
      category: category || this.inferCategory(entities, processedQuery)
    };
  }

  /**
   * Generate embedding for text using Universal Sentence Encoder
   */
  private async generateEmbedding(text: string): Promise<EmbeddingVector> {
    if (!this.model) {
      // Return zero vector when model is not available
      return {
        values: new Array(512).fill(0),
        dimension: 512,
        model: 'universal-sentence-encoder'
      };
    }

    if (!text || text.trim().length === 0) {
      // Return zero vector for empty text
      return {
        values: new Array(512).fill(0), // USE generates 512-dimensional vectors
        dimension: 512,
        model: 'universal-sentence-encoder'
      };
    }

    try {
      const embeddings = await this.model.embed([text]);
      const values = await embeddings.data();
      embeddings.dispose(); // Clean up memory

      return {
        values: Array.from(values),
        dimension: values.length,
        model: 'universal-sentence-encoder'
      };
    } catch (error) {
      console.error('[SemanticSearch] Embedding generation failed:', error);
      // Return zero vector as fallback
      return {
        values: new Array(512).fill(0),
        dimension: 512,
        model: 'universal-sentence-encoder'
      };
    }
  }

  /**
   * Calculate semantic similarity between query and section
   */
  private calculateSemanticSimilarity(queryEmbedding: EmbeddingVector, semanticIndex: SemanticIndex): number {
    // Calculate similarity with different parts of the content
    const titleSim = this.cosineSimilarity(queryEmbedding.values, semanticIndex.embeddings.title.values);
    const overviewSim = this.cosineSimilarity(queryEmbedding.values, semanticIndex.embeddings.overview.values);
    const guidelinesSim = this.cosineSimilarity(queryEmbedding.values, semanticIndex.embeddings.guidelines.values);
    const contentSim = this.cosineSimilarity(queryEmbedding.values, semanticIndex.embeddings.fullContent.values);

    // Weighted combination (title and overview are more important)
    return (
      titleSim * 0.4 +        // Title is most important
      overviewSim * 0.3 +     // Overview is second most important
      guidelinesSim * 0.2 +   // Guidelines are third
      contentSim * 0.1        // Full content is least specific
    );
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate keyword-based score
   */
  private calculateKeywordScore(queryAnalysis: QueryAnalysis, section: HIGSection): number {
    const content = (section.content || '').toLowerCase();
    const title = section.title.toLowerCase();
    
    let score = 0;
    const totalKeywords = queryAnalysis.keywords.length;

    if (totalKeywords === 0) return 0;

    queryAnalysis.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Title matches are more valuable
      if (title.includes(keywordLower)) {
        score += 2;
      }
      
      // Content matches
      const contentMatches = (content.match(new RegExp(keywordLower, 'g')) || []).length;
      score += Math.min(contentMatches * 0.5, 2); // Cap content matches
    });

    return Math.min(score / (totalKeywords * 2), 1); // Normalize to 0-1
  }

  /**
   * Calculate structure-based score
   */
  private calculateStructureScore(queryAnalysis: QueryAnalysis, section: HIGSection): number {
    let score = 0;
    
    // Check if the section has structured content matching the query intent
    const structuredContent = (section as any).structuredContent;
    
    if (structuredContent) {
      score += 0.3; // Base bonus for having structured content
      
      switch (queryAnalysis.intent) {
        case 'find_guideline':
          if (structuredContent.guidelines && structuredContent.guidelines.length > 0) {
            score += 0.5;
          }
          break;
        case 'find_specification':
          if (structuredContent.specifications) {
            score += 0.5;
          }
          break;
        case 'find_example':
          if (structuredContent.examples && structuredContent.examples.length > 0) {
            score += 0.5;
          }
          break;
        default:
          score += 0.2; // General bonus
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate contextual relevance score
   */
  private calculateContextualScore(queryAnalysis: QueryAnalysis, semanticIndex: SemanticIndex): number {
    let score = 0;

    // Platform relevance
    if (queryAnalysis.platform && semanticIndex.metadata.platform === queryAnalysis.platform) {
      score += 0.4;
    } else if (semanticIndex.metadata.platform === 'universal') {
      score += 0.2; // Universal content is somewhat relevant
    }

    // Category relevance
    if (queryAnalysis.category && semanticIndex.metadata.category === queryAnalysis.category) {
      score += 0.3;
    }

    // Quality bonus
    score += semanticIndex.metadata.qualityScore * 0.3;

    return Math.min(score, 1);
  }

  /**
   * Apply boost factors to the combined score
   */
  private applyBoostFactors(
    score: number, 
    queryAnalysis: QueryAnalysis, 
    section: HIGSection, 
    semanticIndex: SemanticIndex
  ): number {
    let boostedScore = score;

    // Exact title match boost
    if (section.title.toLowerCase().includes(queryAnalysis.processedQuery)) {
      boostedScore *= this.config.boostFactors.exactTitle;
    }

    // Platform match boost
    if (queryAnalysis.platform && section.platform === queryAnalysis.platform) {
      boostedScore *= this.config.boostFactors.platformMatch;
    }

    // Category match boost
    if (queryAnalysis.category && section.category === queryAnalysis.category) {
      boostedScore *= this.config.boostFactors.categoryMatch;
    }

    // Recent content boost (content updated within last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    if (semanticIndex.metadata.lastUpdated > sixMonthsAgo) {
      boostedScore *= this.config.boostFactors.recentContent;
    }

    return boostedScore;
  }

  // Helper methods

  private determineSearchIntent(query: string, entities: EntityMatch[]): SearchIntent {
    // Simple intent determination based on query patterns
    if (query.includes('how to') || query.includes('example')) return 'find_example';
    if (query.includes('guideline') || query.includes('best practice')) return 'find_guideline';
    if (query.includes('size') || query.includes('dimension') || query.includes('spec')) return 'find_specification';
    if (query.includes('vs') || query.includes('compare')) return 'compare_platforms';
    if (entities.some(e => e.type === 'component')) return 'find_component';
    
    return 'general_search';
  }

  private extractConcepts(text: string): string[] {
    // Simple concept extraction (can be enhanced with more sophisticated NLP)
    const concepts: string[] = [];
    const conceptKeywords = [
      'accessibility', 'usability', 'navigation', 'interaction', 'visual', 'layout',
      'typography', 'color', 'spacing', 'hierarchy', 'consistency', 'feedback',
      'affordance', 'discoverability', 'clarity', 'focus', 'simplicity'
    ];

    conceptKeywords.forEach(concept => {
      if (text.toLowerCase().includes(concept)) {
        concepts.push(concept);
      }
    });

    return concepts;
  }

  private inferPlatform(entities: EntityMatch[]): ApplePlatform | undefined {
    const platformEntity = entities.find(e => e.type === 'platform');
    return platformEntity?.normalizedValue as ApplePlatform;
  }

  private inferCategory(entities: EntityMatch[], query: string): HIGCategory | undefined {
    // Simple category inference
    if (query.includes('color') || query.includes('material')) return 'color-and-materials';
    if (query.includes('typography') || query.includes('font')) return 'typography';
    if (query.includes('navigation') || query.includes('menu')) return 'navigation';
    if (query.includes('layout') || query.includes('grid')) return 'layout';
    
    return undefined;
  }

  private generateSnippet(section: HIGSection, queryAnalysis: QueryAnalysis): string {
    const content = section.content || '';
    const maxLength = 200;

    // Try to find the most relevant part of the content
    const keywords = queryAnalysis.keywords;
    if (keywords.length > 0) {
      const firstKeyword = keywords[0];
      const index = content.toLowerCase().indexOf(firstKeyword.toLowerCase());
      
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, start + maxLength);
        return content.substring(start, end) + (end < content.length ? '...' : '');
      }
    }

    // Fallback to beginning of content
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  private determineResultType(section: HIGSection, queryAnalysis: QueryAnalysis): 'section' | 'component' | 'guideline' {
    if (queryAnalysis.intent === 'find_component' || 
        queryAnalysis.entities.some(e => e.type === 'component')) {
      return 'component';
    }
    
    if (queryAnalysis.intent === 'find_guideline') {
      return 'guideline';
    }
    
    return 'section';
  }

  private findMatchedConcepts(queryAnalysis: QueryAnalysis, semanticIndex: SemanticIndex): string[] {
    const matched: string[] = [];
    
    queryAnalysis.concepts.forEach(queryConcept => {
      if (semanticIndex.metadata.concepts.includes(queryConcept)) {
        matched.push(queryConcept);
      }
    });

    return matched;
  }

  /**
   * Get semantic search statistics
   */
  getStatistics() {
    return {
      totalIndexedSections: this.semanticIndices.size,
      isInitialized: this.isInitialized,
      modelLoaded: this.model !== null,
      config: this.config
    };
  }

  /**
   * Clear all semantic indices
   */
  clearIndices(): void {
    this.semanticIndices.clear();
    console.log('[SemanticSearch] Cleared all semantic indices');
  }
}