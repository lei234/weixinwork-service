import { KfMessageEvent } from '../../interfaces/wechat.interface';
import { EVENT_TYPES } from '../../constants';
import messageParser from './message-parser.service';
import messageSender from './message-sender.service';
import signatureService from './signature.service';
import contextRedisService from '../context/context-redis.service';
import workflowService from '../coze/workflow.service';
import logger from '../logger/logger.service';

export class WebhookService {
  async handleCallback(body: any): Promise<void> {
    try {
      const { Encrypt, MsgSignature, TimeStamp, Nonce } = body;

      if (!Encrypt || !MsgSignature || !TimeStamp || !Nonce) {
        throw new Error('Invalid callback parameters');
      }

      if (!signatureService.verifyMessage(MsgSignature, TimeStamp, Nonce, Encrypt)) {
        throw new Error('Signature verification failed');
      }

      const decryptedXml = signatureService.decryptMessage(Encrypt);
      const message = await messageParser.parseXml(decryptedXml);

      logger.info('Received WeChat message', {
        msgType: message.MsgType,
        fromUser: message.FromUserName,
      });

      await this.processMessage(message);
    } catch (error) {
      logger.error('Error handling callback', { error });
      throw error;
    }
  }

  private async processMessage(message: KfMessageEvent): Promise<void> {
    const externalUserId = messageParser.extractExternalUserId(message);

    if (!externalUserId) {
      logger.warn('No external user ID found in message');
      return;
    }

    switch (message.MsgType) {
      case 'text':
        await this.handleTextMessage(message, externalUserId);
        break;

      case 'event':
        await this.handleEvent(message, externalUserId);
        break;

      default:
        logger.info('Unsupported message type', { msgType: message.MsgType });
    }
  }

  private async handleTextMessage(message: KfMessageEvent, externalUserId: string): Promise<void> {
    const content = messageParser.extractContent(message);

    if (!content) {
      logger.warn('Empty text message received');
      return;
    }

    logger.info('Processing text message', {
      externalUserId,
      content: content.substring(0, 50),
    });

    try {
      const contextId = await contextRedisService.getOrCreateContext(externalUserId);

      if (!contextId) {
        logger.error('Failed to get or create context for user', { externalUserId });
        await this.sendErrorMessage(externalUserId);
        return;
      }

      const response = await workflowService.executeWorkflow(content, contextId);

      if (response && response.output) {
        const reply = this.extractReplyFromOutput(response.output);
        await this.sendReply(externalUserId, reply);
      } else {
        logger.warn('Empty response from workflow', { contextId });
      }
    } catch (error) {
      logger.error('Error processing text message', {
        externalUserId,
        error,
      });
      await this.sendErrorMessage(externalUserId);
    }
  }

  private async handleEvent(message: KfMessageEvent, externalUserId: string): Promise<void> {
    const event = message.Event;

    logger.info('Received event', { event, externalUserId });

    switch (event) {
      case EVENT_TYPES.SUBSCRIBE:
        await this.handleSubscribe(externalUserId);
        break;

      case EVENT_TYPES.ENTER_SESSION:
        await this.handleEnterSession(externalUserId);
        break;

      default:
        logger.info('Unhandled event type', { event });
    }
  }

  private async handleSubscribe(externalUserId: string): Promise<void> {
    const welcomeMessage = '欢迎使用智能客服服务！我可以帮助您解答问题，请随时与我对话。';
    await this.sendReply(externalUserId, welcomeMessage);
  }

  private async handleEnterSession(externalUserId: string): Promise<void> {
    logger.info('User entered session', { externalUserId });
  }

  private async sendReply(externalUserId: string, content: string): Promise<void> {
    try {
      await messageSender.sendKfMessage(externalUserId, content);
      logger.info('Reply sent successfully', { externalUserId });
    } catch (error) {
      logger.error('Failed to send reply', { externalUserId, error });
      throw error;
    }
  }

  private async sendErrorMessage(externalUserId: string): Promise<void> {
    const errorMessage = '抱歉，服务暂时不可用，请稍后再试。';
    try {
      await messageSender.sendKfMessage(externalUserId, errorMessage);
    } catch (error) {
      logger.error('Failed to send error message', { externalUserId, error });
    }
  }

  private extractReplyFromOutput(output: Record<string, any>): string {
    if (typeof output === 'string') {
      return output;
    }

    return output.result || output.answer || output.response || output.content || JSON.stringify(output);
  }
}

export default new WebhookService();
