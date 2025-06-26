#!/usr/bin/env node

/**
 * Content Validation Script
 * Validates generated content using Phase 1 quality validation system
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ContentQualityValidatorService } from '../services/content-quality-validator.service.js';
import { ContentProcessorService } from '../services/content-processor.service.js';
import type { HIGSection, ContentQualityMetrics } from '../types.js';

class ContentValidator {
  private qualityValidator: ContentQualityValidatorService;
  private contentProcessor: ContentProcessorService;
  private validationResults: Array<{
    file: string;
    isValid: boolean;
    quality: ContentQualityMetrics;
    issues: string[];
  }> = [];

  constructor() {
    this.qualityValidator = new ContentQualityValidatorService({
      minQualityScore: 0.5,      // Reasonable threshold for generated content
      minConfidence: 0.6,        // Decent confidence requirement
      minContentLength: 200,     // Minimum meaningful content
      maxFallbackRate: 10,       // Allow some fallback content
      minStructureScore: 0.4,    // Basic structure requirement
      minAppleTermsScore: 0.1    // Some Apple terminology expected
    });
    this.contentProcessor = new ContentProcessorService();
  }

  async validateContent(): Promise<void> {
    console.log('🔍 Starting content validation with Phase 1 quality checks...\n');

    const contentDir = 'content';
    
    // Check if content directory exists
    try {
      await fs.access(contentDir);
    } catch {
      console.log('⚠️  Content directory not found - generating content first...');
      console.log('   Run: npm run generate-content');
      process.exit(1);
    }

    // Validate platforms directory
    await this.validatePlatformsDirectory(contentDir);
    
    // Validate metadata
    await this.validateMetadata(contentDir);
    
    // Generate validation report
    this.generateValidationReport();
    
    // Exit with appropriate code
    const hasFailures = this.validationResults.some(r => !r.isValid);
    if (hasFailures) {
      console.log('\n❌ Content validation failed - some files do not meet quality standards');
      process.exit(1);
    } else {
      console.log('\n✅ Content validation passed - all files meet quality standards');
    }
  }

  private async validatePlatformsDirectory(contentDir: string): Promise<void> {
    const platformsDir = path.join(contentDir, 'platforms');
    
    try {
      const platforms = await fs.readdir(platformsDir);
      console.log(`📁 Found ${platforms.length} platform directories: ${platforms.join(', ')}`);
      
      for (const platform of platforms) {
        await this.validatePlatformFiles(platformsDir, platform);
      }
    } catch (error) {
      console.error(`❌ Error reading platforms directory: ${error}`);
      throw error;
    }
  }

  private async validatePlatformFiles(platformsDir: string, platform: string): Promise<void> {
    const platformDir = path.join(platformsDir, platform);
    
    try {
      const files = await fs.readdir(platformDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      console.log(`  📄 ${platform}: ${mdFiles.length} markdown files`);
      
      for (const file of mdFiles) {
        await this.validateMarkdownFile(platformDir, file, platform);
      }
    } catch (error) {
      console.error(`❌ Error reading platform directory ${platform}: ${error}`);
      throw error;
    }
  }

  private async validateMarkdownFile(platformDir: string, filename: string, platform: string): Promise<void> {
    const filePath = path.join(platformDir, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract front matter and content
      const { frontMatter, markdownContent } = this.parseFrontMatter(content);
      
      // Create mock section for validation
      const section: HIGSection = {
        id: path.basename(filename, '.md'),
        title: frontMatter.title || path.basename(filename, '.md'),
        url: frontMatter.url || 'https://developer.apple.com/design/human-interface-guidelines/',
        platform: platform as any,
        category: frontMatter.category || 'visual-design',
        quality: frontMatter.quality
      };
      
      // Validate content quality
      const validationResult = await this.qualityValidator.validateContent(markdownContent, section);
      
      // Calculate quality score for the content
      const qualityScore = this.qualityValidator.calculateQualityScore(markdownContent);
      
      const quality: ContentQualityMetrics = {
        score: qualityScore,
        confidence: frontMatter.quality?.confidence || 0.7,
        length: markdownContent.length,
        structureScore: frontMatter.quality?.structureScore || 0.5,
        appleTermsScore: frontMatter.quality?.appleTermsScore || 0.2,
        codeExamplesCount: (markdownContent.match(/```/g) || []).length / 2,
        imageReferencesCount: (markdownContent.match(/!\[.*?\]/g) || []).length,
        headingCount: (markdownContent.match(/^#+\s/gm) || []).length,
        isFallbackContent: frontMatter.quality?.isFallbackContent || false,
        extractionMethod: frontMatter.quality?.extractionMethod || 'crawlee'
      };
      
      this.validationResults.push({
        file: `${platform}/${filename}`,
        isValid: validationResult.isValid,
        quality,
        issues: validationResult.issues
      });
      
      const statusEmoji = validationResult.isValid ? '✅' : '❌';
      const qualityEmoji = quality.score >= 0.7 ? '🟢' : quality.score >= 0.4 ? '🟡' : '🔴';
      
      console.log(`    ${statusEmoji}${qualityEmoji} ${filename} (quality: ${quality.score.toFixed(3)}, length: ${quality.length})`);
      
      if (!validationResult.isValid && validationResult.issues.length > 0) {
        console.log(`      ⚠️  Issues: ${validationResult.issues.slice(0, 2).join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Error validating file ${filename}: ${error}`);
      this.validationResults.push({
        file: `${platform}/${filename}`,
        isValid: false,
        quality: {} as ContentQualityMetrics,
        issues: [`File read error: ${error}`]
      });
    }
  }

  private async validateMetadata(contentDir: string): Promise<void> {
    console.log('\n📊 Validating metadata files...');
    
    const metadataDir = path.join(contentDir, 'metadata');
    const requiredFiles = ['search-index.json', 'cross-references.json', 'generation-info.json'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(metadataDir, file);
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        JSON.parse(content); // Validate JSON
        console.log(`  ✅ ${file}`);
      } catch (error) {
        console.log(`  ❌ ${file} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private parseFrontMatter(content: string): { frontMatter: any; markdownContent: string } {
    const lines = content.split('\n');
    if (lines[0] !== '---') {
      return { frontMatter: {}, markdownContent: content };
    }
    
    const endIndex = lines.slice(1).findIndex(line => line === '---') + 1;
    if (endIndex === 0) {
      return { frontMatter: {}, markdownContent: content };
    }
    
    const frontMatterText = lines.slice(1, endIndex).join('\n');
    const markdownContent = lines.slice(endIndex + 1).join('\n');
    
    try {
      // Simple YAML-like parsing for basic front matter
      const frontMatter: any = {};
      frontMatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          try {
            frontMatter[key] = JSON.parse(value);
          } catch {
            frontMatter[key] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
      return { frontMatter, markdownContent };
    } catch {
      return { frontMatter: {}, markdownContent: content };
    }
  }

  private generateValidationReport(): void {
    console.log('\n📋 Validation Summary Report:');
    console.log('═'.repeat(50));
    
    const totalFiles = this.validationResults.length;
    const validFiles = this.validationResults.filter(r => r.isValid).length;
    const invalidFiles = totalFiles - validFiles;
    
    console.log(`📄 Total files: ${totalFiles}`);
    console.log(`✅ Valid files: ${validFiles} (${((validFiles / totalFiles) * 100).toFixed(1)}%)`);
    console.log(`❌ Invalid files: ${invalidFiles} (${((invalidFiles / totalFiles) * 100).toFixed(1)}%)`);
    
    if (this.validationResults.length > 0) {
      const averageQuality = this.validationResults
        .filter(r => r.quality.score !== undefined)
        .reduce((sum, r) => sum + r.quality.score, 0) / this.validationResults.length;
      
      const averageLength = this.validationResults
        .filter(r => r.quality.length !== undefined)
        .reduce((sum, r) => sum + r.quality.length, 0) / this.validationResults.length;
      
      console.log(`📊 Average quality score: ${averageQuality.toFixed(3)}`);
      console.log(`📏 Average content length: ${Math.round(averageLength)} characters`);
    }
    
    // Show worst performing files
    if (invalidFiles > 0) {
      console.log('\n🔍 Files needing attention:');
      this.validationResults
        .filter(r => !r.isValid)
        .slice(0, 5)
        .forEach(r => {
          console.log(`  ❌ ${r.file}: ${r.issues.slice(0, 1).join(', ')}`);
        });
    }
    
    // Show SLA compliance
    const stats = this.qualityValidator.getStatistics();
    console.log('\n📈 SLA Compliance:');
    console.log(`📊 Extraction success rate: ${stats.extractionSuccessRate.toFixed(1)}% (target: 95%+)`);
    console.log(`🎯 Average quality: ${stats.averageQuality.toFixed(3)} (target: 0.6+)`);
    console.log(`🔄 Fallback usage: ${stats.fallbackUsage}% (target: <10%)`);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ContentValidator();
  validator.validateContent().catch(error => {
    console.error('❌ Content validation failed:', error);
    process.exit(1);
  });
}

export { ContentValidator };