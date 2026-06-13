import { Request, Response, NextFunction } from 'express';
import { uploadToImageKit, deleteFromImageKit } from '../../utils/imagekit';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest } from '../../types';
import { User } from '../../models/User.model';
import { deleteUserSession } from '../../config/redis';
import logger from '../../utils/logger';

export class MediaController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      if (!authReq.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
      }

      // Generate a unique filename to avoid overwrites
      const extension = req.file.originalname.split('.').pop() || 'jpg';
      const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

      const url = await uploadToImageKit(req.file.buffer, uniqueName);

      // Store the old avatar URL to delete it later
      const oldAvatar = authReq.user.avatar;

      // Persist the uploaded avatar URL to the user profile in the database
      const user = await User.findByIdAndUpdate(
        authReq.user._id,
        { $set: { avatar: url } },
        { new: true }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Invalidate cached user session in Redis so subsequent requests retrieve the updated avatar
      await deleteUserSession(authReq.user._id.toString());

      // Delete the old avatar from ImageKit if it exists
      if (oldAvatar) {
        deleteFromImageKit(oldAvatar).catch((err) => {
          logger.error('Failed to delete old avatar in background:', err);
        });
      }

      sendSuccess(res, { url, user }, 'Profile picture uploaded and updated successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
