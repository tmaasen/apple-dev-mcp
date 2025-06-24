import { HIGCache } from '../cache.js';

describe('HIGCache', () => {
  let cache: HIGCache;

  beforeEach(() => {
    cache = new HIGCache(60); // 1 minute TTL for tests
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    test('should set and get cache entries', () => {
      const testData = { foo: 'bar' };
      const result = cache.set('test-key', testData);
      
      expect(result).toBe(true);
      expect(cache.get('test-key')).toEqual(testData);
    });

    test('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    test('should check if key exists', () => {
      cache.set('existing', 'data');
      
      expect(cache.has('existing')).toBe(true);
      expect(cache.has('non-existing')).toBe(false);
    });

    test('should delete cache entries', () => {
      cache.set('to-delete', 'data');
      expect(cache.has('to-delete')).toBe(true);
      
      const deleted = cache.delete('to-delete');
      expect(deleted).toBe(1);
      expect(cache.has('to-delete')).toBe(false);
    });

    test('should clear all cache entries', () => {
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL and Graceful Degradation', () => {
    test('should set cache entry with custom TTL', () => {
      const result = cache.set('custom-ttl', 'data', 120);
      expect(result).toBe(true);
    });

    test('should get cache metadata', () => {
      const testData = 'test-data';
      cache.set('metadata-test', testData);
      
      const metadata = cache.getWithMetadata('metadata-test');
      expect(metadata).toBeTruthy();
      expect(metadata?.data).toBe(testData);
      expect(metadata?.timestamp).toBeInstanceOf(Date);
      expect(metadata?.ttl).toBe(60);
    });

    test('should support graceful degradation', () => {
      const testData = 'graceful-data';
      cache.setWithGracefulDegradation('graceful-key', testData, 60, 120);
      
      const result = cache.getWithGracefulFallback('graceful-key');
      expect(result.data).toBe(testData);
      expect(result.isStale).toBe(false);
    });

    test('should preload cache with multiple entries', () => {
      const entries = [
        { key: 'preload1', data: 'data1' },
        { key: 'preload2', data: 'data2', ttl: 120 }
      ];
      
      cache.preload(entries);
      
      expect(cache.get('preload1')).toBe('data1');
      expect(cache.get('preload2')).toBe('data2');
    });
  });

  describe('Statistics', () => {
    test('should provide cache statistics', () => {
      cache.set('stats-test', 'data');
      cache.get('stats-test'); // Generate a hit
      cache.get('non-existent'); // Generate a miss
      
      const stats = cache.getStats();
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });

    test('should list all cache keys', () => {
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      
      const keys = cache.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });
  });
});