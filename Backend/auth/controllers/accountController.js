const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('../utils/dataAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function changePassword(req, res) {
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
}

async function deleteAccount(req, res) {
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
}

module.exports = {
  changePassword,
  deleteAccount
};
