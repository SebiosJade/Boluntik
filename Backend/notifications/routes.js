const express = require('express');
const notificationController = require('./controllers/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes (require authentication)
router.get('/', protect, notificationController.getNotifications);
router.get('/unread-count', protect, notificationController.getUnreadCount);
router.patch('/:notificationId/read', protect, notificationController.markAsRead);
router.patch('/read-all', protect, notificationController.markAllAsRead);
router.delete('/:notificationId', protect, notificationController.deleteNotification);

// Admin routes
router.post('/', protect, restrictTo('admin'), notificationController.createNotification);

module.exports = router;
