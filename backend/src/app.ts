import express, { Express } from 'express';
import cors from 'cors';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import { complianceRouter } from './routes/compliance.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(requestContext);

  // Mount API v1 routes
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/compliance', complianceRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
