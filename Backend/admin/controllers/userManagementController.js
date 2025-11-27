const User = require('../../models/User');
const EventParticipant = require('../../models/EventParticipant');
const Notification = require('../../models/Notification');
const { findUserById } = require('../../database/dataAccess');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email transporter - lazy initialization
let emailTransporter = null;
const getEmailTransporter = () => {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'voluntech4@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'yqnm uduy dsdx swsm'
      }
    });
  }
  return emailTransporter;
};

// Get all users with filtering
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.accountStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-passwordHash -temporaryPassword')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Get event participant badges for each user
    const usersWithBadges = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Get badges from EventParticipant (volunteer badges)
      const participations = await EventParticipant.find({ userId: user.id });
      const eventParticipantBadges = participations.flatMap(p => p.badges || []);
      
      // Combine user badges (organization badges) with event participant badges
      const allBadges = [
        ...(userObj.badges || []),
        ...eventParticipantBadges
      ];
      
      return {
        ...userObj,
        badges: allBadges,
        totalBadges: allBadges.length
      };
    }));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users: usersWithBadges,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID (for profile viewing)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ id: userId })
      .select('-passwordHash -temporaryPassword');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get event participant badges for this user
    const participations = await EventParticipant.find({ userId: userId });
    const eventParticipantBadges = participations.flatMap(p => p.badges || []);
    
    // Combine user badges (organization badges) with event participant badges
    const userObj = user.toObject();
    const allBadges = [
      ...(userObj.badges || []),
      ...eventParticipantBadges
    ];
    
    const userWithBadges = {
      ...userObj,
      badges: allBadges,
      totalBadges: allBadges.length
    };
    
    res.json({
      success: true,
      user: userWithBadges
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Suspend user account
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin accounts'
      });
    }
    
    user.accountStatus = 'suspended';
    user.suspensionReason = reason || 'Account suspended by admin';
    user.suspendedAt = new Date();
    user.suspendedBy = {
      adminId,
      adminName: admin?.name || 'Admin'
    };
    user.isActive = false;
    
    await user.save();
    
    // Send email notification
    await sendAccountStatusEmail(user, 'suspended', reason);
    
    // Create in-app notification
    await Notification.create({
      userId: user.id,
      type: 'account_suspended',
      title: '⚠️ Account Suspended',
      message: `Your account has been suspended. Reason: ${reason || 'Violation of terms'}. Please contact support if you believe this is an error.`,
      data: {
        reason,
        suspendedAt: new Date(),
        adminName: admin?.name || 'Admin'
      }
    });
    
    res.json({
      success: true,
      message: 'User account suspended successfully',
      user: {
        id: user.id,
        name: user.name,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
};

// Unsuspend user account
const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.accountStatus = 'active';
    user.suspensionReason = '';
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.isActive = true;
    
    await user.save();
    
    // Send email notification
    await sendAccountStatusEmail(user, 'unsuspended');
    
    // Create in-app notification
    await Notification.create({
      userId: user.id,
      type: 'account_unsuspended',
      title: '✅ Account Restored',
      message: 'Your account has been restored. You can now access all features again.',
      data: {
        restoredAt: new Date(),
        adminName: admin?.name || 'Admin'
      }
    });
    
    res.json({
      success: true,
      message: 'User account unsuspended successfully',
      user: {
        id: user.id,
        name: user.name,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message
    });
  }
};

// Delete user account (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }
    
    user.accountStatus = 'deleted';
    user.isActive = false;
    user.suspensionReason = reason || 'Account deleted by admin';
    user.suspendedAt = new Date();
    user.suspendedBy = {
      adminId,
      adminName: admin?.name || 'Admin'
    };
    
    await user.save();
    
    // Send email notification
    await sendAccountStatusEmail(user, 'deleted', reason);
    
    res.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    user.passwordHash = hashedPassword;
    user.temporaryPassword = temporaryPassword;
    user.mustResetPassword = true;
    user.lastPasswordReset = new Date();
    
    await user.save();
    
    // Send email with temporary password
    await sendPasswordResetEmail(user, temporaryPassword);
    
    // Create notification
    await Notification.create({
      userId: user.id,
      type: 'password_reset',
      title: '🔑 Password Reset',
      message: 'Your password has been reset by an admin. Check your email for the temporary password.',
      data: {
        resetAt: new Date(),
        adminName: admin?.name || 'Admin'
      }
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully. Temporary password sent to user email.'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Update user information
const updateUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Track what fields are being changed
    const fieldsChanged = [];
    const allowedFields = ['name', 'email', 'phone', 'location', 'bio', 'skills', 'availability', 'interests', 'organizationName', 'organizationType'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined && user[field] !== updates[field]) {
        fieldsChanged.push(field);
        user[field] = updates[field];
      }
    }
    
    // Add to modification history
    if (fieldsChanged.length > 0) {
      user.modificationHistory.push({
        modifiedBy: {
          adminId,
          adminName: admin?.name || 'Admin'
        },
        fieldsChanged,
        timestamp: new Date(),
        reason: updates.modificationReason || 'Admin update'
      });
    }
    
    await user.save();
    
    // Notify user
    await Notification.create({
      userId: user.id,
      type: 'profile_updated',
      title: '📝 Profile Updated',
      message: `Your profile information has been updated by an admin. Fields changed: ${fieldsChanged.join(', ')}`,
      data: {
        fieldsChanged,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'User information updated successfully',
      fieldsChanged
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user information',
      error: error.message
    });
  }
};

// Email helper functions
const sendAccountStatusEmail = async (user, action, reason = '') => {
  try {
    let subject, message;
    
    if (action === 'suspended') {
      subject = '⚠️ Account Suspended - VolunteerHub';
      message = `
        <h2>Account Suspended</h2>
        <p>Dear ${user.name},</p>
        <p>Your account has been suspended.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is an error, please contact support immediately.</p>
      `;
    } else if (action === 'unsuspended') {
      subject = '✅ Account Restored - VolunteerHub';
      message = `
        <h2>Account Restored</h2>
        <p>Dear ${user.name},</p>
        <p>Good news! Your account has been restored and you can now access all features.</p>
        <p>Thank you for your patience.</p>
      `;
    } else if (action === 'deleted') {
      subject = '🗑️ Account Deleted - VolunteerHub';
      message = `
        <h2>Account Deleted</h2>
        <p>Dear ${user.name},</p>
        <p>Your account has been permanently deleted from our system.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have questions, please contact support.</p>
      `;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: user.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px;">
            ${message}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} VolunteerHub. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };
    
    await getEmailTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending account status email:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (user, temporaryPassword) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: user.email,
      subject: '🔑 Password Reset - VolunteerHub',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px;">
            <h2>Password Reset</h2>
            <p>Dear ${user.name},</p>
            <p>An admin has reset your password. Here is your temporary password:</p>
            <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626; font-family: monospace;">${temporaryPassword}</p>
            </div>
            <p><strong>Important:</strong> You must change this password when you log in.</p>
            <p>For security reasons, please log in and update your password immediately.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} VolunteerHub. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };
    
    await getEmailTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  deleteUser,
  resetUserPassword,
  updateUserInfo
};

