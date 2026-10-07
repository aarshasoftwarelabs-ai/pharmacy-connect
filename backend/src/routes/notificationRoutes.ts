import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Get all notifications for the authenticated user
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await NotificationService.getUserNotifications(userId, limit, offset);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark single notification as read
router.post('/:id/read', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    const notification = await NotificationService.markAsRead(userId, notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.post('/read-all', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    await NotificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
