import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/private/auth.service';
import { sendSuccess } from '../../utils/ApiResponse';
import { IAuthRequest } from '../../types';

export class PrivateAuthController {
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const accessToken = req.headers.authorization?.split(' ')[1] || '';
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || '';
      await authService.logout(authReq.user!._id.toString(), accessToken, refreshToken);
      res.clearCookie('refreshToken');
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const accessToken = req.headers.authorization?.split(' ')[1] || '';
      await authService.changePassword(
        authReq.user!._id.toString(),
        req.body.currentPassword,
        req.body.newPassword,
        accessToken
      );
      res.clearCookie('refreshToken');
      sendSuccess(res, null, 'Password changed. Please login again.');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const user = await authService.getMe(authReq.user!._id.toString());
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new PrivateAuthController();
