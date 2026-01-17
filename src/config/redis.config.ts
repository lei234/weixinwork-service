import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import logger from '../services/logger/logger.service';

class RedisConfig {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;

  constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis reconnection failed');
          }
          this.reconnectAttempts = retries;
          const delay = Math.min(retries * 100, 3000);
          logger.info(`Redis reconnecting... attempt ${retries}`);
          return delay;
        },
      },
      password: config.redis.password || undefined,
      database: config.redis.db,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('Redis connection error', { error: err.message });
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Redis disconnected');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis', { error });
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<string | null> {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis ping failed', { error });
      return null;
    }
  }
}

export const redisConfig = new RedisConfig();
export default redisConfig;
