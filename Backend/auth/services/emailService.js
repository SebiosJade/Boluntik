const nodemailer = require('nodemailer');

// Email configuration using environment variables
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'voluntech4@gmail.com',
    pass: process.env.EMAIL_PASS || 'yqnm uduy dsdx swsm'
  }
});


// Enable email sending for production use
const isDevelopment = false; // ENABLED FOR EMAIL SENDING
console.log('🔧 EMAIL SERVICE INITIALIZED - EMAIL SENDING ENABLED');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 isDevelopment:', false);

async function sendVerificationEmail(email, verificationCode) {
  // Always log to console for debugging (both dev and production)
  console.log(`\n📧 EMAIL VERIFICATION ===`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Verification Code: ${verificationCode}`);
  console.log(`⏰ Expires in: 2 minutes`);
  console.log(`🌍 Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  console.log(`========================\n`);

  if (isDevelopment) {
    // In development, just log the verification code (no actual email)
    console.log(`🔧 Development mode: Email not sent, check console above for code`);
    return true;
  }

  // In production, send actual email AND log to console
  try {
    console.log(`📤 Sending email to: ${email}`);
    console.log(`📤 Using email: ${process.env.EMAIL_USER || 'voluntech4@gmail.com'}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: email,
      subject: 'Verify Your Email - VolunTech',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Welcome to VolunTech!</h2>
          <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #111827; font-size: 32px; letter-spacing: 4px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 2 minutes.</p>
          <p>If you didn't create an account with VolunTech, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px;">© 2024 VolunTech. All rights reserved.</p>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${email}`);
    console.log(`✅ Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('❌ Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    console.log(`⚠️  Email failed, but verification code is logged above for testing`);
    return false;
  }
}

module.exports = {
  sendVerificationEmail
};
