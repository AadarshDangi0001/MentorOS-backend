import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Types } from 'mongoose';
import { paymentDAO } from '../../dao/payment.dao';
import { bookingDAO } from '../../dao/booking.dao';
import { availabilityDAO } from '../../dao/availability.dao';
import { meetingDAO } from '../../dao/meeting.dao';
import { packageDAO } from '../../dao/package.dao';
import { ApiError } from '../../utils/ApiError';
import { ENV } from '../../config/env';
import logger from '../../utils/logger';
import { acquireLock, releaseLock } from '../../config/redis';

let razorpay: Razorpay;

const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

export class PaymentService {
  /**
   * Step 1: Create Razorpay order + a pending payment record + a pending booking.
   * Returns order details for the frontend to open Razorpay checkout.
   */
  async createOrder(
    studentId: string,
    mentorId: string,
    packageId: string,
    availabilityId: string
  ) {
    const lockKey = `lock:slot:${availabilityId}`;
    const locked = await acquireLock(lockKey, 5000); // 5-second lock
    if (!locked) {
      throw ApiError.conflict(
        'This slot is currently being booked by another user. Please try again in a moment.'
      );
    }

    try {
      // --- validate package
      const pkg = await packageDAO.findById(packageId);
      if (!pkg || !pkg.isActive) throw ApiError.notFound('Package not found or inactive');
      if (pkg.mentor.toString() !== mentorId)
        throw ApiError.badRequest('Package does not belong to this mentor');

      // --- validate & lock slot atomically
      const slot = await availabilityDAO.markBooked(availabilityId);
      if (!slot) throw ApiError.conflict('Slot is no longer available');

      // --- create pending booking
      const booking = await bookingDAO.create({
        student: new Types.ObjectId(studentId),
        mentor: new Types.ObjectId(mentorId),
        package: new Types.ObjectId(packageId),
        availability: new Types.ObjectId(availabilityId),
        scheduledAt: slot.startTime,
        duration: pkg.duration,
      });

      // --- create Razorpay order (amount in paise)
      const rp = getRazorpay();
      const order = await rp.orders.create({
        amount: pkg.price * 100,
        currency: 'INR',
        receipt: booking._id.toString(),
      });

      // --- persist payment record
      const payment = await paymentDAO.create({
        booking: booking._id,
        student: new Types.ObjectId(studentId),
        amount: pkg.price * 100,
        gatewayOrderId: order.id,
      });

      await bookingDAO.setPayment(booking._id.toString(), payment._id);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        paymentId: payment._id,
        keyId: ENV.RAZORPAY_KEY_ID,
      };
    } finally {
      await releaseLock(lockKey);
    }
  }

  /**
   * Step 2: Verify Razorpay signature, confirm booking, create meeting record.
   */
  async verifyAndConfirm(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    meetingData: { roomId: string; provider: string; meetingLink: string; hostLink?: string }
  ) {
    // Verify signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      throw ApiError.badRequest('Payment verification failed: invalid signature');
    }

    // Find payment by order id
    const payment = await paymentDAO.findByGatewayOrderId(razorpayOrderId);
    if (!payment) throw ApiError.notFound('Payment record not found');

    // Idempotency: already confirmed
    if (payment.status === 'paid') return { alreadyConfirmed: true };

    // Mark payment paid
    await paymentDAO.markPaid(payment._id.toString(), razorpayPaymentId, razorpaySignature);

    // Get booking to know times
    const booking = await bookingDAO.findById(payment.booking.toString());
    if (!booking) throw ApiError.internal('Booking not found');

    // Create meeting record (from your existing meet backend)
    const meeting = await meetingDAO.create({
      booking: payment.booking,
      roomId: meetingData.roomId,
      provider: meetingData.provider,
      meetingLink: meetingData.meetingLink,
      hostLink: meetingData.hostLink,
      startTime: booking.scheduledAt,
      endTime: new Date(new Date(booking.scheduledAt).getTime() + booking.duration * 60 * 1000),
    });

    // Confirm booking + attach meeting
    await bookingDAO.updateStatus(payment.booking.toString(), 'confirmed');
    await bookingDAO.setMeeting(payment.booking.toString(), meeting._id);

    logger.info(`Booking confirmed: ${payment.booking}, meeting: ${meeting._id}`);

    return {
      alreadyConfirmed: false,
      bookingId: payment.booking,
      meetingLink: meeting.meetingLink,
    };
  }

  /**
   * Razorpay webhook handler.
   * Verify webhook signature, then process payment.captured / payment.failed.
   */
  async handleWebhook(rawBody: string, signature: string) {
    const expected = crypto
      .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    const entity = event?.payload?.payment?.entity;
    if (!entity) return;

    if (event.event === 'payment.captured') {
      const payment = await paymentDAO.findByGatewayOrderId(entity.order_id);
      if (payment && payment.status === 'pending') {
        await paymentDAO.markPaid(payment._id.toString(), entity.id, entity.id);
        await bookingDAO.updateStatus(payment.booking.toString(), 'confirmed');
      }
    }

    if (event.event === 'payment.failed') {
      const payment = await paymentDAO.findByGatewayOrderId(entity.order_id);
      if (payment) {
        await paymentDAO.markFailed(payment._id.toString());
        await bookingDAO.updateStatus(payment.booking.toString(), 'cancelled');
        // free the slot
        const booking = await bookingDAO.findById(payment.booking.toString());
        if (booking) {
          await availabilityDAO.markFree((booking.availability as Types.ObjectId).toString());
        }
      }
    }
  }
}

export const paymentService = new PaymentService();
