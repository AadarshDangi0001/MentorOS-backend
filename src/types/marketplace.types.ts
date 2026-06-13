import { Document, Types } from 'mongoose';

// ─── Package ──────────────────────────────────────────────────
export interface IPackage extends Document {
  _id: Types.ObjectId;
  mentor: Types.ObjectId;
  title: string;
  duration: number; // minutes
  price: number; // INR paise (multiply by 100 for Razorpay)
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Availability Slot ────────────────────────────────────────
export interface IAvailabilitySlot extends Document {
  _id: Types.ObjectId;
  mentor: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Booking ──────────────────────────────────────────────────
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'reschedule_requested'
  | 'rescheduled';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  mentor: Types.ObjectId;
  package: Types.ObjectId;
  availability: Types.ObjectId;
  payment?: Types.ObjectId;
  meeting?: Types.ObjectId;
  status: BookingStatus;
  scheduledAt: Date;
  duration: number;
  rescheduleRequestedBy?: Types.ObjectId;
  rescheduleReason?: string;
  rescheduleNewAvailability?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Payment ──────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  student: Types.ObjectId;
  amount: number; // in paise
  currency: string;
  gateway: 'razorpay';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Meeting ──────────────────────────────────────────────────
export type MeetingStatus = 'scheduled' | 'started' | 'completed';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  roomId: string;
  provider: string;
  meetingLink: string;
  hostLink?: string;
  passcode?: string;
  startTime: Date;
  endTime: Date;
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ───────────────────────────────────────────────────
export interface IReview extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  mentor: Types.ObjectId;
  student: Types.ObjectId;
  rating: number; // 1-5
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}
