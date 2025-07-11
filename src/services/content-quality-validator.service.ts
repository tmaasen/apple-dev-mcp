/**
 * ContentQualityValidatorService
 * 
 * Validates content quality and monitors extraction success rates
 * to ensure compliance with the 95%+ real content SLA.
 */

import type { 
  HIGSection, 
  ContentQualityMetrics, 
  QualityValidationResult, 
  ExtractionStatistics
} from '../types.js';
import type { IContentQualityValidator, IExtractionMonitor } from '../interfaces/content-interfaces.js';

export interface ValidationThresholds {
  minQualityScore: number;
  minConfidence: number;
  minContentLength: number;
  maxFallbackRate: number; // Percentage
  minStructureScore: number;
  minAppleTermsScore: number;
}

export interface QualityReport {
  summary: {
    totalValidated: number;
    passedValidation: number;
    failedValidation: number;
    overallScore: number;
    slaCompliance: boolean;
  };
  issues: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
  recommendations: string[];
  detailedMetrics: ExtractionStatistics;
}

export class ContentQualityValidatorService implements IContentQualityValidator, IExtractionMonitor {
  private validatedSections: Map<string, QualityValidationResult> = new Map();
  private extractionHistory: Array<{ section: HIGSection; quality: ContentQualityMetrics; timestamp: Date }> = [];
  private thresholds: ValidationThresholds;

  constructor(customThresholds?: Partial<ValidationThresholds>) {
    this.thresholds = {
      minQualityScore: 0.5,
      minConfidence: 0.4,
      minContentLength: 200,
      maxFallbackRate: 5, // 5% max fallback usage for 95% SLA
      minStructureScore: 0.2,
      minAppleTermsScore: 0.1,
      ...customThresholds
    };
  }

  /**
   * Validate content quality against established thresholds
   */
  async validateContent(content: string, section: HIGSection): Promise<QualityValidationResult> {
    const sectionId = section.id;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Basic content validation
    if (!content || content.trim().length === 0) {
      issues.push('Content is empty or null');
      return this.createValidationResult(false, 0, 0, issues, recommendations, sectionId);
    }

    // Calculate content metrics if not provided
    let quality: ContentQualityMetrics;
    if (section.quality) {
      quality = section.quality;
    } else {
      // Basic quality calculation for content without metrics
      quality = this.calculateBasicQuality(content, section);
    }

    // Validate against thresholds
    const validationChecks = [
      this.validateQualityScore(quality, issues, recommendations),
      this.validateConfidence(quality, issues, recommendations),
      this.validateContentLength(quality, issues, recommendations),
      this.validateStructure(quality, issues, recommendations),
      this.validateAppleTerms(quality, issues, recommendations),
      this.validateFallbackContent(quality, issues, recommendations)
    ];

    const passedChecks = validationChecks.filter(check => check).length;
    const isValid = passedChecks >= 4; // At least 4 out of 6 checks must pass
    const validationScore = passedChecks / validationChecks.length;

    const result = this.createValidationResult(
      isValid, 
      validationScore, 
      quality.confidence, 
      issues, 
      recommendations,
      sectionId
    );

    // Store validation result
    this.validatedSections.set(sectionId, result);
    
    return result;
  }

  /**
   * Calculate quality score for content without existing metrics
   */
  calculateQualityScore(content: string): number {
    if (!content) return 0;

    let score = 0;
    const contentLower = content.toLowerCase();

    // Length score (0-0.3)
    score += Math.min(content.length / 2000, 1) * 0.3;

    // Apple terms score (0-0.3)
    const appleTerms = ['apple', 'ios', 'macos', 'interface', 'design', 'guidelines'];
    const foundTerms = appleTerms.filter(term => contentLower.includes(term)).length;
    score += (foundTerms / appleTerms.length) * 0.3;

    // Structure score (0-0.2)
    const headings = (content.match(/^#+\s/gm) || []).length;
    score += Math.min(headings / 5, 1) * 0.2;

    // Content richness (0-0.2)
    if (content.includes('```') || content.includes('`')) score += 0.1; // Has code
    if (content.includes('![') || content.includes('<img')) score += 0.1; // Has images

    return Math.min(score, 1.0);
  }

  /**
   * Check if content meets high quality standards
   */
  isHighQualityContent(metrics: ContentQualityMetrics): boolean {
    return (
      metrics.score >= this.thresholds.minQualityScore &&
      metrics.confidence >= this.thresholds.minConfidence &&
      metrics.length >= this.thresholds.minContentLength &&
      !metrics.isFallbackContent &&
      metrics.structureScore >= this.thresholds.minStructureScore
    );
  }

  /**
   * Record extraction for monitoring
   */
  recordExtraction(section: HIGSection, quality: ContentQualityMetrics): void {
    this.extractionHistory.push({
      section,
      quality,
      timestamp: new Date()
    });

    // Keep only last 1000 extractions for memory management
    if (this.extractionHistory.length > 1000) {
      this.extractionHistory = this.extractionHistory.slice(-1000);
    }
  }

  /**
   * Get current extraction statistics
   */
  getStatistics(): ExtractionStatistics {
    if (this.extractionHistory.length === 0) {
      return {
        totalSections: 0,
        successfulExtractions: 0,
        fallbackUsage: 0,
        averageQuality: 0,
        averageConfidence: 0,
        extractionSuccessRate: 0
      };
    }

    const totalSections = this.extractionHistory.length;
    const fallbackUsage = this.extractionHistory.filter(
      entry => entry.quality.isFallbackContent || entry.quality.extractionMethod === 'fallback'
    ).length;
    
    const successfulExtractions = totalSections - fallbackUsage;
    const extractionSuccessRate = (successfulExtractions / totalSections) * 100;
    
    const avgQuality = this.extractionHistory.reduce(
      (sum, entry) => sum + entry.quality.score, 0
    ) / totalSections;
    
    const avgConfidence = this.extractionHistory.reduce(
      (sum, entry) => sum + entry.quality.confidence, 0
    ) / totalSections;

    return {
      totalSections,
      successfulExtractions,
      fallbackUsage,
      averageQuality: avgQuality,
      averageConfidence: avgConfidence,
      extractionSuccessRate
    };
  }

  /**
   * Generate comprehensive quality report
   */
  generateReport(): string {
    const stats = this.getStatistics();
    const validationResults = Array.from(this.validatedSections.values());
    
    const passedValidation = validationResults.filter(r => r.isValid).length;
    const totalValidated = validationResults.length;
    const overallScore = totalValidated > 0 ? passedValidation / totalValidated : 0;
    const slaCompliance = stats.extractionSuccessRate >= 95;

    const report = this.generateQualityReport(stats, {
      totalValidated,
      passedValidation,
      failedValidation: totalValidated - passedValidation,
      overallScore,
      slaCompliance
    });

    return this.formatQualityReport(report);
  }

  // Private helper methods

  private calculateBasicQuality(content: string, _section: HIGSection): ContentQualityMetrics {
    const score = this.calculateQualityScore(content);
    const isFallbackContent = this.detectFallbackContent(content);
    
    return {
      score,
      length: content.length,
      structureScore: Math.min((content.match(/^#+\s/gm) || []).length / 5, 1),
      appleTermsScore: score * 0.3, // Approximate
      codeExamplesCount: (content.match(/```/g) || []).length / 2,
      imageReferencesCount: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
      headingCount: (content.match(/^#+\s/gm) || []).length,
      isFallbackContent,
      extractionMethod: isFallbackContent ? 'fallback' : 'crawlee',
      confidence: isFallbackContent ? 0.1 : score
    };
  }

  private detectFallbackContent(content: string): boolean {
    const fallbackIndicators = [
      'this page requires javascript',
      'single page application',
      'content extraction failed',
      'please visit the official documentation',
      'fallback information'
    ];
    
    const contentLower = content.toLowerCase();
    return fallbackIndicators.some(indicator => contentLower.includes(indicator));
  }

  private validateQualityScore(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.score < this.thresholds.minQualityScore) {
      issues.push(`Quality score too low: ${quality.score.toFixed(3)} (min: ${this.thresholds.minQualityScore})`);
      recommendations.push('Review content extraction patterns and selectors');
      return false;
    }
    return true;
  }

  private validateConfidence(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.confidence < this.thresholds.minConfidence) {
      issues.push(`Confidence too low: ${quality.confidence.toFixed(3)} (min: ${this.thresholds.minConfidence})`);
      recommendations.push('Improve extraction accuracy or review source content');
      return false;
    }
    return true;
  }

  private validateContentLength(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.length < this.thresholds.minContentLength) {
      issues.push(`Content too short: ${quality.length} characters (min: ${this.thresholds.minContentLength})`);
      recommendations.push('Verify complete content extraction or check source availability');
      return false;
    }
    return true;
  }

  private validateStructure(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.structureScore < this.thresholds.minStructureScore) {
      issues.push(`Poor content structure: ${quality.structureScore.toFixed(3)} (min: ${this.thresholds.minStructureScore})`);
      recommendations.push('Review heading extraction and content organization');
      return false;
    }
    return true;
  }

  private validateAppleTerms(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.appleTermsScore < this.thresholds.minAppleTermsScore) {
      issues.push(`Insufficient Apple-specific content: ${quality.appleTermsScore.toFixed(3)} (min: ${this.thresholds.minAppleTermsScore})`);
      recommendations.push('Verify extraction from correct Apple HIG pages');
      return false;
    }
    return true;
  }

  private validateFallbackContent(quality: ContentQualityMetrics, issues: string[], recommendations: string[]): boolean {
    if (quality.isFallbackContent) {
      issues.push('Content appears to be fallback/placeholder content');
      recommendations.push('Enable JavaScript execution and review SPA loading');
      return false;
    }
    return true;
  }

  private createValidationResult(
    isValid: boolean,
    score: number,
    confidence: number,
    issues: string[],
    recommendations: string[],
    _sectionId: string
  ): QualityValidationResult {
    return {
      isValid,
      score,
      confidence,
      issues: [...issues],
      recommendations: [...recommendations]
    };
  }

  private generateQualityReport(stats: ExtractionStatistics, summary: any): QualityReport {
    const issues = {
      highPriority: [] as string[],
      mediumPriority: [] as string[],
      lowPriority: [] as string[]
    };

    const recommendations = [] as string[];

    // Analyze SLA compliance
    if (!summary.slaCompliance) {
      issues.highPriority.push(
        `SLA NOT MET: Extraction success rate is ${stats.extractionSuccessRate.toFixed(1)}% (target: ≥95%)`
      );
      recommendations.push('Review Crawlee configuration and Apple website changes');
    }

    // Analyze quality scores
    if (stats.averageQuality < 0.7) {
      issues.mediumPriority.push(
        `Low average quality score: ${stats.averageQuality.toFixed(3)}`
      );
      recommendations.push('Optimize content extraction selectors');
    }

    // Analyze fallback usage
    const fallbackRate = (stats.fallbackUsage / stats.totalSections) * 100;
    if (fallbackRate > this.thresholds.maxFallbackRate) {
      issues.highPriority.push(
        `High fallback usage: ${fallbackRate.toFixed(1)}% (max: ${this.thresholds.maxFallbackRate}%)`
      );
      recommendations.push('Investigate JavaScript execution and page loading issues');
    }

    return {
      summary,
      issues,
      recommendations,
      detailedMetrics: stats
    };
  }

  private formatQualityReport(report: QualityReport): string {
    const { summary, issues, recommendations, detailedMetrics } = report;
    
    let output = `
📊 Content Quality Validation Report
====================================

🎯 SLA Compliance: ${summary.slaCompliance ? '✅ ACHIEVED' : '❌ NOT MET'}
📈 Extraction Success Rate: ${detailedMetrics.extractionSuccessRate.toFixed(1)}%
⭐ Average Quality Score: ${detailedMetrics.averageQuality.toFixed(3)}
🔒 Average Confidence: ${detailedMetrics.averageConfidence.toFixed(3)}
📊 Total Sections: ${detailedMetrics.totalSections}
🔄 Fallback Usage: ${detailedMetrics.fallbackUsage} (${(detailedMetrics.fallbackUsage / detailedMetrics.totalSections * 100).toFixed(1)}%)

📋 Validation Summary:
   • Total Validated: ${summary.totalValidated}
   • Passed Validation: ${summary.passedValidation}
   • Failed Validation: ${summary.failedValidation}
   • Overall Validation Score: ${(summary.overallScore * 100).toFixed(1)}%

`;

    if (issues.highPriority.length > 0) {
      output += `🚨 High Priority Issues:\n`;
      issues.highPriority.forEach(issue => output += `   • ${issue}\n`);
      output += '\n';
    }

    if (issues.mediumPriority.length > 0) {
      output += `⚠️ Medium Priority Issues:\n`;
      issues.mediumPriority.forEach(issue => output += `   • ${issue}\n`);
      output += '\n';
    }

    if (issues.lowPriority.length > 0) {
      output += `ℹ️ Low Priority Issues:\n`;
      issues.lowPriority.forEach(issue => output += `   • ${issue}\n`);
      output += '\n';
    }

    if (recommendations.length > 0) {
      output += `💡 Recommendations:\n`;
      recommendations.forEach(rec => output += `   • ${rec}\n`);
      output += '\n';
    }

    if (summary.slaCompliance) {
      output += `✅ Congratulations! The system is meeting the 95%+ real content SLA target.\n`;
    } else {
      output += `🔧 Action Required: System is not meeting the 95%+ real content SLA target.\n`;
    }

    return output;
  }
}