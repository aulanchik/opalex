import axios from 'axios';
import { config } from './env';

const client = axios.create({
    baseURL: config.api,
    timeout: 5000
});

export default client;
