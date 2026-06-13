import { Router } from 'express';
import { meetingController } from '../../controllers/private/meeting.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { validate } from '../../middleware/validate';
import { mongoIdParamValidator } from '../../validators/private/booking.validator';

const router = Router();
router.use(authenticate);
router.get(
  '/:bookingId',
  mongoIdParamValidator('bookingId'),
  validate,
  meetingController.getByBooking.bind(meetingController)
);

export default router;
