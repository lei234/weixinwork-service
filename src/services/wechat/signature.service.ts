import { config } from '../../config';
import CryptoUtil from '../../utils/crypto.util';
import { VerifyUrlParams } from '../../interfaces/wechat.interface';

export class SignatureService {
  private token: string;

  constructor() {
    this.token = config.wechat.kfToken;
  }

  verifyUrl(params: VerifyUrlParams): string | null {
    const { msg_signature, timestamp, nonce, echostr } = params;

    if (!msg_signature || !timestamp || !nonce || !echostr) {
      return null;
    }

    const isValid = CryptoUtil.verifySignature(
      this.token,
      timestamp,
      nonce,
      echostr,
      msg_signature
    );

    if (!isValid) {
      return null;
    }

    try {
      const decrypted = CryptoUtil.decrypt(config.wechat.kfEncodingAESKey, echostr);
      return decrypted;
    } catch (error) {
      return null;
    }
  }

  verifyMessage(msg_signature: string, timestamp: string, nonce: string, encrypted: string): boolean {
    return CryptoUtil.verifySignature(
      this.token,
      timestamp,
      nonce,
      encrypted,
      msg_signature
    );
  }

  decryptMessage(encrypted: string): string {
    return CryptoUtil.decrypt(config.wechat.kfEncodingAESKey, encrypted);
  }
}

export default new SignatureService();
