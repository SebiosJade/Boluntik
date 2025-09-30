const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findUserByEmail, createUser, findEmailVerification, findVerifiedEmailVerification, updateEmailVerification, deleteEmailVerification } = require('../../database/dataAccess');
const config = require('../../config'); // Use config instead of direct env access

async function signup(req, res) {
  console.log('=== SIGNUP DEBUG ===');
  console.log('Request body:', req.body);
  const { name, email, password, role, verificationCode } = req.body || {};

  if (!name || !email || !password || !verificationCode) {
    return res.status(400).json({ message: 'name, email, password and verification code are required' });
  }

  // Verify the email verification code using MongoDB
  // Look for verified codes (since email verification step already marked it as verified)
  console.log('Looking for verified email verification for:', email.toLowerCase());
  const verification = await findVerifiedEmailVerification(email.toLowerCase(), verificationCode, 'email_verification');
  console.log('Found verification:', verification);

  if (!verification) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Check if code has expired
  const now = new Date();
  const expiresAt = new Date(verification.expiresAt);
  
  if (now > expiresAt) {
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  // Check if verification is already verified (from email verification step)
  if (!verification.verified) {
    return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
  }

  // Check for existing users using MongoDB
  const existing = await findUserByEmail(email);
  
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  // Create new user using MongoDB
  console.log('Creating user with data:', { name, email: email.toLowerCase(), role });
  const passwordHash = await bcrypt.hash(password, 10);
  const userData = {
    id: uuidv4(),
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    hasCompletedOnboarding: false,
    role: role || 'volunteer',
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    avatar: '/uploads/avatars/default-avatar.png'
  };
  
  const user = await createUser(userData);
  console.log('Created user:', user);

  // Delete the email verification record after successful signup
  await deleteEmailVerification(email.toLowerCase());

  const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  
  const responseData = { 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar 
    }, 
    token 
  };
  
  res.json(responseData);
}

module.exports = {
  signup
};
