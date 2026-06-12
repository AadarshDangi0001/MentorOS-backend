import { Request, Response, NextFunction } from 'express';
import { googleAuthService } from '../../services/public/google-auth.service';
import { IUser } from '../../types';
import { ENV } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import logger from '../../utils/logger';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.IS_PROD,
  sameSite: ENV.IS_PROD ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class GoogleAuthController {
  initiateGoogle(_req: Request, _res: Response): void {
    // passport.authenticate('google') handles this
  }

  async googleCallback(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Google authentication failed');
      }

      const { user, tokens } = await googleAuthService.handleOAuthCallback(req.user as IUser);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      const wantsJson =
        req.headers.accept?.includes('application/json') || req.query.response_type === 'json';

      if (wantsJson) {
        res.status(200).json({
          success: true,
          message: 'Google login successful',
          data: { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
        });
        return;
      }

      const redirectUrl = new URL(`${ENV.FRONTEND_URL}/auth/google/success`);
      redirectUrl.searchParams.set('token', tokens.accessToken);
      redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error('Google callback handling error:', error);
      res.redirect(`${ENV.FRONTEND_URL}/?error=google_auth_failed`);
    }
  }

  googleFailure(_req: Request, res: Response): void {
    res.redirect(`${ENV.FRONTEND_URL}/?error=google_auth_failed`);
  }
}

export const googleAuthController = new GoogleAuthController();
