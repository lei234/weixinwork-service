import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger/logger.service';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ErrorHandler {
  static handle(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error('Error occurred', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  static notFound(req: Request, res: Response): void {
    res.status(404).json({
      success: false,
      error: {
        message: `Route ${req.originalUrl} not found`,
      },
    });
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
