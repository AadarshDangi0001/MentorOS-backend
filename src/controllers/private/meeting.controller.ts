import { Request, Response, NextFunction } from 'express';
import { meetingDAO } from '../../dao/meeting.dao';
import { bookingDAO } from '../../dao/booking.dao';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest } from '../../types';
import { Types } from 'mongoose';

export class MeetingController {
  async getByBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.params;

      // Access control: must be student or mentor of booking
      const booking = await bookingDAO.findById(bookingId);
      if (!booking) throw ApiError.notFound('Booking not found');

      const studentId = (booking.student as { _id: Types.ObjectId })._id?.toString()
        ?? booking.student.toString();
      const mentorId  = (booking.mentor  as { _id: Types.ObjectId })._id?.toString()
        ?? booking.mentor.toString();

      if (studentId !== userId && mentorId !== userId) {
        throw ApiError.forbidden('Access denied');
      }

      const meeting = await meetingDAO.findByBooking(bookingId);
      if (!meeting) throw ApiError.notFound('Meeting not found');

      sendSuccess(res, { meeting });
    } catch (e) { next(e); }
  }
}

export const meetingController = new MeetingController();
