import express, { Express } from 'express';
import cors from 'cors';
import { requestContext } from './middleware/requestContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5180';
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(requestContext);

  // Mount API v1 routes
  app.use('/api/v1', healthRoutes);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
