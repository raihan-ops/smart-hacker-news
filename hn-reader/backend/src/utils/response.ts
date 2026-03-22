import { Response } from 'express';
import { ApiErrorBody, ApiErrorResponse, ApiSuccessResponse } from '../types/api';

function buildMeta() {
  return {
    timestamp: new Date().toISOString(),
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: buildMeta(),
  };

  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  error: ApiErrorBody
): void {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    meta: buildMeta(),
  };

  res.status(statusCode).json(payload);
}
