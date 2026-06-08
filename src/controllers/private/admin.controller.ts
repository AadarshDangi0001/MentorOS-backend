import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User.model';
import { Mentor } from '../../models/Mentor.model';
import { Booking } from '../../models/Booking.model';
import { Payment } from '../../models/Payment.model';
import { bookingDAO } from '../../dao/booking.dao';
import { paymentDAO } from '../../dao/payment.dao';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { MentorStatus, UserStatus, UserRole } from '../../types';
import { deleteUserSession, deleteCache, deleteKeysByPattern } from '../../config/redis';

export class AdminController {
  // ─── Users ────────────────────────────────────────────────
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find()
          .select('-password -refreshTokens')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(),
      ]);
      sendSuccess(res, { users, total }, undefined, 200);
      return;
    } catch (e) {
      next(e);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role: UserRole.BLOCKED, status: UserStatus.SUSPENDED } },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache
      await deleteUserSession(req.params.id);

      sendSuccess(res, { user }, 'User blocked');
    } catch (e) {
      next(e);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const targetRole = role && Object.values(UserRole).includes(role) ? role : UserRole.STUDENT;

      if (targetRole === UserRole.BLOCKED || targetRole === UserRole.DELETED) {
        throw ApiError.badRequest('Cannot unblock user to BLOCKED or DELETED role');
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role: targetRole, status: UserStatus.ACTIVE } },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache
      await deleteUserSession(req.params.id);

      sendSuccess(res, { user }, 'User unblocked');
    } catch (e) {
      next(e);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role: UserRole.DELETED, status: UserStatus.INACTIVE } },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache
      await deleteUserSession(req.params.id);

      sendSuccess(res, null, 'User marked as deleted');
    } catch (e) {
      next(e);
    }
  }

  async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      if (!role || !Object.values(UserRole).includes(role)) {
        throw ApiError.badRequest('Invalid or missing role');
      }

      const updateData: Record<string, any> = { role };
      if (role === UserRole.BLOCKED) {
        updateData.status = UserStatus.SUSPENDED;
      } else if (role === UserRole.DELETED) {
        updateData.status = UserStatus.INACTIVE;
      } else {
        updateData.status = UserStatus.ACTIVE;
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache
      await deleteUserSession(req.params.id);

      sendSuccess(res, { user }, 'User role updated successfully');
    } catch (e) {
      next(e);
    }
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

      // Invalidate explore caches
      await Promise.all([
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${mentor._id}`),
        deleteCache(`explore:mentor:detail:${req.params.id}`),
      ]);

      sendSuccess(res, { mentor }, 'Mentor approved');
    } catch (e) {
      next(e);
    }
  }

  async rejectMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const mentor = await Mentor.findOneAndUpdate(
        { user: req.params.id },
        { $set: { mentorStatus: MentorStatus.REJECTED } },
        { new: true }
      );
      if (!mentor) throw ApiError.notFound('Mentor not found');

      // Invalidate explore caches
      await Promise.all([
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${mentor._id}`),
        deleteCache(`explore:mentor:detail:${req.params.id}`),
      ]);

      sendSuccess(res, { mentor }, 'Mentor rejected');
    } catch (e) {
      next(e);
    }
  }

  // ─── Bookings / Payments ──────────────────────────────────
  async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const result = await bookingDAO.findAll(page, limit);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const result = await paymentDAO.findAll(page, limit);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  }

  // ─── Stats ────────────────────────────────────────────────
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [userRoles, totalBookings, totalPayments, revenueResult] = await Promise.all([
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Booking.countDocuments(),
        Payment.countDocuments(),
        Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      const totalRevenue = revenueResult[0]?.total ?? 0;

      const roles: Record<string, number> = {};
      Object.values(UserRole).forEach((r) => {
        roles[r] = 0;
      });
      userRoles.forEach((item: { _id: string; count: number }) => {
        if (item._id) {
          roles[item._id] = item.count;
        }
      });

      sendSuccess(
        res,
        {
          users: {
            total: Object.values(roles).reduce((a, b) => a + b, 0),
            roles,
          },
          bookings: {
            total: totalBookings,
          },
          payments: {
            total: totalPayments,
            revenueINR: totalRevenue / 100,
          },
        },
        'System statistics retrieved'
      );
    } catch (e) {
      next(e);
    }
  }
}

export const adminController = new AdminController();
