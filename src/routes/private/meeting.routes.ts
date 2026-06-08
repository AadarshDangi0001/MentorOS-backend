import { Router } from 'express';
import { meetingController } from '../../controllers/private/meeting.controller';
import { authenticate } from '../../middleware/auth/authenticate';

const router = Router();
router.use(authenticate);
router.get('/:bookingId', meetingController.getByBooking.bind(meetingController));

export default router;
