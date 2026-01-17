import winston from 'winston';
import path from 'path';
import { config } from '../../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'wechat-coze-integration' },
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

export class LoggerService {
  error(message: string, meta?: any): void {
    logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }
}

export default new LoggerService();
