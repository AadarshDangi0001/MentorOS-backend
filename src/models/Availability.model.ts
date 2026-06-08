import mongoose, { Schema } from 'mongoose';
import { IAvailabilitySlot } from '../types/marketplace.types';

const AvailabilitySchema = new Schema<IAvailabilitySlot>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
    isBooked:  { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AvailabilitySchema.index({ mentor: 1, isBooked: 1, startTime: 1 });
// prevent duplicate overlapping slots at DB level
AvailabilitySchema.index({ mentor: 1, startTime: 1 }, { unique: true });

export const Availability = mongoose.model<IAvailabilitySlot>('Availability', AvailabilitySchema);
