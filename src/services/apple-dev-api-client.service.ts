/**
 * Apple Developer Documentation API Client
 * 
 * Direct API access to Apple's developer documentation at developer.apple.com/tutorials/data
 * Adapted from MightyDillah's apple-doc-mcp with enhancements for HIG integration
 */

import axios from 'axios';
import type { HIGCache } from '../cache.js';
import type { FrameworkInfo } from '../types.js';

const BASE_URL = 'https://developer.apple.com/tutorials/data';

const HEADERS = {
  'User-Agent': 'Apple-Dev-MCP (Development Purpose)',
  'Referer': 'https://developer.apple.com/documentation',
  'DNT': '1'
};

export interface Technology {
  title: string;
  abstract: { text: string; type: string }[];
  url: string;
  kind: string;
  role: string;
  identifier: string;
}

export interface TopicSection {
  title: string;
  identifiers: string[];
  anchor?: string;
}

export interface FrameworkData {
  metadata: {
    title: string;
    role: string;
    platforms: any[];
  };
  abstract: { text: string; type: string }[];
  topicSections: TopicSection[];
  references: Record<string, any>;
}

export interface SymbolData {
  metadata: {
    title: string;
    symbolKind: string;
    platforms: any[];
  };
  abstract: { text: string; type: string }[];
  primaryContentSections: any[];
  topicSections: TopicSection[];
  references: Record<string, any>;
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

export class AppleDevAPIClient {
  private cache: HIGCache;
  private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour cache for API content

  constructor(cache: HIGCache) {
    this.cache = cache;
  }

  private async makeRequest<T>(url: string): Promise<T> {
    const cacheKey = `api:${url}`;
    
    // Check cache first
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(url, { 
        headers: HEADERS,
        timeout: 15000 // 15 second timeout
      });
      
      // Cache the result for 1 hour
      this.cache.set(cacheKey, response.data, this.cacheTimeout / 1000);
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch technical documentation: ${error}`);
    }
  }

  async getTechnologies(): Promise<Record<string, Technology>> {
    const url = `${BASE_URL}/documentation/technologies.json`;
    const data = await this.makeRequest<any>(url);
    return data.references || {};
  }

  async getFramework(frameworkName: string): Promise<FrameworkData> {
    const url = `${BASE_URL}/documentation/${frameworkName}.json`;
    return await this.makeRequest<FrameworkData>(url);
  }

  async getSymbol(path: string): Promise<SymbolData> {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${BASE_URL}/${cleanPath}.json`;
    return await this.makeRequest<SymbolData>(url);
  }

  /**
   * Get technical documentation for a symbol with enhanced formatting
   */
  async getTechnicalDocumentation(path: string): Promise<TechnicalDocumentation> {
    const symbolData = await this.getSymbol(path);
    
    const id = path.replace(/[^a-zA-Z0-9]/g, '_');
    const framework = this.extractFrameworkFromPath(path);
    const abstract = this.extractText(symbolData.abstract);
    const codeExamples = this.extractCodeExamples(symbolData);
    const relatedSymbols = this.extractRelatedSymbols(symbolData);
    
    return {
      id,
      symbol: symbolData.metadata.title,
      framework,
      symbolKind: symbolData.metadata.symbolKind,
      platforms: this.formatPlatformList(symbolData.metadata.platforms),
      abstract,
      apiReference: this.generateAPIReference(symbolData),
      codeExamples,
      relatedSymbols,
      url: `https://developer.apple.com/${path}`,
      lastUpdated: new Date()
    };
  }

  /**
   * Search across all frameworks with enhanced relevance scoring
   */
  async searchGlobal(query: string, options: {
    symbolType?: string;
    platform?: string;
    maxResults?: number;
    includeRelevanceScore?: boolean;
  } = {}): Promise<TechnicalSearchResult[]> {
    const { maxResults = 50, includeRelevanceScore = true } = options;
    const results: TechnicalSearchResult[] = [];
    
    try {
      const technologies = await this.getTechnologies();
      const frameworks = Object.values(technologies).filter(
        tech => tech.kind === 'symbol' && tech.role === 'collection'
      );

      // Use top frameworks to avoid API abuse
      const searchFrameworks = frameworks.slice(0, 20);

      for (const framework of searchFrameworks) {
        if (results.length >= maxResults) break;
        
        try {
          const frameworkResults = await this.searchFramework(framework.title, query, {
            symbolType: options.symbolType,
            platform: options.platform,
            maxResults: Math.ceil(maxResults / 4),
            includeRelevanceScore
          });
          results.push(...frameworkResults);
        } catch {
          // Fall through to fallback
        }
      }

      return results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, maxResults);
    } catch (error) {
      throw new Error(`Global technical search failed: ${error}`);
    }
  }

  /**
   * Search within a specific framework
   */
  async searchFramework(frameworkName: string, query: string, options: {
    symbolType?: string;
    platform?: string;
    maxResults?: number;
    includeRelevanceScore?: boolean;
  } = {}): Promise<TechnicalSearchResult[]> {
    const { maxResults = 20, includeRelevanceScore = true } = options;
    const results: TechnicalSearchResult[] = [];
    
    try {
      const framework = await this.getFramework(frameworkName);
      const searchPattern = this.createSearchPattern(query);
      
      Object.entries(framework.references).forEach(([_id, ref]) => {
        if (results.length >= maxResults) return;
        
        if (this.matchesSearch(ref, searchPattern, options)) {
          const relevanceScore = includeRelevanceScore 
            ? this.calculateRelevanceScore(ref, query)
            : 1.0;
            
          results.push({
            title: ref.title,
            description: this.extractText(ref.abstract || []),
            path: ref.url,
            framework: frameworkName,
            symbolKind: ref.kind,
            platforms: this.formatPlatforms(ref.platforms || framework.metadata?.platforms),
            url: `https://developer.apple.com${ref.url}`,
            relevanceScore,
            type: 'technical'
          });
        }
      });

      return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      throw new Error(`Framework search failed for ${frameworkName}: ${error}`);
    }
  }

  /**
   * Get list of available frameworks
   */
  async getFrameworkList(): Promise<{ name: string; description: string; platforms: string[] }[]> {
    const technologies = await this.getTechnologies();
    const frameworks = Object.values(technologies).filter(
      tech => tech.kind === 'symbol' && tech.role === 'collection'
    );

    return frameworks.map(framework => ({
      name: framework.title,
      description: this.extractText(framework.abstract),
      platforms: [] // Platform info would need to be fetched per framework
    }));
  }

  /**
   * Check if a path exists in Apple's documentation
   */
  async pathExists(path: string): Promise<boolean> {
    try {
      await this.getSymbol(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get framework information by name
   */
  async getFrameworkInfo(frameworkName: string): Promise<FrameworkInfo> {
    const framework = await this.getFramework(frameworkName);
    
    return {
      name: framework.metadata.title,
      description: this.extractText(framework.abstract),
      platforms: this.formatPlatformList(framework.metadata.platforms),
      topicSections: framework.topicSections.map(section => section.title),
      url: `https://developer.apple.com/documentation/${frameworkName.toLowerCase()}`
    };
  }

  // Helper methods
  private createSearchPattern(query: string): RegExp {
    // Convert wildcard pattern to regex
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
    return new RegExp(pattern, 'i');
  }

  private matchesSearch(ref: any, pattern: RegExp, options: { symbolType?: string; platform?: string }): boolean {
    if (!ref.title) return false;
    
    // Title match
    if (!pattern.test(ref.title)) return false;
    
    // Symbol type filter
    if (options.symbolType && ref.kind !== options.symbolType) return false;
    
    // Platform filter
    if (options.platform && ref.platforms) {
      const hasPlat = ref.platforms.some((p: any) => 
        p.name?.toLowerCase().includes(options.platform.toLowerCase())
      );
      if (!hasPlat) return false;
    }
    
    return true;
  }

  private calculateRelevanceScore(ref: any, query: string): number {
    const title = ref.title?.toLowerCase() || '';
    const queryLower = query.replace(/\*/g, '').toLowerCase();
    
    if (title === queryLower) return 1.0; // Exact match
    if (title.startsWith(queryLower)) return 0.9; // Prefix match
    if (title.includes(queryLower)) return 0.7; // Contains match
    return 0.5; // Pattern match
  }

  private extractFrameworkFromPath(path: string): string {
    const match = path.match(/^(?:documentation\/)?([^/]+)/);
    return match ? match[1] : 'Unknown';
  }

  private extractCodeExamples(symbolData: SymbolData): string[] {
    const examples: string[] = [];
    
    // Extract from primary content sections
    if (symbolData.primaryContentSections) {
      for (const section of symbolData.primaryContentSections) {
        if (section.kind === 'code' && section.code) {
          examples.push(section.code);
        }
      }
    }
    
    return examples;
  }

  private extractRelatedSymbols(symbolData: SymbolData): string[] {
    const related: string[] = [];
    
    // Extract from topic sections
    if (symbolData.topicSections) {
      for (const section of symbolData.topicSections) {
        if (section.identifiers) {
          for (const identifier of section.identifiers.slice(0, 3)) {
            const ref = symbolData.references?.[identifier];
            if (ref && ref.title) {
              related.push(ref.title);
            }
          }
        }
      }
    }
    
    return related.slice(0, 5); // Limit to 5 related symbols
  }

  private generateAPIReference(symbolData: SymbolData): string {
    let reference = `# ${symbolData.metadata.title}\n\n`;
    
    if (symbolData.metadata.symbolKind) {
      reference += `**Type:** ${symbolData.metadata.symbolKind}\n`;
    }
    
    if (symbolData.metadata.platforms) {
      reference += `**Platforms:** ${this.formatPlatforms(symbolData.metadata.platforms)}\n\n`;
    }
    
    if (symbolData.abstract) {
      reference += `## Overview\n${this.extractText(symbolData.abstract)}\n\n`;
    }
    
    return reference;
  }

  extractText(abstract: { text: string; type: string }[]): string {
    return abstract?.map(item => item.text).join('') || '';
  }

  private formatPlatforms(platforms: any[]): string {
    if (!platforms || platforms.length === 0) return 'All platforms';
    return platforms
      .map(p => `${p.name} ${p.introducedAt}+${p.beta ? ' (Beta)' : ''}`)
      .join(', ');
  }

  private formatPlatformList(platforms: any[]): string[] {
    if (!platforms || platforms.length === 0) return [];
    return platforms.map(p => p.name || '').filter(Boolean);
  }
}