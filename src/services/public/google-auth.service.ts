import { IUser, IAuthTokens } from '../../types';
import { generateAuthTokens } from '../../utils/jwt';
import { userDAO } from '../../dao/user.dao';

/**
 * GoogleAuthService — handles post-passport token issuance.
 * Passport strategy (config/passport.ts) handles the Google API call
 * and user upsert. This service handles everything after that.
 */
export class GoogleAuthService {
  async handleOAuthCallback(user: IUser): Promise<{ user: IUser; tokens: IAuthTokens }> {
    // Issue JWT tokens
    const tokens = generateAuthTokens(user._id.toString(), user.role);

    // [DAO] persist refresh token
    await userDAO.pushRefreshToken(user._id.toString(), tokens.refreshToken);

    // [DAO] update last login
    await userDAO.updateLastLogin(user._id);

    return { user, tokens };
  }
}

export const googleAuthService = new GoogleAuthService();
