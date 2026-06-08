import { Router } from 'express';
import passport from 'passport';
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
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/public/auth/google/failure',
  }),
  googleAuthController.googleCallback.bind(googleAuthController)
);

router.get('/google/failure', googleAuthController.googleFailure.bind(googleAuthController));

// ─── Local Auth ───────────────────────────────────────────────
router.post('/register',    authLimiter, registerValidator, validate, authController.register.bind(authController));
router.post('/login',       authLimiter, loginValidator, validate, authController.login.bind(authController));
router.post('/refresh',     authController.refreshToken.bind(authController));
router.get('/verify-email/:token', authController.verifyEmail.bind(authController));
router.post('/resend-verification', passwordResetLimiter, resendVerificationValidator, validate, authController.resendVerificationEmail.bind(authController));
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, authController.forgotPassword.bind(authController));
router.post('/reset-password/:token', passwordResetLimiter, resetPasswordValidator, validate, authController.resetPassword.bind(authController));

export default router;
