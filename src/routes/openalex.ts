import { Router } from 'express';
import { ENTITIES, responseCache } from '@/services/openalex';
import { OpenAlexController } from '@/controllers/openalex';
import { getInFlightCount } from '@/utils/deduplicate';
import { rateLimiter } from '@/utils/limiter';
import { config } from '@/config/env';

const router = Router();

for (const entity of ENTITIES) {
  router.get(`/${entity}`, OpenAlexController.list(entity));

  // Regex route so IDs containing slashes (DOIs, URLs) match; works on Express 4 and 5.
  // The capture is available as req.params[0].
  router.get(new RegExp(`^/${entity}/(.+)$`), OpenAlexController.getById(entity));
}

if (!config.isProduction) {
  router.get('/debug/in-flight', (_req, res) => {
    res.json({ inFlightRequests: getInFlightCount() });
  });

  router.get('/debug/rate-limit', (_req, res) => {
    res.json(rateLimiter.getStatus());
  });

  router.get('/debug/cache', (_req, res) => {
    res.json(responseCache.status());
  });
}

export default router;
