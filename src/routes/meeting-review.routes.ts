// meeting.routes.ts
import { Router } from 'express';
import { meetingController } from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth/authenticate';

const router = Router();
router.use(authenticate);
router.get('/:bookingId', meetingController.getByBooking.bind(meetingController));

export { router as meetingRoutes };

// review.routes.ts
import { Router as R } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate as auth } from '../middleware/auth/authenticate';
import { authorize } from '../middleware/auth/authorize';
import { UserRole } from '../types';

const reviewRouter = R();
reviewRouter.get('/:mentorId', reviewController.getByMentor.bind(reviewController));
reviewRouter.post('/', auth, authorize(UserRole.STUDENT), reviewController.submit.bind(reviewController));

export { reviewRouter };
