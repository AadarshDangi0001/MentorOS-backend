import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis';
import { ENV } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Creates a Redis-backed rate limiter lazily (on first request).
 * This avoids the "client is closed" error that occurs when
 * RedisStore is instantiated before connectRedis() is called.
 */
function createLazyLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
  skipSuccessfulRequests?: boolean;
  message: string;
}): RequestHandler {
  let limiter: RequestHandler | null = null;

  return (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting for testing
   if (ENV.NODE_ENV === 'test') {
  return next();
}

    if (!limiter) {
      limiter = rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
          prefix: options.prefix,
        }),
        validate: { creationStack: false }, // We intentionally create lazily to wait for Redis
        handler: (_req, _res, nxt) => nxt(ApiError.tooMany(options.message)),
      });
    }
    limiter(req, res, next);
  };
}

// General API rate limit
export const apiLimiter = createLazyLimiter({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  prefix: 'rate-limit:api:',
  message: 'Too many requests, please try again later',
});

// Strict limit for auth routes
export const authLimiter = createLazyLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  prefix: 'rate-limit:auth:',
  skipSuccessfulRequests: true, // only count failed attempts
  message: 'Too many auth attempts, please try again in 15 minutes',
});

// Very strict for password reset
export const passwordResetLimiter = createLazyLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  prefix: 'rate-limit:pwd-reset:',
  message: 'Too many password reset requests, please try again in 1 hour',
});
