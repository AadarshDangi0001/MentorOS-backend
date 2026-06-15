import mongoose, { Schema } from 'mongoose';
import { IMentor, MentorStatus } from '../types';

const AvailabilitySchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const MentorSchema = new Schema<IMentor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    mentorStatus: {
      type: String,
      enum: Object.values(MentorStatus),
      default: MentorStatus.PENDING_REVIEW,
    },
    expertise: [{ type: String, trim: true }],
    experience: { type: Number, min: 0, default: 0 },
    currentRole: { type: String, trim: true },
    company: { type: String, trim: true },
    linkedIn: { type: String, trim: true },
    github: { type: String, trim: true },
    hourlyRate: { type: Number, min: 0 },
    languages: [{ type: String, default: ['English'] }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    availability: [AvailabilitySchema],
    isVerified: { type: Boolean, default: false },
    documents: [{ type: String }],
  },
  { timestamps: true }
);

MentorSchema.index({ mentorStatus: 1 });
MentorSchema.index({ expertise: 1 });
MentorSchema.index({ rating: -1 });

export const Mentor = mongoose.model<IMentor>('Mentor', MentorSchema);
