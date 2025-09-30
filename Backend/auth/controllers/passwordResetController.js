const bcrypt = require('bcryptjs');
const { findUserByEmail, findEmailVerification, createEmailVerification, updateEmailVerification, updateUser, deleteEmailVerification } = require('../../database/dataAccess');
const { sendVerificationEmail } = require('../services/emailService');


// Send password reset code
async function sendPasswordReset(req, res) {
  
  const { email } = req.body || {};

  if (!email) {
    console.log('ERROR: Email is required');
    return res.status(400).json({ message: 'Email is required' });
  }

  console.log('Looking up user for email:', email);
  const user = await findUserByEmail(email);
  
  console.log('User lookup result:', { 
    userFound: !!user, 
    userEmail: user?.email
  });
  
  if (!user) {
    console.log('User not found, returning generic success message for security');
    // For security, don't reveal if email exists or not
    return res.json({ 
      success: true, 
      message: 'If the email exists, a reset code has been sent',
      expiresIn: 600 // 10 minutes in seconds
    });
  }

  // Generate 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Create password reset verification using MongoDB
  const verificationData = {
    id: require('crypto').randomUUID(),
    email: String(email).toLowerCase(),
    code: resetCode,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    type: 'password_reset' // Mark this as a password reset verification
  };

  await createEmailVerification(verificationData);

  console.log('Generated reset code:', resetCode);
  console.log('Reset code expires at:', expiresAt.toISOString());
  
  // Send password reset email
  console.log('Attempting to send reset email...');
  const emailSent = await sendPasswordResetEmail(email, resetCode);
  console.log('Email send result:', emailSent);
  
  if (emailSent) {
    console.log('Password reset email sent successfully');
    res.json({ 
      success: true, 
      message: 'If the email exists, a reset code has been sent',
      expiresIn: 600 // 10 minutes in seconds
    });
  } else {
    console.log('ERROR: Failed to send reset email');
    res.status(500).json({ message: 'Failed to send reset email' });
  }
}

// Verify password reset code
async function verifyPasswordResetCode(req, res) {
  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ 
      message: 'Email and reset code are required',
      details: [
        { field: 'email', message: !email ? 'Email is required' : 'Email is valid' },
        { field: 'code', message: !code ? 'Reset code is required' : 'Reset code is provided' }
      ]
    });
  }

  // Find password reset verification using MongoDB
  const verification = await findEmailVerification(email.toLowerCase(), code, 'password_reset');

  if (!verification) {
    return res.status(400).json({ 
      message: 'Invalid or expired reset code',
      details: [
        { field: 'code', message: 'Reset code is invalid or has expired' },
        { field: 'email', message: 'No password reset request found for this email' }
      ]
    });
  }

  // Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    return res.status(400).json({ 
      message: 'Reset code has expired',
      details: [
        { field: 'code', message: 'Reset code has expired. Please request a new one' },
        { field: 'expiresAt', message: `Code expired at ${verification.expiresAt}` }
      ]
    });
  }

  // Check if code has already been used
  if (verification.isUsed) {
    return res.status(400).json({ 
      message: 'Reset code has already been used',
      details: [
        { field: 'code', message: 'This reset code has already been used. Please request a new one' }
      ]
    });
  }

  // Mark verification as verified using MongoDB
  await updateEmailVerification(email.toLowerCase(), { 
    verified: true, 
    verifiedAt: new Date().toISOString() 
  });

  res.json({ 
    success: true, 
    message: 'Reset code verified successfully',
    verifiedEmail: email
  });
}

// Reset password with verified code
async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body || {};

  // Enhanced validation with specific error messages
  if (!email || !code || !newPassword) {
    const details = [];
    if (!email) details.push({ field: 'email', message: 'Email is required' });
    if (!code) details.push({ field: 'code', message: 'Reset code is required' });
    if (!newPassword) details.push({ field: 'newPassword', message: 'New password is required' });
    
    return res.status(400).json({ 
      message: 'Missing required fields',
      details 
    });
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      message: 'Password is too short',
      details: [
        { field: 'newPassword', message: 'Password must be at least 6 characters long' }
      ]
    });
  }

  if (newPassword.length > 128) {
    return res.status(400).json({ 
      message: 'Password is too long',
      details: [
        { field: 'newPassword', message: 'Password cannot be longer than 128 characters' }
      ]
    });
  }

  // Verify the reset code using MongoDB
  const verification = await findEmailVerification(email.toLowerCase(), code, 'password_reset');

  if (!verification) {
    return res.status(400).json({ 
      message: 'Invalid or expired reset code',
      details: [
        { field: 'code', message: 'Reset code is invalid or has expired' },
        { field: 'email', message: 'No password reset request found for this email' }
      ]
    });
  }

  // Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    return res.status(400).json({ 
      message: 'Reset code has expired',
      details: [
        { field: 'code', message: 'Reset code has expired. Please request a new one' },
        { field: 'expiresAt', message: `Code expired at ${verification.expiresAt}` }
      ]
    });
  }

  // Check if verification has been verified
  if (!verification.verified) {
    return res.status(400).json({ 
      message: 'Reset code verification required',
      details: [
        { field: 'code', message: 'Please verify your reset code first before resetting password' }
      ]
    });
  }

  // Check if code has already been used
  if (verification.isUsed) {
    return res.status(400).json({ 
      message: 'Reset code has already been used',
      details: [
        { field: 'code', message: 'This reset code has already been used. Please request a new one' }
      ]
    });
  }

  // Find user using MongoDB
  const user = await findUserByEmail(email);
  
  if (!user) {
    return res.status(404).json({ 
      message: 'User not found',
      details: [
        { field: 'email', message: 'No user found with this email address' }
      ]
    });
  }

  // Check if new password is the same as current password
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    return res.status(400).json({ 
      message: 'New password must be different',
      details: [
        { field: 'newPassword', message: 'New password must be different from your current password' }
      ]
    });
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  
  // Update user's password using MongoDB
  await updateUser(user.id, {
    passwordHash: newPasswordHash,
    passwordChangedAt: new Date().toISOString()
  });

  // Delete the email verification record after successful password reset
  await deleteEmailVerification(email.toLowerCase());

  // Log the password reset for audit purposes
  console.log(`Password reset for user: ${email} (ID: ${user.id}) - Email verification record deleted`);

  res.json({ 
    success: true, 
    message: 'Password successfully reset'
  });
}

// Helper function to send password reset email
async function sendPasswordResetEmail(email, resetCode) {
  const nodemailer = require('nodemailer');
  
  // Email configuration (for development, you can use a service like Gmail, SendGrid, etc.)
  const emailTransporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to other services
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });

  // For development/testing, you can use a mock email service
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, just log the reset code
    console.log(`\n=== PASSWORD RESET ===`);
    console.log(`Email: ${email}`);
    console.log(`Reset Code: ${resetCode}`);
    console.log(`====================\n`);
    return true;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Reset Your Password - VolunTech',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Password Reset Request</h2>
          <p>You requested to reset your password. Please use the following code to reset your password:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #111827; font-size: 32px; letter-spacing: 4px; margin: 0;">${resetCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px;">© 2024 VolunTech. All rights reserved.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

module.exports = {
  sendPasswordReset,
  verifyPasswordResetCode,
  resetPassword
};
