import { Request, Response, NextFunction } from 'express';
import { Mentor } from '../../models/Mentor.model';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest } from '../../types';
import { deleteCache, deleteKeysByPattern } from '../../config/redis';

export class MentorController {
  async createOrUpdateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id;
      const {
        company,
        currentRole,
        experience,
        expertise,
        linkedIn,
        github,
        hourlyRate,
        languages,
      } = req.body;

      const mentor = await Mentor.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            company,
            currentRole,
            experience,
            expertise,
            linkedIn,
            github,
            hourlyRate,
            languages,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      // Invalidate explore list and mentor details cache
      await Promise.all([
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${userId}`),
      ]);

      sendSuccess(res, { mentor }, 'Mentor profile updated');
    } catch (e) {
      next(e);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id;
      const mentor = await Mentor.findOne({ user: userId }).populate('user', 'name email avatar');
      if (!mentor) throw ApiError.notFound('Mentor profile not found');
      sendSuccess(res, { mentor });
    } catch (e) {
      next(e);
    }
  }
}

export const mentorController = new MentorController();
