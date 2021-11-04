import express from 'express';
import userNotificationController from '../controller/userNotificationController.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/notifications',userNotificationController.sendNotification);
router.get('/notification',rateLimiter, userNotificationController.sendNotification);

export default router;