import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const headerValue = req.headers['x-correlation-id'];
  let correlationId: string;

  if (typeof headerValue === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(headerValue)) {
    correlationId = headerValue;
  } else {
    correlationId = randomUUID();
  }

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
