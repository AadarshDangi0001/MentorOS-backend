import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types/marketplace.types';

const BookingSchema = new Schema<IBooking>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    availability: { type: Schema.Types.ObjectId, ref: 'Availability', required: true },
    payment:  { type: Schema.Types.ObjectId, ref: 'Payment' },
    meeting:  { type: Schema.Types.ObjectId, ref: 'Meeting' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'reschedule_requested', 'rescheduled'],
      default: 'pending',
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    duration:    { type: Number, required: true },
    rescheduleRequestedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
    rescheduleReason:         { type: String, trim: true, maxlength: 300 },
    rescheduleNewAvailability:{ type: Schema.Types.ObjectId, ref: 'Availability' },
  },
  { timestamps: true }
);

BookingSchema.index({ student: 1, status: 1 });
BookingSchema.index({ mentor: 1, status: 1 });
BookingSchema.index({ scheduledAt: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
