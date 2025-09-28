# MongoDB Compass Setup Guide

This guide will help you set up MongoDB Compass with your VolunTech application.

## 🎯 Option 1: Local MongoDB (Recommended for Development)

### Step 1: Install MongoDB Community Server

#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service
5. Install MongoDB Compass (GUI tool)

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 2: Configure Environment for Local MongoDB

Update your `.env` file:

```env
# Local MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/voluntech
DATABASE_TYPE=mongodb

# Other existing variables...
NODE_ENV=development
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Step 3: Connect MongoDB Compass

1. Open MongoDB Compass
2. In the connection string field, enter: `mongodb://localhost:27017`
3. Click "Connect"
4. You should see the `voluntech` database after running the migration

## 🚀 Option 2: MongoDB Atlas (Recommended for Production)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a free M0 cluster (512 MB storage)

### Step 2: Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Create a user with username: `voluntech-user`
4. Generate a secure password
5. Set privileges to "Read and write to any database"

### Step 3: Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production: Add your server's IP address

### Step 4: Get Connection String

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string

### Step 5: Configure Environment for Atlas

Update your `.env` file:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://voluntech-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voluntech?retryWrites=true&w=majority
DATABASE_TYPE=mongodb

# Other existing variables...
NODE_ENV=development
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Step 6: Connect MongoDB Compass to Atlas

1. Open MongoDB Compass
2. Click **"New Connection"**
3. Paste your Atlas connection string
4. Replace `<password>` with your actual password
5. Click **"Connect"**

## 📦 Running the Migration

### Step 1: Install Dependencies (if not already done)
```bash
cd Backend
npm install
```

### Step 2: Run the Migration Script
```bash
# For local MongoDB or Atlas
npm run migrate:mongodb
```

### Step 3: Verify in MongoDB Compass

After migration, you should see these collections in your `voluntech` database:

- **`users`** - User accounts and profiles
- **`events`** - Volunteer events
- **`eventparticipants`** - Event participation records
- **`emailverifications`** - Email verification codes

## 🔍 MongoDB Compass Features

### 1. Browse Collections
- View your data in a user-friendly interface
- Filter and sort documents
- Edit documents directly

### 2. Query Documents
```javascript
// Find users by role
{ "role": "volunteer" }

// Find events by organization
{ "organizationId": "your-org-id" }

// Find recent events
{ "createdAt": { "$gte": new Date("2025-01-01") } }
```

### 3. Index Management
- View existing indexes
- Create new indexes for better performance
- Monitor index usage

### 4. Performance Monitoring
- View slow queries
- Monitor database performance
- Analyze query execution plans

## 🛠️ Troubleshooting

### Connection Issues

**Error**: `MongoServerError: Authentication failed`
**Solution**: 
- Check username and password in connection string
- Ensure database user has proper permissions

**Error**: `MongoNetworkError: failed to connect`
**Solution**:
- Check network access settings in Atlas
- Verify IP address is whitelisted
- For local MongoDB, ensure service is running

### Migration Issues

**Error**: `E11000 duplicate key error`
**Solution**:
- The migration script clears existing data by default
- If you want to keep existing data, comment out the `deleteMany()` calls

**Error**: `ValidationError: Path 'email' is required`
**Solution**:
- Check your JSON data for missing required fields
- The migration script handles missing fields with defaults

## 📊 Sample Queries for MongoDB Compass

### Find All Users
```javascript
{}
```

### Find Volunteers Only
```javascript
{ "role": "volunteer" }
```

### Find Events by Date Range
```javascript
{
  "date": {
    "$gte": "09/01/2025",
    "$lte": "09/30/2025"
  }
}
```

### Find Events with Participants
```javascript
{
  "actualParticipants": { "$ne": "0" }
}
```

### Find User's Joined Events
```javascript
// First, find user's ID
{ "email": "user@example.com" }

// Then find their participations
{ "userId": "user-id-here" }
```

## 🎯 Development Workflow

### 1. Start Local MongoDB
```bash
# Windows (if installed as service)
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

### 2. Start Your Application
```bash
cd Backend
npm run dev
```

### 3. Monitor in MongoDB Compass
- Open MongoDB Compass
- Connect to `mongodb://localhost:27017`
- Browse your `voluntech` database
- Monitor real-time changes as you use the app

## 🔄 Switching Between Storage Types

### Use Local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/voluntech
DATABASE_TYPE=mongodb
```

### Use MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/voluntech?retryWrites=true&w=majority
DATABASE_TYPE=mongodb
```

### Use File-based Storage:
```env
DATABASE_TYPE=file
# MONGODB_URI=... (comment out)
```

## 🎉 Benefits of MongoDB Compass

### 1. Visual Data Management
- Browse collections with a clean interface
- Edit documents directly
- View data relationships

### 2. Query Builder
- Build complex queries visually
- Test queries before using in code
- Export query results

### 3. Performance Insights
- Monitor slow queries
- View database statistics
- Analyze index usage

### 4. Schema Analysis
- Understand your data structure
- Identify data patterns
- Plan schema improvements

## 📱 Next Steps

1. **Choose your setup** (Local MongoDB or Atlas)
2. **Configure your environment** variables
3. **Run the migration** to transfer your data
4. **Open MongoDB Compass** and explore your data
5. **Start developing** with visual database management

Your VolunTech application is now ready for MongoDB development with Compass! 🚀
