import { Router } from 'express';
import { reviewController } from '../../controllers/private/review.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

// Public: view mentor's reviews
router.get('/:mentorId', reviewController.getByMentor.bind(reviewController));

// Private: submit review
router.post(
  '/',
  authenticate,
  authorize(UserRole.STUDENT),
  reviewController.submit.bind(reviewController)
);

export default router;
