import { Router } from 'express';
import { meetingController } from '../../controllers/private/meeting.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { validate } from '../../middleware/validate';
import { mongoIdParamValidator } from '../../validators/private/booking.validator';
import { body } from 'express-validator';

const router = Router();
router.use(authenticate);

router.post(
  '/create',
  body('bookingId').isMongoId().withMessage('Invalid Booking ID'),
  validate,
  meetingController.create.bind(meetingController)
);

router.post(
  '/:bookingId/join-host',
  mongoIdParamValidator('bookingId'),
  validate,
  meetingController.joinHost.bind(meetingController)
);

router.post(
  '/:bookingId/join-user',
  mongoIdParamValidator('bookingId'),
  validate,
  meetingController.joinUser.bind(meetingController)
);

router.post(
  '/:bookingId/end',
  mongoIdParamValidator('bookingId'),
  validate,
  meetingController.end.bind(meetingController)
);

router.get(
  '/:bookingId',
  mongoIdParamValidator('bookingId'),
  validate,
  meetingController.getByBooking.bind(meetingController)
);

export default router;
