import { Router } from 'express';
import { bookingController } from '../../controllers/private/booking.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize, requireEmailVerified } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

router.use(authenticate);

// Student
router.get(
  '/my',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  bookingController.getMyBookings.bind(bookingController)
);
router.post(
  '/:bookingId/accept-reschedule',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  bookingController.acceptReschedule.bind(bookingController)
);
router.post(
  '/:bookingId/reject-reschedule',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  bookingController.rejectReschedule.bind(bookingController)
);

// Mentor
router.get(
  '/mentor',
  requireEmailVerified,
  authorize(UserRole.MENTOR),
  bookingController.getMentorBookings.bind(bookingController)
);
router.post(
  '/:bookingId/reschedule',
  requireEmailVerified,
  authorize(UserRole.MENTOR),
  bookingController.requestReschedule.bind(bookingController)
);

// Shared (student or mentor of the booking)
router.get('/:id', bookingController.getById.bind(bookingController));

export default router;
