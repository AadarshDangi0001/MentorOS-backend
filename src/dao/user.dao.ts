import { Types } from 'mongoose';
import { User } from '../models/User.model';
import { IUser, UserStatus } from '../types';
import { deleteUserSession } from '../config/redis';

/**
 * UserDAO — all raw MongoDB operations for the User collection.
 * No business logic, no throwing ApiErrors — just DB calls.
 * Services consume this and handle logic on top.
 */
export class UserDAO {
  // ─── Find ──────────────────────────────────────────────────

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findByEmailWithSecrets(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokens');
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).select('+refreshTokens');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password +refreshTokens');
  }

  async findByIdWithRefreshTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshTokens');
  }

  async findByVerificationToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  // Finds unverified user by email — ignores token expiry (for resend)
  async findUnverifiedByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, isEmailVerified: false }).select(
      '+emailVerificationToken +emailVerificationExpires'
    );
  }

  async setVerificationToken(
    userId: Types.ObjectId,
    hashedToken: string,
    expires: Date
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
    });
  }

  async findByResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');
  }

  // ─── Create ────────────────────────────────────────────────

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    emailVerificationToken: string;
    emailVerificationExpires: Date;
  }): Promise<IUser> {
    return User.create(data);
  }

  // ─── Update ────────────────────────────────────────────────

  async resetLoginAttempts(userId: Types.ObjectId): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 },
    });
  }

  async updateLastLogin(userId: Types.ObjectId): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { lastLogin: new Date() },
    });
  }

  async setPasswordResetToken(
    userId: Types.ObjectId,
    hashedToken: string,
    expires: Date
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });
  }

  async clearPasswordResetToken(userId: Types.ObjectId): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    });
  }

  async markEmailVerified(user: IUser): Promise<IUser> {
    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    const saved = await user.save();
    await deleteUserSession(user._id.toString());
    return saved;
  }

  async savePasswordAndClearSessions(user: IUser, newPassword: string): Promise<IUser> {
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    const saved = await user.save();
    await deleteUserSession(user._id.toString());
    return saved;
  }

  async changePasswordAndClearSessions(user: IUser, newPassword: string): Promise<IUser> {
    user.password = newPassword;
    user.refreshTokens = [];
    const saved = await user.save();
    await deleteUserSession(user._id.toString());
    return saved;
  }

  // ─── Refresh Token Management ──────────────────────────────

  async pushRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          $each: [token],
          $slice: -5, // keep only last 5 sessions
        },
      },
    });
    await deleteUserSession(userId);
  }

  async pullRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: token },
    });
    await deleteUserSession(userId);
  }

  async rotateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: oldToken },
      $push: { refreshTokens: newToken },
    });
    await deleteUserSession(userId);
  }
}

export const userDAO = new UserDAO();
