# Email Verification Setup

## Development Mode
In development mode, verification codes are logged to the console instead of being sent via email. Check your backend console for the verification code.

## Production Setup

### Option 1: Gmail (Recommended for testing)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Set environment variables:
   ```bash
   export EMAIL_USER="voluntech4@gmail.com"
   export EMAIL_PASS="yqnm uduy dsdx swsm"
   ```

### Option 2: Other Email Services
Update the email configuration in `index.js`:

```javascript
const emailTransporter = nodemailer.createTransporter({
  service: 'sendgrid', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Option 3: Custom SMTP
```javascript
const emailTransporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Environment Variables
Create a `.env` file in the Backend directory:
```
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password
NODE_ENV=production
```

## Testing
1. Start the backend server
2. Try signing up with a valid email
3. Check your email (or console in development mode) for the verification code
4. Enter the code to complete signup

