import { Types } from 'mongoose';
import { bookingDAO } from '../../dao/booking.dao';
import { availabilityDAO } from '../../dao/availability.dao';
import { ApiError } from '../../utils/ApiError';
import { BookingStatus } from '../../types/marketplace.types';

export class BookingService {
  async getById(bookingId: string, requesterId: string) {
    const booking = await bookingDAO.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    const studentId =
      (booking.student as { _id: Types.ObjectId })._id?.toString() ?? booking.student.toString();
    const mentorId =
      (booking.mentor as { _id: Types.ObjectId })._id?.toString() ?? booking.mentor.toString();

    if (studentId !== requesterId && mentorId !== requesterId) {
      throw ApiError.forbidden('Access denied');
    }
    return booking;
  }

  async getStudentBookings(studentId: string, status?: BookingStatus | BookingStatus[]) {
    return bookingDAO.findByStudent(studentId, status);
  }

  async getMentorBookings(mentorId: string, status?: BookingStatus | BookingStatus[]) {
    return bookingDAO.findByMentor(mentorId, status);
  }

  /** Mentor requests reschedule */
  async requestReschedule(
    bookingId: string,
    mentorId: string,
    newAvailabilityId: string,
    reason?: string
  ) {
    const booking = await bookingDAO.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    const bMentorId =
      (booking.mentor as { _id: Types.ObjectId })._id?.toString() ?? booking.mentor.toString();
    if (bMentorId !== mentorId) throw ApiError.forbidden('Not your booking');

    if (!['confirmed', 'rescheduled'].includes(booking.status)) {
      throw ApiError.badRequest('Only confirmed bookings can be rescheduled');
    }

    // Validate new slot belongs to mentor and is free
    const newSlot = await availabilityDAO.findById(newAvailabilityId);
    if (!newSlot) throw ApiError.notFound('New slot not found');
    if (newSlot.mentor.toString() !== mentorId) throw ApiError.forbidden('Slot not yours');
    if (newSlot.isBooked) throw ApiError.conflict('New slot is already booked');
    if (newSlot.startTime <= new Date())
      throw ApiError.badRequest('New slot must be in the future');

    return bookingDAO.requestReschedule(
      bookingId,
      new Types.ObjectId(mentorId),
      new Types.ObjectId(newAvailabilityId),
      reason
    );
  }

  /** Student accepts reschedule */
  async acceptReschedule(bookingId: string, studentId: string) {
    const booking = await bookingDAO.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    const bStudentId =
      (booking.student as { _id: Types.ObjectId })._id?.toString() ?? booking.student.toString();
    if (bStudentId !== studentId) throw ApiError.forbidden('Not your booking');

    if (booking.status !== 'reschedule_requested') {
      throw ApiError.badRequest('No reschedule pending on this booking');
    }

    const newAvailId = booking.rescheduleNewAvailability!.toString();

    // Lock new slot
    const locked = await availabilityDAO.markBooked(newAvailId);
    if (!locked) throw ApiError.conflict('New slot is no longer available');

    // Free original slot
    await availabilityDAO.markFree((booking.availability as Types.ObjectId).toString());

    return bookingDAO.acceptReschedule(bookingId, new Types.ObjectId(newAvailId), locked.startTime);
  }

  /** Student rejects reschedule */
  async rejectReschedule(bookingId: string, studentId: string) {
    const booking = await bookingDAO.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    const bStudentId =
      (booking.student as { _id: Types.ObjectId })._id?.toString() ?? booking.student.toString();
    if (bStudentId !== studentId) throw ApiError.forbidden('Not your booking');

    if (booking.status !== 'reschedule_requested') {
      throw ApiError.badRequest('No reschedule pending');
    }

    return bookingDAO.rejectReschedule(bookingId);
  }
}

export const bookingService = new BookingService();
