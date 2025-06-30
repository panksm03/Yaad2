import { logger } from '../utils/logger';

// Simple in-memory cache implementation
export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();

  constructor() {
    if (CacheService.instance) {
      return CacheService.instance;
    }
    CacheService.instance = this;
    logger.info('In-memory cache service initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache
      const memCached = this.memoryCache.get(key);
      if (memCached && memCached.expiry > Date.now()) {
        return memCached.value as T;
      } else if (memCached) {
        // Expired
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      // Store in memory cache
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
      });

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  // Cleanup method for graceful shutdown
  async disconnect(): Promise<void> {
    try {
      // Clear memory cache on disconnect
      this.memoryCache.clear();
      logger.info('In-memory cache disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting cache:', error);
    }
  }
}

// Export a function that returns a new instance of CacheService
export const initializeCache = async (): Promise<CacheService> => {
  return new CacheService();
};