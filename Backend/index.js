const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, '[]', 'utf8');
  }
}

async function readUsers() {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    // Handle empty file or invalid JSON
    if (!data || data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    // If JSON parsing fails, return empty array and recreate the file
    console.warn('Error reading users file, recreating with empty array:', error.message);
    await fs.writeFile(usersFile, '[]', 'utf8');
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
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
  };
  users.push(user);
  await writeUsers(users);

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.post('/api/auth/login', async (req, res) => {
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
  if (needsOnboarding) {
    users[userIndex] = { ...user, hasCompletedOnboarding: true };
    await writeUsers(users);
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token, needsOnboarding });
});

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.patch('/api/auth/onboarding', async (req, res) => {
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
});

app.patch('/api/auth/change-password', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  
  const { currentPassword, newPassword } = req.body || {};
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex < 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    users[userIndex] = { 
      ...user, 
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date().toISOString()
    };
    
    await writeUsers(users);
    
    // Log the password change for audit purposes
    console.log(`Password changed for user: ${user.email} (ID: ${user.id})`);
    
    res.json({ 
      success: true, 
      message: 'Password successfully changed'
    });
  } catch (e) {
    console.error('Error changing password:', e);
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.delete('/api/auth/account', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex < 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user from the array
    const deletedUser = users.splice(userIndex, 1)[0];
    await writeUsers(users);
    
    // Log the deletion for audit purposes
    console.log(`User account deleted: ${deletedUser.email} (ID: ${deletedUser.id})`);
    
    res.json({ 
      success: true, 
      message: 'Account successfully deleted',
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      }
    });
  } catch (e) {
    console.error('Error deleting account:', e);
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
