import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types/marketplace.types';

const ReviewSchema = new Schema<IReview>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

ReviewSchema.index({ mentor: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
