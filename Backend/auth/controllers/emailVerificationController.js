const { findUserByEmail, findEmailVerification, createEmailVerification, updateEmailVerification, deleteEmailVerification } = require('../../database/dataAccess');
const { sendVerificationEmail } = require('../services/emailService');

// Send verification email
async function sendVerification(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if email is already in use
  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Create verification record in MongoDB
  const verificationData = {
    id: require('crypto').randomUUID(),
    email: String(email).toLowerCase(),
    code: verificationCode,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    type: 'email_verification'
  };

  await createEmailVerification(verificationData);

  // Send verification email
  const emailSent = await sendVerificationEmail(email, verificationCode);
  
  if (emailSent) {
    res.json({ 
      success: true, 
      message: 'Verification code sent to your email',
      expiresIn: 120 // 2 minutes in seconds
    });
  } else {
    res.status(500).json({ message: 'Failed to send verification email' });
  }
}

// Verify email code
async function verifyEmail(req, res) {
  const { email, code } = req.body || {};
  const { cleanup = 'false' } = req.query; // Optional query parameter to control cleanup

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  // Find verification in MongoDB
  const verification = await findEmailVerification(email.toLowerCase(), code, 'email_verification');

  if (!verification) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  // Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  // If cleanup is requested, delete the verification record
  if (cleanup === 'true') {
    await deleteEmailVerification(email.toLowerCase());
  } else {
    // Otherwise, just mark as verified
    await updateEmailVerification(email.toLowerCase(), { 
      verified: true, 
      verifiedAt: new Date().toISOString() 
    });
  }

  res.json({ 
    success: true, 
    message: 'Email verified successfully',
    verifiedEmail: email,
    cleanup: cleanup === 'true' ? 'Verification record deleted' : 'Verification record kept for signup'
  });
}

module.exports = {
  sendVerification,
  verifyEmail
};
