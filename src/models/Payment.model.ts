import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../types/marketplace.types';

const PaymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: 'INR' },
    gateway: { type: String, enum: ['razorpay'], default: 'razorpay' },
    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String, index: true },
    gatewaySignature: { type: String },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
