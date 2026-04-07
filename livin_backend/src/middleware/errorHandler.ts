import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.stack);

  const status = 'statusCode' in err ? (err as any).statusCode as number : 500;

  // Never leak stack traces or internal details in production
  res.status(status).json({
    message: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
