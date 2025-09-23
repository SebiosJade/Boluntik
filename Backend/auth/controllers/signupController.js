const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers, readEmailVerifications, writeEmailVerifications } = require('../utils/dataAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function signup(req, res) {
  const { name, email, password, role, verificationCode } = req.body || {};

  if (!name || !email || !password || !verificationCode) {
    return res.status(400).json({ message: 'name, email, password and verification code are required' });
  }

  // Verify the email verification code
  const verifications = await readEmailVerifications();
  const verification = verifications.find(v => 
    v.email === email.toLowerCase() && v.code === verificationCode
  );

  if (!verification) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    // Remove expired verification
    const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
    await writeEmailVerifications(filteredVerifications);
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  // Check if verification has been verified
  if (!verification.verified) {
    return res.status(400).json({ message: 'Email verification required. Please verify your email first.' });
  }

  const users = await readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    hasCompletedOnboarding: false,
    role,
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    avatar: '/uploads/avatars/default-avatar.png' // Default avatar for new users
  };
  users.push(user);
  await writeUsers(users);

  // Remove used verification
  const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
  await writeEmailVerifications(filteredVerifications);

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }, token });
}

module.exports = {
  signup
};
