import mongoose from 'mongoose';
import { ENV } from './env';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(ENV.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnect...');
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
