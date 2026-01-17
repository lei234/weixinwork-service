export interface ContextData {
  contextId: string;
  externalUserId: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface CreateContextResult {
  contextId: string;
  isNew: boolean;
}

export interface GetContextResult {
  contextId: string | null;
  exists: boolean;
}

export interface UpdateContextResult {
  success: boolean;
  contextId: string;
}
