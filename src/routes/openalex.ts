import { Router } from 'express'
import { OpenAlexController } from '@/controllers/opalex'
import { getInFlightCount } from '@/utils/deduplicate'
import { rateLimiter } from '@/utils/limiter'
import { env } from '@/config/env'

const router = Router();

router.get('/works', OpenAlexController.getWorks);
router.get('/works/:id', OpenAlexController.getWorkById);
router.get('/authors', OpenAlexController.getAuthors);
router.get('/authors/:id', OpenAlexController.getAuthorById);
router.get('/institutions', OpenAlexController.getInstitutions);
router.get('/institutions/:id', OpenAlexController.getInstitutionById);

if (!env.isProduction) {
    router.get('/debug/in-flight', (req, res) => {
        res.json({ inFlightRequests: getInFlightCount() });
    });

    router.get('/debug/rate-limit', (req, res) => {
        res.json(rateLimiter.getStatus());
    });
}

export default router;
