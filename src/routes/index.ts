import { Router } from 'express';
import publicRoutes from './public';
import privateRoutes from './private';

const router = Router();

router.use('/public', publicRoutes);
router.use('/private', privateRoutes);

export default router;
