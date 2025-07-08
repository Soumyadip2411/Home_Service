import { Router } from 'express';
import { getNotifications, markNotificationRead, getUnreadCount } from '../controllers/notification.controller.js';
import auth from '../middleware/auth.js';

const notificationRouter = Router();

notificationRouter.get('/', auth, getNotifications);
notificationRouter.patch('/:id/read', auth, markNotificationRead);
notificationRouter.get('/unread/count', auth, getUnreadCount);

export default notificationRouter; 