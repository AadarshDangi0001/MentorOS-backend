import { Router } from 'express';
import { mentorController } from '../../controllers/private/mentor.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize, requireEmailVerified } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import { updateMentorProfileValidator } from '../../validators/private/mentor.validator';

const router = Router();

router.use(authenticate, authorize(UserRole.MENTOR), requireEmailVerified);
router.put(
  '/profile',
  updateMentorProfileValidator,
  validate,
  mentorController.createOrUpdateProfile.bind(mentorController)
);
router.get('/profile', mentorController.getMyProfile.bind(mentorController));

export default router;
