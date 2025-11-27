const express = require('express');
const router = express.Router();
const { authenticateToken, restrictTo } = require('../middleware/auth');
const userManagementController = require('./controllers/userManagementController');
const userReportController = require('./controllers/userReportController');
const analyticsController = require('./controllers/analyticsController');

// User Management Routes (Admin only)
router.get('/users', authenticateToken, restrictTo('admin'), userManagementController.getAllUsers);
router.get('/users/:userId', authenticateToken, userManagementController.getUserById); // Public profile
router.put('/users/:userId/suspend', authenticateToken, restrictTo('admin'), userManagementController.suspendUser);
router.put('/users/:userId/unsuspend', authenticateToken, restrictTo('admin'), userManagementController.unsuspendUser);
router.delete('/users/:userId', authenticateToken, restrictTo('admin'), userManagementController.deleteUser);
router.post('/users/:userId/reset-password', authenticateToken, restrictTo('admin'), userManagementController.resetUserPassword);
router.put('/users/:userId/update', authenticateToken, restrictTo('admin'), userManagementController.updateUserInfo);

// User Report Routes
router.post('/reports', authenticateToken, userReportController.createReport); // Any user can report
router.get('/reports', authenticateToken, restrictTo('admin'), userReportController.getAllReports);
router.get('/reports/:reportId', authenticateToken, restrictTo('admin'), userReportController.getReportById);
router.put('/reports/:reportId/review', authenticateToken, restrictTo('admin'), userReportController.reviewReport);
router.get('/my-reports', authenticateToken, userReportController.getUserReports);

// Analytics Routes (Admin only)
router.get('/analytics/usage', authenticateToken, restrictTo('admin'), analyticsController.getUsageAnalytics);
router.get('/analytics/revenue', authenticateToken, restrictTo('admin'), analyticsController.getRevenueAnalytics);
router.get('/analytics/overview', authenticateToken, restrictTo('admin'), analyticsController.getSystemOverview);

module.exports = router;

