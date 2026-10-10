import { config } from '@/config/env';
import { createCache } from '@/cache';
import { rateLimiter } from '@/utils/limiter';
import { deduplicate } from '@/utils/deduplicate';
import { HttpError } from '@/utils/errors';
import { Logger } from '@/utils/logger';

export const ENTITIES = [
  'works',
  'authors',
  'sources',
  'institutions',
  'topics',
  'keywords',
  'publishers',
  'funders',
] as const;

export type Entity = (typeof ENTITIES)[number];

export interface RateLimitInfo {
  remaining?: number;
  creditsUsed?: number;
}

export interface ServiceResult {
  data: unknown;
  fromCache: boolean;
  rateLimit?: RateLimitInfo;
}

export interface CacheValue {
  data: unknown;
  rateLimit?: RateLimitInfo;
}

/** In-memory or Redis, chosen by CACHE_DRIVER. Call `responseCache.close()` on shutdown. */
export const responseCache = createCache<CacheValue>(config);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const headerNumber = (res: Response, name: string): number | undefined => {
  const raw = res.headers.get(name);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

/** Delay before retry `attempt` (0-based): exponential backoff with jitter, or Retry-After when sent. */
const retryDelayMs = (attempt: number, res?: Response): number => {
  const retryAfter = res ? headerNumber(res, 'retry-after') : undefined;
  if (retryAfter !== undefined && retryAfter >= 0) {
    return Math.min(retryAfter, 10) * 1000;
  }
  return Math.min(500 * 2 ** attempt, 8000) + Math.floor(Math.random() * 250);
};

/**
 * 429 means either a burst over 100 req/s (worth retrying) or an exhausted daily
 * budget (retrying within seconds can't help). OpenAlex reports the latter as Remaining <= 0.
 */
const isRetryable = (res: Response): boolean => {
  if (res.status >= 500) return true;
  if (res.status === 429) {
    const remaining = headerNumber(res, 'x-ratelimit-remaining');
    return remaining === undefined || remaining > 0;
  }
  return false;
};

const toHttpError = async (res: Response): Promise<HttpError> => {
  let message = `OpenAlex responded with status ${res.status}`;
  const text = await res.text().catch(() => '');

  if (text) {
    try {
      const body = JSON.parse(text);
      const detail = body?.message ?? body?.error;
      if (typeof detail === 'string' && detail) message = detail;
    } catch {
      message = text.slice(0, 300);
    }
  }

  const retryAfter = headerNumber(res, 'retry-after');

  // Pass through errors the caller can act on; hide upstream auth/server problems behind a 502.
  if (res.status === 400 || res.status === 404) {
    return new HttpError(res.status, message);
  }

  if (res.status === 429) {
    const remaining = headerNumber(res, 'x-ratelimit-remaining');
    const exhausted = remaining !== undefined && remaining <= 0;
    return new HttpError(
      429,
      exhausted ? 'OpenAlex daily budget exhausted' : 'OpenAlex rate limit exceeded',
      retryAfter,
    );
  }

  Logger.info(`[OpenAlex] upstream error ${res.status}: ${message}`);
  return new HttpError(502, 'OpenAlex request failed');
};

const fetchOpenAlex = async (path: string, params: Record<string, string>): Promise<CacheValue> => {
  const url = new URL(`${config.api}${path}`);

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  // OpenAlex authenticates with an api_key query parameter. The old mailto/polite pool is ignored.
  url.searchParams.set('api_key', config.apiKey);

  for (let attempt = 0; ; attempt++) {
    try {
      await rateLimiter.acquire();
    } catch {
      throw new HttpError(503, 'Proxy is saturated, try again shortly', 1);
    }

    let res: Response;

    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(config.requestTimeoutMs),
      });
    } catch {
      if (attempt < config.maxRetries) {
        await sleep(retryDelayMs(attempt));
        continue;
      }
      throw new HttpError(504, 'OpenAlex did not respond in time');
    }

    if (res.ok) {
      return {
        data: await res.json(),
        rateLimit: {
          remaining: headerNumber(res, 'x-ratelimit-remaining'),
          creditsUsed: headerNumber(res, 'x-ratelimit-credits-used'),
        },
      };
    }

    if (isRetryable(res) && attempt < config.maxRetries) {
      const delay = retryDelayMs(attempt, res);
      await res.arrayBuffer().catch(() => undefined); // release the connection
      Logger.info(`[OpenAlex] ${res.status} on ${path}, retry ${attempt + 1} in ${delay}ms`);
      await sleep(delay);
      continue;
    }

    throw await toHttpError(res);
  }
};

/** Cache/dedupe key. Built from the path and client params only, so the API key never ends up in it. */
const cacheKey = (path: string, params: Record<string, string>): string => {
  const query = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join('&');
  return `${path}?${query}`;
};

const request = async (path: string, params: Record<string, string>): Promise<ServiceResult> => {
  const key = cacheKey(path, params);

  const cached = await responseCache.get(key);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const fresh = await deduplicate(key, async () => {
    const value = await fetchOpenAlex(path, params);
    // Not awaited: the caller shouldn't wait on the cache write, and set() never rejects.
    void responseCache.set(key, value);
    return value;
  });

  return { ...fresh, fromCache: false };
};

export class OpenAlexService {
  static list(entity: Entity, params: Record<string, string>): Promise<ServiceResult> {
    return request(`/${entity}`, params);
  }

  static getById(
    entity: Entity,
    id: string,
    params: Record<string, string> = {},
  ): Promise<ServiceResult> {
    // encodeURI keeps ":" and "/" so doi:10.1234/abc and https://doi.org/... reach OpenAlex intact.
    return request(`/${entity}/${encodeURI(id)}`, params);
  }
}
