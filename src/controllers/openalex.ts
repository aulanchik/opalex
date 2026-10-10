import type { Request, RequestHandler, Response } from 'express';
import { Entity, OpenAlexService, ServiceResult } from '@/services/openalex';
import { parseId, parseListParams, parseSingletonParams } from '@/utils/query';

const send = (res: Response, result: ServiceResult): void => {
  res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');

  if (result.rateLimit?.remaining !== undefined) {
    res.set('X-OpenAlex-RateLimit-Remaining', String(result.rateLimit.remaining));
  }

  res.json(result.data);
};

/** Forwards rejected promises to the error middleware (Express 4 doesn't do this itself). */
const handle =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

export class OpenAlexController {
  /** GET /<entity>?search=&filter=&sort=&select=&group_by=&per_page=&page=&cursor= */
  static list(entity: Entity): RequestHandler {
    return handle(async (req, res) => {
      const result = await OpenAlexService.list(entity, parseListParams(req.query));
      send(res, result);
    });
  }

  /** GET /<entity>/<id>, where the id may be W123, doi:10.1/x, https://doi.org/10.1/x, ... */
  static getById(entity: Entity): RequestHandler {
    return handle(async (req, res) => {
      // The route is a regex that captures everything after "/<entity>/", slashes included.
      const id = parseId(req.params[0]);
      const result = await OpenAlexService.getById(entity, id, parseSingletonParams(req.query));
      send(res, result);
    });
  }
}
