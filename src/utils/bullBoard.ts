import { Application } from 'express';
import { logger } from './logger';

export const setupBullBoard = (app: Application): void => {
  try {
    logger.info('Bull Board setup skipped - Redis not available');
  } catch (error) {
    logger.error('Failed to set up Bull Board:', error);
  }
};