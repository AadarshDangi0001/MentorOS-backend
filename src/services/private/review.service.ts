import { Types } from 'mongoose';
import { reviewDAO } from '../../dao/review.dao';
import { bookingDAO } from '../../dao/booking.dao';
import { Mentor } from '../../models/Mentor.model';
import { ApiError } from '../../utils/ApiError';
import { deleteCache, deleteKeysByPattern } from '../../config/redis';

export class ReviewService {
  async submit(studentId: string, bookingId: string, rating: number, review?: string) {
    const booking = await bookingDAO.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    const bStudentId =
      (booking.student as { _id: Types.ObjectId })._id?.toString() ?? booking.student.toString();
    if (bStudentId !== studentId) throw ApiError.forbidden('Not your booking');

    if (booking.status !== 'completed') {
      throw ApiError.badRequest('Can only review completed sessions');
    }

    const alreadyReviewed = await reviewDAO.existsByBooking(bookingId);
    if (alreadyReviewed) throw ApiError.conflict('Review already submitted for this booking');

    const mentorId =
      (booking.mentor as { _id: Types.ObjectId })._id?.toString() ?? booking.mentor.toString();

    const newReview = await reviewDAO.create({
      booking: new Types.ObjectId(bookingId),
      mentor: new Types.ObjectId(mentorId),
      student: new Types.ObjectId(studentId),
      rating,
      review,
    });

    // Update mentor rating stats
    const { avg, count } = await reviewDAO.computeRatingStats(mentorId);
    await Mentor.findOneAndUpdate(
      { user: mentorId },
      { $set: { rating: avg, totalReviews: count } }
    );

    // Invalidate explore cache for the mentor list, profile details, and reviews
    await Promise.all([
      deleteKeysByPattern('explore:mentors:list:*'),
      deleteCache(`explore:mentor:detail:${mentorId}`),
      deleteKeysByPattern(`explore:reviews:list:${mentorId}:*`),
    ]);

    return newReview;
  }

  async getByMentor(mentorId: string, page = 1, limit = 10) {
    return reviewDAO.findByMentor(mentorId, page, limit);
  }
}

export const reviewService = new ReviewService();
