import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth/authenticate';
import { authorize } from '../middleware/auth/authorize';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/users',                      adminController.listUsers.bind(adminController));
router.patch('/users/:id/block',          adminController.blockUser.bind(adminController));
router.patch('/users/:id/delete',         adminController.deleteUser.bind(adminController));
router.patch('/mentors/:id/approve',      adminController.approveMentor.bind(adminController));
router.patch('/mentors/:id/reject',       adminController.rejectMentor.bind(adminController));
router.get('/bookings',                   adminController.listBookings.bind(adminController));
router.get('/payments',                   adminController.listPayments.bind(adminController));

export default router;
