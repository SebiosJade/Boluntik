const express = require('express');
const { sendVerification, verifyEmail } = require('./controllers/emailVerificationController');
const { signup } = require('./controllers/signupController');
const { login, getMe, updateOnboarding } = require('./controllers/loginController');
const { logout } = require('./controllers/logoutController');
const { changePassword, deleteAccount } = require('./controllers/accountController');
const { sendPasswordReset, verifyPasswordResetCode, resetPassword } = require('./controllers/passwordResetController');
const { getUserInterests, updateUserInterests, getAvailableInterests } = require('./controllers/userInterestsController');
const { getProfile, updateProfile, updateInterests, uploadAvatar, deleteAvatar, upload } = require('./controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const {
  signupValidation,
  loginValidation,
  emailVerificationValidation,
  passwordResetValidation,
  profileUpdateValidation,
  interestsValidation,
  changePasswordValidation,
  deleteAccountValidation,
  logoutValidation
} = require('../middleware/validation');

const router = express.Router();

// Email verification routes
router.post('/send-verification', sendVerification);
router.post('/verify-email', emailVerificationValidation, verifyEmail);

// Authentication routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', logoutValidation, logout);
router.get('/me', getMe);
router.patch('/onboarding', updateOnboarding);

// Account management routes
router.patch('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.delete('/account', authenticateToken, deleteAccountValidation, deleteAccount);

// Password reset routes
router.post('/forgot-password', sendPasswordReset);
router.post('/verify-reset-code', verifyPasswordResetCode);
router.post('/reset-password', passwordResetValidation, resetPassword);

// User interests routes
router.get('/interests', getUserInterests);
router.put('/interests', interestsValidation, updateUserInterests);
router.get('/interests/available', getAvailableInterests);

// Profile management routes
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, profileUpdateValidation, updateProfile);
router.patch('/interests', authenticateToken, interestsValidation, updateInterests);
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', authenticateToken, deleteAvatar);

module.exports = router;
