import { createApp } from './app.js';
import { logger } from './logging/logger.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const app = createApp();

app.listen(PORT, () => {
  logger.info(`KONE Compliance API server running on port ${PORT}`, { port: PORT });
});
