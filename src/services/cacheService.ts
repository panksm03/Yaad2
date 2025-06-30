import { createClient } from 'redis';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

config();

let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnectionAttempted = false;

export const initializeRedis = async () => {
  if (redisConnectionAttempted) {
    return redisClient;
  }
  
  redisConnectionAttempted = true;
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      // Don't throw in development mode
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    redisClient = null;
    
    // Continue without Redis in development
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Running without Redis cache in development mode');
      return null;
    }
    throw error;
  }
};

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private redisInitialized = false;

  constructor() {
    if (CacheService.instance) {
      return CacheService.instance;
    }
    CacheService.instance = this;
  }

  private async ensureRedisConnection() {
    if (!this.redisInitialized) {
      this.redisInitialized = true;
      try {
        await initializeRedis();
      } catch (error) {
        logger.warn('Redis initialization failed, using memory cache only');
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const memCached = this.memoryCache.get(key);
      if (memCached && memCached.expiry > Date.now()) {
        return memCached.value as T;
      } else if (memCached) {
        // Expired
        this.memoryCache.delete(key);
      }

      // Try Redis if available
      await this.ensureRedisConnection();
      if (redisClient && redisClient.isOpen) {
        const value = await redisClient.get(key);
        if (value) {
          const parsed = JSON.parse(value) as T;
          // Store in memory cache
          this.memoryCache.set(key, {
            value: parsed,
            expiry: Date.now() + 60000 // 1 minute
          });
          return parsed;
        }
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

      // Store in Redis if available
      await this.ensureRedisConnection();
      if (redisClient && redisClient.isOpen) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      }

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

      // Remove from Redis if available
      await this.ensureRedisConnection();
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(key);
      }

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

      // Clear Redis if available
      await this.ensureRedisConnection();
      if (redisClient && redisClient.isOpen) {
        await redisClient.flushAll();
      }

      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  // Cleanup method for graceful shutdown
  async disconnect(): Promise<void> {
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
        logger.info('Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }
}