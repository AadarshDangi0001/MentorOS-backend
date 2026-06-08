import { userDAO } from '../../dao/user.dao';
import { ApiError } from '../../utils/ApiError';
import { getTokenTTL } from '../../utils/jwt';
import { blacklistToken } from '../../config/redis';
import { IUser } from '../../types';

export class PrivateAuthService {
  // ─── Logout ────────────────────────────────────────────────
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const ttl = getTokenTTL(accessToken);
    if (ttl > 0) await blacklistToken(accessToken, ttl);

    // [DAO] remove refresh token from DB
    await userDAO.pullRefreshToken(userId, refreshToken);
  }

  // ─── Change Password ───────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    accessToken: string
  ): Promise<void> {
    // [DAO] fetch with password field
    const user = await userDAO.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    // [DAO] update password + wipe all sessions
    await userDAO.changePasswordAndClearSessions(user, newPassword);

    // blacklist current access token in Redis
    const ttl = getTokenTTL(accessToken);
    if (ttl > 0) await blacklistToken(accessToken, ttl);
  }

  // ─── Get Me ────────────────────────────────────────────────
  async getMe(userId: string): Promise<IUser> {
    // [DAO] plain user fetch
    const user = await userDAO.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }
}

export const authService = new PrivateAuthService();
