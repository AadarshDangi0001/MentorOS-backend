import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { IAuthRequest } from '../types';

export class ReviewController {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const { bookingId, rating, review } = req.body;
      const r = await reviewService.submit(studentId, bookingId, rating, review);
      sendCreated(res, { review: r }, 'Review submitted');
    } catch (e) { next(e); }
  }

  async getByMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await reviewService.getByMentor(
        req.params.mentorId,
        Number(page ?? 1),
        Number(limit ?? 10)
      );
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }
}

export const reviewController = new ReviewController();
