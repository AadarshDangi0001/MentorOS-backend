import { Router } from 'express';
import { exploreController } from '../../controllers/public/explore.controller';
import { validate } from '../../middleware/validate';
import { exploreQueryValidator, mongoIdParamValidator } from '../../validators/public/explore.validator';

const router = Router();

router.get(
  '/',
  exploreQueryValidator,
  validate,
  exploreController.getMentors.bind(exploreController)
);
router.get(
  '/:mentorId',
  mongoIdParamValidator('mentorId'),
  validate,
  exploreController.getMentorById.bind(exploreController)
);
router.get(
  '/:mentorId/reviews',
  mongoIdParamValidator('mentorId'),
  exploreQueryValidator,
  validate,
  exploreController.getMentorReviews.bind(exploreController)
);

export default router;
