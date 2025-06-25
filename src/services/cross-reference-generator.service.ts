/**
 * Cross Reference Generator Service
 * Single Responsibility: Generate cross-references between sections
 */

import { ICrossReferenceGenerator } from '../interfaces/content-interfaces.js';
import { HIGSection } from '../types.js';

export class CrossReferenceGeneratorService implements ICrossReferenceGenerator {
  private sections: HIGSection[] = [];
  private crossReferences: Record<string, any> = {};

  addSection(section: HIGSection): void {
    this.sections.push(section);
  }

  generateReferences(): Record<string, any> {
    this.crossReferences = {};

    for (const section of this.sections) {
      const related = this.findRelatedSections(section);
      const backlinks = this.findBacklinks(section);
      const tags = this.generateTags(section);

      this.crossReferences[section.id] = {
        relatedSections: related,
        backlinks,
        tags
      };
    }

    // Generate backlinks in a second pass
    this.generateBacklinks();

    return { ...this.crossReferences };
  }

  clear(): void {
    this.sections = [];
    this.crossReferences = {};
  }

  private findRelatedSections(section: HIGSection): string[] {
    return this.sections
      .filter(s => s.id !== section.id)
      .filter(s => s.platform === section.platform || s.category === section.category)
      .map(s => s.id)
      .slice(0, 5); // Limit to top 5
  }

  private findBacklinks(section: HIGSection): string[] {
    return this.sections
      .filter(s => s.id !== section.id)
      .filter(s => (s.content || '').toLowerCase().includes(section.title.toLowerCase()))
      .map(s => s.id);
  }

  private generateTags(section: HIGSection): string[] {
    const tags: string[] = [section.platform, section.category];
    
    const title = section.title.toLowerCase();
    if (title.includes('button')) tags.push('controls', 'interaction');
    if (title.includes('navigation')) tags.push('navigation-ui', 'hierarchy');
    if (title.includes('color')) tags.push('visual-design', 'theming');
    if (title.includes('typography')) tags.push('text', 'fonts');
    if (title.includes('icon')) tags.push('visual-elements');
    if (title.includes('accessibility')) tags.push('a11y');
    
    return [...new Set(tags)];
  }

  private generateBacklinks(): void {
    for (const [sectionId, refs] of Object.entries(this.crossReferences)) {
      refs.relatedSections.forEach((relatedId: string) => {
        if (this.crossReferences[relatedId]) {
          if (!this.crossReferences[relatedId].backlinks.includes(sectionId)) {
            this.crossReferences[relatedId].backlinks.push(sectionId);
          }
        }
      });
    }
  }
}