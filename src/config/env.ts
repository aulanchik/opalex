import dotenv from 'dotenv'
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    api: process.env.OPENALEX_API!
}
