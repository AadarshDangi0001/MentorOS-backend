import { Router } from 'express';
import { availabilityController } from '../../controllers/private/availability.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import {
  createAvailabilityValidator,
  mongoIdParamValidator,
} from '../../validators/private/availability.validator';

const router = Router();

// Public: view mentor's available slots
router.get(
  '/:mentorId',
  mongoIdParamValidator('mentorId'),
  validate,
  availabilityController.getByMentor.bind(availabilityController)
);

// Mentor-only
router.use(authenticate, authorize(UserRole.MENTOR));
router.post(
  '/',
  createAvailabilityValidator,
  validate,
  availabilityController.create.bind(availabilityController)
);
router.delete(
  '/:slotId',
  mongoIdParamValidator('slotId'),
  validate,
  availabilityController.delete.bind(availabilityController)
);

// SUPER_ADMIN also bypasses via authorize Strategy

export default router;
