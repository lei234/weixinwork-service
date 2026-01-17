export const WECHAT_API_BASE = 'https://qyapi.weixin.qq.com';

export const WECHAT_ENDPOINTS = {
  GET_ACCESS_TOKEN: '/cgi-bin/gettoken',
  SEND_MESSAGE: '/cgi-bin/message/send',
  KF_SEND_MESSAGE: '/cgi-bin/kf/send_msg',
} as const;

export const COZE_ENDPOINTS = {
  WORKFLOW_EXECUTE: '/v1/workflow/execute',
  WORKFLOW_STREAM: '/v1/workflow/stream_execute',
  CREATE_CONTEXT: '/v1/conversation/create',
} as const;

export const REDIS_KEYS = {
  CONTEXT: (externalUserId: string) => `context:${externalUserId}`,
  ACCESS_TOKEN: 'access_token',
} as const;

export const CONTEXT_TTL = 24 * 60 * 60;

export const COZE_TIMEOUT = 30000;

export const MAX_RETRIES = 3;

export const RETRY_DELAY = 1000;

export const WECHAT_RATE_LIMITS = {
  PER_MINUTE: 20,
  PER_DAY: 2000,
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  EVENT: 'event',
} as const;

export const EVENT_TYPES = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  ENTER_SESSION: 'enter_session',
} as const;
