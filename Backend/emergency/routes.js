const express = require('express');
const router = express.Router();
const { authenticateToken, restrictTo } = require('../middleware/auth');
const alertController = require('./controllers/emergencyAlertController');
const analyticsController = require('./controllers/analyticsController');

// Emergency Alert Routes

// Public route - view alert by ID (for email links)
router.get('/alerts/:alertId/view', alertController.getAlertById);

// Volunteer routes
router.get('/alerts/active', authenticateToken, alertController.getActiveAlerts);
router.post('/alerts/:alertId/join', authenticateToken, restrictTo('volunteer'), alertController.joinAlert);
router.post('/alerts/:alertId/checkin', authenticateToken, restrictTo('volunteer'), alertController.checkIn);
router.post('/alerts/:alertId/checkout', authenticateToken, restrictTo('volunteer'), alertController.checkOut);
router.get('/my-responses', authenticateToken, restrictTo('volunteer'), alertController.getMyResponses);
router.get('/volunteer-stats', authenticateToken, restrictTo('volunteer'), analyticsController.getVolunteerStats);

// Organization routes
router.post('/alerts', authenticateToken, restrictTo('organization'), alertController.upload.single('image'), alertController.createEmergencyAlert);
router.get('/organization-alerts', authenticateToken, restrictTo('organization'), alertController.getOrganizationAlerts);
router.put('/alerts/:alertId/status', authenticateToken, restrictTo('organization', 'admin'), alertController.updateAlertStatus);
router.delete('/alerts/:alertId', authenticateToken, restrictTo('organization'), alertController.deleteEmergencyAlert);
router.get('/organization-stats', authenticateToken, restrictTo('organization'), analyticsController.getOrganizationStats);

// Admin routes
router.get('/alerts', authenticateToken, restrictTo('admin'), alertController.getAllAlerts);
router.put('/alerts/:alertId/verify', authenticateToken, restrictTo('admin'), alertController.verifyAlert);
router.get('/dashboard-stats', authenticateToken, restrictTo('admin'), analyticsController.getDashboardStats);
router.get('/analytics', authenticateToken, restrictTo('admin'), analyticsController.getAnalytics);
router.get('/feature-adoption-metrics', authenticateToken, restrictTo('admin'), analyticsController.getFeatureAdoptionMetrics);

module.exports = router;

