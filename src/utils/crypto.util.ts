import crypto from 'crypto';

export class CryptoUtil {
  static decrypt(encodingAESKey: string, encryptedMsg: string): string {
    const key = Buffer.from(encodingAESKey + '=', 'base64');
    const iv = key.slice(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedMsg, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const content = decrypted.slice(16);
    const length = content.slice(0, 4).readUInt32BE(0);

    return content.slice(4, length + 4);
  }

  static encrypt(encodingAESKey: string, text: string, appId: string): string {
    const key = Buffer.from(encodingAESKey + '=', 'base64');
    const iv = key.slice(0, 16);
    const randomBytes = crypto.randomBytes(16);
    const textBuffer = Buffer.from(text, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(textBuffer.length, 0);
    const appIdBuffer = Buffer.from(appId, 'utf8');

    const packet = Buffer.concat([randomBytes, lengthBuffer, textBuffer, appIdBuffer]);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(packet);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString('base64');
  }

  static generateSignature(token: string, timestamp: string, nonce: string, encrypted: string): string {
    const arr = [token, timestamp, nonce, encrypted].sort();
    const str = arr.join('');
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    return sha1.digest('hex');
  }

  static verifySignature(
    token: string,
    timestamp: string,
    nonce: string,
    encrypted: string,
    signature: string
  ): boolean {
    const computedSignature = this.generateSignature(token, timestamp, nonce, encrypted);
    return computedSignature === signature;
  }

  static sha1(str: string): string {
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    return sha1.digest('hex');
  }
}

export default CryptoUtil;
