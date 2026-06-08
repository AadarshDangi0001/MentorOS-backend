import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { paymentController } from '../../controllers/private/payment.controller';

const router = Router();

// Webhook: needs raw body BEFORE json parsing.
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

export default router;
