const { readUsers, readEmailVerifications, writeEmailVerifications } = require('../utils/dataAccess');
const { sendVerificationEmail } = require('../services/emailService');

// Send verification email
async function sendVerification(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const users = await readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 120); // 2 minutes from now

  const verifications = await readEmailVerifications();
  
  // Remove any existing verification for this email
  const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
  
  const verification = {
    email: String(email).toLowerCase(),
    code: verificationCode,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  };

  filteredVerifications.push(verification);
  await writeEmailVerifications(filteredVerifications);

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

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const verifications = await readEmailVerifications();
  const verification = verifications.find(v => 
    v.email === email.toLowerCase() && v.code === code
  );

  if (!verification) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  // Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    // Remove expired verification
    const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
    await writeEmailVerifications(filteredVerifications);
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  // Mark verification as verified but don't remove it yet (will be removed during signup)
  const updatedVerifications = verifications.map(v => 
    v.email === email.toLowerCase() && v.code === code 
      ? { ...v, verified: true, verifiedAt: new Date().toISOString() }
      : v
  );
  await writeEmailVerifications(updatedVerifications);

  res.json({ 
    success: true, 
    message: 'Email verified successfully',
    verifiedEmail: email
  });
}

module.exports = {
  sendVerification,
  verifyEmail
};
