const express = require('express');
const router = express.Router();
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const paymentSettingsController = require('./controllers/paymentSettingsController');
const campaignController = require('./controllers/campaignController');
const fileUploadController = require('./controllers/fileUploadController');

// Payment Settings Routes (Admin only)
router.get('/payment-settings', paymentSettingsController.getSettings);
router.put('/payment-settings', protect, restrictTo('admin'), paymentSettingsController.updateSettings);

// File Upload Routes
router.post('/upload/qr-code', protect, restrictTo('admin'), fileUploadController.uploadQRCode, fileUploadController.handleQRUpload);
router.post('/upload/campaign-image', protect, restrictTo('organization'), fileUploadController.uploadCampaignImage, fileUploadController.handleCampaignImageUpload);
router.post('/upload/donation-screenshot', fileUploadController.uploadDonationScreenshot, fileUploadController.handleDonationScreenshotUpload);

// Campaign Routes
router.get('/campaigns', campaignController.getAllCampaigns);
router.get('/campaigns/:id', campaignController.getCampaign);
router.get('/org/campaigns', protect, restrictTo('organization'), campaignController.getOrgCampaigns);
router.post('/campaigns', protect, restrictTo('organization'), campaignController.createCampaign);
router.put('/campaigns/:id', protect, restrictTo('organization'), campaignController.updateCampaign);
router.delete('/campaigns/:id', protect, restrictTo('organization'), campaignController.deleteCampaign);

// Donation Routes (optionally authenticated - works for both logged-in and guest users)
router.post('/campaigns/:id/donate', optionalAuth, campaignController.submitDonation);
router.get('/my-donations', protect, campaignController.getMyDonations);
router.get('/admin/donations', protect, restrictTo('admin'), campaignController.getAllDonations);
router.put('/admin/campaigns/:campaignId/donations/:donationId/verify', protect, restrictTo('admin'), campaignController.verifyDonation);

// Disbursement Routes (Admin only)
router.post('/admin/campaigns/:campaignId/disburse', protect, restrictTo('admin'), campaignController.disburseFunds);

// Campaign Management Routes (Admin only)
router.post('/admin/complete-expired-campaigns', protect, restrictTo('admin'), campaignController.completeExpiredCampaigns);

module.exports = router;

