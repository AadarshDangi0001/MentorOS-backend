import mongoose, { Schema } from 'mongoose';
import { IStudent } from '../types';

const StudentSchema = new Schema<IStudent>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    college: { type: String, trim: true },
    degree: { type: String, trim: true },
    graduationYear: { type: Number, min: 2000, max: 2035 },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    linkedIn: { type: String, trim: true },
    github: { type: String, trim: true },
    resumeUrl: { type: String },
    sessionsBooked: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
  },
  { timestamps: true }
);

StudentSchema.index({ user: 1 });
StudentSchema.index({ skills: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
