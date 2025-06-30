import Bull from 'bull';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
config();

// Redis connection options
const redisUrl = process.env.BULL_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

// Default job options
const defaultJobOptions = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
};

// Queue configuration with connection timeout
const queueConfig = {
  defaultJobOptions,
  redis: {
    connectTimeout: 5000,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryDelayOnFailover: 100
  }
};

let queuesInitialized = false;
let imageAnalysisQueue: Bull.Queue | null = null;
let faceRecognitionQueue: Bull.Queue | null = null;
let tagGenerationQueue: Bull.Queue | null = null;

const initializeQueues = async () => {
  if (queuesInitialized) {
    return;
  }

  try {
    // Create queues with error handling
    imageAnalysisQueue = new Bull('image-analysis', redisUrl, queueConfig);
    faceRecognitionQueue = new Bull('face-recognition', redisUrl, queueConfig);
    tagGenerationQueue = new Bull('tag-generation', redisUrl, queueConfig);

    const queues = [imageAnalysisQueue, faceRecognitionQueue, tagGenerationQueue];

    // Set up error handlers
    queues.forEach(queue => {
      if (!queue) return;

      queue.on('error', (error) => {
        logger.error(`Queue ${queue.name} error:`, error);
        // Don't crash in development
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      });

      queue.on('failed', (job, error) => {
        logger.error(`Job ${job.id} in ${queue.name} failed:`, error);
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} in ${queue.name} stalled`);
      });

      queue.on('ready', () => {
        logger.info(`Queue ${queue.name} is ready`);
      });
    });

    queuesInitialized = true;
    logger.info('Queues initialized successfully');

    // Log queue status after initialization
    setTimeout(logQueueStatus, 1000);
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    
    // In development, continue without queues
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Running without job queues in development mode');
      queuesInitialized = true;
      return;
    }
    throw error;
  }
};

// Log queue status on startup
const logQueueStatus = async () => {
  try {
    const queues = [imageAnalysisQueue, faceRecognitionQueue, tagGenerationQueue].filter(Boolean);
    
    if (queues.length === 0) {
      logger.warn('No queues available for status check');
      return;
    }
    
    for (const queue of queues) {
      if (!queue) continue;
      
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ]);
        
        logger.info(`Queue ${queue.name} status: waiting=${waiting}, active=${active}, completed=${completed}, failed=${failed}`);
      } catch (error) {
        logger.warn(`Could not get status for queue ${queue.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error logging queue status:', error);
  }
};

// Initialize queues with delay to allow for graceful startup
setTimeout(() => {
  initializeQueues().catch(error => {
    logger.error('Queue initialization failed:', error);
  });
}, 2000);

// Export queues with null checks
export { imageAnalysisQueue, faceRecognitionQueue, tagGenerationQueue };

export const queues = {
  get imageAnalysisQueue() { return imageAnalysisQueue; },
  get faceRecognitionQueue() { return faceRecognitionQueue; },
  get tagGenerationQueue() { return tagGenerationQueue; }
};

// Helper function to check if queues are available
export const areQueuesAvailable = () => {
  return queuesInitialized && imageAnalysisQueue && faceRecognitionQueue && tagGenerationQueue;
};

// Graceful shutdown
export const closeQueues = async () => {
  try {
    const queues = [imageAnalysisQueue, faceRecognitionQueue, tagGenerationQueue].filter(Boolean);
    await Promise.all(queues.map(queue => queue?.close()));
    logger.info('All queues closed successfully');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
};