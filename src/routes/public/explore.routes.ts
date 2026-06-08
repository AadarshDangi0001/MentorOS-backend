import { Router } from 'express';
import { exploreController } from '../../controllers/public/explore.controller';

const router = Router();

router.get('/',                          exploreController.getMentors.bind(exploreController));
router.get('/:mentorId',                 exploreController.getMentorById.bind(exploreController));
router.get('/:mentorId/reviews',         exploreController.getMentorReviews.bind(exploreController));

export default router;
