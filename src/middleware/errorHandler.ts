import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { IApiResponse } from '../types';
import logger from '../utils/logger';
import { ENV } from '../config/env';

interface MongoDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: ApiError;

  // Invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Duplicate key
  else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as MongoDuplicateKeyError).code === 11000
  ) {
    const mongoError = err as MongoDuplicateKeyError;

    const field = Object.keys(mongoError.keyValue)[0] ?? 'Field';

    error = ApiError.conflict(`${field} already exists`);
  }

  // Validation error
  else if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      [e.path]: e.message,
    }));

    error = ApiError.badRequest('Validation failed', errors);
  }

  // Operational error
  else if (err instanceof ApiError) {
    error = err;
  }

  // Unknown error
  else {
    const message = err instanceof Error ? err.message : 'Internal server error';

    error = ApiError.internal(message);
  }

  if (!error.isOperational) {
    logger.error(`[${req.method}] ${req.path}`, err instanceof Error ? err.stack : err);
  }

  const response: IApiResponse = {
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(!ENV.IS_PROD &&
      !error.isOperational &&
      err instanceof Error && {
        stack: err.stack,
      }),
  };

  res.status(error.statusCode).json(response);
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
