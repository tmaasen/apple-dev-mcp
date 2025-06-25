/**
 * File System Service Implementation
 * Single Responsibility: Handle all file system operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { IFileSystemService } from '../interfaces/content-interfaces.js';

export class FileSystemService implements IFileSystemService {
  async writeFile(filePath: string, content: string): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await this.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async mkdir(dirPath: string, options?: { recursive: boolean }): Promise<void> {
    await fs.mkdir(dirPath, options);
  }

  async readdir(dirPath: string): Promise<string[]> {
    return await fs.readdir(dirPath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(filePath: string): Promise<{ size: number; isDirectory(): boolean }> {
    return await fs.stat(filePath);
  }

  /**
   * Calculate total size of directory recursively
   */
  async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }
}