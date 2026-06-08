import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { isTokenBlacklisted } from '../../config/redis';
import { User } from '../../models/User.model';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest, UserStatus } from '../../types';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Access token required'));
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist (logout)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return next(ApiError.unauthorized('Token has been revoked'));

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) return next(ApiError.unauthorized('User not found'));

    if (user.status === UserStatus.SUSPENDED) {
      return next(ApiError.forbidden('Your account has been suspended'));
    }

    (req as IAuthRequest).user = user;
    next();
  } catch (error: unknown) {
    const name = (error as Error).name;
    if (name === 'TokenExpiredError') return next(ApiError.unauthorized('Access token expired'));
    if (name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid access token'));
    next(error);
  }
};
