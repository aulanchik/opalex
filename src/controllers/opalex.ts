import { Request, Response } from 'express';
import { OpenAlexService } from '@/services/openalex';

export class OpenAlexController {

    static async getWorks(
        req: Request,
        res: Response
    ) {
        try {
            const { query, page, per_page } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }

            const results = await OpenAlexService.getWorks(
                query as string,
                parseInt(page as string) || 1,
                parseInt(per_page as string) || 25
            );

            res.json(results);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }

    static async getAuthors(
        req: Request,
        res: Response
    ) {
        try {
            const { query, page, per_page } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }

            const results = await OpenAlexService.getAuthors(
                query as string,
                parseInt(page as string) || 1,
                parseInt(per_page as string) || 25
            );

            res.json(results);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }

    static async getInstitutions(
        req: Request,
        res: Response
    ) {
        try {
            const { query, page, per_page } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }

            const results = await OpenAlexService.getInstitutions(
                query as string,
                parseInt(page as string) || 1,
                parseInt(per_page as string) || 25
            );

            res.json(results);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }

    static async getWorkById(
        req: Request,
        res: Response
    ) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID parameter is required' });
            }

            const result = await OpenAlexService.getWorkById(id);
            res.json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }

    static async getAuthorById(
        req: Request,
        res: Response
    ) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID parameter is required' });
            }

            const result = await OpenAlexService.getAuthorById(id);
            res.json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }

    static async getInstitutionById(
        req: Request,
        res: Response
    ) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID parameter is required' });
            }

            const result = await OpenAlexService.getInstitutionById(id);
            res.json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ error: errorMessage });
        }
    }
}
