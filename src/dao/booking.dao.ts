import { Types } from 'mongoose';
import { Booking } from '../models/Booking.model';
import { BookingStatus, IBooking } from '../types/marketplace.types';

export class BookingDAO {
  async create(data: {
    student: Types.ObjectId;
    mentor: Types.ObjectId;
    package: Types.ObjectId;
    availability: Types.ObjectId;
    scheduledAt: Date;
    duration: number;
  }): Promise<IBooking> {
    return Booking.create(data);
  }

  async findById(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate('student', 'name email avatar')
      .populate('mentor', 'name email avatar')
      .populate('package', 'title duration price')
      .populate('availability', 'startTime endTime')
      .populate('meeting', 'meetingLink hostLink status')
      .populate('cancelledBy', 'name email role');
    // no .lean()
  }

  async findByStudent(
    studentId: string,
    status?: BookingStatus | BookingStatus[]
  ): Promise<IBooking[]> {
    const query: Record<string, unknown> = { student: studentId };
    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    return Booking.find(query)
      .populate('mentor', 'name email avatar')
      .populate('package', 'title duration price')
      .populate('meeting', 'meetingLink status')
      .populate('rescheduleNewAvailability', 'startTime endTime')
      .populate('cancelledBy', 'name email role')
      .sort({ scheduledAt: -1 });
  }

  async findByMentor(
    mentorId: string,
    status?: BookingStatus | BookingStatus[]
  ): Promise<IBooking[]> {
    const query: Record<string, unknown> = { mentor: mentorId };
    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    return Booking.find(query)
      .populate('student', 'name email avatar')
      .populate('package', 'title duration price')
      .populate('meeting', 'meetingLink hostLink status')
      .populate('rescheduleNewAvailability', 'startTime endTime')
      .populate('cancelledBy', 'name email role')
      .sort({ scheduledAt: -1 });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  }

  async cancelBooking(id: string, cancelledById: Types.ObjectId): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      id,
      { $set: { status: 'cancelled', cancelledBy: cancelledById } },
      { new: true }
    );
  }

  async setPayment(bookingId: string, paymentId: Types.ObjectId): Promise<void> {
    await Booking.findByIdAndUpdate(bookingId, { $set: { payment: paymentId } });
  }

  async setMeeting(bookingId: string, meetingId: Types.ObjectId): Promise<void> {
    await Booking.findByIdAndUpdate(bookingId, { $set: { meeting: meetingId } });
  }

  async requestReschedule(
    bookingId: string,
    requestedBy: Types.ObjectId,
    newAvailabilityId: Types.ObjectId,
    reason?: string
  ): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          status: 'reschedule_requested',
          rescheduleRequestedBy: requestedBy,
          rescheduleNewAvailability: newAvailabilityId,
          rescheduleReason: reason,
        },
      },
      { new: true }
    );
  }

  async acceptReschedule(
    bookingId: string,
    newAvailabilityId: Types.ObjectId,
    scheduledAt: Date
  ): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          status: 'rescheduled',
          availability: newAvailabilityId,
          scheduledAt,
          rescheduleRequestedBy: undefined,
          rescheduleReason: undefined,
          rescheduleNewAvailability: undefined,
        },
      },
      { new: true }
    );
  }

  async rejectReschedule(bookingId: string): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: { status: 'confirmed' },
        $unset: {
          rescheduleRequestedBy: 1,
          rescheduleReason: 1,
          rescheduleNewAvailability: 1,
        },
      },
      { new: true }
    );
  }

  // Admin
  async findAll(page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find()
        .populate('student', 'name email')
        .populate('mentor', 'name email')
        .populate('package', 'title price')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      Booking.countDocuments(),
    ]);
    return { bookings, total };
  }
}

export const bookingDAO = new BookingDAO();
