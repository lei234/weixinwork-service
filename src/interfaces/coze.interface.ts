export interface CozeWorkflowRequest {
  workflow_id: string;
  parameters?: Record<string, any>;
  context_id?: string;
  stream?: boolean;
}

export interface CozeWorkflowResponse {
  code: number;
  msg: string;
  data: {
    workflow_id: string;
    context_id: string;
    output?: Record<string, any>;
    status: 'success' | 'failed' | 'running';
    error?: string;
  };
}

export interface CozeStreamChunk {
  event: string;
  data: string;
}

export interface CozeWorkflowOutput {
  result?: string;
  answer?: string;
  response?: string;
  [key: string]: any;
}

export interface CozeContextInfo {
  context_id: string;
  created_at: string;
  updated_at: string;
}

export enum CozeWorkflowStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
}
