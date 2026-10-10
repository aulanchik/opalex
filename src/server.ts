import app from '@/app';
import { config } from '@/config/env';
import { responseCache } from '@/services/openalex';
import { Logger } from '@/utils/logger';

const server = app.listen(config.port, () => {
  Logger.success(`Server is up at port ${config.port} (cache: ${responseCache.driver})`);
});

let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;

  Logger.info(`${signal} received, shutting down`);

  // Safety net: don't hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();

  server.close(async () => {
    await responseCache.close();
    process.exit(0);
  });

  server.closeIdleConnections();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
