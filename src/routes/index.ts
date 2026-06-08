import { Router } from 'express';
import authRoutes         from './auth.routes';
import exploreRoutes      from './explore.routes';
import packageRoutes      from './package.routes';
import availabilityRoutes from './availability.routes';
import paymentRoutes      from './payment.routes';
import bookingRoutes      from './booking.routes';
import adminRoutes        from './admin.routes';
import mentorRoutes from './mentor.routes';
import { meetingRoutes, reviewRouter } from './meeting-review.routes';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/mentors',      exploreRoutes);
router.use('/packages',     packageRoutes);
router.use('/availability', availabilityRoutes);
router.use('/payments',     paymentRoutes);
router.use('/bookings',     bookingRoutes);
router.use('/meetings',     meetingRoutes);
router.use('/reviews',      reviewRouter);
router.use('/admin',        adminRoutes);
router.use('/mentor', mentorRoutes);

export default router;
