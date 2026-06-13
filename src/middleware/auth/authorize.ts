import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest, UserRole } from '../../types';
import { hasMinimumRole } from '../../utils/roleBasedAccess';

export const authorize =
  (...roles: UserRole[]) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      const authReq = req as IAuthRequest;
      if (!authReq.user) return next(ApiError.unauthorized());
      // SUPER_ADMIN can access all routes
      if (authReq.user.role === UserRole.SUPER_ADMIN) return next();
      if (!roles.includes(authReq.user.role)) {
        return next(ApiError.forbidden(`Access denied. Required role: ${roles.join(' or ')}`));
      }
      next();
    };

export const authorizeAtLeast =
  (minimumRole: UserRole) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as IAuthRequest;
    if (!authReq.user) return next(ApiError.unauthorized());

    if (!hasMinimumRole(authReq.user.role, minimumRole)) {
      return next(ApiError.forbidden(`Access denied. Required minimum role: ${minimumRole}`));
    }
    next();
  };

export const requireEmailVerified = (req: Request, _res: Response, next: NextFunction): void => {
  const authReq = req as IAuthRequest;
  if (!authReq.user?.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your email address first'));
  }
  next();
};
