# Authentication Module

This directory contains the modular authentication system for the VolunTech backend.

## Directory Structure

```
auth/
├── controllers/           # Request handlers for different auth operations
│   ├── emailVerificationController.js
│   ├── signupController.js
│   ├── loginController.js
│   └── accountController.js
├── services/             # Business logic services
│   └── emailService.js
├── utils/                # Shared utilities and data access
│   └── dataAccess.js
├── routes.js             # Route definitions
└── README.md            # This file
```

## Controllers

### EmailVerificationController
- `sendVerification(req, res)` - Sends verification code to email
- `verifyEmail(req, res)` - Verifies the email code

### SignupController
- `signup(req, res)` - Creates new user account with email verification

### LoginController
- `login(req, res)` - Authenticates user login
- `getMe(req, res)` - Gets current user info from token
- `updateOnboarding(req, res)` - Updates user onboarding status

### AccountController
- `changePassword(req, res)` - Changes user password
- `deleteAccount(req, res)` - Deletes user account

## Services

### EmailService
- `sendVerificationEmail(email, code)` - Sends verification email

## Utils

### DataAccess
- `readUsers()` - Reads users from JSON file
- `writeUsers(users)` - Writes users to JSON file
- `readEmailVerifications()` - Reads email verifications from JSON file
- `writeEmailVerifications(verifications)` - Writes email verifications to JSON file

## API Endpoints

All endpoints are prefixed with `/api/auth/`:

### Email Verification
- `POST /send-verification` - Send verification code
- `POST /verify-email` - Verify email code

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /me` - Get current user
- `PATCH /onboarding` - Update onboarding status

### Account Management
- `PATCH /change-password` - Change password
- `DELETE /account` - Delete account

## Benefits of Modular Structure

1. **Separation of Concerns**: Each controller handles specific functionality
2. **Maintainability**: Easy to find and modify specific features
3. **Testability**: Individual modules can be tested in isolation
4. **Scalability**: Easy to add new features or modify existing ones
5. **Code Reusability**: Shared utilities can be used across controllers
6. **Clean Architecture**: Clear separation between routes, controllers, services, and data access

## Usage

The main `index.js` file imports and uses the auth routes:

```javascript
const authRoutes = require('./auth/routes');
app.use('/api/auth', authRoutes);
```

This modular approach makes the codebase much more organized and maintainable!
