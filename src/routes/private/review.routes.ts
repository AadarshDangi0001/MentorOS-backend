import { Router } from 'express';
import { reviewController } from '../../controllers/private/review.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import { submitReviewValidator, mongoIdParamValidator } from '../../validators/private/review.validator';

const router = Router();

// Public: view mentor's reviews
router.get(
  '/:mentorId',
  mongoIdParamValidator('mentorId'),
  validate,
  reviewController.getByMentor.bind(reviewController)
);

// Private: submit review
router.post(
  '/',
  authenticate,
  authorize(UserRole.STUDENT),
  submitReviewValidator,
  validate,
  reviewController.submit.bind(reviewController)
);

export default router;
