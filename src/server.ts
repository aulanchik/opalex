import app from '@/app';
import { config } from '@/config/env';
import { Logger } from '@/utils/logger';

const server = app.listen(config.port, () => {
    Logger.success(`Server is up at port ${config.port}`)
})

const shutdown = (signal: string) => {
    Logger.info(`Received ${signal}. Shutting it down gracefully...`);
    server.close((err) => {
        if (err) {
            Logger.error(`Error occured while shutting down: ${err.message}`);
            process.exit(1);
        }
        Logger.success(`Server shut down successfully!`);
        process.exit(0);
    })
}

const signals = ['SIGTERM', 'SIGINT'];

signals.forEach(signal => process.on(signal, () => shutdown(signal)));

process.on('uncaughtException', (err) => {
    Logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    Logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(`Unhandled Rejection at ${promise}: ${reason}`);
    process.exit(1);
});
