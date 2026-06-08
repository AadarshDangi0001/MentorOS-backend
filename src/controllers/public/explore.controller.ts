import { Request, Response, NextFunction } from 'express';
import { exploreService } from '../../services/public/explore.service';
import { reviewService } from '../../services/private/review.service';
import { sendSuccess } from '../../utils/ApiResponse';
import { getCache, setCache } from '../../config/redis';

export class ExploreController {
  async getMentors(req: Request, res: Response, next: NextFunction) {
    try {
      const { company, skill, minExperience, maxExperience, minRating, page, limit, sort, order } =
        req.query;

      const cacheKey = `explore:mentors:list:${JSON.stringify(req.query)}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        sendSuccess(res, JSON.parse(cached), 'Mentors fetched (cached)', 200);
        return;
      }

      const result = await exploreService.getMentors({
        company: company as string,
        skill: skill as string,
        minExperience: minExperience ? Number(minExperience) : undefined,
        maxExperience: maxExperience ? Number(maxExperience) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Math.min(Number(limit), 50) : 12,
        sort: sort as 'rating' | 'experience' | 'price',
        order: order as 'asc' | 'desc',
      });

      await setCache(cacheKey, JSON.stringify(result.mentors), 300); // 5 min TTL
      sendSuccess(res, result.mentors, 'Mentors fetched', 200);
    } catch (e) {
      next(e);
    }
  }

  async getMentorById(req: Request, res: Response, next: NextFunction) {
    try {
      const { mentorId } = req.params;
      const cacheKey = `explore:mentor:detail:${mentorId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        sendSuccess(res, { mentor: JSON.parse(cached) }, 'Mentor fetched (cached)', 200);
        return;
      }

      const mentor = await exploreService.getMentorById(mentorId);
      await setCache(cacheKey, JSON.stringify(mentor), 1800); // 30 min TTL
      sendSuccess(res, { mentor });
    } catch (e) {
      next(e);
    }
  }

  async getMentorReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const { mentorId } = req.params;
      const cacheKey = `explore:reviews:list:${mentorId}:${page ?? 1}:${limit ?? 10}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        sendSuccess(res, JSON.parse(cached), 'Reviews fetched (cached)');
        return;
      }

      const result = await reviewService.getByMentor(
        mentorId,
        Number(page ?? 1),
        Number(limit ?? 10)
      );

      await setCache(cacheKey, JSON.stringify(result.reviews), 600); // 10 min TTL
      sendSuccess(res, result.reviews, 'Reviews fetched');
    } catch (e) {
      next(e);
    }
  }
}

export const exploreController = new ExploreController();
