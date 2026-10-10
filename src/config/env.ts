import 'dotenv/config';

/**
 * Reads an environment variable as an integer.
 * Returns `fallback` when the variable is unset or empty,
 * and throws when it is set to something that isn't an integer.
 */
const int = (name: string, fallback: number): number => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${name} must be an integer, but got ${rawValue}`);
  }

  return value;
};

/**
 * Reads an environment variable as a positive number (fractions allowed,
 * e.g. RATE_LIMIT_REFILL_RATE=0.5). Returns `fallback` when unset or empty.
 */
const positiveFloat = (name: string, fallback: number): number => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number, but got ${rawValue}`);
  }

  return value;
};

/**
 * Reads an environment variable as a string.
 * Returns `fallback` when the variable is unset or empty (whitespace only counts as empty).
 */
const str = (name: string, fallback: string): string => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  return rawValue.trim();
};

/**
 * Reads a required environment variable as a string.
 * Throws when the variable is unset or empty, so the app fails at startup
 * instead of running with a missing secret or connection string.
 */
const requiredStr = (name: string): string => {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return rawValue;
};

const nodeEnv = str('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

const config = {
  isProduction,
  port: int('PORT', 3000),
  api: str('OPENALEX_API', 'https://api.openalex.org').replace(/\/+$/, ''),
  apiKey: requiredStr('OPENALEX_API_KEY'),

  logLevel: isProduction ? 'warn' : 'info',
  enableMorgan: !isProduction,
  rateLimitCapacity: positiveFloat('RATE_LIMIT_CAPACITY', 50),
  rateLimitRefillRate: positiveFloat('RATE_LIMIT_REFILL_RATE', 50),

  requestTimeoutMs: int('REQUEST_TIMEOUT_MS', 15000),
  maxRetries: int('MAX_RETRIES', 3),

  cacheTtlSeconds: int('CACHE_TTL_SECONDS', 3600),
  cacheMaxEntries: int('CACHE_MAX_ENTRIES', 500),
} as const;

export { config };
