/**
 * Content caching layer with TTL and graceful degradation
 */

import NodeCache from 'node-cache';
import type { CacheEntry } from './types.js';

export class HIGCache {
  private cache: NodeCache;
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600) { // 1 hour default TTL
    this.cache = new NodeCache({
      stdTTL: defaultTTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false
    });
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a cache entry with custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): boolean {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL
    };
    
    return this.cache.set(key, entry, ttl || this.defaultTTL);
  }

  /**
   * Get a cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get<CacheEntry<T>>(key);
    if (!entry) {
      return null;
    }
    
    return entry.data;
  }

  /**
   * Get a cache entry with metadata
   */
  getWithMetadata<T>(key: string): CacheEntry<T> | null {
    return this.cache.get<CacheEntry<T>>(key) || null;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all keys in cache
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if cached data is stale (expired but available for graceful degradation)
   */
  isStale<T>(key: string): boolean {
    const entry = this.cache.get<CacheEntry<T>>(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const entryAge = now - entry.timestamp.getTime();
    return entryAge > (entry.ttl * 1000);
  }

  /**
   * Get stale data for graceful degradation
   * Returns data even if expired, useful when fresh data fetch fails
   */
  getStale<T>(key: string): T | null {
    // First try to get non-expired data
    const fresh = this.get<T>(key);
    if (fresh) {
      return fresh;
    }

    // If no fresh data, try to get from internal cache even if expired
    const allData = this.cache.keys().map(k => ({
      key: k,
      value: this.cache.get<CacheEntry<T>>(k)
    }));

    const staleEntry = allData.find(item => item.key === key);
    return staleEntry?.value?.data || null;
  }

  /**
   * Set cache entry that persists longer for graceful degradation
   */
  setWithGracefulDegradation<T>(key: string, data: T, normalTTL?: number, gracefulTTL?: number): boolean {
    const ttl = normalTTL || this.defaultTTL;
    const graceTTL = gracefulTTL || (ttl * 24); // Keep stale data 24x longer

    // Set the normal cache entry
    const normalResult = this.set(key, data, ttl);
    
    // Also set a backup entry with longer TTL for graceful degradation
    const backupKey = `${key}:backup`;
    const backupResult = this.set(backupKey, data, graceTTL);

    return normalResult && backupResult;
  }

  /**
   * Get data with graceful degradation fallback
   */
  getWithGracefulFallback<T>(key: string): { data: T | null; isStale: boolean } {
    // Try to get fresh data first
    const freshData = this.get<T>(key);
    if (freshData) {
      return { data: freshData, isStale: false };
    }

    // Try to get backup data if fresh data is not available
    const backupKey = `${key}:backup`;
    const staleData = this.get<T>(backupKey);
    
    return { 
      data: staleData, 
      isStale: staleData !== null 
    };
  }

  /**
   * Preload cache with critical data
   */
  preload<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(entry => {
      this.set(entry.key, entry.data, entry.ttl);
    });
  }

  /**
   * Clean up cache resources
   */
  destroy(): void {
    this.cache.close();
  }
}