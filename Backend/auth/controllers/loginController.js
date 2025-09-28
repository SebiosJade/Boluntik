const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers, findUserByEmail, updateUser } = require('../../database/dataAccess');
const config = require('../../config');
const logger = require('../../utils/logger');

async function login(req, res) {
  console.log('=== LOGIN DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const { email, password } = req.body || {};
  console.log('Login attempt:', { email, passwordLength: password?.length || 0 });
  
  if (!email || !password) {
    console.log('ERROR: Missing email or password');
    return res.status(400).json({ message: 'email and password are required' });
  }

  const users = await readUsers();
  console.log('Total users in database:', users.length);
  
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === String(email).toLowerCase());
  const user = userIndex >= 0 ? users[userIndex] : null;
  
  console.log('User lookup:', { 
    userIndex, 
    userFound: !!user, 
    userEmail: user?.email,
    userRole: user?.role 
  });
  
  if (!user) {
    console.log('ERROR: User not found for email:', email);
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  console.log('Attempting password comparison...');
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log('Password match result:', isMatch);
  
  if (!isMatch) {
    console.log('ERROR: Password does not match');
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const needsOnboarding = !user.hasCompletedOnboarding;
  const needsDefaultAvatar = !user.avatar;
  
  if (needsOnboarding || needsDefaultAvatar) {
    users[userIndex] = { 
      ...user, 
      hasCompletedOnboarding: needsOnboarding ? true : user.hasCompletedOnboarding,
      avatar: needsDefaultAvatar ? '/uploads/avatars/default-avatar.png' : user.avatar
    };
    await writeUsers(users);
  }

  console.log('Generating JWT token...');
  const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  
  const responseData = { 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar || '/uploads/avatars/default-avatar.png' 
    }, 
    token, 
    needsOnboarding 
  };
  
  console.log('Login successful! Response data:', {
    userId: responseData.user.id,
    userEmail: responseData.user.email,
    userRole: responseData.user.role,
    hasToken: !!responseData.token,
    needsOnboarding: responseData.needsOnboarding
  });
  
  res.json(responseData);
}

async function getMe(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const users = await readUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '/uploads/avatars/default-avatar.png' } });
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

async function updateOnboarding(req, res) {
  console.log('=== UPDATE ONBOARDING DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const { hasCompletedOnboarding } = req.body;
  console.log('Onboarding status to set:', hasCompletedOnboarding, 'Type:', typeof hasCompletedOnboarding);
  
  if (typeof hasCompletedOnboarding !== 'boolean') {
    console.log('ERROR: hasCompletedOnboarding must be a boolean');
    return res.status(400).json({ message: 'hasCompletedOnboarding must be a boolean' });
  }
  
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    if (userIndex < 0) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const user = users[userIndex];
    console.log('Current user:', { id: user.id, name: user.name, email: user.email });
    console.log('Current onboarding status:', user.hasCompletedOnboarding);
    console.log('Setting onboarding status to:', hasCompletedOnboarding);
    
    users[userIndex] = { ...users[userIndex], hasCompletedOnboarding };
    await writeUsers(users);
    
    console.log('Onboarding status updated successfully!');
    res.json({ success: true, hasCompletedOnboarding });
  } catch (e) {
    console.error('Error updating onboarding status:', e);
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = {
  login,
  getMe,
  updateOnboarding
};
