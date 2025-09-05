# VolunTech Backend

This is the Node.js/Express backend API server for the VolunTech platform.

## 🚀 Tech Stack

- **Node.js** with ES Modules
- **Express.js** (v4.19.2) - Web framework
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **File-based JSON storage** (for development)

## 📁 Project Structure

```
Backend/
├── server/                 # Server source code
│   ├── index.js           # Main server file
│   ├── data/              # Data storage
│   │   └── users.json     # User data (JSON file)
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## 🏃‍♂️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start          # Production
   npm run dev        # Development (with nodemon)
   ```

## 🔧 Development

- **Production:** `npm start`
- **Development:** `npm run dev` (auto-restart with nodemon)
- **Server start:** `npm run server:start`
- **Server dev:** `npm run server:dev`

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /health` - Health check

### Request/Response Format

**Signup:**
```json
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "volunteer"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## 🔐 Security Features

- **Password hashing** with bcrypt (10 rounds)
- **JWT tokens** with 7-day expiration
- **CORS enabled** for cross-origin requests
- **Input validation** for required fields

## 📊 Data Storage

Currently using file-based JSON storage for development:
- **Location:** `server/data/users.json`
- **Structure:** Array of user objects
- **Fields:** id, name, email, passwordHash, createdAt, hasCompletedOnboarding, role

## ⚙️ Configuration

- **Port:** 4000 (configurable via `PORT` environment variable)
- **JWT Secret:** `dev_secret_change_me` (configurable via `JWT_SECRET` environment variable)

## 🚧 Future Improvements

- **Database integration** (MongoDB, PostgreSQL, etc.)
- **Additional API endpoints** for app features
- **Middleware for role-based access control**
- **Input sanitization and validation**
- **Rate limiting and security headers**
