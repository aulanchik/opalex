import dotenv from 'dotenv'
dotenv.config()

function int(name: string, fallback: number, min: number): number {
  const value = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(value) && value >= min ? value : fallback
}

export const config = Object.freeze({
  port: int('PORT', 3000, 1),
  openAlexApiKey: process.env.OPENALEX_API_KEY || undefined,
  openAlexBaseUrl: (
    process.env.OPENALEX_BASE_URL || 'https://api.openalex.org'
  ).replace(/\/$/, ''),
  cacheMaxEntries: int('CACHE_MAX_ENTRIES', 5000, 1),
  cacheMaxBytes: int('CACHE_MAX_BYTES', 128 * 1024 * 1024, 1024),
  cacheTtlMs: int('CACHE_TTL_MS', 60 * 60 * 1000, 0),
  cacheStaleMs: int('CACHE_STALE_MS', 6 * 60 * 60 * 1000, 0),
  upstreamTimeoutMs: int('UPSTREAM_TIMEOUT_MS', 15_000, 100),
  upstreamRetries: int('UPSTREAM_RETRIES', 2, 0),
  corsOrigin: process.env.CORS_ORIGIN || '*',
})
