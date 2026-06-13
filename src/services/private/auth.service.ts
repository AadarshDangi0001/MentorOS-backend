import { userDAO } from '../../dao/user.dao';
import { ApiError } from '../../utils/ApiError';
import { getTokenTTL } from '../../utils/jwt';
import { blacklistToken, deleteUserSession } from '../../config/redis';
import { IUser } from '../../types';
import { User } from '../../models/User.model';
import { deleteFromImageKit } from '../../utils/imagekit';
import logger from '../../utils/logger';

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

  // ─── Update Me ─────────────────────────────────────────────
  async updateMe(
    userId: string,
    data: { name?: string; phone?: string; bio?: string; avatar?: string }
  ): Promise<IUser> {
    const allowedFields: Record<string, unknown> = {};
    if (data.name !== undefined) allowedFields.name = data.name;
    if (data.phone !== undefined) allowedFields.phone = data.phone;
    if (data.bio !== undefined) allowedFields.bio = data.bio;
    if (data.avatar !== undefined) allowedFields.avatar = data.avatar;

    // Fetch existing user to check the old avatar
    let oldAvatar: string | undefined;
    if (data.avatar !== undefined) {
      const existingUser = await User.findById(userId).select('avatar');
      if (existingUser && existingUser.avatar) {
        oldAvatar = existingUser.avatar;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('User not found');

    // Invalidate cached user session in Redis so subsequent requests get updated data
    await deleteUserSession(userId);

    // Delete old avatar from ImageKit if the avatar was updated/removed
    if (data.avatar !== undefined && oldAvatar && oldAvatar !== data.avatar) {
      deleteFromImageKit(oldAvatar).catch((err) => {
        logger.error('Failed to delete old avatar in background:', err);
      });
    }

    return user;
  }
}

export const authService = new PrivateAuthService();
