/**
 * Wildcard Search Service
 * 
 * Provides advanced wildcard pattern matching for both HIG and technical documentation
 * Phase 2: Enhanced search patterns with * and ? wildcards
 */

export interface WildcardPattern {
  pattern: string;
  isWildcard: boolean;
  regex: RegExp;
  originalQuery: string;
}

export interface WildcardMatch {
  text: string;
  score: number;
  matchedSegments: string[];
  fullMatch: boolean;
}

export class WildcardSearchService {
  /**
   * Parse query for wildcard patterns
   */
  parseWildcardPattern(query: string): WildcardPattern {
    const hasWildcards = query.includes('*') || query.includes('?');
    
    if (!hasWildcards) {
      // No wildcards, return simple case-insensitive regex
      const escapedQuery = this.escapeRegexSpecialChars(query);
      return {
        pattern: query,
        isWildcard: false,
        regex: new RegExp(escapedQuery, 'i'),
        originalQuery: query
      };
    }

    // Convert wildcard pattern to regex
    const regexPattern = this.wildcardToRegex(query);
    
    return {
      pattern: regexPattern,
      isWildcard: true,
      regex: new RegExp(regexPattern, 'i'),
      originalQuery: query
    };
  }

  /**
   * Convert wildcard pattern to regex
   * * matches any sequence of characters
   * ? matches any single character
   */
  private wildcardToRegex(pattern: string): string {
    // Escape regex special characters except * and ?
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert wildcards to regex
    escaped = escaped.replace(/\*/g, '.*');  // * becomes .*
    escaped = escaped.replace(/\?/g, '.');   // ? becomes .
    
    // Anchor the pattern for more precise matching
    return `^${escaped}$`;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegexSpecialChars(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Test if text matches wildcard pattern
   */
  matchesPattern(text: string, pattern: WildcardPattern): WildcardMatch {
    const match = pattern.regex.test(text);
    
    if (!match) {
      return {
        text,
        score: 0,
        matchedSegments: [],
        fullMatch: false
      };
    }

    // Calculate match quality
    const score = this.calculateWildcardScore(text, pattern);
    const matchedSegments = this.extractMatchedSegments(text, pattern);
    
    return {
      text,
      score,
      matchedSegments,
      fullMatch: match
    };
  }

  /**
   * Calculate relevance score for wildcard matches
   */
  private calculateWildcardScore(text: string, pattern: WildcardPattern): number {
    if (!pattern.isWildcard) {
      // Simple text matching score
      const textLower = text.toLowerCase();
      const queryLower = pattern.originalQuery.toLowerCase();
      
      if (textLower === queryLower) return 1.0;           // Exact match
      if (textLower.startsWith(queryLower)) return 0.9;   // Prefix match
      if (textLower.includes(queryLower)) return 0.7;     // Contains match
      return 0.5;                                         // Regex match
    }

    // Wildcard scoring
    let score = 0.6; // Base score for wildcard matches
    
    // Bonus for fewer wildcards (more specific patterns)
    const wildcardCount = (pattern.originalQuery.match(/[*?]/g) || []).length;
    const specificityBonus = Math.max(0, (5 - wildcardCount) * 0.1);
    score += specificityBonus;
    
    // Bonus for pattern length (longer patterns are more specific)
    const lengthBonus = Math.min(0.2, pattern.originalQuery.length * 0.01);
    score += lengthBonus;
    
    // Penalty for very long matches with simple patterns
    if (wildcardCount >= 2 && text.length > pattern.originalQuery.length * 3) {
      score -= 0.1;
    }
    
    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Extract segments that matched the pattern
   */
  private extractMatchedSegments(text: string, pattern: WildcardPattern): string[] {
    if (!pattern.isWildcard) {
      return text.match(pattern.regex) || [];
    }

    // For wildcard patterns, try to identify the static parts
    const staticParts = pattern.originalQuery.split(/[*?]+/).filter(part => part.length > 0);
    const segments: string[] = [];
    
    for (const part of staticParts) {
      if (text.toLowerCase().includes(part.toLowerCase())) {
        segments.push(part);
      }
    }
    
    return segments;
  }

  /**
   * Advanced pattern matching with multiple criteria
   */
  searchWithWildcards<T extends { title: string; [key: string]: any }>(
    items: T[],
    query: string,
    searchFields: (keyof T)[] = ['title' as keyof T],
    options: {
      caseSensitive?: boolean;
      wholeWordMatch?: boolean;
      maxResults?: number;
      minScore?: number;
    } = {}
  ): Array<T & { wildcardMatch: WildcardMatch }> {
    const {
      caseSensitive = false,
      wholeWordMatch = false,
      maxResults = 50,
      minScore = 0.1
    } = options;

    const pattern = this.parseWildcardPattern(query);
    
    // Adjust regex for case sensitivity and word matching
    if (!caseSensitive && pattern.regex.flags !== 'i') {
      pattern.regex = new RegExp(pattern.regex.source, 'i');
    }
    
    if (wholeWordMatch) {
      pattern.regex = new RegExp(`\\b${pattern.regex.source}\\b`, pattern.regex.flags);
    }

    const results: Array<T & { wildcardMatch: WildcardMatch }> = [];

    for (const item of items) {
      let bestMatch: WildcardMatch | null = null;
      
      // Check each specified field
      for (const field of searchFields) {
        const fieldValue = String(item[field] || '');
        const match = this.matchesPattern(fieldValue, pattern);
        
        if (match.score > 0 && (!bestMatch || match.score > bestMatch.score)) {
          bestMatch = match;
        }
      }

      if (bestMatch && bestMatch.score >= minScore) {
        results.push({
          ...item,
          wildcardMatch: bestMatch
        });
      }
    }

    // Sort by relevance score and limit results
    return results
      .sort((a, b) => b.wildcardMatch.score - a.wildcardMatch.score)
      .slice(0, maxResults);
  }

  /**
   * Highlight matched segments in text
   */
  highlightMatches(text: string, pattern: WildcardPattern, highlightStart = '**', highlightEnd = '**'): string {
    if (!pattern.isWildcard) {
      // Simple text highlighting
      const query = pattern.originalQuery;
      const regex = new RegExp(`(${this.escapeRegexSpecialChars(query)})`, 'gi');
      return text.replace(regex, `${highlightStart}$1${highlightEnd}`);
    }

    // Wildcard highlighting - highlight static parts
    const staticParts = pattern.originalQuery
      .split(/[*?]+/)
      .filter(part => part.length > 0)
      .sort((a, b) => b.length - a.length); // Longest first to avoid partial replacements

    let highlighted = text;
    for (const part of staticParts) {
      const regex = new RegExp(`(${this.escapeRegexSpecialChars(part)})`, 'gi');
      highlighted = highlighted.replace(regex, `${highlightStart}$1${highlightEnd}`);
    }

    return highlighted;
  }

  /**
   * Generate example patterns for user guidance
   */
  getPatternExamples(): Array<{ pattern: string; description: string; examples: string[] }> {
    return [
      {
        pattern: 'UI*',
        description: 'Find items starting with "UI"',
        examples: ['UIButton', 'UILabel', 'UIViewController']
      },
      {
        pattern: '*Button',
        description: 'Find items ending with "Button"',
        examples: ['UIButton', 'NSButton', 'ActionButton']
      },
      {
        pattern: '*View*',
        description: 'Find items containing "View"',
        examples: ['UITableView', 'NSView', 'NavigationView']
      },
      {
        pattern: 'NS????',
        description: 'Find NS classes with 4 additional characters',
        examples: ['NSView', 'NSText', 'NSMenu']
      },
      {
        pattern: 'SwiftUI.*',
        description: 'Find SwiftUI components',
        examples: ['SwiftUI.Button', 'SwiftUI.Text', 'SwiftUI.List']
      },
      {
        pattern: '?avigation',
        description: 'Find navigation-related items with any first character',
        examples: ['Navigation', 'navigation']
      }
    ];
  }

  /**
   * Validate wildcard pattern
   */
  validatePattern(pattern: string): { isValid: boolean; error?: string } {
    try {
      this.parseWildcardPattern(pattern);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid pattern'
      };
    }
  }
}