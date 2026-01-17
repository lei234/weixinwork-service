import { Request, Response } from 'express';
import { VerifyUrlParams } from '../interfaces/wechat.interface';
import signatureService from '../services/wechat/signature.service';
import webhookService from '../services/wechat/webhook.service';
import logger from '../services/logger/logger.service';
import { asyncHandler } from '../middlewares/error-handler.middleware';

export class WebhookController {
  verifyUrl = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { msg_signature, timestamp, nonce, echostr } = req.query as any;

    const params: VerifyUrlParams = {
      msg_signature,
      timestamp,
      nonce,
      echostr,
    };

    logger.info('Received URL verification request', {
      timestamp,
      nonce,
    });

    const result = signatureService.verifyUrl(params);

    if (result) {
      logger.info('URL verification successful');
      res.send(result);
    } else {
      logger.warn('URL verification failed');
      res.status(403).send('Verification failed');
    }
  });

  handleCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Received webhook callback');

    await webhookService.handleCallback(req.body);

    res.json({
      code: 0,
      message: 'success',
    });
  });

  healthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'wechat-coze-integration',
    });
  });
}

export default new WebhookController();
