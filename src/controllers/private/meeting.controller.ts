import { Request, Response, NextFunction } from 'express';
import { meetingDAO } from '../../dao/meeting.dao';
import { bookingDAO } from '../../dao/booking.dao';
import { Meeting } from '../../models/Meeting.model';
import { sheryMeetService } from '../../services/private/sherymeet.service';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { IAuthRequest } from '../../types';
import { Types } from 'mongoose';
import crypto from 'crypto';

export class MeetingController {
  async getByBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.params;

      // Access control: must be student or mentor of booking
      const booking = await bookingDAO.findById(bookingId);
      if (!booking) throw ApiError.notFound('Booking not found');

      const studentId =
        (booking.student as { _id: Types.ObjectId })._id?.toString() ?? booking.student.toString();
      const mentorId =
        (booking.mentor as { _id: Types.ObjectId })._id?.toString() ?? booking.mentor.toString();

      if (studentId !== userId && mentorId !== userId) {
        throw ApiError.forbidden('Access denied');
      }

      const meeting = await meetingDAO.findByBooking(bookingId);
      if (!meeting) throw ApiError.notFound('Meeting not found');

      sendSuccess(res, { meeting });
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const mentorId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.body;

      if (!bookingId) {
        throw ApiError.badRequest('Booking ID is required');
      }

      const booking = await bookingDAO.findById(bookingId);
      if (!booking) {
        throw ApiError.notFound('Booking not found');
      }

      // Only the mentor of this booking can create the meeting
      const bookingMentorId = (booking.mentor as any)._id?.toString() ?? booking.mentor.toString();
      if (bookingMentorId !== mentorId) {
        throw ApiError.forbidden('Only the booking mentor can create the meeting');
      }

      // Check if meeting already exists
      let meeting = await Meeting.findOne({ booking: bookingId });
      if (meeting) {
        sendSuccess(res, { meeting }, 'Meeting already exists');
        return;
      }

      // Generate passcode
      const passcode = crypto.randomBytes(8).toString('hex');

      // Call SheryMeet API
      const hostUser = (req as IAuthRequest).user!;
      const hostData = {
        _id: hostUser._id.toString(),
        userName: hostUser.name,
        role: 'mentor',
        email: hostUser.email,
      };

      const response = await sheryMeetService.createMeeting(hostData, passcode);
      if (!response || !response.success || !response.data) {
        throw ApiError.internal('Failed to create meeting room on SheryMeet');
      }

      const { roomName, hostLink, participantLink } = response.data;

      // Save in our database
      meeting = await Meeting.create({
        booking: booking._id,
        roomId: roomName,
        provider: 'livekit',
        meetingLink: participantLink,
        hostLink: hostLink,
        passcode: passcode,
        startTime: booking.scheduledAt,
        endTime: new Date(new Date(booking.scheduledAt).getTime() + booking.duration * 60 * 1000),
        status: 'scheduled',
      });

      // Link meeting to booking
      await bookingDAO.setMeeting(bookingId, meeting._id);

      sendSuccess(res, { meeting }, 'Meeting created successfully');
    } catch (e) {
      next(e);
    }
  }

  async joinHost(req: Request, res: Response, next: NextFunction) {
    try {
      const mentorId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.params;

      const booking = await bookingDAO.findById(bookingId);
      if (!booking) throw ApiError.notFound('Booking not found');

      const bookingMentorId = (booking.mentor as any)._id?.toString() ?? booking.mentor.toString();
      if (bookingMentorId !== mentorId) {
        throw ApiError.forbidden('Only the booking mentor can join as host');
      }

      const meeting = await Meeting.findOne({ booking: bookingId });
      if (!meeting) throw ApiError.notFound('Meeting not found. Please create it first.');

      // Call SheryMeet API
      const hostUser = (req as IAuthRequest).user!;
      const hostData = {
        _id: hostUser._id.toString(),
        userName: hostUser.name,
        role: 'mentor',
        email: hostUser.email,
      };

      const response = await sheryMeetService.joinAsHost(
        meeting.roomId,
        hostData,
        meeting.passcode || ''
      );

      if (!response || !response.success || !response.data) {
        throw ApiError.internal('Failed to join meeting as host');
      }

      // Update meeting status to started if it's scheduled
      if (meeting.status === 'scheduled') {
        meeting.status = 'started';
        await meeting.save();
      }

      sendSuccess(res, response.data, 'Host joined successfully');
    } catch (e) {
      next(e);
    }
  }

  async joinUser(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.params;

      const booking = await bookingDAO.findById(bookingId);
      if (!booking) throw ApiError.notFound('Booking not found');

      const bookingStudentId = (booking.student as any)._id?.toString() ?? booking.student.toString();
      if (bookingStudentId !== studentId) {
        throw ApiError.forbidden('Only the student who booked can join this meeting');
      }

      const meeting = await Meeting.findOne({ booking: bookingId });
      if (!meeting) throw ApiError.notFound('Meeting is not created yet');

      // Verify host has started meeting
      if (meeting.status !== 'started') {
        throw ApiError.badRequest('Meeting has not been started by the host yet');
      }

      // Call SheryMeet API
      const studentUser = (req as IAuthRequest).user!;
      const studentData = {
        _id: studentUser._id.toString(),
        userName: studentUser.name,
        role: 'student',
        email: studentUser.email,
      };

      const response = await sheryMeetService.joinAsUser(meeting.roomId, studentData);
      if (!response || !response.success || !response.data) {
        throw ApiError.internal('Failed to join meeting as student');
      }

      sendSuccess(res, response.data, 'Student joined successfully');
    } catch (e) {
      next(e);
    }
  }

  async end(req: Request, res: Response, next: NextFunction) {
    try {
      const mentorId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.params;

      const booking = await bookingDAO.findById(bookingId);
      if (!booking) throw ApiError.notFound('Booking not found');

      const bookingMentorId = (booking.mentor as any)._id?.toString() ?? booking.mentor.toString();
      if (bookingMentorId !== mentorId) {
        throw ApiError.forbidden('Only the booking mentor can end this meeting');
      }

      const meeting = await Meeting.findOne({ booking: bookingId });
      if (!meeting) throw ApiError.notFound('Meeting not found');

      // Call SheryMeet API
      const response = await sheryMeetService.endMeeting(meeting.roomId);
      if (!response || !response.success) {
        throw ApiError.internal('Failed to end meeting on SheryMeet');
      }

      // Update meeting status
      meeting.status = 'completed';
      await meeting.save();

      // Update booking status
      await bookingDAO.updateStatus(bookingId, 'completed');

      sendSuccess(res, { meeting }, 'Meeting ended successfully');
    } catch (e) {
      next(e);
    }
  }
}

export const meetingController = new MeetingController();
