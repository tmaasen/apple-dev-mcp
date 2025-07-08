/**
 * Update Checker Service
 * 
 * Provides update checking functionality for git repository, static content, and API documentation
 * Adapted from MightyDillah's apple-doc-mcp with enhancements for multiple content sources
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { HIGCache } from '../cache.js';
import type { HIGStaticContentProvider } from '../static-content.js';
import type { UpdateCheckResult, GitUpdateStatus, UpdateNotification, CheckUpdatesArgs } from '../types.js';

const execAsync = promisify(exec);

export class UpdateCheckerService {
  private cache: HIGCache;
  private staticContentProvider?: HIGStaticContentProvider;

  constructor(cache: HIGCache, staticContentProvider?: HIGStaticContentProvider) {
    this.cache = cache;
    this.staticContentProvider = staticContentProvider;
  }

  /**
   * Check for updates across all configured sources
   */
  async checkUpdates(args: CheckUpdatesArgs = {}): Promise<{
    updates: UpdateCheckResult[];
    notifications: UpdateNotification[];
    summary: string;
    hasUpdates: boolean;
  }> {
    const { sources = ['git-repository', 'hig-static', 'api-documentation'], includeChangelog = false } = args;
    const updates: UpdateCheckResult[] = [];
    const notifications: UpdateNotification[] = [];

    // Check git repository updates
    if (sources.includes('git-repository')) {
      try {
        const gitUpdate = await this.checkGitUpdates(includeChangelog);
        updates.push(gitUpdate);
        
        if (gitUpdate.isUpdateAvailable) {
          notifications.push({
            type: 'info',
            message: `Git repository has ${gitUpdate.changelog?.length || 0} new commits available`,
            actionRequired: true,
            instructions: ['Run `git pull origin main` to update', 'Restart the MCP server after updating']
          });
        }
      } catch {
        notifications.push({
          type: 'error',
          message: 'Failed to check git repository updates',
          actionRequired: false
        });
      }
    }

    // Check static HIG content freshness
    if (sources.includes('hig-static') && this.staticContentProvider) {
      try {
        const higUpdate = await this.checkStaticContentFreshness();
        updates.push(higUpdate);
        
        if (higUpdate.isUpdateAvailable) {
          notifications.push({
            type: 'warning',
            message: 'Static HIG content is stale (>6 months old)',
            actionRequired: true,
            instructions: ['Run `npm run generate-content` to update', 'Consider scheduling automatic updates']
          });
        }
      } catch {
        notifications.push({
          type: 'warning',
          message: 'Could not check static content freshness',
          actionRequired: false
        });
      }
    }

    // Check API documentation availability (simple connectivity test)
    if (sources.includes('api-documentation')) {
      try {
        const apiUpdate = await this.checkAPIDocumentationStatus();
        updates.push(apiUpdate);
      } catch {
        notifications.push({
          type: 'warning',
          message: 'Could not verify API documentation availability',
          actionRequired: false
        });
      }
    }

    const hasUpdates = updates.some(update => update.isUpdateAvailable);
    const summary = this.generateUpdateSummary(updates, notifications);

    return {
      updates,
      notifications,
      summary,
      hasUpdates
    };
  }

  /**
   * Check git repository for updates
   */
  async checkGitUpdates(includeChangelog: boolean = false): Promise<UpdateCheckResult> {
    try {
      // Fetch latest changes from remote
      await execAsync('git fetch origin', { timeout: 10000 });
      
      // Check current branch
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      const branch = currentBranch.trim();
      
      // Compare local vs remote commits
      const { stdout: behind } = await execAsync(`git rev-list --count HEAD..origin/${branch}`);
      const { stdout: ahead } = await execAsync(`git rev-list --count origin/${branch}..HEAD`);
      
      const behindCount = parseInt(behind.trim());
      const aheadCount = parseInt(ahead.trim());
      
      // Get current version info
      const { stdout: localCommit } = await execAsync('git log -1 --format="%h %s (%an, %ar)"');
      const { stdout: remoteCommit } = await execAsync(`git log -1 --format="%h %s (%an, %ar)" origin/${branch}`);
      
      let changelog: string[] | undefined;
      if (includeChangelog && behindCount > 0) {
        try {
          const { stdout: changelogOutput } = await execAsync(`git log --oneline HEAD..origin/${branch}`);
          changelog = changelogOutput.trim().split('\n').filter(line => line.length > 0);
        } catch {
          changelog = [`${behindCount} commits available (changelog unavailable)`];
        }
      }
      
      const isUpdateAvailable = behindCount > 0;
      let updateInstructions = '';
      
      if (isUpdateAvailable) {
        updateInstructions = `Run 'git pull origin ${branch}' to update, then restart the MCP server.`;
      } else if (aheadCount > 0) {
        updateInstructions = `Local repository is ${aheadCount} commits ahead. Consider pushing changes.`;
      } else {
        updateInstructions = 'Repository is up to date.';
      }

      return {
        source: 'git-repository',
        isUpdateAvailable,
        currentVersion: localCommit.trim(),
        latestVersion: remoteCommit.trim(),
        lastChecked: new Date(),
        updateInstructions,
        changelog
      };
    } catch (error) {
      throw new Error(`Git update check failed: ${error}`);
    }
  }

  /**
   * Check static content freshness
   */
  async checkStaticContentFreshness(): Promise<UpdateCheckResult> {
    if (!this.staticContentProvider) {
      throw new Error('Static content provider not available');
    }

    const isAvailable = await this.staticContentProvider.isAvailable();
    if (!isAvailable) {
      return {
        source: 'hig-static',
        isUpdateAvailable: true,
        lastChecked: new Date(),
        updateInstructions: 'Static content not found. Run `npm run generate-content` to create.'
      };
    }

    const metadata = this.staticContentProvider.getMetadata();
    const isStale = this.staticContentProvider.isContentStale();
    const contentAge = this.staticContentProvider.getContentAge();
    
    const ageDays = contentAge ? Math.floor(contentAge / (24 * 60 * 60 * 1000)) : null;
    
    return {
      source: 'hig-static',
      isUpdateAvailable: isStale,
      currentVersion: metadata?.lastUpdated ? new Date(metadata.lastUpdated).toLocaleDateString() : 'Unknown',
      latestVersion: 'Current Apple HIG (check developer.apple.com)',
      lastChecked: new Date(),
      updateInstructions: isStale 
        ? 'Content is stale. Run `npm run generate-content` to update.'
        : `Content is fresh (${ageDays} days old).`,
      changelog: isStale ? [`Content is ${ageDays} days old`, 'Apple may have published new design guidelines'] : undefined
    };
  }

  /**
   * Check API documentation status
   */
  async checkAPIDocumentationStatus(): Promise<UpdateCheckResult> {
    try {
      // Simple connectivity test to Apple's API
      const testUrl = 'https://developer.apple.com/tutorials/data/documentation/technologies.json';
      const response = await fetch(testUrl, {
        method: 'HEAD'
      });

      const isAvailable = response.ok;
      
      return {
        source: 'api-documentation',
        isUpdateAvailable: false, // API is always current
        currentVersion: 'Live API',
        latestVersion: 'Live API',
        lastChecked: new Date(),
        updateInstructions: isAvailable 
          ? 'API documentation is available and current.'
          : 'API documentation may be temporarily unavailable.'
      };
    } catch {
      return {
        source: 'api-documentation',
        isUpdateAvailable: false,
        currentVersion: 'Unknown',
        latestVersion: 'Unknown',
        lastChecked: new Date(),
        updateInstructions: 'Could not verify API availability. Check internet connection.'
      };
    }
  }

  /**
   * Get git status information
   */
  async getGitStatus(): Promise<GitUpdateStatus> {
    try {
      await execAsync('git fetch origin', { timeout: 5000 });
      
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      const branch = currentBranch.trim();
      
      const { stdout: behind } = await execAsync(`git rev-list --count HEAD..origin/${branch}`);
      const { stdout: ahead } = await execAsync(`git rev-list --count origin/${branch}..HEAD`);
      
      const behindCount = parseInt(behind.trim());
      const aheadCount = parseInt(ahead.trim());
      
      const { stdout: localCommit } = await execAsync('git log -1 --format="%h %s (%an, %ar)"');
      const { stdout: remoteCommit } = await execAsync(`git log -1 --format="%h %s (%an, %ar)" origin/${branch}`);
      
      let status = '';
      if (behindCount === 0 && aheadCount === 0) {
        status = 'Up to date';
      } else if (behindCount > 0 && aheadCount === 0) {
        status = `${behindCount} update${behindCount > 1 ? 's' : ''} available`;
      } else if (behindCount === 0 && aheadCount > 0) {
        status = `${aheadCount} local change${aheadCount > 1 ? 's' : ''} ahead`;
      } else {
        status = `${behindCount} update${behindCount > 1 ? 's' : ''} available, ${aheadCount} local change${aheadCount > 1 ? 's' : ''} ahead`;
      }

      return {
        branch,
        status,
        behindCount,
        aheadCount,
        localCommit: localCommit.trim(),
        remoteCommit: remoteCommit.trim(),
        hasUpdates: behindCount > 0,
        hasLocalChanges: aheadCount > 0,
        lastChecked: new Date()
      };
    } catch (error) {
      throw new Error(`Git status check failed: ${error}`);
    }
  }

  /**
   * Generate a human-readable update summary
   */
  private generateUpdateSummary(updates: UpdateCheckResult[], notifications: UpdateNotification[]): string {
    const updateCount = updates.filter(u => u.isUpdateAvailable).length;
    const errorCount = notifications.filter(n => n.type === 'error').length;
    const warningCount = notifications.filter(n => n.type === 'warning').length;
    
    if (updateCount === 0 && errorCount === 0 && warningCount === 0) {
      return '✅ All systems up to date';
    }
    
    let summary = '';
    if (updateCount > 0) {
      summary += `🔄 ${updateCount} update${updateCount > 1 ? 's' : ''} available`;
    }
    if (warningCount > 0) {
      summary += `${summary ? ', ' : ''}⚠️  ${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    }
    if (errorCount > 0) {
      summary += `${summary ? ', ' : ''}❌ ${errorCount} error${errorCount > 1 ? 's' : ''}`;
    }
    
    return summary;
  }

  /**
   * Quietly check for updates on startup (non-blocking)
   */
  async checkAndNotifyUpdates(): Promise<void> {
    try {
      const result = await this.checkGitUpdates(false);
      
      if (result.isUpdateAvailable && process.env.NODE_ENV === 'development') {
        console.error(`🔄 Updates available! Use 'check_updates' tool for details.`);
      }
    } catch {
      // Silent fail - don't spam console with update errors on startup
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Could not check for updates on startup');
      }
    }
  }
}