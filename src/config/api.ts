import axios from 'axios';
import { env } from './env';

const client = axios.create({
    baseURL: env.api,
    timeout: 5000,
});

client.interceptors.request.use((config) => {
    if (env.apiKey) {
        config.headers.Authorization = `Bearer ${env.apiKey}`;
    }

    return config;
})

export default client;
