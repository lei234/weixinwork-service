import express, { Application } from 'express';
import { config } from './config';
import webhookController from './controllers/webhook.controller';
import { ErrorHandler, asyncHandler } from './middlewares/error-handler.middleware';
import logger from './services/logger/logger.service';

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', webhookController.healthCheck);

  app.get('/webhook/wechat', webhookController.verifyUrl);

  app.post('/webhook/wechat', webhookController.handleCallback);

  app.use(ErrorHandler.notFound);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    ErrorHandler.handle(err, req, res, next);
  });

  return app;
};

export default createApp;
