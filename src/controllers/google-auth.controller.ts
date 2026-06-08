import { Request, Response, NextFunction } from 'express';
import { googleAuthService } from '../services/google-auth.service';
import { IUser } from '../types';
import { ENV } from '../config/env';
import { ApiError } from '../utils/ApiError';

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

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Google authentication failed');
      }

      const { user, tokens } = await googleAuthService.handleOAuthCallback(req.user as IUser);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      const wantsJson =
        req.headers.accept?.includes('application/json') ||
        req.query.response_type === 'json';

      if (wantsJson) {
        res.status(200).json({
          success: true,
          message: 'Google login successful',
          data: { user, accessToken: tokens.accessToken },
        });
        return;
      }

      const redirectUrl = new URL(`${ENV.CLIENT_URL}/auth/google/success`);
      redirectUrl.searchParams.set('token', tokens.accessToken);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${ENV.CLIENT_URL}/auth/login?error=google_auth_failed`);
      next(error);
    }
  }

  googleFailure(_req: Request, res: Response): void {
    res.redirect(`${ENV.CLIENT_URL}/auth/login?error=google_auth_failed`);
  }
}

export const googleAuthController = new GoogleAuthController();
