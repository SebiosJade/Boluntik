const bcrypt = require('bcryptjs');
const { findUserById, updateUser, deleteUser } = require('../../database/dataAccess');

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get user from database
    const user = await findUserById(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user's password in database
    await updateUser(user.id, {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Password successfully changed'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteAccount(req, res) {
  try {
    // Get user from database
    const user = await findUserById(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user from database
    const deletedUser = await deleteUser(user.id);
    
    if (!deletedUser) {
      return res.status(500).json({ message: 'Failed to delete account' });
    }
    
    res.json({ 
      success: true, 
      message: 'Account successfully deleted',
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      }
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  changePassword,
  deleteAccount
};
