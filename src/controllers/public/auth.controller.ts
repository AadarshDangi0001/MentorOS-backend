import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/public/auth.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';
import { UserRole } from '../../types';
import { ENV } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.IS_PROD,
  sameSite: ENV.IS_PROD ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class PublicAuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const { user, tokens } = await authService.register(name, email, password, role as UserRole);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      sendCreated(
        res,
        { user, accessToken: tokens.accessToken },
        'Registration successful. Please verify your email.'
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token required' });
        return;
      }
      const tokens = await authService.refreshToken(token);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.verifyEmail(req.params.token);
      sendSuccess(res, { user }, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resendVerificationEmail(req.body.email);
      sendSuccess(
        res,
        null,
        'If your email is registered and unverified, a new verification link has been sent'
      );
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.params.token, req.body.password);
      res.clearCookie('refreshToken');
      sendSuccess(res, null, 'Password reset successful. Please login again.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new PublicAuthController();
