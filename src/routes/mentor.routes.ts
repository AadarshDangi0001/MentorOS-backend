import { Router } from 'express';
import { mentorController } from '../controllers/mentor.controller';
import { authenticate } from '../middleware/auth/authenticate';
import { authorize, requireEmailVerified } from '../middleware/auth/authorize';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate, authorize(UserRole.MENTOR), requireEmailVerified);
router.put('/profile', mentorController.createOrUpdateProfile.bind(mentorController));
router.get('/profile', mentorController.getMyProfile.bind(mentorController));

export default router;