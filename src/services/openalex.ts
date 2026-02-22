import { OpenAlexResponse, OpenAlexWork, OpenAlexAuthor, OpenAlexInstitution } from '@/types/opalex'
import { Cache } from '@/utils/cache'
import client from '@/config/api'

const CACHE_TTL = {
    SEARCH: 5 * 60 * 1000, // 5 minutes for search results
    DETAILS: 15 * 60 * 1000, // 15 minutes for individual records
}

const generateCacheKey = (prefix: string, params: Record<string, any>) => {
    const sorted = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
    return `${prefix}:${sorted}`;
}

interface CachedResult<T> {
    data: T;
    fromCache: boolean;
}

export class OpenAlexService {

    static async getWorks(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<CachedResult<OpenAlexResponse>> {
        const cacheKey = generateCacheKey('works:search', { query, page, perPage });
        const cached = Cache.get<OpenAlexResponse>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/works`, { params });
            Cache.set(cacheKey, response.data, CACHE_TTL.SEARCH);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getAuthors(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<CachedResult<OpenAlexResponse>> {
        const cacheKey = generateCacheKey('authors:search', { query, page, perPage });
        const cached = Cache.get<OpenAlexResponse>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/authors`, { params });
            Cache.set(cacheKey, response.data, CACHE_TTL.SEARCH);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getInstitutions(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<CachedResult<OpenAlexResponse>> {
        const cacheKey = generateCacheKey('institutions:search', { query, page, perPage });
        const cached = Cache.get<OpenAlexResponse>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/institutions`, { params });
            Cache.set(cacheKey, response.data, CACHE_TTL.SEARCH);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getWorkById(
        id: string
    ): Promise<CachedResult<OpenAlexWork>> {
        const cacheKey = `works:id:${id}`;
        const cached = Cache.get<OpenAlexWork>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        try {
            const response = await client.get(`/works/${id}`);
            Cache.set(cacheKey, response.data, CACHE_TTL.DETAILS);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getAuthorById(
        id: string
    ): Promise<CachedResult<OpenAlexAuthor>> {
        const cacheKey = `authors:id:${id}`;
        const cached = Cache.get<OpenAlexAuthor>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        try {
            const response = await client.get(`/authors/${id}`);
            Cache.set(cacheKey, response.data, CACHE_TTL.DETAILS);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getInstitutionById(
        id: string
    ): Promise<CachedResult<OpenAlexInstitution>> {
        const cacheKey = `institutions:id:${id}`;
        const cached = Cache.get<OpenAlexInstitution>(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        try {
            const response = await client.get(`/institutions/${id}`);
            Cache.set(cacheKey, response.data, CACHE_TTL.DETAILS);
            return { data: response.data, fromCache: false };
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }
}
