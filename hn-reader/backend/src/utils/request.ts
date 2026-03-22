import { AppError } from '../errors/AppError';

export function readSingleValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

export function parseIntParam(value: unknown, label: string): number {
  const raw = readSingleValue(value);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (!Number.isInteger(parsed)) {
    throw new AppError(400, `Invalid ${label}`, 'INVALID_PARAM');
  }

  return parsed;
}

export function parseBoundedIntQuery(
  value: unknown,
  defaults: { defaultValue: number; min: number; max: number; label: string }
): number {
  const raw = readSingleValue(value);

  if (!raw) {
    return defaults.defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isInteger(parsed) || parsed < defaults.min || parsed > defaults.max) {
    throw new AppError(
      400,
      `Invalid ${defaults.label} parameter. Must be between ${defaults.min} and ${defaults.max}`,
      'INVALID_PAGINATION'
    );
  }

  return parsed;
}

export function parseNonNegativeIntQuery(value: unknown, defaultValue: number, label: string): number {
  const raw = readSingleValue(value);

  if (!raw) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(400, `Invalid ${label} parameter. Must be >= 0`, 'INVALID_PAGINATION');
  }

  return parsed;
}
