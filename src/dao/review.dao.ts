import { Types } from 'mongoose';
import { Review } from '../models/Review.model';
import { IReview } from '../types/marketplace.types';

export class ReviewDAO {
  async create(data: {
    booking: Types.ObjectId;
    mentor: Types.ObjectId;
    student: Types.ObjectId;
    rating: number;
    review?: string;
  }): Promise<IReview> {
    return Review.create(data);
  }

  async existsByBooking(bookingId: string): Promise<boolean> {
    const count = await Review.countDocuments({ booking: bookingId });
    return count > 0;
  }

  async findByMentor(
    mentorId: string,
    page: number,
    limit: number
  ): Promise<{ reviews: IReview[]; total: number }> {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ mentor: mentorId })
        .populate('student', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Review.countDocuments({ mentor: mentorId }),
    ]);
    return { reviews, total };
  }

  /** Recalculate and return new avg rating + count */
  async computeRatingStats(mentorId: string): Promise<{ avg: number; count: number }> {
    const result = await Review.aggregate([
      { $match: { mentor: new Types.ObjectId(mentorId) } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    if (!result.length) return { avg: 0, count: 0 };
    return { avg: parseFloat(result[0].avg.toFixed(2)), count: result[0].count };
  }
}

export const reviewDAO = new ReviewDAO();
