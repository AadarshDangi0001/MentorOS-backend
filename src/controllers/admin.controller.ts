import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { Mentor } from '../models/Mentor.model';
import { bookingDAO } from '../dao/booking.dao';
import { paymentDAO } from '../dao/payment.dao';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { MentorStatus, UserStatus } from '../types';

export class AdminController {
  // ─── Users ────────────────────────────────────────────────
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const skip  = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find().select('-password -refreshTokens').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
        User.countDocuments(),
      ]);
      sendSuccess(res, { users }, undefined, 200);
      return;
    } catch (e) { next(e); }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { status: UserStatus.SUSPENDED } },
        { new: true }
      );
      if (!user) throw ApiError.notFound('User not found');
      sendSuccess(res, { user }, 'User blocked');
    } catch (e) { next(e); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { status: UserStatus.INACTIVE } },
        { new: true }
      );
      if (!user) throw ApiError.notFound('User not found');
      sendSuccess(res, null, 'User marked as deleted');
    } catch (e) { next(e); }
  }

  // ─── Mentors ──────────────────────────────────────────────
  async approveMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const mentor = await Mentor.findOneAndUpdate(
        { user: req.params.id },
        { $set: { mentorStatus: MentorStatus.APPROVED, isVerified: true } },
        { new: true }
      );
      if (!mentor) throw ApiError.notFound('Mentor not found');
      sendSuccess(res, { mentor }, 'Mentor approved');
    } catch (e) { next(e); }
  }

  async rejectMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const mentor = await Mentor.findOneAndUpdate(
        { user: req.params.id },
        { $set: { mentorStatus: MentorStatus.REJECTED } },
        { new: true }
      );
      if (!mentor) throw ApiError.notFound('Mentor not found');
      sendSuccess(res, { mentor }, 'Mentor rejected');
    } catch (e) { next(e); }
  }

  // ─── Bookings / Payments ──────────────────────────────────
  async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const result = await bookingDAO.findAll(page, limit);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const result = await paymentDAO.findAll(page, limit);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }
}

export const adminController = new AdminController();
