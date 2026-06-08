import { userDAO } from '../dao/user.dao';
import { profileDAO } from '../dao/profile.dao';
import { ApiError } from '../utils/ApiError';
import { generateAuthTokens, verifyRefreshToken, getTokenTTL } from '../utils/jwt';
import { blacklistToken } from '../config/redis';
import { sendEmail, emailTemplates } from '../utils/email';
import { generateRandomToken, hashToken } from '../utils/crypto';
import { IUser, UserRole, IAuthTokens } from '../types';
import { ENV } from '../config/env';
import logger from '../utils/logger';

export class AuthService {

  // ─── Register ──────────────────────────────────────────────
  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole = UserRole.STUDENT
  ): Promise<{ user: IUser; tokens: IAuthTokens }> {

    // [DAO] check duplicate
    const existing = await userDAO.findByEmail(email);
    if (existing) throw ApiError.conflict('Email already registered');

    const verificationToken = generateRandomToken();
    const hashedToken = hashToken(verificationToken);

    // [DAO] create user
    const user = await userDAO.createUser({
      name, email, password, role,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // [DAO] create role profile
    if (role === UserRole.STUDENT) await profileDAO.createStudentProfile(user._id);
    if (role === UserRole.MENTOR)  await profileDAO.createMentorProfile(user._id);

    // send verification email (non-blocking)
    try {
      const { subject, html } = emailTemplates.verifyEmail(name, verificationToken, ENV.CLIENT_URL);
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      logger.error('Verification email failed:', err);
    }

    const tokens = generateAuthTokens(user._id.toString(), user.role);

    // [DAO] persist refresh token
    await userDAO.pushRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user, tokens };
  }

  // ─── Login ─────────────────────────────────────────────────
  async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; tokens: IAuthTokens }> {

    // [DAO] fetch with sensitive fields
    const user = await userDAO.findByEmailWithSecrets(email);
    if (!user) throw ApiError.unauthorized('Invalid credentials');

    if (user.isLocked()) {
      throw ApiError.unauthorized('Account temporarily locked due to too many failed attempts');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await (user as unknown as { incrementLoginAttempts(): Promise<void> }).incrementLoginAttempts();
      throw ApiError.unauthorized('Invalid credentials');
    }

    // [DAO] reset attempts + update lastLogin
    await userDAO.resetLoginAttempts(user._id);

    const tokens = generateAuthTokens(user._id.toString(), user.role);

    // [DAO] persist refresh token
    await userDAO.pushRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user, tokens };
  }

  // ─── Logout ────────────────────────────────────────────────
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const ttl = getTokenTTL(accessToken);
    if (ttl > 0) await blacklistToken(accessToken, ttl);

    // [DAO] remove refresh token from DB
    await userDAO.pullRefreshToken(userId, refreshToken);
  }

  // ─── Refresh Token ─────────────────────────────────────────
  async refreshToken(token: string): Promise<IAuthTokens> {
    const decoded = verifyRefreshToken(token);

    // [DAO] verify token exists in DB
    const user = await userDAO.findByIdWithRefreshTokens(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = generateAuthTokens(user._id.toString(), user.role);

    // [DAO] rotate: pull old, push new
    await userDAO.rotateRefreshToken(user._id.toString(), token, tokens.refreshToken);

    return tokens;
  }
  
   async resendVerificationEmail(email: string): Promise<void> {
    // [DAO] find unverified user — works even if previous token expired
    const user = await userDAO.findUnverifiedByEmail(email);
 
    // Silent return — prevents email enumeration
    if (!user) return;
 
    // Guard: already verified (race condition / double request)
    if (user.isEmailVerified) return;
 
    // Rate-limit resend: block if a valid (non-expired) token still exists
    const tokenStillValid =
      user.emailVerificationExpires &&
      user.emailVerificationExpires > new Date();
 
    if (tokenStillValid) {
      // Tell the client to wait rather than silently ignoring
      throw ApiError.tooMany(
        'A verification email was sent recently. Please wait before requesting another.'
      );
    }
 
    // Generate fresh token
    const rawToken = generateRandomToken();
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
 
    // [DAO] overwrite old token
    await userDAO.setVerificationToken(user._id, hashedToken, expires);
 
    try {
      const { subject, html } = emailTemplates.verifyEmail(user.name, rawToken, ENV.CLIENT_URL);
      await sendEmail({ to: user.email, subject, html });
    } catch (err) {
      // Rollback token so user can try again
      await userDAO.setVerificationToken(user._id, '', new Date(0));
      logger.error('Resend verification email failed:', err);
      throw ApiError.internal('Could not send verification email, please try again');
    }
  }
 

  // ─── Verify Email ──────────────────────────────────────────
  async verifyEmail(token: string): Promise<IUser> {
    const hashedToken = hashToken(token);

    // [DAO] find by hashed token with expiry check
    const user = await userDAO.findByVerificationToken(hashedToken);
    if (!user) throw ApiError.badRequest('Invalid or expired verification token');

    // [DAO] mark verified + activate
    const updated = await userDAO.markEmailVerified(user);

    try {
      const { subject, html } = emailTemplates.welcomeAfterVerify(updated.name);
      await sendEmail({ to: updated.email, subject, html });
    } catch (err) {
      logger.error('Welcome email failed:', err);
    }

    return updated;
  }

  // ─── Forgot Password ───────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    // [DAO] find user — silent return prevents email enumeration
    const user = await userDAO.findByEmail(email);
    if (!user) return;

    const resetToken = generateRandomToken();
    const hashedToken = hashToken(resetToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // [DAO] save reset token
    await userDAO.setPasswordResetToken(user._id, hashedToken, expires);

    try {
      const { subject, html } = emailTemplates.resetPassword(user.name, resetToken, ENV.CLIENT_URL);
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      // [DAO] rollback token if email fails
      await userDAO.clearPasswordResetToken(user._id);
      throw ApiError.internal('Could not send reset email, please try again');
    }
  }

  // ─── Reset Password ────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(token);

    // [DAO] find by reset token with expiry check
    const user = await userDAO.findByResetToken(hashedToken);
    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    // [DAO] set new password + clear all sessions
    await userDAO.savePasswordAndClearSessions(user, newPassword);
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





export const authService = new AuthService();
