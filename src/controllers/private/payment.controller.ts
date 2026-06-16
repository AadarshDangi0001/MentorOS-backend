import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../../services/private/payment.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';
import { IAuthRequest } from '../../types';

export class PaymentController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const { mentorId, packageId, availabilityId } = req.body;
      const order = await paymentService.createOrder(
        studentId,
        mentorId,
        packageId,
        availabilityId
      );
      sendCreated(res, order, 'Payment order created');
    } catch (e) {
      next(e);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        meetingData, // { roomId, provider, meetingLink, hostLink }
      } = req.body;

      const result = await paymentService.verifyAndConfirm(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        meetingData
      );
      sendSuccess(res, result, 'Payment verified. Booking confirmed.');
    } catch (e) {
      next(e);
    }
  }

  /**
   * Webhook — must use raw body (express.raw middleware on this route).
   * The webhook is called by Razorpay, NOT the client.
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      await paymentService.handleWebhook(
        (req as Request & { rawBody: string }).rawBody ?? req.body.toString(),
        signature
      );
      res.status(200).json({ received: true });
    } catch (e) {
      next(e);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = (req as IAuthRequest).user!._id.toString();
      const { bookingId } = req.body;
      const result = await paymentService.cancelPendingBooking(studentId, bookingId);
      sendSuccess(res, result, 'Pending booking removed successfully');
    } catch (e) {
      next(e);
    }
  }
}

export const paymentController = new PaymentController();
