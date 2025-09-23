const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('../utils/dataAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const users = await readUsers();
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === String(email).toLowerCase());
  const user = userIndex >= 0 ? users[userIndex] : null;
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
    users[userIndex] = { 
      ...user, 
      hasCompletedOnboarding: needsOnboarding ? true : user.hasCompletedOnboarding,
      avatar: needsDefaultAvatar ? '/uploads/avatars/default-avatar.png' : user.avatar
    };
    await writeUsers(users);
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '/uploads/avatars/default-avatar.png' }, token, needsOnboarding });
}

async function getMe(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '/uploads/avatars/default-avatar.png' } });
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

async function updateOnboarding(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  
  const { hasCompletedOnboarding } = req.body;
  if (typeof hasCompletedOnboarding !== 'boolean') {
    return res.status(400).json({ message: 'hasCompletedOnboarding must be a boolean' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    if (userIndex < 0) return res.status(401).json({ message: 'Invalid token' });
    
    users[userIndex] = { ...users[userIndex], hasCompletedOnboarding };
    await writeUsers(users);
    
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
