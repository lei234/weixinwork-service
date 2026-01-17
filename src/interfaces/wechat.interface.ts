export interface WechatCallbackEvent {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
  Event?: string;
  MsgId?: string;
  Content?: string;
  AgentID?: number;
}

export interface WechatTextMessage {
  touser: string;
  msgtype: 'text';
  text: {
    content: string;
  };
}

export interface WechatMarkdownMessage {
  touser: string;
  msgtype: 'markdown';
  markdown: {
    content: string;
  };
}

export type WechatSendMessage = WechatTextMessage | WechatMarkdownMessage;

export interface WechatAccessTokenResponse {
  errcode: number;
  errmsg: string;
  access_token: string;
  expires_in: number;
}

export interface WechatSendResponse {
  errcode: number;
  errmsg: string;
  invaliduser?: string;
  invalidparty?: string;
  invalidtag?: string;
  msgid?: string;
}

export interface KfMessageEvent {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
  Content?: string;
  MsgId?: string;
  ExternalUserID?: string;
  OpenKfId?: string;
}

export interface VerifyUrlParams {
  msg_signature: string;
  timestamp: string;
  nonce: string;
  echostr: string;
}

export interface DecryptedMessage {
  id: number;
  message: string;
}

export interface KfAccountInfo {
 kf_id: string;
  name: string;
  avatar?: string;
}
