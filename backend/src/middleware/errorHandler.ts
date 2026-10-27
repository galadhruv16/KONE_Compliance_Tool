import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger.js';
import { ApiResponse } from '../types/api.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled server error', {
    correlationId: req.correlationId,
    error: err.message,
    path: req.path,
    method: req.method,
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  };

  res.status(500).json(response);
}
