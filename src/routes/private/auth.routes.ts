import { Router } from 'express';
import { authController } from '../../controllers/private/auth.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { validate } from '../../middleware/validate';
import { changePasswordValidator } from '../../validators/private/auth.validator';

const router = Router();

router.use(authenticate);

router.get('/me', authController.getMe.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.patch(
  '/change-password',
  changePasswordValidator,
  validate,
  authController.changePassword.bind(authController)
);

export default router;
