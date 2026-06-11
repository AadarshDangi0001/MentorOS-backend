import { Router } from 'express';
import publicRoutes from './public';
import privateRoutes from './private';
import publicAuthRoutes from './public/auth.routes';

const router = Router();

router.use('/public', publicRoutes);
router.use('/private', privateRoutes);
router.use('/auth', publicAuthRoutes);

export default router;
