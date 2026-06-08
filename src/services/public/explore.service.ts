import { SortOrder } from 'mongoose';
import { Mentor } from '../../models/Mentor.model';
import { MentorStatus } from '../../types';
import { ApiError } from '../../utils/ApiError';

export interface MentorFilter {
  company?: string;
  skill?: string;
  minExperience?: number;
  maxExperience?: number;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'rating' | 'experience' | 'price';
  order?: 'asc' | 'desc';
}

export class ExploreService {
  async getMentors(filters: MentorFilter) {
    const {
      company,
      skill,
      minExperience,
      maxExperience,
      minRating,
      page = 1,
      limit = 12,
      sort = 'rating',
      order = 'desc',
    } = filters;

    const query: Record<string, unknown> = {
      mentorStatus: MentorStatus.APPROVED,
    };

    if (company) {
      query.company = {
        $regex: company,
        $options: 'i',
      };
    }

    if (skill) {
      query.expertise = {
        $in: [new RegExp(skill, 'i')],
      };
    }

    if (minExperience !== undefined || maxExperience !== undefined) {
      const expFilter: Record<string, number> = {};

      if (minExperience !== undefined) {
        expFilter.$gte = minExperience;
      }

      if (maxExperience !== undefined) {
        expFilter.$lte = maxExperience;
      }

      query.experience = expFilter;
    }

    if (minRating !== undefined) {
      query.rating = {
        $gte: minRating,
      };
    }

    const sortDir: SortOrder = order === 'asc' ? 1 : -1;

    const sortMap: Record<string, Record<string, SortOrder>> = {
      rating: {
        rating: sortDir,
      },
      experience: {
        experience: sortDir,
      },
      price: {
        hourlyRate: sortDir,
      },
    };

    const skip = (page - 1) * limit;

    const [mentors, total] = await Promise.all([
      Mentor.find(query)
        .populate('user', 'name email avatar bio')
        .select('-documents')
        .sort(
          sortMap[sort] ?? {
            rating: -1 as SortOrder,
          }
        )
        .skip(skip)
        .limit(limit)
        .lean(),

      Mentor.countDocuments(query),
    ]);

    return {
      mentors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMentorById(mentorUserId: string) {
    const mentor = await Mentor.findOne({
      user: mentorUserId,
      mentorStatus: MentorStatus.APPROVED,
    })
      .populate('user', 'name email avatar bio phone')
      .select('-documents')
      .lean();

    if (!mentor) {
      throw ApiError.notFound('Mentor not found');
    }

    return mentor;
  }
}

export const exploreService = new ExploreService();
