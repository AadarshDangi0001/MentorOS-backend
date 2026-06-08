import { createClient } from 'redis';
import { ENV } from './env';
import logger from '../utils/logger';

const redisClient = createClient({ url: ENV.REDIS_URL });

redisClient.on('error', (err) => logger.error('Redis error:', err));
redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};

export const setCache = async (key: string, value: string, ttl?: number): Promise<void> => {
  if (ttl) {
    await redisClient.setEx(key, ttl, value);
  } else {
    await redisClient.set(key, value);
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  return redisClient.get(key);
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export const blacklistToken = async (token: string, ttl: number): Promise<void> => {
  await redisClient.setEx(`blacklist:${token}`, ttl, '1');
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`blacklist:${token}`);
  return result === '1';
};

// ─── Distributed Locking ───────────────────────────────────────
export const acquireLock = async (key: string, ttlMs: number): Promise<boolean> => {
  const result = await redisClient.set(key, 'locked', {
    PX: ttlMs,
    NX: true,
  });
  return result === 'OK';
};

export const releaseLock = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

// ─── User Session Caching ──────────────────────────────────────
export const setUserSession = async (
  userId: string,
  userJson: string,
  ttl: number
): Promise<void> => {
  await redisClient.setEx(`user:session:${userId}`, ttl, userJson);
};

export const getUserSession = async (userId: string): Promise<string | null> => {
  return redisClient.get(`user:session:${userId}`);
};

export const deleteUserSession = async (userId: string): Promise<void> => {
  await redisClient.del(`user:session:${userId}`);
};

// ─── Pattern-Based Cache Invalidation ──────────────────────────
export const deleteKeysByPattern = async (pattern: string): Promise<void> => {
  const keys: string[] = [];
  for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
    keys.push(key);
  }
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export default redisClient;
