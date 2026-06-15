import { Router } from 'express';
import { bookingController } from '../../controllers/private/booking.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize, requireEmailVerified } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import {
  bookingQueryValidator,
  requestRescheduleValidator,
  mongoIdParamValidator,
} from '../../validators/private/booking.validator';

const router = Router();

router.use(authenticate);

// Student
router.get(
  '/my',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  bookingQueryValidator,
  validate,
  bookingController.getMyBookings.bind(bookingController)
);
router.post(
  '/:bookingId/accept-reschedule',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  mongoIdParamValidator('bookingId'),
  validate,
  bookingController.acceptReschedule.bind(bookingController)
);
router.post(
  '/:bookingId/reject-reschedule',
  requireEmailVerified,
  authorize(UserRole.STUDENT),
  mongoIdParamValidator('bookingId'),
  validate,
  bookingController.rejectReschedule.bind(bookingController)
);

// Mentor
router.get(
  '/mentor',
  requireEmailVerified,
  authorize(UserRole.MENTOR),
  bookingQueryValidator,
  validate,
  bookingController.getMentorBookings.bind(bookingController)
);
router.post(
  '/:bookingId/reschedule',
  requireEmailVerified,
  authorize(UserRole.MENTOR),
  requestRescheduleValidator,
  validate,
  bookingController.requestReschedule.bind(bookingController)
);
// Shared (student or mentor of the booking)
router.get(
  '/:id',
  mongoIdParamValidator('id'),
  validate,
  bookingController.getById.bind(bookingController)
);
router.post(
  '/:bookingId/cancel',
  requireEmailVerified,
  mongoIdParamValidator('bookingId'),
  validate,
  bookingController.cancelBooking.bind(bookingController)
);

export default router;
