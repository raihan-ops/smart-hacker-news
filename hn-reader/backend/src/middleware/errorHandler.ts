import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { AppError, isAppError } from '../errors/AppError';
import { sendError } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, {
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
    sendError(res, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = error.code === 'P2025' ? 404 : 400;
    sendError(res, statusCode, {
      code: error.code,
      message: error.message,
    });
    return;
  }

  const err = error instanceof Error ? error : new Error('Unknown error');

  console.error(`${req.method} ${req.path}`, err);

  sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: config.server.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
}

export function badRequest(message: string, code: string = 'BAD_REQUEST', details?: unknown): never {
  throw new AppError(400, message, code, details);
}
