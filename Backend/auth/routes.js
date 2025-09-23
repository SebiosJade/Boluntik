const express = require('express');
const { sendVerification, verifyEmail } = require('./controllers/emailVerificationController');
const { signup } = require('./controllers/signupController');
const { login, getMe, updateOnboarding } = require('./controllers/loginController');
const { changePassword, deleteAccount } = require('./controllers/accountController');
const { sendPasswordReset, verifyPasswordResetCode, resetPassword } = require('./controllers/passwordResetController');
const { getUserInterests, updateUserInterests, getAvailableInterests } = require('./controllers/userInterestsController');
const { getProfile, updateProfile, updateInterests, uploadAvatar, deleteAvatar, upload } = require('./controllers/profileController');

const router = express.Router();

// Email verification routes
router.post('/send-verification', sendVerification);
router.post('/verify-email', verifyEmail);

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);
router.patch('/onboarding', updateOnboarding);

// Account management routes
router.patch('/change-password', changePassword);
router.delete('/account', deleteAccount);

// Password reset routes
router.post('/forgot-password', sendPasswordReset);
router.post('/verify-reset-code', verifyPasswordResetCode);
router.post('/reset-password', resetPassword);

// User interests routes
router.get('/interests', getUserInterests);
router.put('/interests', updateUserInterests);
router.get('/interests/available', getAvailableInterests);

// Profile management routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/interests', updateInterests);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', deleteAvatar);

module.exports = router;
