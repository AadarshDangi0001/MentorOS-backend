import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User.model';
import { Mentor } from '../../models/Mentor.model';
import { Booking } from '../../models/Booking.model';
import { Payment } from '../../models/Payment.model';
import { bookingDAO } from '../../dao/booking.dao';
import { paymentDAO } from '../../dao/payment.dao';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { MentorStatus, UserStatus, UserRole, IAuthRequest } from '../../types';
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
      const authReq = req as IAuthRequest;
      const actor = authReq.user;
      const targetId = req.params.id;

      if (actor && actor._id.toString() === targetId) {
        throw ApiError.forbidden('You cannot block yourself');
      }

      const user = await User.findByIdAndUpdate(
        targetId,
        { $set: { role: UserRole.BLOCKED, status: UserStatus.SUSPENDED } },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache and explore cache
      await Promise.all([
        deleteUserSession(targetId),
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${targetId}`),
      ]);

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

      // Invalidate user session cache and explore cache
      await Promise.all([
        deleteUserSession(req.params.id),
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${req.params.id}`),
      ]);

      sendSuccess(res, { user }, 'User unblocked');
    } catch (e) {
      next(e);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as IAuthRequest;
      const actor = authReq.user;
      const targetId = req.params.id;

      if (actor && actor._id.toString() === targetId) {
        throw ApiError.forbidden('You cannot delete yourself');
      }

      const user = await User.findByIdAndUpdate(
        targetId,
        { $set: { role: UserRole.DELETED, status: UserStatus.INACTIVE } },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache and explore cache
      await Promise.all([
        deleteUserSession(targetId),
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${targetId}`),
      ]);

      sendSuccess(res, null, 'User marked as deleted');
    } catch (e) {
      next(e);
    }
  }

  async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as IAuthRequest;
      const actor = authReq.user;
      const targetId = req.params.id;
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        throw ApiError.badRequest('Invalid or missing role');
      }

      if (!actor) {
        throw ApiError.unauthorized('User not authenticated');
      }

      // Authorization check:
      // 1. Nobody (neither ADMIN nor SUPER_ADMIN) can change their own role.
      if (actor._id.toString() === targetId) {
        throw ApiError.forbidden('You cannot change your own role');
      }

      // 2. Only SUPER_ADMIN can change user roles.
      if (actor.role !== UserRole.SUPER_ADMIN) {
        throw ApiError.forbidden('Only super admins can modify user roles');
      }

      const updateData: { role: UserRole; status?: UserStatus } = { role };
      if (role === UserRole.BLOCKED) {
        updateData.status = UserStatus.SUSPENDED;
      } else if (role === UserRole.DELETED) {
        updateData.status = UserStatus.INACTIVE;
      } else {
        updateData.status = UserStatus.ACTIVE;
      }

      const user = await User.findByIdAndUpdate(
        targetId,
        { $set: updateData },
        { new: true }
      ).select('-password -refreshTokens');
      if (!user) throw ApiError.notFound('User not found');

      // Invalidate user session cache and explore cache
      await Promise.all([
        deleteUserSession(targetId),
        deleteKeysByPattern('explore:mentors:list:*'),
        deleteCache(`explore:mentor:detail:${targetId}`),
      ]);

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

  async listMentors(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const skip = (page - 1) * limit;
      const [mentors, total] = await Promise.all([
        Mentor.find()
          .populate('user', '-password -refreshTokens')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Mentor.countDocuments(),
      ]);
      sendSuccess(res, { mentors, total }, undefined, 200);
      return;
    } catch (e) {
      next(e);
    }
  }

  async createMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        email,
        password,
        mentorStatus,
        isVerified,
        expertise,
        experience,
        currentRole,
        company,
        linkedIn,
        github,
        hourlyRate,
        languages,
      } = req.body;

      if (!name || !email || !password) {
        throw ApiError.badRequest('Name, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw ApiError.badRequest('A user with this email already exists');
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role: UserRole.MENTOR,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
      await user.save();

      // Create corresponding mentor document
      const mentor = new Mentor({
        user: user._id,
        mentorStatus: mentorStatus || MentorStatus.APPROVED,
        isVerified: isVerified !== undefined ? isVerified : true,
        expertise: expertise || [],
        experience: experience || 0,
        currentRole: currentRole || '',
        company: company || '',
        linkedIn: linkedIn || '',
        github: github || '',
        hourlyRate: hourlyRate || 0,
        languages: languages || ['English'],
      });
      await mentor.save();

      // Invalidate explore list caches
      await deleteKeysByPattern('explore:mentors:list:*');

      sendSuccess(res, { user, mentor }, 'Mentor profile created successfully', 201);
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
