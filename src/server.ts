import app from './app';
import { ENV } from './config/env';
import connectDB from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();

    const server = app.listen(ENV.PORT, () => {
      logger.info(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    });

    // ─── Graceful Shutdown ──────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.close();
        logger.info('Server closed. Database connections terminated.');
        process.exit(0);
      });

      // Force kill after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('UNHANDLED REJECTION:', reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
