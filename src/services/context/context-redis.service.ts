import { ContextData, CreateContextResult, GetContextResult } from '../../interfaces/context.interface';
import { REDIS_KEYS, CONTEXT_TTL } from '../../constants';
import redisConfig from '../../config/redis.config';
import workflowService from '../coze/workflow.service';
import logger from '../logger/logger.service';

export class ContextRedisService {
  private getRedis() {
    return redisConfig.getClient();
  }

  private getRedisKey(externalUserId: string): string {
    return `${REDIS_KEYS.CONTEXT(externalUserId)}`;
  }

  async getOrCreateContext(externalUserId: string): Promise<string | null> {
    try {
      const existingContext = await this.getContext(externalUserId);

      if (existingContext && existingContext.contextId) {
        logger.info('Using existing context', {
          externalUserId,
          contextId: existingContext.contextId,
        });

        await this.updateContext(externalUserId);
        return existingContext.contextId;
      }

      return await this.createContext(externalUserId);
    } catch (error) {
      logger.error('Failed to get or create context', { externalUserId, error });
      return null;
    }
  }

  private async getContext(externalUserId: string): Promise<GetContextResult> {
    try {
      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);
      const data = await redis.get(key);

      if (!data) {
        return { contextId: null, exists: false };
      }

      const contextData: ContextData = JSON.parse(data);
      return { contextId: contextData.contextId, exists: true };
    } catch (error) {
      logger.error('Failed to get context from Redis', { externalUserId, error });
      return { contextId: null, exists: false };
    }
  }

  private async createContext(externalUserId: string): Promise<string | null> {
    try {
      const cozeContextId = await workflowService.createConversation();

      if (!cozeContextId) {
        logger.error('Failed to create COZE conversation');
        return null;
      }

      const contextData: ContextData = {
        contextId: cozeContextId,
        externalUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
      };

      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);

      await redis.setEx(key, CONTEXT_TTL, JSON.stringify(contextData));

      logger.info('Created new context', {
        externalUserId,
        contextId: cozeContextId,
      });

      return cozeContextId;
    } catch (error) {
      logger.error('Failed to create context', { externalUserId, error });
      return null;
    }
  }

  private async updateContext(externalUserId: string): Promise<void> {
    try {
      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);
      const data = await redis.get(key);

      if (!data) {
        return;
      }

      const contextData: ContextData = JSON.parse(data);
      contextData.updatedAt = Date.now();
      contextData.messageCount += 1;

      await redis.setEx(key, CONTEXT_TTL, JSON.stringify(contextData));
    } catch (error) {
      logger.error('Failed to update context', { externalUserId, error });
    }
  }

  async deleteContext(externalUserId: string): Promise<boolean> {
    try {
      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);
      const result = await redis.del(key);

      if (result > 0) {
        logger.info('Deleted context', { externalUserId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete context', { externalUserId, error });
      return false;
    }
  }

  async getContextInfo(externalUserId: string): Promise<ContextData | null> {
    try {
      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);
      const data = await redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as ContextData;
    } catch (error) {
      logger.error('Failed to get context info', { externalUserId, error });
      return null;
    }
  }

  async refreshContextTTL(externalUserId: string): Promise<void> {
    try {
      const redis = this.getRedis();
      const key = this.getRedisKey(externalUserId);
      await redis.expire(key, CONTEXT_TTL);
    } catch (error) {
      logger.error('Failed to refresh context TTL', { externalUserId, error });
    }
  }

  async getAllActiveContexts(): Promise<ContextData[]> {
    try {
      const redis = this.getRedis();
      const pattern = this.getRedisKey('*');
      const keys = await redis.keys(pattern);

      const contexts: ContextData[] = [];
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          contexts.push(JSON.parse(data) as ContextData);
        }
      }

      return contexts;
    } catch (error) {
      logger.error('Failed to get all active contexts', { error });
      return [];
    }
  }
}

export default new ContextRedisService();
