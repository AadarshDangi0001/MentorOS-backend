import mongoose, { Schema } from 'mongoose';
import { IMeeting } from '../types/marketplace.types';

const MeetingSchema = new Schema<IMeeting>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    roomId: { type: String, required: true },
    provider: { type: String, required: true, default: 'livekit' },
    meetingLink: { type: String, required: true },
    hostLink: { type: String },
    passcode: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'started', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
