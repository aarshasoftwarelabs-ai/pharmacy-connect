import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const safeMessage =
    statusCode >= 500 && env.NODE_ENV !== 'development'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  const response: any = {
    success: false,
    message: safeMessage,
  };

  // Include stack trace only in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
