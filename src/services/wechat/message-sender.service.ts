import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { WechatSendMessage, WechatAccessTokenResponse, WechatSendResponse } from '../../interfaces/wechat.interface';
import { WECHAT_API_BASE, WECHAT_ENDPOINTS } from '../../constants';
import logger from '../logger/logger.service';

export class MessageSenderService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private corpId: string;
  private kfSecret: string;

  constructor() {
    this.corpId = config.wechat.corpId;
    this.kfSecret = config.wechat.kfSecret;

    this.axiosInstance = axios.create({
      baseURL: WECHAT_API_BASE,
      timeout: 10000,
    });
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.axiosInstance.get<WechatAccessTokenResponse>(
        WECHAT_ENDPOINTS.GET_ACCESS_TOKEN,
        {
          params: {
            corpid: this.corpId,
            corpsecret: this.kfSecret,
          },
        }
      );

      if (response.data.errcode !== 0) {
        throw new Error(`Failed to get access token: ${response.data.errmsg}`);
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + (response.data.expires_in - 300) * 1000;

      logger.info('Access token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get access token', { error });
      throw error;
    }
  }

  async sendMessage(message: WechatSendMessage): Promise<WechatSendResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.post<WechatSendResponse>(
        `${WECHAT_ENDPOINTS.SEND_MESSAGE}?access_token=${accessToken}`,
        message
      );

      if (response.data.errcode !== 0) {
        logger.warn('Send message returned non-zero errcode', {
          errcode: response.data.errcode,
          errmsg: response.data.errmsg,
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to send message', { error });
      throw error;
    }
  }

  async sendTextMessage(user: string, content: string): Promise<WechatSendResponse> {
    const message: WechatSendMessage = {
      touser: user,
      msgtype: 'text',
      text: {
        content,
      },
    };

    return this.sendMessage(message);
  }

  async sendMarkdownMessage(user: string, content: string): Promise<WechatSendResponse> {
    const message: WechatSendMessage = {
      touser: user,
      msgtype: 'markdown',
      markdown: {
        content,
      },
    };

    return this.sendMessage(message);
  }

  async sendKfMessage(externalUserId: string, content: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.post(
        `${WECHAT_ENDPOINTS.KF_SEND_MESSAGE}?access_token=${accessToken}`,
        {
          external_userid: externalUserId,
          text: content,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to send kf message', { error });
      throw error;
    }
  }
}

export default new MessageSenderService();
