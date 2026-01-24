import dotenv from 'dotenv'
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development', isProduction,
    port: parseInt(process.env.PORT || '3000', 10),
    api: process.env.OPENALEX_API!,
    logLevel: isProduction ? 'warn' : 'info',
    enableMorgan: !isProduction,
};

if (!config.api) {
    throw new Error('OPENALEX API key is missing.');
}
