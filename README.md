# OpenAlex Proxy

A small Express + TypeScript service that sits in front of the [OpenAlex API](https://developers.openalex.org/).
It keeps your API key on the server, validates and whitelists query parameters, caches and de-duplicates requests to save daily budget, retries transient failures, and returns consistent JSON errors.

## Features

- Server-side API key. Clients never see it, and any `api_key` or `mailto` they send is ignored.
- Endpoints for `works`, `authors`, `sources`, `institutions`, `topics`, `keywords`, `publishers` and `funders`.
- Lookups by OpenAlex ID, DOI, ORCID, ROR and other external IDs, including IDs that contain slashes.
- In-memory TTL/LRU cache plus in-flight de-duplication of identical requests.
- Token-bucket limiter, retries with exponential backoff, `Retry-After` support. A 429 caused by an exhausted daily budget is not retried.
- Upstream 400/404/429 are passed through; other upstream failures become a generic 502.

## Requirements

- Node.js 18 or newer (uses built-in `fetch` and `AbortSignal.timeout`)
- pnpm
- A free OpenAlex API key: create an account and copy the key from <https://openalex.org/settings/api>

## Getting started

```bash
pnpm install
cp .env.example .env     # then set OPENALEX_API_KEY
pnpm dev                 # tsx watch --env-file=.env src/server.ts
```

The server listens on <http://localhost:3000> by default.

## Configuration

Set these in `.env`.

| Variable                 | Default                    | Description                                                         |
| ------------------------ | -------------------------- | ------------------------------------------------------------------- |
| `OPENALEX_API_KEY`       | (required)                 | Your OpenAlex API key. The app refuses to start without it.         |
| `PORT`                   | `3000`                     | HTTP port.                                                          |
| `NODE_ENV`               | `development`              | In `production`, request logging and the debug routes are disabled. |
| `OPENALEX_API`           | `https://api.openalex.org` | Upstream base URL (a trailing slash is stripped).                   |
| `RATE_LIMIT_CAPACITY`    | `50`                       | Token-bucket size: the largest burst of upstream requests.          |
| `RATE_LIMIT_REFILL_RATE` | `50`                       | Tokens added per second. Fractions are allowed.                     |
| `REQUEST_TIMEOUT_MS`     | `15000`                    | Timeout for each upstream attempt.                                  |
| `MAX_RETRIES`            | `3`                        | Retries for 5xx responses, timeouts and burst 429s.                 |
| `CACHE_TTL_SECONDS`      | `3600`                     | How long a response stays cached.                                   |
| `CACHE_MAX_ENTRIES`      | `500`                      | Maximum cached responses (least recently used are evicted).         |

## API

### List: `GET /<entity>`

`<entity>` is one of `works`, `authors`, `sources`, `institutions`, `topics`, `keywords`, `publishers`, `funders`.

| Parameter        | Notes                                                            |
| ---------------- | ---------------------------------------------------------------- |
| `search`         | Full-text search. `query` is accepted as an alias.               |
| `filter`         | OpenAlex filter syntax, e.g. `publication_year:2024,is_oa:true`. |
| `sort`           | e.g. `cited_by_count:desc`.                                      |
| `select`         | Comma-separated fields to return.                                |
| `group_by`       | Aggregate by a field.                                            |
| `per_page`       | 1 to 100. Larger values are clamped to 100.                      |
| `page`           | 1 or higher. Basic paging only reaches the first 10,000 results. |
| `cursor`         | Deep paging. Start with `*`, then pass `meta.next_cursor`.       |
| `sample`, `seed` | Random sample (up to 10,000) and its seed.                       |

Every parameter is optional. Anything not listed above is dropped.

### Single entity: `GET /<entity>/<id>`

`<id>` can be an OpenAlex ID (`W2741809807`), a prefixed external ID (`doi:10.7717/peerj.4375`, `pmid:...`, `orcid:...`, `ror:...`) or a full URL (`https://doi.org/...`). Only `select` is forwarded.

### Response headers

| Header                           | Meaning                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `X-Cache`                        | `HIT` if served from the proxy cache, otherwise `MISS`.                        |
| `X-OpenAlex-RateLimit-Remaining` | Remaining daily budget, as reported by OpenAlex when the response was fetched. |

### Errors

Errors are JSON: `{ "error": "message" }`.

| Status | Meaning                                                                                     |
| ------ | ------------------------------------------------------------------------------------------- |
| 400    | Invalid parameter or ID, or OpenAlex rejected the request.                                  |
| 404    | Unknown route, or the entity does not exist.                                                |
| 429    | OpenAlex rate limit or daily budget exhausted. `Retry-After` is set when OpenAlex sends it. |
| 502    | OpenAlex failed, or rejected the API key. Details are in the server log.                    |
| 503    | The proxy's own rate limiter is saturated. `Retry-After: 1` is set.                         |
| 504    | OpenAlex timed out or was unreachable after retries.                                        |
| 500    | Unexpected error.                                                                           |

### Debug routes

Available only when `NODE_ENV` is not `production`:

- `GET /debug/in-flight`: number of upstream requests currently in flight
- `GET /debug/rate-limit`: state of the local token bucket

## Examples

```bash
curl -i "http://localhost:3000/works?search=crispr&per_page=3&select=id,display_name"
curl "http://localhost:3000/works?filter=publication_year:2024,is_oa:true&sort=cited_by_count:desc&per_page=5&select=id,display_name"
curl "http://localhost:3000/works/W2741809807?select=id,display_name"
curl "http://localhost:3000/works/doi:10.7717/peerj.4375?select=id,doi"
curl "http://localhost:3000/authors?search=hinton&per_page=3&select=id,display_name"
```

## How a request flows

1. Parameters are validated and whitelisted (`src/utils/query.ts`).
2. The cache is checked. A hit returns immediately and costs no OpenAlex budget.
3. Identical in-flight requests are merged into one upstream call.
4. The local token bucket is acquired, then the request is sent with your `api_key`.
5. 5xx responses, timeouts and burst 429s are retried with backoff. A 429 with no budget remaining is not.
6. Successful responses are cached. Failures become JSON errors through the error middleware.

## Cost notes

OpenAlex gives about $1 of free usage per day with an API key (less without one), refilled at midnight UTC. Single-entity lookups are free, list and filter calls cost about $0.0001 each, and searches about $0.001 each. Going above 100 requests per second returns 429. Use `per_page=100`, `select`, and the cache to keep usage low. Check the [OpenAlex pricing docs](https://developers.openalex.org/api-reference/authentication) for current numbers.

The cache and the rate limiter live in process memory, so they are not shared between multiple instances. The limiter only smooths bursts and does not track the daily budget.

## Project structure

```
src/
  app.ts                     Express app: CORS, logging, routes, 404 and error handlers
  server.ts                  Entry point
  config/env.ts              Typed environment configuration
  routes/openalex.ts         Route table (one list and one by-id route per entity)
  controllers/openalex.ts    Parses requests and sends responses
  services/openalex.ts       Upstream calls: auth, cache, de-dupe, limiter, retries
  middleware/errors.ts       JSON 404 and error handlers
  utils/
    cache.ts                 TTL + LRU cache
    deduplicate.ts           In-flight request de-duplication
    errors.ts                HttpError
    limiter.ts               Token-bucket rate limiter
    logger.ts                Logger
    query.ts                 Parameter and ID validation
```

## Type checking

```bash
pnpm exec tsc --noEmit
```
