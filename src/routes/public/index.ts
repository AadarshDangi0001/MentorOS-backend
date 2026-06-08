import { Router } from 'express';
import authRoutes from './auth.routes';
import exploreRoutes from './explore.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/mentors', exploreRoutes);
router.use('/payments', webhookRoutes);

export default router;
