const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers, readEmailVerifications, writeEmailVerifications, findEmailVerification, updateEmailVerification } = require('../../database/dataAccess');
const config = require('../../config'); // Use config instead of direct env access

async function signup(req, res) {
  console.log('=== SIGNUP DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const { name, email, password, role, verificationCode } = req.body || {};
  
  console.log('Signup data:', {
    name: name?.length || 0,
    email: email?.length || 0,
    passwordLength: password?.length || 0,
    role,
    verificationCodeLength: verificationCode?.length || 0
  });

  if (!name || !email || !password || !verificationCode) {
    console.log('ERROR: Missing required fields');
    return res.status(400).json({ message: 'name, email, password and verification code are required' });
  }

  // Verify the email verification code
  console.log('Looking up email verification...');
  const verifications = await readEmailVerifications();
  console.log('Total verifications in database:', verifications.length);
  
  const verification = verifications.find(v => 
    v.email === email.toLowerCase() && v.code === verificationCode
  );
  
  console.log('Verification lookup result:', {
    verificationFound: !!verification,
    email: email.toLowerCase(),
    codeProvided: verificationCode
  });

  if (!verification) {
    console.log('ERROR: Invalid verification code');
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Check if code has expired
  const now = new Date();
  const expiresAt = new Date(verification.expiresAt);
  console.log('Verification expiry check:', {
    now: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isExpired: now > expiresAt
  });
  
  if (now > expiresAt) {
    console.log('ERROR: Verification code expired');
    // Remove expired verification
    const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
    await writeEmailVerifications(filteredVerifications);
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  // Check if verification has been verified
  console.log('Verification status:', {
    verified: verification.verified,
    type: verification.type
  });
  
  if (!verification.verified) {
    console.log('ERROR: Email not verified');
    return res.status(400).json({ message: 'Email verification required. Please verify your email first.' });
  }

  console.log('Checking for existing users...');
  const users = await readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  console.log('Existing user check:', {
    totalUsers: users.length,
    existingUserFound: !!existing,
    existingUserEmail: existing?.email
  });
  
  if (existing) {
    console.log('ERROR: Email already in use');
    return res.status(409).json({ message: 'Email already in use' });
  }

  console.log('Creating new user...');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    hasCompletedOnboarding: false,
    role: role || 'volunteer', // Default to volunteer if no role provided
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    avatar: '/uploads/avatars/default-avatar.png' // Default avatar for new users
  };
  
  console.log('New user created:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
  
  users.push(user);
  console.log('Saving user to database...');
  const saveResult = await writeUsers(users);
  console.log('User save result:', saveResult);

  // Remove used verification
  console.log('Removing used verification...');
  const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
  await writeEmailVerifications(filteredVerifications);

  console.log('Generating JWT token...');
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
  
  console.log('Signup successful! Response data:', {
    userId: responseData.user.id,
    userEmail: responseData.user.email,
    userRole: responseData.user.role,
    hasToken: !!responseData.token
  });
  
  res.json(responseData);
}

module.exports = {
  signup
};
