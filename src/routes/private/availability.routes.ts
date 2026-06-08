import { Router } from 'express';
import { availabilityController } from '../../controllers/private/availability.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

// Public: view mentor's available slots
router.get('/:mentorId', availabilityController.getByMentor.bind(availabilityController));

// Mentor-only
router.use(authenticate, authorize(UserRole.MENTOR));
router.post('/', availabilityController.create.bind(availabilityController));
router.delete('/:slotId', availabilityController.delete.bind(availabilityController));

// SUPER_ADMIN also bypasses via authorize Strategy

export default router;
