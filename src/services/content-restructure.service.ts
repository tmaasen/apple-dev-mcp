/**
 * Content Restructure Service
 * 
 * Handles the restructuring of content from platform-first organization
 * to topic-first organization that matches Apple's HIG structure.
 */

import fs from 'fs/promises';
import path from 'path';

export interface ContentRestructureConfig {
  currentContentDir: string;
  newContentDir: string;
  backupDir: string;
}

export interface TopicConsolidationPlan {
  topic: string;
  url: string;
  bestSourcePlatform: string;
  bestSourceFile: string;
  duplicateFiles: string[];
  isUniversal: boolean;
  platformSpecificSections: Map<string, string>; // platform -> content
}

export interface RestructurePlan {
  universalTopicsToMove: string[]; // Files to move from universal/ to root
  universalTopicsToConsolidate: TopicConsolidationPlan[]; // Duplicated topics to merge
  platformSpecificTopicsToKeep: string[]; // Keep in platforms/ structure
  filesToDelete: string[]; // Duplicate files to remove
}

export class ContentRestructureService {
  private config: ContentRestructureConfig;

  constructor(config: ContentRestructureConfig) {
    this.config = config;
  }

  /**
   * Create a restructure plan based on current content analysis
   */
  async createRestructurePlan(): Promise<RestructurePlan> {
    const plan: RestructurePlan = {
      universalTopicsToMove: [],
      universalTopicsToConsolidate: [],
      platformSpecificTopicsToKeep: [],
      filesToDelete: []
    };

    // Get all current content files
    const platformsDir = path.join(this.config.currentContentDir, 'platforms');
    const platforms = await fs.readdir(platformsDir, { withFileTypes: true });

    const urlTopicMap = new Map<string, TopicConsolidationPlan>();
    const universalTopics = new Set<string>();

    // Analyze all files
    for (const platformDirent of platforms) {
      if (!platformDirent.isDirectory()) continue;
      
      const platform = platformDirent.name;
      const platformDir = path.join(platformsDir, platform);
      const files = await fs.readdir(platformDir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(platformDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const frontMatter = this.parseFrontMatter(content);
        
        if (!frontMatter.url) continue;

        const topic = file.replace('.md', '');
        const url = frontMatter.url;
        const quality = parseFloat(frontMatter.qualityScore) || 0;
        const contentLength = parseInt(frontMatter.contentLength) || 0;

        // Track universal vs platform-specific topics
        if (platform === 'universal') {
          universalTopics.add(topic);
        }

        // Group by URL for consolidation analysis
        if (!urlTopicMap.has(url)) {
          urlTopicMap.set(url, {
            topic,
            url,
            bestSourcePlatform: platform,
            bestSourceFile: filePath,
            duplicateFiles: [filePath],
            isUniversal: false,
            platformSpecificSections: new Map()
          });
        } else {
          const existing = urlTopicMap.get(url)!;
          existing.duplicateFiles.push(filePath);
          
          // Update best source if this one has better quality/content
          const existingQuality = await this.getFileQuality(existing.bestSourceFile);
          const existingLength = await this.getFileContentLength(existing.bestSourceFile);
          
          if (quality > existingQuality || (quality === existingQuality && contentLength > existingLength)) {
            existing.bestSourcePlatform = platform;
            existing.bestSourceFile = filePath;
          }
        }
      }
    }

    // Categorize topics
    for (const [, consolidationPlan] of urlTopicMap) {
      const topic = consolidationPlan.topic;
      
      // Determine if topic should be universal
      const isDuplicatedAcrossPlatforms = consolidationPlan.duplicateFiles.length > 1;
      const isInUniversalFolder = universalTopics.has(topic);
      const isUniversal = isInUniversalFolder || isDuplicatedAcrossPlatforms;
      
      consolidationPlan.isUniversal = isUniversal;

      if (isUniversal) {
        if (isDuplicatedAcrossPlatforms) {
          // Need to consolidate multiple files
          plan.universalTopicsToConsolidate.push(consolidationPlan);
          // Mark duplicates for deletion (except the best source)
          const filesToDelete = consolidationPlan.duplicateFiles.filter(f => f !== consolidationPlan.bestSourceFile);
          plan.filesToDelete.push(...filesToDelete);
        } else {
          // Single universal file - just move it
          plan.universalTopicsToMove.push(consolidationPlan.bestSourceFile);
        }
      } else {
        // Keep as platform-specific
        plan.platformSpecificTopicsToKeep.push(consolidationPlan.bestSourceFile);
      }
    }

    return plan;
  }

  /**
   * Execute the restructure plan
   */
  async executeRestructure(plan: RestructurePlan): Promise<void> {
    console.log('🔄 Starting content restructure...');

    // Create backup
    await this.createBackup();

    // Create new directory structure
    await fs.mkdir(this.config.newContentDir, { recursive: true });
    const newPlatformsDir = path.join(this.config.newContentDir, 'platforms');
    await fs.mkdir(newPlatformsDir, { recursive: true });

    // 1. Move simple universal topics
    console.log(`📁 Moving ${plan.universalTopicsToMove.length} universal topics to root...`);
    for (const sourceFile of plan.universalTopicsToMove) {
      const fileName = path.basename(sourceFile);
      const targetFile = path.join(this.config.newContentDir, fileName);
      await fs.copyFile(sourceFile, targetFile);
      console.log(`   Moved: ${fileName}`);
    }

    // 2. Consolidate duplicated universal topics
    console.log(`🔄 Consolidating ${plan.universalTopicsToConsolidate.length} duplicated topics...`);
    for (const consolidation of plan.universalTopicsToConsolidate) {
      await this.consolidateTopic(consolidation);
    }

    // 3. Keep platform-specific topics in platforms/ structure
    console.log(`📱 Preserving ${plan.platformSpecificTopicsToKeep.length} platform-specific topics...`);
    for (const sourceFile of plan.platformSpecificTopicsToKeep) {
      const relativePath = path.relative(path.join(this.config.currentContentDir, 'platforms'), sourceFile);
      const targetFile = path.join(newPlatformsDir, relativePath);
      
      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
    }

    // 4. Copy metadata directory
    const metadataSource = path.join(this.config.currentContentDir, 'metadata');
    const metadataTarget = path.join(this.config.newContentDir, 'metadata');
    
    try {
      await fs.mkdir(metadataTarget, { recursive: true });
      const metadataFiles = await fs.readdir(metadataSource);
      for (const file of metadataFiles) {
        await fs.copyFile(
          path.join(metadataSource, file),
          path.join(metadataTarget, file)
        );
      }
    } catch (error) {
      console.warn('⚠️ Could not copy metadata directory:', error);
    }

    console.log('✅ Content restructure completed!');
  }

  /**
   * Consolidate a duplicated topic into a single universal file
   */
  private async consolidateTopic(consolidation: TopicConsolidationPlan): Promise<void> {
    console.log(`   Consolidating: ${consolidation.topic}`);
    
    // Read the best source file
    const bestContent = await fs.readFile(consolidation.bestSourceFile, 'utf8');
    const bestFrontMatter = this.parseFrontMatter(bestContent);
    
    // Read platform-specific content from duplicates
    const platformSections = new Map<string, string>();
    
    for (const duplicateFile of consolidation.duplicateFiles) {
      if (duplicateFile === consolidation.bestSourceFile) continue;
      
      const platform = this.extractPlatformFromPath(duplicateFile);
      const content = await fs.readFile(duplicateFile, 'utf8');
      const frontMatter = this.parseFrontMatter(content);
      
      // If the duplicate has better content, extract platform-specific sections
      if (parseFloat(frontMatter.qualityScore) > 0.5) {
        const contentBody = this.extractContentBody(content);
        platformSections.set(platform, contentBody);
      }
    }

    // Create consolidated content
    const consolidatedContent = this.createConsolidatedContent(
      bestContent,
      bestFrontMatter,
      platformSections
    );

    // Write to new location
    const targetFile = path.join(this.config.newContentDir, `${consolidation.topic}.md`);
    await fs.writeFile(targetFile, consolidatedContent);
  }

  /**
   * Create consolidated content with platform-specific sections
   */
  private createConsolidatedContent(
    baseContent: string,
    baseFrontMatter: any,
    platformSections: Map<string, string>
  ): string {
    let content = baseContent;
    
    // Update front matter to indicate universal scope
    const updatedFrontMatter = {
      ...baseFrontMatter,
      platform: 'universal',
      id: baseFrontMatter.id?.replace(/-\w+$/, '-universal'),
      consolidatedFrom: Array.from(platformSections.keys())
    };

    // Replace front matter
    content = content.replace(
      /^---\n[\s\S]*?\n---/,
      '---\n' + Object.entries(updatedFrontMatter)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n') + '\n---'
    );

    // Add platform-specific sections if any
    if (platformSections.size > 0) {
      content += '\n\n## Platform-Specific Information\n\n';
      
      for (const [platform, platformContent] of platformSections) {
        content += `### ${platform.charAt(0).toUpperCase() + platform.slice(1)}\n\n`;
        content += platformContent + '\n\n';
      }
    }

    return content;
  }

  /**
   * Parse markdown front matter
   */
  private parseFrontMatter(content: string): Record<string, any> {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontMatterMatch) return {};
    
    const frontMatter: Record<string, any> = {};
    const lines = frontMatterMatch[1].split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          frontMatter[key] = JSON.parse(value);
        } catch {
          frontMatter[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return frontMatter;
  }

  /**
   * Extract content body (everything after front matter)
   */
  private extractContentBody(content: string): string {
    const frontMatterMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return frontMatterMatch ? frontMatterMatch[1].trim() : content;
  }

  /**
   * Extract platform name from file path
   */
  private extractPlatformFromPath(filePath: string): string {
    const parts = filePath.split('/');
    const platformsIndex = parts.findIndex(part => part === 'platforms');
    return platformsIndex >= 0 ? parts[platformsIndex + 1] : 'unknown';
  }

  /**
   * Get file quality score
   */
  private async getFileQuality(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf8');
    const frontMatter = this.parseFrontMatter(content);
    return parseFloat(frontMatter.qualityScore) || 0;
  }

  /**
   * Get file content length
   */
  private async getFileContentLength(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf8');
    const frontMatter = this.parseFrontMatter(content);
    return parseInt(frontMatter.contentLength) || 0;
  }

  /**
   * Create backup of current content
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupDir, `content-backup-${timestamp}`);
    
    console.log(`💾 Creating backup at: ${backupPath}`);
    await fs.mkdir(backupPath, { recursive: true });
    
    // Copy entire content directory
    await this.copyDirectory(this.config.currentContentDir, backupPath);
  }

  /**
   * Recursively copy directory
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}