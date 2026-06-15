import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../../services/private/booking.service';
import { sendSuccess } from '../../utils/ApiResponse';
import { IAuthRequest } from '../../types';
import { BookingStatus } from '../../types/marketplace.types';

export class BookingController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const booking = await bookingService.getById(req.params.id, userId);
      sendSuccess(res, { booking });
    } catch (e) {
      next(e);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const { status } = req.query;
      const bookings = await bookingService.getStudentBookings(
        userId,
        status as BookingStatus | undefined
      );
      sendSuccess(res, { bookings });
    } catch (e) {
      next(e);
    }
  }

  async getMentorBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const { status } = req.query;
      const bookings = await bookingService.getMentorBookings(
        userId,
        status as BookingStatus | undefined
      );
      sendSuccess(res, { bookings });
    } catch (e) {
      next(e);
    }
  }

  async requestReschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const mentorId = (req as IAuthRequest).user!._id.toString();
      const { newAvailabilityId, reason } = req.body;
      const booking = await bookingService.requestReschedule(
        req.params.bookingId,
        mentorId,
        newAvailabilityId,
        reason
      );
      sendSuccess(res, { booking }, 'Reschedule request sent to student');
    } catch (e) {
      next(e);
    }
  }

  async acceptReschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const booking = await bookingService.acceptReschedule(req.params.bookingId, studentId);
      sendSuccess(res, { booking }, 'Reschedule accepted');
    } catch (e) {
      next(e);
    }
  }

  async rejectReschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const booking = await bookingService.rejectReschedule(req.params.bookingId, studentId);
      sendSuccess(res, { booking }, 'Reschedule rejected');
    } catch (e) {
      next(e);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const booking = await bookingService.cancelBooking(req.params.bookingId, userId);
      sendSuccess(res, { booking }, 'Booking cancelled');
    } catch (e) {
      next(e);
    }
  }
}

export const bookingController = new BookingController();
