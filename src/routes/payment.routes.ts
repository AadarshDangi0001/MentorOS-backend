import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth/authenticate';
import { authorize } from '../middleware/auth/authorize';
import { UserRole } from '../types';

const router = Router();

// Webhook: needs raw body BEFORE json parsing.
// Mount this BEFORE express.json() at the app level, or capture raw body here.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, _res: Response, next: NextFunction) => {
    // Attach raw body string for HMAC verification
    (req as Request & { rawBody: string }).rawBody = req.body.toString('utf-8');
    next();
  },
  paymentController.webhook.bind(paymentController)
);

// Student-only
router.use(authenticate, authorize(UserRole.STUDENT));
router.post('/create-order', paymentController.createOrder.bind(paymentController));
router.post('/verify',       paymentController.verify.bind(paymentController));

export default router;
