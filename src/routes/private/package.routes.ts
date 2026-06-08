import { Router } from 'express';
import { packageController } from '../../controllers/private/package.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

// Public
router.get('/:mentorId', packageController.getByMentor.bind(packageController));

// Mentor-only (authenticated)
router.use(authenticate);
router.post('/', authorize(UserRole.MENTOR), packageController.create.bind(packageController));
router.put('/:id', authorize(UserRole.MENTOR), packageController.update.bind(packageController));
router.delete('/:id', authorize(UserRole.MENTOR), packageController.delete.bind(packageController));

export default router;
