import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      [err.type === 'field' ? err.path : 'error']: err.msg,
    }));
    return next(ApiError.badRequest('Validation failed', formatted));
  }
  next();
};
