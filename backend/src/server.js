import express from 'express';
import cors from 'cors';

import { validateAuthConfig } from './config/auth.js';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import apiRoutes from './routes/index.js';
import { requestContextMiddleware } from './middleware/requestContextMiddleware.js';
import { responseMiddleware } from './middleware/responseMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');

app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(responseMiddleware);

app.use(env.apiPrefix, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

validateAuthConfig();

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
