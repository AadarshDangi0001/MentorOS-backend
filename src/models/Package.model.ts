import mongoose, { Schema } from 'mongoose';
import { IPackage } from '../types/marketplace.types';

const PackageSchema = new Schema<IPackage>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      max: [180, 'Maximum duration is 180 minutes'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PackageSchema.index({ mentor: 1, isActive: 1 });

export const Package = mongoose.model<IPackage>('Package', PackageSchema);
