import { OpenAlexResponse, OpenAlexWork, OpenAlexAuthor, OpenAlexInstitution } from '@/types/opalex'
import client from '@/config/api'

export class OpenAlexService {

    static async getWorks(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<OpenAlexResponse> {
        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/works`, { params });
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getAuthors(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<OpenAlexResponse> {
        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/authors`, { params });
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getInstitutions(
        query: string,
        page: number = 1,
        perPage: number = 25
    ): Promise<OpenAlexResponse> {
        const params = {
            search: query,
            page: page,
            per_page: perPage
        };

        try {
            const response = await client.get(`/institutions`, { params });
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getWorkById(
        id: string
    ): Promise<OpenAlexWork> {
        try {
            const response = await client.get(`/works/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getAuthorById(
        id: string
    ): Promise<OpenAlexAuthor> {
        try {
            const response = await client.get(`/authors/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }

    static async getInstitutionById(
        id: string
    ): Promise<OpenAlexInstitution> {
        try {
            const response = await client.get(`/institutions/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`OpenAlex API error: ${error}`);
        }
    }
}
