import { Router } from 'express';
import { paymentController } from '../../controllers/private/payment.controller';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize, requireEmailVerified } from '../../middleware/auth/authorize';
import { UserRole } from '../../types';

const router = Router();

// Student-only & Verified email only
router.use(authenticate, authorize(UserRole.STUDENT), requireEmailVerified);
router.post('/create-order', paymentController.createOrder.bind(paymentController));
router.post('/verify', paymentController.verify.bind(paymentController));

export default router;
