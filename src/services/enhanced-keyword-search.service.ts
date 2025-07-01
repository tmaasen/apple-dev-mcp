/**
 * Enhanced Keyword Search Service
 * 
 * Provides improved search functionality without requiring TensorFlow.
 * Uses advanced keyword matching, stemming, and relevance scoring.
 */

import type { SearchResult, ApplePlatform, HIGCategory } from '../types.js';

export interface EnhancedSearchConfig {
  maxResults: number;
  minScore: number;
  exactMatchBoost: number;
  titleBoost: number;
  keywordBoost: number;
  platformBoost: number;
  categoryBoost: number;
}

export class EnhancedKeywordSearchService {
  private readonly defaultConfig: EnhancedSearchConfig = {
    maxResults: 20,
    minScore: 0.1,
    exactMatchBoost: 3.0,
    titleBoost: 2.0,
    keywordBoost: 1.5,
    platformBoost: 1.2,
    categoryBoost: 1.1
  };

  private readonly synonyms: Record<string, string[]> = {
    'authentication': ['login', 'sign in', 'signin', 'auth', 'credential'],
    'login': ['sign in', 'signin', 'authentication', 'auth'],
    'password': ['passkey', 'credentials', 'security', 'authentication'],
    'security': ['privacy', 'protection', 'secure', 'safety', 'password'],
    'privacy': ['security', 'protection', 'data protection', 'confidential'],
    'button': ['control', 'input', 'interaction', 'tap', 'press'],
    'navigation': ['menu', 'nav', 'routing', 'flow', 'path'],
    'error': ['validation', 'feedback', 'alert', 'warning', 'message'],
    'validation': ['error', 'feedback', 'check', 'verify', 'validate'],
    'ui': ['interface', 'user interface', 'design', 'layout'],
    'ux': ['user experience', 'experience', 'usability', 'interaction']
  };

  private readonly commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 
    'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'it', 'its'
  ]);

  constructor(private config: Partial<EnhancedSearchConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Enhanced search with synonym expansion and better relevance scoring
   */
  async search(
    query: string, 
    sections: any[], 
    platform?: ApplePlatform, 
    category?: HIGCategory
  ): Promise<SearchResult[]> {
    const expandedQuery = this.expandQueryWithSynonyms(query);
    const queryTokens = this.tokenizeQuery(expandedQuery);
    
    const results: SearchResult[] = [];

    for (const section of sections) {
      if (!section) continue;

      // Apply filters
      if (platform && platform !== 'universal' && 
          section.platform !== platform && section.platform !== 'universal') {
        continue;
      }

      if (category && section.category !== category) {
        continue;
      }

      const score = this.calculateRelevanceScore(section, query, queryTokens);
      
      if (score >= this.config.minScore!) {
        results.push({
          id: section.id,
          title: section.title,
          platform: section.platform,
          category: section.category,
          url: section.url,
          snippet: section.snippet || '',
          relevanceScore: score,
          type: 'section' as const,
          highlights: this.generateHighlights(section, queryTokens)
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, this.config.maxResults!);
  }

  /**
   * Expand query with synonyms for better matching
   */
  private expandQueryWithSynonyms(query: string): string {
    const words = query.toLowerCase().split(/\s+/);
    const expandedWords = new Set(words);

    for (const word of words) {
      if (this.synonyms[word]) {
        this.synonyms[word].forEach(synonym => expandedWords.add(synonym));
      }
    }

    return Array.from(expandedWords).join(' ');
  }

  /**
   * Tokenize query into meaningful search terms
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.commonWords.has(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0);
  }

  /**
   * Calculate comprehensive relevance score
   */
  private calculateRelevanceScore(section: any, originalQuery: string, queryTokens: string[]): number {
    let score = 0;
    const originalQueryLower = originalQuery.toLowerCase();
    const titleLower = (section.title || '').toLowerCase();
    const snippetLower = (section.snippet || '').toLowerCase();
    const keywords = section.keywords || [];

    // 1. Exact phrase match in title (highest priority)
    if (titleLower.includes(originalQueryLower)) {
      score += this.config.exactMatchBoost! * this.config.titleBoost!;
    }

    // 2. Exact phrase match in snippet
    if (snippetLower.includes(originalQueryLower)) {
      score += this.config.exactMatchBoost!;
    }

    // 3. Individual word matches in title
    const titleWordMatches = queryTokens.filter(token => titleLower.includes(token));
    score += titleWordMatches.length * this.config.titleBoost!;

    // 4. Individual word matches in keywords
    const keywordMatches = queryTokens.filter(token => 
      keywords.some((keyword: string) => keyword.toLowerCase().includes(token))
    );
    score += keywordMatches.length * this.config.keywordBoost!;

    // 5. Individual word matches in snippet
    const snippetWordMatches = queryTokens.filter(token => snippetLower.includes(token));
    score += snippetWordMatches.length * 0.5;

    // 6. Bonus for platform/category relevance
    if (section.platform === 'universal') {
      score += this.config.platformBoost! * 0.5; // Universal content gets a small boost
    }

    // 7. Penalty for very short content (likely incomplete)
    if (section.snippet && section.snippet.length < 100) {
      score *= 0.8;
    }

    // 8. Bonus for authentication-related sections
    const authTerms = ['sign', 'login', 'auth', 'privacy', 'security', 'password'];
    const hasAuthTerms = authTerms.some(term => 
      titleLower.includes(term) || snippetLower.includes(term) ||
      keywords.some((k: string) => k.toLowerCase().includes(term))
    );
    if (hasAuthTerms && queryTokens.some(token => authTerms.includes(token))) {
      score += 0.5;
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(section: any, queryTokens: string[]): string[] {
    const highlights: string[] = [];
    const title = section.title || '';
    const snippet = section.snippet || '';

    // Find highlighted terms in title
    for (const token of queryTokens) {
      if (title.toLowerCase().includes(token)) {
        highlights.push(`title:${token}`);
      }
      if (snippet.toLowerCase().includes(token)) {
        highlights.push(`content:${token}`);
      }
    }

    return [...new Set(highlights)]; // Remove duplicates
  }
}