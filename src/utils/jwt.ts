import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ITokenPayload, IAuthTokens, UserRole } from '../types';

export const generateAccessToken = (id: string, role: UserRole): string => {
  return jwt.sign({ id, role }, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRE,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (id: string, role: UserRole): string => {
  return jwt.sign({ id, role }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRE,
  } as jwt.SignOptions);
};

export const generateAuthTokens = (id: string, role: UserRole): IAuthTokens => ({
  accessToken: generateAccessToken(id, role),
  refreshToken: generateRefreshToken(id, role),
});

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as ITokenPayload;
};

export const decodeToken = (token: string): ITokenPayload | null => {
  return jwt.decode(token) as ITokenPayload | null;
};

// Returns seconds until expiry (for Redis TTL)
export const getTokenTTL = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;
  return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
};
