import { config } from './config';
import createApp from './app';
import redisConfig from './config/redis.config';
import logger from './services/logger/logger.service';

const startServer = async () => {
  try {
    logger.info('Starting WeChat-COZE integration service...');

    await redisConfig.connect();

    const pong = await redisConfig.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info('Service started successfully');
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await redisConfig.disconnect();
          logger.info('Redis connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
