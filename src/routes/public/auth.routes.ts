import { Router } from 'express';
import passport from 'passport';
import { ENV } from '../../config/env';
import logger from '../../utils/logger';
import { authController } from '../../controllers/public/auth.controller';
import { googleAuthController } from '../../controllers/public/google-auth.controller';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
} from '../../validators/public/auth.validator';

const router = Router();

// ─── Google OAuth ─────────────────────────────────────────────
router.get(
  '/google',
  (req, res, next) => {
    const role = req.query.role === 'mentor' ? 'mentor' : 'student';
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: JSON.stringify({ role }),
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, _info) => {
      if (err || !user) {
        logger.error('Google OAuth callback strategy/token error:', err || 'No user returned');
        return res.redirect(`${ENV.FRONTEND_URL}/?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleAuthController.googleCallback.bind(googleAuthController)
);

router.get('/google/failure', googleAuthController.googleFailure.bind(googleAuthController));

// ─── Local Auth ───────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  registerValidator,
  validate,
  authController.register.bind(authController)
);
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validate,
  authController.login.bind(authController)
);
router.post('/refresh', authController.refreshToken.bind(authController));
router.get('/verify-email/:token', authController.verifyEmail.bind(authController));
router.post(
  '/resend-verification',
  passwordResetLimiter,
  resendVerificationValidator,
  validate,
  authController.resendVerificationEmail.bind(authController)
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword.bind(authController)
);
router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword.bind(authController)
);

export default router;
