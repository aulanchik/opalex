import express from 'express'
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';

import routes from '@/routes/openalex';
import { errorHandler } from '@/middleware/errorHandler';
import { env } from '@/config/env';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.enableMorgan) {
    app.use(morgan('dev'));
}

app.use('/api', routes);
app.use(errorHandler);

export default app;
