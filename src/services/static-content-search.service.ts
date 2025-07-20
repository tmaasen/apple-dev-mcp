/**
 * Static Content Search Service
 * 
 * Provides fast, relevant search results from pre-generated static content
 * with intelligent snippet extraction and relevance scoring.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { FileSystemService } from './content/file-system.service.js';
import type { SearchIndexEntry } from './content/search-indexer.service.js';
import type { SearchResult, ApplePlatform, HIGCategory } from '../types.js';

export class StaticContentSearchService {
  private fileSystem: FileSystemService;
  private searchIndex: SearchIndexEntry[] = [];
  private contentCache = new Map<string, string>();
  private indexLoaded = false;
  private synonymMap = new Map<string, string[]>();
  private contentDirectory: string;

  constructor(contentDirectory?: string) {
    this.fileSystem = new FileSystemService();
    this.contentDirectory = this.resolveContentDirectory(contentDirectory);
    this.initializeSynonymMap();
  }

  /**
   * Resolve content directory path for different installation scenarios
   */
  private resolveContentDirectory(providedPath?: string): string {
    if (providedPath) {
      return path.resolve(providedPath);
    }

    // Determine current directory based on environment
    let currentDir: string;
    
    try {
      // ES Module environment (runtime) - use dynamic import.meta access
      const importMeta = (globalThis as any).import?.meta || (typeof eval !== 'undefined' ? eval('import.meta') : null);
      if (importMeta?.url) {
        const currentFilePath = fileURLToPath(importMeta.url);
        currentDir = path.dirname(currentFilePath);
      } else {
        currentDir = process.cwd();
      }
    } catch {
      // CommonJS environment (tests) or other fallback
      currentDir = process.cwd();
    }

    // Try different possible locations for content directory
    const possiblePaths = [
      // Test environment - relative to project root
      path.resolve(process.cwd(), 'content'),
      // When running from source in dist
      path.resolve(currentDir, '../../content'),
      // When installed as npm package
      path.resolve(currentDir, '../content'),
      // Last resort - relative path
      'content'
    ];

    // Return the first path that exists
    for (const contentPath of possiblePaths) {
      try {
        // Check if this path has the expected structure
        const metadataPath = path.join(contentPath, 'metadata', 'search-index.json');
        if (this.fileSystem.existsSync(metadataPath)) {
          console.log(`📁 Found content directory: ${contentPath}`);
          return contentPath;
        }
      } catch (error) {
        console.log(`❌ Content path failed: ${contentPath} - ${error}`);
        continue;
      }
    }

    // Log all attempted paths for debugging
    console.log('⚠️ No content directory found. Tried:', possiblePaths);
    // Default fallback
    return possiblePaths[0];
  }

  /**
   * Initialize synonym mappings for better search relevance
   */
  private initializeSynonymMap(): void {
    // Basic search and guidelines
    this.synonymMap.set('search', ['searching', 'search field', 'search bar', 'find', 'lookup']);
    this.synonymMap.set('searching', ['search', 'search field', 'search bar', 'find', 'lookup']);
    this.synonymMap.set('guidelines', ['best practices', 'recommendations', 'guidance', 'standards']);
    this.synonymMap.set('best practices', ['guidelines', 'recommendations', 'guidance', 'standards']);
    
    // Interactive elements
    this.synonymMap.set('button', ['btn', 'tap', 'click', 'press', 'action', 'buttons']);
    this.synonymMap.set('toggle', ['switch', 'toggles', 'on off', 'binary control']);
    this.synonymMap.set('switch', ['toggle', 'toggles', 'on off', 'binary control']);
    this.synonymMap.set('picker', ['pickers', 'selection', 'chooser', 'selector', 'segmented picker']);
    this.synonymMap.set('slider', ['sliders', 'range', 'continuous control', 'scrubber']);
    
    // Navigation and layout
    this.synonymMap.set('navigation', ['nav', 'navigate', 'menu', 'hierarchy', 'navigation bar']);
    this.synonymMap.set('tab', ['tabs', 'tab bar', 'tabbed', 'bottom navigation']);
    this.synonymMap.set('stack', ['stacks', 'layout', 'zstack', 'vstack', 'hstack', 'lazy stack']);
    
    // Data presentation
    this.synonymMap.set('progress', ['progress indicator', 'loading', 'spinner', 'activity indicator']);
    this.synonymMap.set('loading', ['progress', 'spinner', 'activity', 'progress indicator']);
    this.synonymMap.set('chart', ['charts', 'graph', 'data visualization', 'charting']);
    this.synonymMap.set('gauge', ['gauges', 'meter', 'measurement', 'dial']);
    
    // Modal and overlays
    this.synonymMap.set('alert', ['alerts', 'dialog', 'modal alert', 'system alert']);
    this.synonymMap.set('action sheet', ['action sheets', 'bottom sheet', 'modal choices']);
    this.synonymMap.set('popover', ['popovers', 'popup', 'contextual menu', 'callout']);
    this.synonymMap.set('sheet', ['sheets', 'modal', 'presentation']);
    
    // Text and input
    this.synonymMap.set('text field', ['text fields', 'input', 'text input', 'form field']);
    this.synonymMap.set('text', ['text field', 'text view', 'label', 'typography']);
    
    // Platform concepts  
    this.synonymMap.set('notification', ['notifications', 'push notification', 'alerts', 'system notification']);
    this.synonymMap.set('onboarding', ['welcome', 'introduction', 'getting started', 'first run']);
    this.synonymMap.set('rating', ['ratings', 'review', 'stars', 'feedback']);
    
    // Technical concepts
    this.synonymMap.set('swiftui', ['swift ui', 'declarative ui', 'view', 'modifier']);
    this.synonymMap.set('uikit', ['ui kit', 'imperative ui', 'view controller']);
    this.synonymMap.set('view', ['views', 'interface', 'ui element', 'component']);
    this.synonymMap.set('task', ['async', 'concurrency', 'background', 'operation']);
    
    // General design
    this.synonymMap.set('interface', ['ui', 'user interface', 'design', 'component']);
    this.synonymMap.set('component', ['element', 'control', 'widget', 'interface']);
    this.synonymMap.set('pattern', ['patterns', 'design pattern', 'interaction']);
    this.synonymMap.set('accessibility', ['a11y', 'voiceover', 'accessible', 'inclusive']);
    this.synonymMap.set('design', ['interface', 'ui', 'visual', 'aesthetic']);
  }

  /**
   * Expand query terms with synonyms for better matching
   */
  private expandQueryWithSynonyms(query: string): string[] {
    const terms = query.split(/\s+/).filter(term => term.length > 1);
    const expanded = new Set([query]); // Always include original query
    
    for (const term of terms) {
      const synonyms = this.synonymMap.get(term);
      if (synonyms) {
        synonyms.forEach(synonym => expanded.add(synonym));
      }
    }
    
    return Array.from(expanded);
  }

  /**
   * Get concept boost for direct concept matches
   */
  private getConceptBoost(query: string, title: string): number {
    // Define concept mappings for direct matches
    const conceptMappings = new Map([
      // Exact plurals and variations
      ['alert', 'alerts'],
      ['alerts', 'alerts'],
      ['action sheet', 'action sheets'],
      ['action sheets', 'action sheets'],
      ['picker', 'pickers'],
      ['pickers', 'pickers'], 
      ['progress indicator', 'progress indicators'],
      ['progress indicators', 'progress indicators'],
      ['notification', 'notifications'],
      ['notifications', 'notifications'],
      ['button', 'buttons'],
      ['buttons', 'buttons'],
      ['tab', 'tab bars'],
      ['tab bar', 'tab bars'],
      ['tabs', 'tab bars'],
      ['search field', 'search fields'],
      ['search fields', 'search fields'],
      
      // Concept variations
      ['progress', 'progress indicators'],
      ['loading', 'progress indicators'],
      ['spinner', 'progress indicators'],
      ['activity indicator', 'progress indicators'],
      ['dialog', 'alerts'],
      ['modal alert', 'alerts'],
      ['bottom sheet', 'action sheets'],
      ['selection', 'pickers'],
      ['chooser', 'pickers'],
      ['push notification', 'notifications'],
      ['system notification', 'notifications']
    ]);

    const expectedTitle = conceptMappings.get(query);
    if (expectedTitle && title.includes(expectedTitle)) {
      return 0.8; // Strong boost for concept matches
    }

    // Check for partial concept matches
    for (const [queryPattern, titlePattern] of conceptMappings) {
      if (query.includes(queryPattern) && title.includes(titlePattern)) {
        return 0.4; // Moderate boost for partial matches
      }
    }

    return 0;
  }

  /**
   * Load search index from generated metadata
   */
  private async loadSearchIndex(): Promise<void> {
    if (this.indexLoaded) return;

    try {
      const indexPath = path.join(this.contentDirectory, 'metadata', 'search-index.json');
      if (await this.fileSystem.exists(indexPath)) {
        const indexData = await this.fileSystem.readFile(indexPath);
        this.searchIndex = JSON.parse(indexData);
        this.indexLoaded = true;
        console.log(`📚 Loaded search index with ${this.searchIndex.length} entries`);
      } else {
        console.warn('⚠️ Search index not found, using empty index');
        this.searchIndex = [];
        this.indexLoaded = true;
      }
    } catch (error) {
      console.error('❌ Failed to load search index:', error);
      this.searchIndex = [];
      this.indexLoaded = true;
    }
  }

  /**
   * Search static content with enhanced relevance scoring
   */
  async searchContent(
    query: string, 
    platform?: ApplePlatform, 
    category?: HIGCategory, 
    limit: number = 3
  ): Promise<SearchResult[]> {
    await this.loadSearchIndex();

    if (this.searchIndex.length === 0) {
      return this.getFallbackResults(query, platform, limit);
    }

    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 1);
    const results: SearchResult[] = [];

    // Search through index entries
    for (const entry of this.searchIndex) {
      let relevanceScore = 0;
      const highlights: string[] = [];

      // Enhanced title matching with multi-term support and concept detection
      const titleLower = entry.title.toLowerCase();
      if (titleLower === queryLower) {
        relevanceScore += 1.0;
        highlights.push(entry.title);
      } else if (titleLower.includes(queryLower)) {
        relevanceScore += 0.6;
        highlights.push(entry.title);
      } else {
        // Check individual query terms in title
        let titleTermMatches = 0;
        for (const term of queryTerms) {
          if (titleLower.includes(term)) {
            titleTermMatches++;
          }
        }
        if (titleTermMatches > 0) {
          relevanceScore += (titleTermMatches / queryTerms.length) * 0.4;
          highlights.push(entry.title);
        }
        
        // Boost exact concept matches (e.g., "alerts" query should strongly match "Alerts" title)
        const conceptBoost = this.getConceptBoost(queryLower, titleLower);
        if (conceptBoost > 0) {
          relevanceScore += conceptBoost;
          highlights.push(entry.title);
        }
      }

      // Enhanced keyword matching with synonym expansion
      const synonymExpansion = this.expandQueryWithSynonyms(queryLower);
      let keywordScore = 0;
      for (const expandedQuery of synonymExpansion) {
        const keywordMatches = entry.keywords.filter(k => {
          const keywordLower = k.toLowerCase();
          return keywordLower.includes(expandedQuery) || expandedQuery.includes(keywordLower);
        });
        if (keywordMatches.length > 0) {
          const exactMatches = entry.keywords.filter(k => k.toLowerCase() === expandedQuery);
          if (exactMatches.length > 0) {
            keywordScore += exactMatches.length * 0.5;
          } else {
            keywordScore += keywordMatches.length * 0.3;
          }
          highlights.push(...keywordMatches);
        }
      }
      relevanceScore += Math.min(keywordScore, 0.8); // Cap keyword score

      // Enhanced snippet matching with term-based scoring
      const snippetLower = entry.snippet.toLowerCase();
      if (snippetLower.includes(queryLower)) {
        relevanceScore += 0.4;
      } else {
        // Score based on individual term matches in snippet
        let snippetTermMatches = 0;
        for (const term of queryTerms) {
          if (snippetLower.includes(term)) {
            snippetTermMatches++;
          }
        }
        if (snippetTermMatches > 0) {
          relevanceScore += (snippetTermMatches / queryTerms.length) * 0.3;
        }
      }

      // Content quality bonuses (prioritize actionable guidance)
      if (entry.hasGuidelines) {
        relevanceScore += 0.2; // Guidelines are highly valuable
      }
      
      if (entry.hasSpecifications) {
        relevanceScore += 0.15; // Specifications provide concrete values
      }
      
      if (entry.hasExamples) {
        relevanceScore += 0.1; // Examples help implementation
      }
      
      if (entry.hasStructuredContent) {
        relevanceScore += 0.05; // Well-structured content is easier to use
      }

      // Quality score bonus (0-1 scale, so weight it appropriately)
      if (entry.quality && entry.quality.score) {
        relevanceScore += entry.quality.score * 0.3; // Up to 0.3 bonus for high quality
      }

      // Apply filters
      if (platform && platform !== 'universal' && entry.platform !== platform && entry.platform !== 'universal') {
        continue;
      }

      if (category && entry.category !== category) {
        continue;
      }

      // Only include relevant results (lowered threshold for better recall)
      if (relevanceScore > 0.08) {
        // Get full content instead of snippet
        const fullContent = await this.getFullContent(entry);
        
        results.push({
          id: entry.id,
          title: entry.title,
          url: entry.url,
          platform: entry.platform as ApplePlatform,
          category: entry.category as HIGCategory,
          relevanceScore,
          content: fullContent,
          type: this.determineType(entry),
          highlights: highlights.slice(0, 3) // Limit highlights
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get full content for an entry
   */
  private async getFullContent(entry: SearchIndexEntry): Promise<string> {
    try {
      const contentPath = this.getContentPath(entry);
      if (await this.fileSystem.exists(contentPath)) {
        return await this.loadContent(contentPath);
      }

      return entry.snippet || `# ${entry.title}\n\nContent not available.`;
    } catch {
      return entry.snippet || `# ${entry.title}\n\nContent unavailable.`;
    }
  }


  /**
   * Load content from file with caching
   */
  private async loadContent(contentPath: string): Promise<string> {
    if (this.contentCache.has(contentPath)) {
      const cached = this.contentCache.get(contentPath);
      return cached || '';
    }

    try {
      const content = await this.fileSystem.readFile(contentPath);
      // Extract content after front matter
      const contentStart = content.indexOf('---\n', 4);
      const actualContent = contentStart > 0 ? content.slice(contentStart + 4) : content;
      
      this.contentCache.set(contentPath, actualContent);
      return actualContent;
    } catch {
      return '';
    }
  }

  /**
   * Get content file path for an index entry
   */
  private getContentPath(entry: SearchIndexEntry): string {
    if (entry.platform === 'universal') {
      return path.join(this.contentDirectory, 'universal', entry.filename);
    } else {
      const platformDir = entry.platform.toLowerCase();
      return path.join(this.contentDirectory, 'platforms', platformDir, entry.filename);
    }
  }

  /**
   * Determine result type based on entry
   */
  private determineType(entry: SearchIndexEntry): 'section' | 'component' | 'guideline' {
    if (entry.hasGuidelines) return 'guideline';
    if (entry.title.toLowerCase().includes('button') || 
        entry.title.toLowerCase().includes('picker') ||
        entry.title.toLowerCase().includes('slider')) {
      return 'component';
    }
    return 'section';
  }

  /**
   * Fallback results when no search index is available
   */
  private getFallbackResults(query: string, platform?: ApplePlatform, limit: number = 3): SearchResult[] {
    const queryLower = query.toLowerCase();
    const fallbackItems = [
      {
        id: 'accessibility-fallback',
        title: 'Accessibility',
        url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
        platform: 'universal',
        keywords: ['accessibility', 'a11y', 'voiceover', 'contrast', 'guidelines'],
        snippet: 'Accessible user interfaces empower everyone to have a great experience with your app or game. When you design for accessibility, you reach a larger audience and create a more inclusive experience.'
      },
      {
        id: 'buttons-fallback',
        title: 'Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        platform: 'universal',
        keywords: ['button', 'btn', 'interactive', 'touch', 'tap'],
        snippet: 'Buttons initiate app-specific actions, have customizable backgrounds, and can include a title or an icon. The minimum touch target size is 44pt x 44pt.'
      },
      {
        id: 'navigation-fallback',
        title: 'Navigation',
        url: 'https://developer.apple.com/design/human-interface-guidelines/navigation-bars',
        platform: 'universal',
        keywords: ['navigation', 'nav', 'hierarchy', 'menu'],
        snippet: 'A navigation bar appears at the top of an app screen, enabling navigation through a hierarchy of content.'
      }
    ];

    const results: SearchResult[] = [];
    
    for (const item of fallbackItems) {
      let relevanceScore = 0;
      
      if (item.title.toLowerCase().includes(queryLower)) relevanceScore += 0.8;
      if (item.keywords.some(k => k.includes(queryLower) || queryLower.includes(k))) relevanceScore += 0.6;
      if (item.snippet.toLowerCase().includes(queryLower)) relevanceScore += 0.4;
      
      if (relevanceScore > 0) {
        results.push({
          id: item.id,
          title: item.title,
          url: item.url,
          platform: item.platform as ApplePlatform,
          relevanceScore,
          content: item.snippet, // Use snippet as basic content for fallback
          type: 'guideline'
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Check if static content is available
   */
  async isContentAvailable(): Promise<boolean> {
    const indexPath = path.join(this.contentDirectory, 'metadata', 'search-index.json');
    return await this.fileSystem.exists(indexPath);
  }

  /**
   * Get content statistics
   */
  async getContentStats(): Promise<{ sections: number; totalSize: string }> {
    await this.loadSearchIndex();
    const totalSize = await this.fileSystem.calculateDirectorySize(this.contentDirectory);
    return {
      sections: this.searchIndex.length,
      totalSize: `${Math.round(totalSize / 1024)}KB`
    };
  }
}