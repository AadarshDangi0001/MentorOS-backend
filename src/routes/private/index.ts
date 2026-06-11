import { Router } from 'express';
import authRoutes from './auth.routes';
import packageRoutes from './package.routes';
import availabilityRoutes from './availability.routes';
import paymentRoutes from './payment.routes';
import bookingRoutes from './booking.routes';
import meetingRoutes from './meeting.routes';
import reviewRoutes from './review.routes';
import adminRoutes from './admin.routes';
import mentorRoutes from './mentor.routes';
import mediaRoutes from './media.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/availability', availabilityRoutes);
router.use('/payments', paymentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/meetings', meetingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/mentor', mentorRoutes);
router.use('/media', mediaRoutes);

export default router;
