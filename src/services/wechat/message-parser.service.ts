import xml2js from 'xml2js';
import { KfMessageEvent } from '../../interfaces/wechat.interface';

export class MessageParserService {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
    });
  }

  async parseXml(xml: string): Promise<KfMessageEvent> {
    try {
      const result = await this.parser.parseStringPromise(xml);
      return result.xml as KfMessageEvent;
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error}`);
    }
  }

  extractContent(message: KfMessageEvent): string {
    if (message.MsgType === 'text') {
      return message.Content || '';
    }
    return '';
  }

  extractExternalUserId(message: KfMessageEvent): string {
    return message.FromUserName || message.ExternalUserID || '';
  }

  isOpenKfMessage(message: any): boolean {
    return message.MsgType === 'event' && message.Event === 'kf_msg_or_event';
  }

  isTextMessage(message: KfMessageEvent): boolean {
    return message.MsgType === 'text';
  }
}

export default new MessageParserService();
