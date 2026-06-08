import { Types } from 'mongoose';
import { Payment } from '../models/Payment.model';
import { IPayment } from '../types/marketplace.types';

export class PaymentDAO {
  async create(data: {
    booking: Types.ObjectId;
    student: Types.ObjectId;
    amount: number;
    gatewayOrderId: string;
  }): Promise<IPayment> {
    return Payment.create(data);
  }

  async findById(id: string): Promise<IPayment | null> {
    return Payment.findById(id);
  }

  async findByGatewayOrderId(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ gatewayOrderId: orderId });
  }

  async markPaid(
    id: string,
    gatewayPaymentId: string,
    gatewaySignature: string
  ): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'paid',
          gatewayPaymentId,
          gatewaySignature,
          paidAt: new Date(),
        },
      },
      { new: true }
    );
  }

  async markFailed(id: string): Promise<void> {
    await Payment.findByIdAndUpdate(id, { $set: { status: 'failed' } });
  }

  async findAll(page: number, limit: number): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find()
        .populate('student', 'name email')
        .populate('booking')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      Payment.countDocuments(),
    ]);
    return { payments, total };
  }
}

export const paymentDAO = new PaymentDAO();
