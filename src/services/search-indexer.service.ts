/**
 * Search Indexer Service
 * Single Responsibility: Generate and manage search indices
 */

import { ISearchIndexer, IContentProcessor } from '../interfaces/content-interfaces.js';
import { HIGSection } from '../types.js';

export class SearchIndexerService implements ISearchIndexer {
  private searchIndex: Record<string, any> = {};

  constructor(private contentProcessor: IContentProcessor) {}

  addSection(section: HIGSection): void {
    if (!section.content) {
      console.warn(`Skipping section ${section.id} - no content available`);
      return;
    }

    const keywords = this.contentProcessor.extractKeywords(section.content, section);
    const snippet = this.contentProcessor.extractSnippet(section.content);

    this.searchIndex[section.id] = {
      id: section.id,
      title: section.title,
      platform: section.platform,
      category: section.category,
      url: section.url,
      keywords,
      snippet
    };
  }

  generateIndex(): Record<string, any> {
    return { ...this.searchIndex };
  }

  clear(): void {
    this.searchIndex = {};
  }

  getIndexSize(): number {
    return Object.keys(this.searchIndex).length;
  }
}