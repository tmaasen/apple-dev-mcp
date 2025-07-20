/**
 * Search Indexer Service
 * 
 * Generates search indices and metadata for static HIG content
 */

import type { HIGSection } from '../../types.js';
import type { ContentQualityMetrics } from './content-processor.service.js';

export interface SearchIndexEntry {
  id: string;
  title: string;
  platform: string;
  category: string;
  url: string;
  filename: string;
  keywords: string[];
  snippet: string;
  quality?: ContentQualityMetrics;
  lastUpdated: string;
  hasStructuredContent: boolean;
  hasGuidelines: boolean;
  hasExamples: boolean;
  hasSpecifications: boolean;
  conceptCount: number;
}

export interface CrossReference {
  fromSection: string;
  toSection: string;
  relationshipType: 'related' | 'parent' | 'child' | 'see-also';
  relevanceScore: number;
}

export interface GenerationInfo {
  generatedAt: string;
  totalSections: number;
  successfulExtractions: number;
  averageQuality: number;
  platforms: string[];
  categories: string[];
  version: string;
}

export class SearchIndexerService {
  private searchIndex: SearchIndexEntry[] = [];
  private crossReferences: CrossReference[] = [];

  /**
   * Generate search index from processed sections
   */
  generateSearchIndex(sections: HIGSection[], processedContent: Map<string, any>): SearchIndexEntry[] {
    console.log('📊 Generating search index...');
    
    this.searchIndex = [];
    
    for (const section of sections) {
      const processed = processedContent.get(section.id);
      if (!processed) continue;

      const entry: SearchIndexEntry = {
        id: section.id,
        title: section.title,
        platform: section.platform,
        category: section.category,
        url: section.url,
        filename: this.generateFilename(section),
        keywords: processed.keywords || [],
        snippet: this.generateSnippet(processed.cleanedMarkdown),
        quality: processed.quality,
        lastUpdated: section.lastUpdated.toISOString(),
        hasStructuredContent: this.hasStructuredContent(processed.cleanedMarkdown),
        hasGuidelines: this.hasGuidelines(processed.cleanedMarkdown),
        hasExamples: this.hasExamples(processed.cleanedMarkdown),
        hasSpecifications: this.hasSpecifications(processed.cleanedMarkdown),
        conceptCount: this.countConcepts(processed.cleanedMarkdown)
      };

      this.searchIndex.push(entry);
    }

    console.log(`📋 Generated search index with ${this.searchIndex.length} entries`);
    return this.searchIndex;
  }

  /**
   * Generate cross-references between sections
   */
  generateCrossReferences(sections: HIGSection[], processedContent: Map<string, any>): CrossReference[] {
    console.log('🔗 Generating cross-references...');
    
    this.crossReferences = [];
    
    for (const section of sections) {
      const processed = processedContent.get(section.id);
      if (!processed?.relatedSections) continue;

      for (const relatedTitle of processed.relatedSections) {
        const relatedSection = sections.find(s => 
          s.title.toLowerCase() === relatedTitle.toLowerCase()
        );
        
        if (relatedSection) {
          this.crossReferences.push({
            fromSection: section.id,
            toSection: relatedSection.id,
            relationshipType: 'related',
            relevanceScore: this.calculateRelevanceScore(section, relatedSection)
          });
        }
      }
    }

    // Add platform-based relationships
    this.addPlatformRelationships(sections);

    // Add category-based relationships  
    this.addCategoryRelationships(sections);

    console.log(`🔗 Generated ${this.crossReferences.length} cross-references`);
    return this.crossReferences;
  }

  /**
   * Generate metadata about the content generation process
   */
  generateMetadata(sections: HIGSection[], processedContent: Map<string, any>): GenerationInfo {
    const successful = Array.from(processedContent.values()).filter(p => p.quality && !p.quality.isFallbackContent).length;
    const totalQuality = Array.from(processedContent.values())
      .filter(p => p.quality)
      .reduce((sum, p) => sum + p.quality.score, 0);
    const avgQuality = totalQuality / processedContent.size;

    const platforms = [...new Set(sections.map(s => s.platform))];
    const categories = [...new Set(sections.map(s => s.category))];

    return {
      generatedAt: new Date().toISOString(),
      totalSections: sections.length,
      successfulExtractions: successful,
      averageQuality: Math.round(avgQuality * 100) / 100,
      platforms,
      categories,
      version: '2.0.0'
    };
  }

  /**
   * Search the index for matching entries
   */
  search(query: string, filters?: {
    platform?: string;
    category?: string;
    minQuality?: number;
  }): SearchIndexEntry[] {
    const queryLower = query.toLowerCase();
    const results = this.searchIndex.filter(entry => {
      // Text matching
      const titleMatch = entry.title.toLowerCase().includes(queryLower);
      const keywordMatch = entry.keywords.some(k => k.includes(queryLower));
      const snippetMatch = entry.snippet.toLowerCase().includes(queryLower);
      
      if (!titleMatch && !keywordMatch && !snippetMatch) {
        return false;
      }

      // Apply filters
      if (filters?.platform && entry.platform !== filters.platform) {
        return false;
      }
      
      if (filters?.category && entry.category !== filters.category) {
        return false;
      }
      
      if (filters?.minQuality && entry.quality && entry.quality.score < filters.minQuality) {
        return false;
      }

      return true;
    });

    // Sort by relevance
    results.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      // Title matches get highest score
      if (a.title.toLowerCase().includes(queryLower)) scoreA += 10;
      if (b.title.toLowerCase().includes(queryLower)) scoreB += 10;
      
      // Keyword matches
      scoreA += a.keywords.filter(k => k.includes(queryLower)).length * 5;
      scoreB += b.keywords.filter(k => k.includes(queryLower)).length * 5;
      
      // Quality bonus
      if (a.quality) scoreA += a.quality.score;
      if (b.quality) scoreB += b.quality.score;
      
      return scoreB - scoreA;
    });

    return results;
  }

  private generateFilename(section: HIGSection): string {
    const slug = section.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${slug}.md`;
  }

  private generateSnippet(content: string): string {
    // Find first substantial paragraph
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    const firstParagraph = paragraphs[0] || content.slice(0, 200);
    
    // Clean markdown formatting
    const cleaned = firstParagraph
      .replace(/^#+\s*/, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // Remove emphasis
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .trim();
    
    return cleaned.length > 200 ? cleaned.slice(0, 200) + '...' : cleaned;
  }

  private hasStructuredContent(content: string): boolean {
    return content.includes('##') && (content.includes('###') || content.includes('####'));
  }

  private hasGuidelines(content: string): boolean {
    const guidelineKeywords = ['should', 'must', 'avoid', 'ensure', 'consider', 'guideline', 'best practice'];
    return guidelineKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private hasExamples(content: string): boolean {
    return content.includes('```') || content.toLowerCase().includes('example');
  }

  private hasSpecifications(content: string): boolean {
    const specKeywords = ['size', 'dimension', 'pixel', 'point', 'pt', 'px', 'minimum', 'maximum'];
    return specKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private countConcepts(content: string): number {
    // Count major headings as concepts
    const headings = content.match(/^#+\s/gm) || [];
    return Math.max(headings.length, 1);
  }

  private calculateRelevanceScore(sectionA: HIGSection, sectionB: HIGSection): number {
    let score = 0;
    
    // Same platform bonus
    if (sectionA.platform === sectionB.platform) score += 0.3;
    
    // Same category bonus
    if (sectionA.category === sectionB.category) score += 0.5;
    
    // Title similarity (basic)
    const wordsA = sectionA.title.toLowerCase().split(' ');
    const wordsB = sectionB.title.toLowerCase().split(' ');
    const commonWords = wordsA.filter(word => wordsB.includes(word)).length;
    score += (commonWords / Math.max(wordsA.length, wordsB.length)) * 0.2;
    
    return Math.min(1.0, score);
  }

  private addPlatformRelationships(sections: HIGSection[]): void {
    // Link universal content to platform-specific versions
    const universalSections = sections.filter(s => s.platform === 'universal');
    const platformSections = sections.filter(s => s.platform !== 'universal');
    
    for (const universal of universalSections) {
      for (const platform of platformSections) {
        if (this.areTopicallySimilar(universal, platform)) {
          this.crossReferences.push({
            fromSection: universal.id,
            toSection: platform.id,
            relationshipType: 'related',
            relevanceScore: 0.6
          });
        }
      }
    }
  }

  private addCategoryRelationships(sections: HIGSection[]): void {
    // Group by category and create relationships
    const categoryGroups = new Map<string, HIGSection[]>();
    
    for (const section of sections) {
      if (!categoryGroups.has(section.category)) {
        categoryGroups.set(section.category, []);
      }
      const categoryList = categoryGroups.get(section.category);
      if (categoryList) {
        categoryList.push(section);
      }
    }
    
    // Add relationships within categories
    for (const [, sectionList] of categoryGroups) {
      for (let i = 0; i < sectionList.length; i++) {
        for (let j = i + 1; j < sectionList.length; j++) {
          const score = this.calculateRelevanceScore(sectionList[i], sectionList[j]);
          if (score > 0.3) {
            this.crossReferences.push({
              fromSection: sectionList[i].id,
              toSection: sectionList[j].id,
              relationshipType: 'related',
              relevanceScore: score
            });
          }
        }
      }
    }
  }

  private areTopicallySimilar(sectionA: HIGSection, sectionB: HIGSection): boolean {
    const titleA = sectionA.title.toLowerCase();
    const titleB = sectionB.title.toLowerCase();
    
    // Check if they share significant words
    const wordsA = titleA.split(' ').filter(w => w.length > 3);
    const wordsB = titleB.split(' ').filter(w => w.length > 3);
    
    return wordsA.some(word => wordsB.includes(word));
  }
}