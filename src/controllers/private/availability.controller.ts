import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../../services/private/availability.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';
import { IAuthRequest } from '../../types';

export class AvailabilityController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const { startTime, endTime } = req.body;
      const slot = await availabilityService.create(
        userId,
        new Date(startTime),
        new Date(endTime)
      );
      sendCreated(res, { slot }, 'Availability slot created');
    } catch (e) { next(e); }
  }

  async getByMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyAvailable = req.query.available === 'true';
      const slots = await availabilityService.getByMentor(req.params.mentorId, onlyAvailable);
      sendSuccess(res, { slots });
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      await availabilityService.delete(userId, req.params.slotId);
      sendSuccess(res, null, 'Slot deleted');
    } catch (e) { next(e); }
  }
}

export const availabilityController = new AvailabilityController();
