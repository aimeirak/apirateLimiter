import Router from 'express';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use(notificationRoutes);

export default router;