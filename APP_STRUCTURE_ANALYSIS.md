# 📊 VolunTech - Complete App Structure & Flow Analysis

## 🎯 Executive Summary

**VolunTech** is a comprehensive **Volunteer Management Platform** built with:
- **Backend**: Node.js + Express.js + MongoDB Atlas
- **Frontend**: React Native + Expo Router + TypeScript
- **Architecture**: Full-stack RESTful API with real-time Socket.IO communication
- **Purpose**: Connect volunteers with organizations, manage events, track attendance, issue certificates, and facilitate virtual volunteering

---

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VOLUNTECH PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────┐         ┌──────────────────────┐     │
│  │   FRONTEND (Expo) │◄───────►│   BACKEND (Express)  │     │
│  │  React Native     │  REST   │   Node.js + Socket   │     │
│  │  TypeScript       │  API    │   JWT Auth           │     │
│  └───────────────────┘         └──────────┬───────────┘     │
│                                            │                  │
│                                            ▼                  │
│                                   ┌─────────────────┐        │
│                                   │  MongoDB Atlas  │        │
│                                   │  Database       │        │
│                                   └─────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Access Levels

### 1. **Volunteer** (Primary User)
   - Browse and join events
   - Manage personal calendar
   - Track volunteering history
   - Earn badges and certificates
   - Rate and review organizations
   - Participate in virtual events
   - Emergency response access
   - Crowdfunding engagement

### 2. **Organization** (Event Organizer)
   - Create and manage events
   - Track volunteers
   - Mark attendance (check-in/out)
   - Award certificates and badges
   - View reviews and ratings
   - Manage virtual events with tasks
   - Access impact tracking dashboard
   - Generate reports

### 3. **Admin** (Platform Manager)
   - User management
   - Platform analytics
   - Event categories management
   - Revenue and subscriptions
   - Technical monitoring
   - Emergency management
   - Advertising management
   - Virtual hub oversight

---

## 🗄️ Backend Structure (Node.js + Express)

### Entry Point: `Backend/index.js`
- Express server initialization
- MongoDB connection
- Security middleware (Helmet, CORS, Rate Limiting)
- Socket.IO setup for real-time features
- Route registration
- Error handling

### 📁 Directory Structure & Purpose

#### **1. `/auth` - Authentication System**
**Purpose**: Handle all user authentication and account management

**Controllers:**
- `signupController.js` - User registration with role selection
- `loginController.js` - User login, JWT token generation, onboarding status
- `logoutController.js` - Session termination
- `emailVerificationController.js` - Send/verify email codes
- `passwordResetController.js` - Forgot password flow
- `profileController.js` - Profile CRUD, avatar upload
- `accountController.js` - Change password, delete account
- `userInterestsController.js` - Manage user interests/preferences

**Flow:**
```
Signup → Email Verification → Login → JWT Token → 
  Onboarding (interests) → Role-based Dashboard
```

---

#### **2. `/calendar` - Event Management**
**Purpose**: Complete event lifecycle management

**Controllers:**
- `eventController.js` - CRUD operations for events, join/unjoin
- `attendanceController.js` - Check-in/out tracking for volunteers
- `volunteerManagementController.js` - Volunteer status, feedback, badges
- `reviewController.js` - Rating & review system

**Key Features:**
- Event creation with detailed metadata (location, time, requirements)
- Participant management
- Attendance tracking (must be marked "attended" to rate)
- Badge awarding system (6 types: Excellence, Impact, Responsive, Professional, Inspiring, Friendly)
- Rating aggregation (1-5 stars)
- Review moderation (edit/delete within 24 hours)

---

#### **3. `/certificates` - Certificate System**
**Purpose**: Award and verify digital certificates

**Controllers:**
- `certificateController.js` - Award, generate, verify certificates

**Features:**
- Unique certificate generation with QR codes
- PDF generation (server-side with Puppeteer)
- Certificate verification system
- Multiple certificate styles and types
- Organization-specific branding

---

#### **4. `/virtualHub` - Virtual Events & Remote Work**
**Purpose**: Enable online volunteering and remote collaboration

**Controllers:**
- `virtualEventController.js` - Virtual event management
- `fileUploadController.js` - Task file management

**Features:**
- Virtual events (Webinar, Workshop, Training, Meeting)
- Platform options (in-app, Zoom, Google Meet, Teams)
- Task assignment system (pending, in-progress, completed)
- File attachments and deliverables
- Task outputs tracking
- Google Meet integration

---

#### **5. `/chat` - Real-time Communication**
**Purpose**: Enable messaging between users

**Controllers:**
- Chat message handling
- Conversation management

**Socket.IO Events:**
- `join:conversation` - Join chat room
- `message:send` - Send message
- `typing:start/stop` - Typing indicators
- `message:read` - Read receipts
- `video:join-room` - Video call integration
- WebRTC signaling (offer, answer, ICE candidates)

---

#### **6. `/middleware` - Security & Validation**
- `auth.js` - JWT authentication middleware
- `security.js` - Helmet, CORS, Rate limiting, Compression
- `errorHandler.js` - Global error handling
- `validation.js` - Input validation with express-validator

---

#### **7. `/models` - MongoDB Schemas**

**User Model** (`User.js`)
```javascript
- id, name, email, passwordHash, role
- avatar, bio, phone, location
- skills[], interests[], availability[]
- badges[] (awarded by organizations)
- certificates[] (from attended events)
- hasCompletedOnboarding, emailVerified
```

**Event Model** (`Event.js`)
```javascript
- id, title, description, date, time
- location, maxParticipants, currentParticipants
- organizationId, organizationName
- eventType, difficulty, cause, skills
- status (upcoming, ongoing, completed, cancelled)
- ratings { average, total, breakdown }
- reviewCount
```

**EventParticipant Model** (`EventParticipant.js`)
```javascript
- Tracks volunteer registration
- Attendance status (registered, attended, absent)
- Check-in/check-out timestamps
```

**EventReview Model** (`EventReview.js`)
```javascript
- eventId, volunteerId, organizationId
- rating (1-5), reviewText
- badges[] (max 3 per review)
- canEdit/Delete (24-hour window)
```

**VirtualEvent Model** (`VirtualEvent.js`)
```javascript
- Virtual event details
- platform (in-app, zoom, google-meet, teams)
- tasks[] with assignments
  - assignedTo, status, priority
  - attachments[], outputs[]
- googleMeetLink
```

**Conversation & Message Models**
```javascript
- Real-time chat support
- Participants tracking
- Message types (text, image, file)
- Read receipts
```

---

## 📱 Frontend Structure (React Native + Expo)

### Entry Point: `Frontend/app/_layout.tsx`
- Context providers (Auth, Alert)
- Navigation setup with Expo Router
- Theme provider (Dark/Light mode)
- Error boundary

### 🎨 App Architecture

```
App Root
├── Index (Landing Page)
├── (auth) - Authentication Flow
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── interest.tsx (Onboarding)
├── myprofile.tsx (User Profile)
├── notification.tsx
├── chat.tsx & chatroom.tsx
│
├── (volunteerTabs) - Volunteer Dashboard
│   ├── home.tsx - Event discovery
│   ├── explore.tsx - Browse events
│   ├── calendar.tsx - Personal calendar
│   ├── emergency.tsx - Emergency response
│   ├── crowdfunding.tsx - Support causes
│   └── virtualhub.tsx - Online volunteering
│
├── (organizationTabs) - Organization Dashboard
│   ├── home.tsx - Event management
│   ├── volunteers.tsx - Volunteer tracking
│   ├── calendar.tsx - Event schedule
│   ├── certificates.tsx - Award certificates
│   ├── impacttracker.tsx - Analytics
│   ├── reports.tsx - Generate reports
│   ├── resources.tsx - Document management
│   ├── crowdfundingorg.tsx
│   └── virtualhub.tsx - Virtual event management
│
└── (adminTabs) - Admin Dashboard
    ├── home.tsx - Platform overview
    ├── users.tsx - User management
    ├── analytics.tsx - Platform metrics
    ├── categories.tsx - Event categories
    ├── emergency.tsx - Emergency coordination
    ├── revenue.tsx - Financial tracking
    ├── subscriptions.tsx
    ├── fees.tsx
    ├── ads.tsx - Advertising management
    ├── technical.tsx - System health
    └── virtual.tsx - Virtual hub management
```

---

## 🔐 Authentication Flow

### Registration Flow
```
1. User visits index.tsx (landing page)
2. Clicks "Sign Up" → /(auth)/signup
3. Enters: name, email, password, role (volunteer/organization)
4. Backend creates user with hasCompletedOnboarding: false
5. Email verification sent
6. User verifies email
7. Login with credentials
8. JWT token generated (payload: { sub: userId, name, role })
9. Frontend stores token in AsyncStorage (if "Remember Me")
10. Redirect to /interest (onboarding) to select interests
11. After interests selection → Role-based dashboard
```

### Login Flow
```
1. User enters email + password
2. Backend verifies credentials with bcrypt
3. JWT token generated (expires in 7 days)
4. Response: { token, user, needsOnboarding }
5. Frontend AuthContext.login() called
6. Token stored in AsyncStorage
7. Navigation:
   - If needsOnboarding → /interest
   - If role=volunteer → /volunteer → (volunteerTabs)/home
   - If role=organization → /organization → (organizationTabs)/home
   - If role=admin → /admin → (adminTabs)/home
```

### Protected Routes
- All API routes use `authenticateToken` middleware
- JWT verification extracts userId from token
- Frontend wraps API calls with token header: `Authorization: Bearer <token>`
- Socket.IO connections authenticated with token in handshake

---

## 📊 Key Features & Data Flow

### 1. **Event Creation & Management**
```
Organization creates event:
1. POST /api/events with event details
2. Event saved to MongoDB with organizationId
3. Event appears in volunteer explore/calendar
4. Volunteers can join: POST /api/events/:eventId/join
5. EventParticipant record created
6. currentParticipants count updated
```

### 2. **Attendance Tracking**
```
1. Event status changes to "ongoing"
2. Organization marks attendance:
   PATCH /api/events/:eventId/attendance/:userId
   { status: "attended" }
3. EventParticipant.attended = true
4. Volunteer becomes eligible to rate event
```

### 3. **Rating & Review System**
```
1. Volunteer submits review:
   POST /api/events/:eventId/review
   { rating: 5, reviewText: "Great event!", badges: ["excellence", "impact"] }
2. Backend verifies attendance status
3. EventReview document created
4. Event.ratings.average recalculated
5. User.badges updated with awarded badges
6. Organization sees rating on profile
```

### 4. **Certificate Generation**
```
1. Organization awards certificate:
   POST /api/certificates/award
   { volunteerId, eventId, certificateType }
2. Unique certificate ID generated (UUID)
3. Certificate data added to User.certificates[]
4. Volunteer can view in profile
5. Generate PDF: GET /api/certificates/generate/:volunteerId/:certificateId
6. Public verification: GET /api/certificates/verify/:certificateId
```

### 5. **Virtual Events & Task Management**
```
1. Organization creates virtual event:
   POST /api/virtual/events
   { title, platform, googleMeetLink, tasks: [] }
2. Volunteers join virtual event
3. Tasks assigned to volunteers:
   POST /api/virtual/events/:eventId/tasks
4. Volunteers upload outputs:
   POST /api/virtual/events/:eventId/tasks/:taskId/outputs
5. Organization reviews deliverables
```

### 6. **Real-time Chat**
```
1. User connects to Socket.IO with JWT token
2. Joins personal room: user:${userId}
3. Joins conversation: emit('join:conversation', conversationId)
4. Send message: emit('message:send', { conversationId, content })
5. Message broadcast to all participants
6. Typing indicators and read receipts in real-time
```

---

## 🔄 API Endpoints Summary

### Authentication (`/api/auth`)
- POST `/signup` - Register new user
- POST `/login` - Login and get JWT
- POST `/logout` - Logout
- GET `/me` - Get current user
- POST `/send-verification` - Send email verification
- POST `/verify-email` - Verify email code
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password
- GET `/profile` - Get user profile
- PATCH `/profile` - Update profile
- POST `/profile/avatar` - Upload avatar
- PATCH `/change-password` - Change password
- DELETE `/account` - Delete account

### Events (`/api/events`)
- GET `/` - Get all events
- POST `/` - Create event
- GET `/:id` - Get event by ID
- PUT `/:id` - Update event
- DELETE `/:id` - Delete event
- POST `/:eventId/join` - Join event
- POST `/:eventId/unjoin` - Leave event
- GET `/:eventId/volunteers` - Get event volunteers
- PATCH `/:eventId/volunteers/:userId/status` - Update volunteer status
- PATCH `/:eventId/attendance/:userId` - Mark attendance
- POST `/:eventId/review` - Submit review
- GET `/:eventId/reviews` - Get event reviews

### Certificates (`/api/certificates`)
- POST `/award` - Award certificate
- GET `/volunteer/:volunteerId` - Get volunteer certificates
- GET `/organization/:organizationId` - Get org certificates
- GET `/generate/:volunteerId/:certificateId` - Generate PDF
- GET `/verify/:certificateId` - Verify certificate

### Virtual Events (`/api/virtual`)
- GET `/events` - Get all virtual events
- POST `/events` - Create virtual event
- GET `/events/:eventId` - Get event details
- POST `/events/:eventId/join` - Join event
- POST `/events/:eventId/tasks` - Create task
- PATCH `/events/:eventId/tasks/:taskId` - Update task
- POST `/events/:eventId/tasks/:taskId/outputs` - Upload output

### Chat (`/api/chat`)
- Socket.IO real-time events for messaging

---

## 🎨 Frontend Components

### Core Components (`Frontend/components/`)

**Profile & User:**
- `EditProfileModal.tsx` - Edit user profile
- `ProfileIcon.tsx` - User avatar display
- `ProfileDropdown.tsx` - User menu

**Activity & Achievements:**
- `EnhancedActivityHistory.tsx` - Volunteer history with ratings
- `EnhancedBadgesSection.tsx` - Badge showcase
- `EnhancedCertificatesSection.tsx` - Certificate display
- `BadgeCard.tsx` - Individual badge display
- `BadgeDetailModal.tsx` - Badge details

**Events:**
- `EventCard.tsx` - Event display card
- `RateReviewModal.tsx` - Rate event modal
- `ReviewsList.tsx` - Display reviews

**Certificates:**
- `CertificatePDFGenerator.tsx` - Generate PDF on client
- `CertificatePreview.tsx` - Preview certificate

**UI Components:**
- `LoadingSpinner.tsx` - Loading indicator
- `LoadingSkeleton.tsx` - Skeleton loader
- `ErrorBoundary.tsx` - Error handling
- `OptimizedImage.tsx` - Image optimization

---

## 🔒 Security Features

### Backend Security
1. **JWT Authentication**: 7-day expiry, secure secret
2. **Password Hashing**: bcrypt with 12 salt rounds
3. **Rate Limiting**: 100 requests per 15 minutes
4. **Helmet**: Security headers
5. **CORS**: Configured origins only
6. **Input Validation**: express-validator on all routes
7. **File Upload Validation**: Size limits, mime type checks
8. **MongoDB Injection Prevention**: Mongoose sanitization

### Frontend Security
1. **Secure Storage**: AsyncStorage for tokens
2. **Token Refresh**: Automatic token handling
3. **Protected Routes**: Role-based access control
4. **XSS Prevention**: React Native built-in protection

---

## 📦 Dependencies

### Backend Key Dependencies
```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "jsonwebtoken": "JWT authentication",
  "bcryptjs": "Password hashing",
  "socket.io": "Real-time communication",
  "nodemailer": "Email service",
  "multer": "File uploads",
  "helmet": "Security headers",
  "winston": "Logging",
  "puppeteer": "PDF generation"
}
```

### Frontend Key Dependencies
```json
{
  "expo": "React Native framework",
  "expo-router": "File-based routing",
  "react-native": "Mobile framework",
  "socket.io-client": "Real-time client",
  "@react-native-async-storage/async-storage": "Secure storage",
  "expo-image-picker": "Image selection",
  "expo-document-picker": "File selection"
}
```

---

## 🌊 Data Flow Example: Complete Event Lifecycle

### 1. Event Creation (Organization)
```
Organization → POST /api/events
  ↓
Backend validates + saves Event
  ↓
Event appears in DB with status: "upcoming"
  ↓
Volunteers see event in explore/calendar
```

### 2. Volunteer Joins Event
```
Volunteer → POST /api/events/:eventId/join { userId }
  ↓
EventParticipant created { eventId, userId, status: "registered" }
  ↓
Event.currentParticipants++
  ↓
Event appears in volunteer's "My Events"
```

### 3. Event Day - Check-in
```
Organization → PATCH /api/events/:eventId/attendance/:userId
  { checkInTime, status: "attended" }
  ↓
EventParticipant.attended = true
  ↓
Volunteer eligible for rating
```

### 4. Post-Event Rating
```
Volunteer → POST /api/events/:eventId/review
  { rating: 5, reviewText, badges: ["excellence"] }
  ↓
Backend checks EventParticipant.attended = true
  ↓
EventReview created
  ↓
Event.ratings.average recalculated
  ↓
User.badges[] updated
  ↓
Organization sees new rating & badge
```

### 5. Certificate Award
```
Organization → POST /api/certificates/award
  { volunteerId, eventId }
  ↓
Certificate generated with unique ID
  ↓
User.certificates[] updated
  ↓
Volunteer can view/download certificate
  ↓
Public verification available
```

---

## 🚀 Deployment Architecture

### Backend Deployment
- **Platform**: Any Node.js hosting (Heroku, Railway, DigitalOcean)
- **Database**: MongoDB Atlas (cloud)
- **File Storage**: Server uploads folder (or AWS S3)
- **Environment Variables**: JWT_SECRET, MONGODB_URI, EMAIL credentials

### Frontend Deployment
- **Mobile**: Expo EAS Build → App Store / Play Store
- **Web**: Expo web build → Static hosting
- **Over-the-Air Updates**: Expo OTA updates

---

## 📊 Database Collections Summary

1. **users** - User accounts (volunteers, organizations, admins)
2. **events** - Physical volunteer events
3. **eventparticipants** - Event registrations & attendance
4. **eventreviews** - Ratings & reviews
5. **virtualevents** - Online events with tasks
6. **conversations** - Chat conversations
7. **messages** - Chat messages
8. **emailverifications** - Email verification codes

---

## 🎯 Future Enhancements (Mentioned in Code)

- [ ] Push notifications
- [ ] Payment integration (Stripe)
- [ ] Advanced analytics dashboard
- [ ] Organization subscription tiers
- [ ] Advertising system (partially implemented)
- [ ] Video recording for virtual events
- [ ] Review moderation tools
- [ ] Offline support
- [ ] Social sharing features

---

## 📝 Code Quality & Best Practices

### Backend
✅ ES6+ modules
✅ Async/await error handling
✅ Middleware pattern
✅ MVC architecture (Models, Controllers, Routes)
✅ Winston logging
✅ Environment configuration
✅ Input validation
✅ MongoDB indexes for performance

### Frontend
✅ TypeScript for type safety
✅ Custom hooks for logic reuse
✅ Context API for state management
✅ Service layer for API calls
✅ Error boundaries
✅ Loading states
✅ Responsive design
✅ Accessibility considerations

---

## 🔍 Key Files Purpose Summary

### Backend
| File | Purpose |
|------|---------|
| `index.js` | Server entry point, middleware setup |
| `config/index.js` | Centralized configuration |
| `database/connection.js` | MongoDB connection manager |
| `middleware/auth.js` | JWT authentication |
| `middleware/security.js` | Security middleware (CORS, rate limit, helmet) |
| `socket/socketHandler.js` | Real-time WebSocket handlers |
| `models/*.js` | MongoDB schemas |
| `*/controllers/*.js` | Business logic |
| `*/routes.js` | API endpoint definitions |

### Frontend
| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with providers |
| `contexts/AuthContext.tsx` | Authentication state management |
| `constants/Api.ts` | API endpoint configuration |
| `services/*.ts` | API call wrappers |
| `hooks/*.ts` | Custom React hooks |
| `components/*.tsx` | Reusable UI components |
| `app/(role)/*.tsx` | Role-specific screens |

---

## 🎓 Summary

**VolunTech** is a production-ready, full-stack volunteer management platform with:

✅ **3 User Roles** (Volunteer, Organization, Admin)
✅ **Complete Authentication** (Signup, Login, Email Verification, Password Reset)
✅ **Event Management** (Create, Join, Attendance, Reviews)
✅ **Gamification** (Badges, Certificates)
✅ **Real-time Chat** (Socket.IO, WebRTC for video)
✅ **Virtual Events** (Task management, Google Meet integration)
✅ **Rating System** (5-star ratings, text reviews, badges)
✅ **Mobile + Web Support** (Expo cross-platform)
✅ **Secure & Scalable** (JWT, MongoDB Atlas, Rate Limiting)

The architecture is well-organized, follows industry best practices, and is built for scalability and maintainability.

---

**Generated**: October 19, 2025
**App Version**: 1.1.0
**Status**: Production Ready ✅

