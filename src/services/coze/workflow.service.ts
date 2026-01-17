import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { CozeWorkflowRequest, CozeWorkflowResponse, CozeWorkflowOutput } from '../../interfaces/coze.interface';
import { COZE_TIMEOUT, MAX_RETRIES, RETRY_DELAY } from '../../constants';
import logger from '../logger/logger.service';

export class WorkflowService {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private apiBaseUrl: string;
  private workflowId: string;
  private timeout: number;

  constructor() {
    this.apiKey = config.coze.apiKey;
    this.apiBaseUrl = config.coze.apiBaseUrl;
    this.workflowId = config.coze.workflowId;
    this.timeout = config.coze.timeout;

    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY;
          logger.info(`Rate limited, waiting ${delay}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        return Promise.reject(error);
      }
    );
  }

  async executeWorkflow(
    input: string,
    contextId: string,
    retries: number = MAX_RETRIES
  ): Promise<CozeWorkflowResponse['data']> {
    const requestBody: CozeWorkflowRequest = {
      workflow_id: this.workflowId,
      parameters: {
        input,
      },
      context_id: contextId,
      stream: false,
    };

    logger.debug('Executing COZE workflow', {
      workflowId: this.workflowId,
      contextId,
      input: input.substring(0, 100),
    });

    try {
      const response = await this.axiosInstance.post<CozeWorkflowResponse>(
        '/v1/workflow/execute',
        requestBody
      );

      if (response.data.code !== 0) {
        throw new Error(`COZE workflow failed: ${response.data.msg}`);
      }

      logger.info('COZE workflow executed successfully', {
        contextId,
        status: response.data.data.status,
      });

      return response.data.data;
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        logger.warn('Retrying workflow execution', {
          remainingRetries: retries - 1,
          error: error.message,
        });
        await this.exponentialDelay(MAX_RETRIES - retries + 1);
        return this.executeWorkflow(input, contextId, retries - 1);
      }

      logger.error('Failed to execute COZE workflow', {
        error: error.message,
        contextId,
      });
      throw error;
    }
  }

  async executeWorkflowStream(
    input: string,
    contextId: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const requestBody: CozeWorkflowRequest = {
      workflow_id: this.workflowId,
      parameters: {
        input,
      },
      context_id: contextId,
      stream: true,
    };

    try {
      const response = await this.axiosInstance.post(
        '/v1/workflow/stream_execute',
        requestBody,
        {
          responseType: 'stream',
        }
      );

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              logger.debug('Failed to parse stream chunk', { data });
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    } catch (error) {
      logger.error('Failed to execute streaming workflow', { error });
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return status === 429 || status === 500 || status === 502 || status === 503;
  }

  private exponentialDelay(attempt: number): Promise<void> {
    const delay = RETRY_DELAY * Math.pow(2, attempt);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async createConversation(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<{ data: { id: string } }>(
        '/v1/conversation/create',
        {}
      );

      const conversationId = response.data.data.id;
      logger.info('Created new COZE conversation', { conversationId });

      return conversationId;
    } catch (error) {
      logger.error('Failed to create COZE conversation', { error });
      throw error;
    }
  }
}

export default new WorkflowService();
