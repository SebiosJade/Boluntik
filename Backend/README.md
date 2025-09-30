# VolunTech Backend

A robust Node.js backend API for the VolunTech volunteer management platform, built with Express.js and MongoDB Atlas.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - Complete user profiles with skills, interests, and availability
- **Event Management** - Create, update, and manage volunteer events
- **Email Verification** - Secure email verification system
- **File Upload** - Avatar and document upload with validation
- **Security** - Rate limiting, CORS, input validation, and error handling
- **Database** - MongoDB Atlas integration with Mongoose ODM

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Winston** - Logging
- **Helmet** - Security headers

## 📁 Project Structure

```
Backend/
├── auth/                    # Authentication system
│   ├── controllers/         # Auth controllers (login, signup, etc.)
│   ├── routes.js           # Auth routes
│   └── services/           # Email service
├── calendar/               # Event management
│   ├── controllers/        # Event controllers
│   └── routes.js          # Event routes
├── config/                 # Configuration
│   └── index.js           # App configuration
├── database/               # Database layer
│   ├── connection.js      # MongoDB connection
│   └── dataAccess.js      # Data access layer
├── middleware/             # Custom middleware
│   ├── errorHandler.js    # Global error handling
│   ├── security.js        # Security middleware
│   └── validation.js      # Input validation
├── models/                 # MongoDB models
│   ├── User.js            # User model
│   ├── Event.js           # Event model
│   ├── EventParticipant.js # Event participant model
│   └── EmailVerification.js # Email verification model
├── scripts/                # Utility scripts
│   └── migrateToMongoDB.js # Database migration
├── utils/                  # Utilities
│   └── logger.js          # Logging utility
├── uploads/                # File uploads
├── data/                   # JSON data (backup)
├── backups/                # Database backups
└── index.js               # Main server file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Email service credentials (Gmail, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Environment Variables**
   ```env
   NODE_ENV=development
   PORT=4000
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   
   # Database Configuration
   DATABASE_TYPE=mongodb
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voluntech
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=VolunTech <noreply@voluntech.com>
   ```

### Database Migration

If migrating from JSON files to MongoDB Atlas:

```bash
# Run migration script
npm run migrate:atlas
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-verification` - Send email verification
- `POST /api/auth/verify-email` - Verify email code

### User Management
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/profile/avatar` - Upload avatar
- `DELETE /api/auth/profile/avatar` - Remove avatar

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event by ID
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent brute force attacks
- **CORS Protection** - Configured for specific origins
- **Input Validation** - Comprehensive request validation
- **Security Headers** - Helmet.js protection
- **Error Handling** - Secure error responses

## 🗄️ Database Models

### User Model
- User authentication and profile data
- Skills, interests, and availability
- Role-based permissions (volunteer, organization, admin)

### Event Model
- Event details and scheduling
- Organization and participant management
- Status tracking and categorization

### EventParticipant Model
- Event registration tracking
- Participant status management
- Check-in/check-out functionality

### EmailVerification Model
- Email verification codes
- Password reset tokens
- Expiration and attempt tracking

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB Atlas URI
3. Set secure JWT secret
4. Configure email service credentials

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB Atlas connection tested
- [ ] Email service working
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Error logging configured

## 📝 Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server
npm run migrate:atlas  # Migrate to MongoDB Atlas
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

## 🔧 Development

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Consistent error handling
- Comprehensive input validation

### Logging
- Winston logger configured
- Error and access logging
- Development vs production modes

## 📞 Support

For issues and questions:
- Check the API documentation
- Review error logs
- Test with Postman/curl
- Check MongoDB Atlas connection

## 📄 License

This project is licensed under the MIT License.