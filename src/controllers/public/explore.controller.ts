import { Request, Response, NextFunction } from 'express';
import { exploreService } from '../../services/public/explore.service';
import { reviewService } from '../../services/private/review.service';
import { sendSuccess } from '../../utils/ApiResponse';

export class ExploreController {
  async getMentors(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        company, skill, minExperience, maxExperience, minRating,
        page, limit, sort, order,
      } = req.query;

      const result = await exploreService.getMentors({
        company:       company as string,
        skill:         skill as string,
        minExperience: minExperience ? Number(minExperience) : undefined,
        maxExperience: maxExperience ? Number(maxExperience) : undefined,
        minRating:     minRating ? Number(minRating) : undefined,
        page:          page ? Number(page) : 1,
        limit:         limit ? Math.min(Number(limit), 50) : 12,
        sort:          sort as 'rating' | 'experience' | 'price',
        order:         order as 'asc' | 'desc',
      });

      sendSuccess(res, result.mentors, 'Mentors fetched', 200);
    } catch (e) { next(e); }
  }

  async getMentorById(req: Request, res: Response, next: NextFunction) {
    try {
      const mentor = await exploreService.getMentorById(req.params.mentorId);
      sendSuccess(res, { mentor });
    } catch (e) { next(e); }
  }

  async getMentorReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await reviewService.getByMentor(
        req.params.mentorId,
        Number(page ?? 1),
        Number(limit ?? 10)
      );
      sendSuccess(res, result.reviews, 'Reviews fetched');
    } catch (e) { next(e); }
  }
}

export const exploreController = new ExploreController();
