import type { Request } from 'express';
import { HttpError } from '@/utils/errors';

type Query = Request['query'];

const PASSTHROUGH = ['search', 'filter', 'sort', 'select', 'group_by', 'cursor', 'seed'] as const;

export const MAX_PER_PAGE = 100; // OpenAlex limit
export const MAX_SAMPLE = 10_000; // OpenAlex limit

const single = (query: Query, name: string): string | undefined => {
  const value = query[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `Query parameter "${name}" must be a single value`);
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const integer = (query: Query, name: string, min: number, max?: number): number | undefined => {
  const raw = single(query, name);

  if (raw === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(raw)) {
    throw new HttpError(400, `Query parameter "${name}" must be an integer`);
  }

  const value = Number(raw);

  if (value < min) {
    throw new HttpError(400, `Query parameter "${name}" must be at least ${min}`);
  }

  return max === undefined ? value : Math.min(value, max);
};

/**
 * Builds the OpenAlex query string for list endpoints.
 * `query` is accepted as a legacy alias for `search`.
 */
export const parseListParams = (query: Query): Record<string, string> => {
  const params: Record<string, string> = {};

  for (const name of PASSTHROUGH) {
    const value = single(query, name);
    if (value !== undefined) params[name] = value;
  }

  if (params.search === undefined) {
    const legacy = single(query, 'query');
    if (legacy !== undefined) params.search = legacy;
  }

  const perPage = integer(query, 'per_page', 1, MAX_PER_PAGE);
  if (perPage !== undefined) params.per_page = String(perPage);

  const page = integer(query, 'page', 1);
  if (page !== undefined) params.page = String(page);

  const sample = integer(query, 'sample', 1, MAX_SAMPLE);
  if (sample !== undefined) params.sample = String(sample);

  return params;
};

/** Single-entity lookups only support field selection. */
export const parseSingletonParams = (query: Query): Record<string, string> => {
  const select = single(query, 'select');
  return select === undefined ? {} : { select };
};

/**
 * Validates an entity ID. Accepts OpenAlex IDs (W2741809807), prefixed external IDs
 * (doi:10.1234/abc, pmid:123, orcid:..., ror:...), full URLs (https://doi.org/...) and "random".
 * These can contain slashes, so the route captures the whole remainder of the path.
 */
export const parseId = (raw: string | undefined): string => {
  const id = raw?.trim();

  if (!id) {
    throw new HttpError(400, 'ID parameter is required');
  }

  if (id.length > 300 || /[\s?#\\\u0000-\u001f]/.test(id) || id.split('/').includes('..')) {
    throw new HttpError(400, 'Invalid ID');
  }

  return id;
};
