import { Types } from 'mongoose';
import { Meeting } from '../models/Meeting.model';
import { IMeeting } from '../types/marketplace.types';

export class MeetingDAO {
  async create(data: {
    booking: Types.ObjectId;
    roomId: string;
    provider: string;
    meetingLink: string;
    hostLink?: string;
    startTime: Date;
    endTime: Date;
  }): Promise<IMeeting> {
    return Meeting.create(data);
  }

async findByBooking(bookingId: string) { 
    return Meeting.findOne({ booking: bookingId }).lean();
  }
}

export const meetingDAO = new MeetingDAO();
