const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers, findUserById, updateUser, deleteUser } = require('../../database/dataAccess');
const config = require('../../config');

async function changePassword(req, res) {
  console.log('=== CHANGE PASSWORD DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const { currentPassword, newPassword } = req.body || {};
  console.log('Password change data:', { 
    currentPasswordLength: currentPassword?.length || 0, 
    newPasswordLength: newPassword?.length || 0 
  });
  
  if (!currentPassword || !newPassword) {
    console.log('ERROR: Missing password fields');
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 6) {
    console.log('ERROR: New password too short');
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }
  
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex < 0) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[userIndex];
    console.log('Current user:', { id: user.id, name: user.name, email: user.email });
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      console.log('ERROR: Current password is incorrect');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    console.log('Current password verified successfully');
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    users[userIndex] = { 
      ...user, 
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date().toISOString()
    };
    
    console.log('Saving updated password to file...');
    const saveResult = await writeUsers(users);
    console.log('Password save result:', saveResult);
    
    // Log the password change for audit purposes
    console.log(`Password changed for user: ${user.email} (ID: ${user.id})`);
    console.log('Password change successful!');
    
    res.json({ 
      success: true, 
      message: 'Password successfully changed'
    });
  } catch (e) {
    console.error('Error changing password:', e);
    console.error('Error stack:', e.stack);
    res.status(401).json({ message: 'Invalid token' });
  }
}

async function deleteAccount(req, res) {
  console.log('=== DELETE ACCOUNT DEBUG ===');
  console.log('Request headers:', req.headers);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex < 0) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[userIndex];
    console.log('User to delete:', { id: user.id, name: user.name, email: user.email });
    
    // Remove user from the array
    const deletedUser = users.splice(userIndex, 1)[0];
    console.log('User removed from array');
    
    console.log('Saving updated users list...');
    const saveResult = await writeUsers(users);
    console.log('Delete save result:', saveResult);
    
    // Log the deletion for audit purposes
    console.log(`User account deleted: ${deletedUser.email} (ID: ${deletedUser.id})`);
    console.log('Account deletion successful!');
    
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
    console.error('Error stack:', e.stack);
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = {
  changePassword,
  deleteAccount
};
