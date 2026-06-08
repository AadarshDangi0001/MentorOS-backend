import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { ENV } from './env';
import { profileDAO } from '../dao/profile.dao';
import { User } from '../models/User.model';
import { UserRole, UserStatus, AuthProvider } from '../types';
import logger from '../utils/logger';

passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: ENV.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email returned from Google'), undefined);
        }

        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || email.split('@')[0];

        // ── Case 1: user already linked Google ────────────────
        const googleUser = await User.findOne({ googleId }).select('+refreshTokens');
        if (googleUser) {
          // Update avatar in case it changed
          if (avatar && googleUser.avatar !== avatar) {
            googleUser.avatar = avatar;
            await googleUser.save();
          }
          return done(null, googleUser);
        }

        // ── Case 2: existing local account with same email ────
        const localUser = await User.findOne({ email }).select('+refreshTokens +googleId');
        if (localUser) {
          // Link Google to existing account
          localUser.googleId = googleId;
          localUser.authProvider = AuthProvider.GOOGLE;
          localUser.isEmailVerified = true;
          localUser.status = UserStatus.ACTIVE;
          if (avatar && !localUser.avatar) localUser.avatar = avatar;
          await localUser.save();
          return done(null, localUser);
        }

        // ── Case 3: brand new user via Google ─────────────────
        const newUser = await User.create({
          name,
          email,
          googleId,
          avatar,
          role: UserRole.STUDENT, // default role; user can change later
          authProvider: AuthProvider.GOOGLE,
          isEmailVerified: true, // Google verifies email for us
          status: UserStatus.ACTIVE,
        });

        // Create student profile by default
        await profileDAO.createStudentProfile(newUser._id);

        logger.info(`New Google OAuth user registered: ${email}`);
        return done(null, newUser);
      } catch (error) {
        logger.error('Google OAuth strategy error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Not using sessions — we use JWT, so these are no-ops
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

export default passport;
