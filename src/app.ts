import express, { Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import openalex from '@/routes/openalex';
import { config } from '@/config/env';
import { errorHandler, notFound } from '@/middleware/errors';

const app: Express = express();

app.disable('x-powered-by');
app.use(cors());

if (config.enableMorgan) {
  app.use(morgan('dev'));
}

app.use('/', openalex);

app.use(notFound);
app.use(errorHandler);

export default app;
