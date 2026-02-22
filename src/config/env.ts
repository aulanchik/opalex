import dotenv from 'dotenv'
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development', isProduction,
    port: parseInt(process.env.PORT || '3000', 10),
    api: process.env.OPENALEX_API!,
    apiKey: process.env.OPENALEX_API_KEY!,
    logLevel: isProduction ? 'warn' : 'info',
    enableMorgan: !isProduction,
};

if (!env.apiKey) {
    throw new Error('OPENALEX API key is missing.');
}
