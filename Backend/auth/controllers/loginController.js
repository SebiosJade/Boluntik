const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, updateUser } = require('../../database/dataAccess');
const config = require('../../config');
const logger = require('../../utils/logger');

async function login(req, res) {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await findUserByEmail(email);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const needsOnboarding = !user.hasCompletedOnboarding;
  const needsDefaultAvatar = !user.avatar;
  
  if (needsOnboarding || needsDefaultAvatar) {
    const updateData = {};
    if (needsOnboarding) {
      updateData.hasCompletedOnboarding = true;
    }
    if (needsDefaultAvatar) {
      updateData.avatar = '/uploads/avatars/default-avatar.png';
    }
    await updateUser(user.id, updateData);
  }

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
  
  res.json(responseData);
}

async function getMe(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '/uploads/avatars/default-avatar.png' } });
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

async function updateOnboarding(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const { hasCompletedOnboarding } = req.body;
  
  if (typeof hasCompletedOnboarding !== 'boolean') {
    return res.status(400).json({ message: 'hasCompletedOnboarding must be a boolean' });
  }
  
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    await updateUser(user.id, { hasCompletedOnboarding });
    
    res.json({ success: true, hasCompletedOnboarding });
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = {
  login,
  getMe,
  updateOnboarding
};
