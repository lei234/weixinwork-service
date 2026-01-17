import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  wechat: {
    corpId: process.env.WECHAT_CORP_ID || '',
    kfSecret: process.env.WECHAT_KF_SECRET || '',
    kfToken: process.env.WECHAT_KF_TOKEN || '',
    kfEncodingAESKey: process.env.WECHAT_KF_ENCODING_AES_KEY || '',
  },

  coze: {
    apiKey: process.env.COZE_API_KEY || '',
    apiBaseUrl: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
    workflowId: process.env.COZE_WORKFLOW_ID || '',
    timeout: parseInt(process.env.COZE_TIMEOUT || '30000', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    prefix: process.env.REDIS_PREFIX || 'wechat:',
  },
} as const;

export type Config = typeof config;
