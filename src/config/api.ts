import axios, { AxiosError } from 'axios';
import { env } from './env';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const RETRIABLE_STATUS_CODES = [429, 500, 502, 503, 504];

const client = axios.create({
    baseURL: env.api,
    timeout: 5000,
});

client.interceptors.request.use((config) => {
    if (env.apiKey) {
        config.headers.Authorization = `Bearer ${env.apiKey}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { _retryCount?: number }) => {
        const status = error.response?.status;
        const isRetriable = status && RETRIABLE_STATUS_CODES.includes(status);

        if (!isRetriable) {
            return Promise.reject(error);
        }

        const retryCount = error._retryCount ?? 0;
        if (retryCount >= MAX_RETRIES) {
            return Promise.reject(error);
        }

        error._retryCount = retryCount + 1;

        const retryAfter = error.response?.headers['retry-after'];
        const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_RETRY_DELAY * Math.pow(2, retryCount);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return client(error.config!);
    }
);

export default client;
