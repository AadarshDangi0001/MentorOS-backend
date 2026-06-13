import { Router } from 'express';
import { packageController } from '../../controllers/private/package.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';
import { validate } from '../../middleware/validate';
import {
  createPackageValidator,
  updatePackageValidator,
  mongoIdParamValidator,
} from '../../validators/private/package.validator';

const router = Router();

// Public
router.get(
  '/:mentorId',
  mongoIdParamValidator('mentorId'),
  validate,
  packageController.getByMentor.bind(packageController)
);

// Mentor-only (authenticated)
router.use(authenticate);
router.post(
  '/',
  authorize(UserRole.MENTOR),
  createPackageValidator,
  validate,
  packageController.create.bind(packageController)
);
router.put(
  '/:id',
  authorize(UserRole.MENTOR),
  updatePackageValidator,
  validate,
  packageController.update.bind(packageController)
);
router.delete(
  '/:id',
  authorize(UserRole.MENTOR),
  mongoIdParamValidator('id'),
  validate,
  packageController.delete.bind(packageController)
);

export default router;
