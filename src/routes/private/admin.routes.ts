import { Router } from 'express';
import { adminController } from '../../controllers/private/admin.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

// Allow both ADMIN and SUPER_ADMIN for general admin functionalities
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/stats',                       adminController.getStats.bind(adminController));
router.get('/users',                       adminController.listUsers.bind(adminController));
router.patch('/users/:id/block',           adminController.blockUser.bind(adminController));
router.patch('/users/:id/unblock',         adminController.unblockUser.bind(adminController));
router.patch('/users/:id/delete',          adminController.deleteUser.bind(adminController));
router.patch('/mentors/:id/approve',       adminController.approveMentor.bind(adminController));
router.patch('/mentors/:id/reject',        adminController.rejectMentor.bind(adminController));
router.get('/bookings',                    adminController.listBookings.bind(adminController));
router.get('/payments',                    adminController.listPayments.bind(adminController));

// Restrict role modification strictly to SUPER_ADMIN
router.patch('/users/:id/role',            authorize(UserRole.SUPER_ADMIN), adminController.changeUserRole.bind(adminController));

export default router;
