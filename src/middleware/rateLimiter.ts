import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';
import { ApiError } from '../utils/ApiError';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many requests, please try again later')),
});

// Strict limit for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many auth attempts, please try again in 15 minutes')),
});

// Very strict for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, //¸ 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many password reset requests, please try again in 1 hour')),
});
