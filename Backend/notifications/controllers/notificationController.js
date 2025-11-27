const Notification = require('../../models/Notification');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');

// Get all notifications for a user
exports.getNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments({ userId });

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    data: { notifications },
  });
});

// Get unread notification count
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const count = await Notification.getUnreadCount(userId);

  res.status(200).json({
    status: 'success',
    data: { count },
  });
});

// Mark notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOne({ id: notificationId, userId });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read',
    data: { notification },
  });
});

// Mark all notifications as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  await Notification.markAllAsRead(userId);

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

// Delete notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOneAndDelete({ id: notificationId, userId });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Notification deleted successfully',
  });
});

// Create notification (admin only)
exports.createNotification = catchAsync(async (req, res, next) => {
  const { userId, type, title, message, data } = req.body;

  if (!userId || !type || !title || !message) {
    return next(new AppError('User ID, type, title, and message are required', 400));
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data: data || {},
  });

  logger.info(`Notification created - User: ${userId}, Type: ${type}, Title: ${title}`);

  res.status(201).json({
    status: 'success',
    message: 'Notification created successfully',
    data: { notification },
  });
});

// Create donation notification helper (for donor)
exports.createDonationNotification = async (userId, type, campaignTitle, donationAmount, additionalData = {}) => {
  try {
    const notification = await Notification.createDonationNotification(
      userId,
      type,
      campaignTitle,
      donationAmount,
      additionalData
    );

    logger.info(`Donation notification created - User: ${userId}, Type: ${type}, Campaign: ${campaignTitle}`);
    return notification;
  } catch (error) {
    logger.error('Error creating donation notification:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Create new donation notification helper (for org and admin)
exports.createNewDonationNotification = async (userId, donorName, campaignTitle, donationAmount, additionalData = {}) => {
  try {
    const notification = await Notification.createNewDonationNotification(
      userId,
      donorName,
      campaignTitle,
      donationAmount,
      additionalData
    );

    logger.info(`New donation notification created - User: ${userId}, Donor: ${donorName}, Campaign: ${campaignTitle}`);
    return notification;
  } catch (error) {
    logger.error('Error creating new donation notification:', error);
  }
};

// Create campaign notification helper (for admin and volunteers)
exports.createCampaignNotification = async (userId, campaignTitle, organizationName, goalAmount, additionalData = {}) => {
  try {
    const notification = await Notification.createCampaignNotification(
      userId,
      campaignTitle,
      organizationName,
      goalAmount,
      additionalData
    );

    logger.info(`Campaign notification created - User: ${userId}, Campaign: ${campaignTitle}`);
    return notification;
  } catch (error) {
    logger.error('Error creating campaign notification:', error);
  }
};

// Helper to notify all users with specific role
exports.notifyUsersByRole = async (role, createNotificationFn) => {
  try {
    const User = require('../../models/User');
    const users = await User.find({ role, isActive: true });
    
    const notifications = await Promise.all(
      users.map(user => createNotificationFn(user.id))
    );

    logger.info(`Notified ${notifications.filter(n => n).length} ${role}s`);
    return notifications;
  } catch (error) {
    logger.error(`Error notifying ${role}s:`, error);
  }
};
