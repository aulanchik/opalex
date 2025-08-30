import express from 'express'
import morgan from 'morgan';
import cors from 'cors';

import routes from '@/routes/openalex';
import { errorHandler } from '@/middleware/errorHandler';


const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

export default app;
