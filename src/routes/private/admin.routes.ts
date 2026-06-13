import { Router } from 'express';
import { adminController } from '../../controllers/private/admin.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorizeAtLeast } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import {
  createMentorValidator,
  changeUserRoleValidator,
  unblockUserValidator,
  mongoIdParamValidator,
} from '../../validators/private/admin.validator';

const router = Router();

// Allow both ADMIN and SUPER_ADMIN for general admin functionalities via hierarchy
router.use(authenticate, authorizeAtLeast(UserRole.ADMIN));

router.get('/stats', adminController.getStats.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));
router.get('/mentors', adminController.listMentors.bind(adminController));

router.post(
  '/mentors',
  createMentorValidator,
  validate,
  adminController.createMentor.bind(adminController)
);

router.patch(
  '/users/:id/block',
  mongoIdParamValidator('id'),
  validate,
  adminController.blockUser.bind(adminController)
);

router.patch(
  '/users/:id/unblock',
  unblockUserValidator,
  validate,
  adminController.unblockUser.bind(adminController)
);

router.patch(
  '/users/:id/delete',
  mongoIdParamValidator('id'),
  validate,
  adminController.deleteUser.bind(adminController)
);

router.patch(
  '/mentors/:id/approve',
  mongoIdParamValidator('id'),
  validate,
  adminController.approveMentor.bind(adminController)
);

router.patch(
  '/mentors/:id/reject',
  mongoIdParamValidator('id'),
  validate,
  adminController.rejectMentor.bind(adminController)
);

router.get('/bookings', adminController.listBookings.bind(adminController));
router.get('/payments', adminController.listPayments.bind(adminController));

router.patch(
  '/users/:id/role',
  changeUserRoleValidator,
  validate,
  adminController.changeUserRole.bind(adminController)
);

export default router;
