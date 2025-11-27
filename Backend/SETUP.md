# 🚀 VolunTech Backend Setup Guide

Complete setup guide for MongoDB Atlas and Email services.

---

## 📋 Quick Start Checklist

- [ ] Install Node.js (v18+)
- [ ] Install MongoDB Compass (optional but recommended)
- [ ] Create MongoDB Atlas account
- [ ] Set up database user and network access
- [ ] Configure email service
- [ ] Create `.env` file
- [ ] Run `npm install`
- [ ] Start server with `npm run dev`

---

## 1️⃣ MongoDB Atlas Setup

### Step 1: Create Account & Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create account
3. Create a new cluster:
   - **Tier**: M0 (Free - 512 MB)
   - **Provider**: AWS/Google Cloud/Azure
   - **Region**: Choose closest to your users
   - **Name**: `voluntech-cluster`

### Step 2: Database Access

1. Go to **Database Access** → **Add New Database User**
2. **Username**: `voluntech-user`
3. **Password**: Generate secure password (save this!)
4. **Privileges**: Read and write to any database
5. Click **Add User**

### Step 3: Network Access

1. Go to **Network Access** → **Add IP Address**
2. **For Development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. **For Production**: Add your server's specific IP address
4. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Database** → Click **Connect**
2. Choose **Connect your application**
3. **Driver**: Node.js
4. **Version**: 4.1 or later
5. Copy the connection string:
   ```
   mongodb+srv://voluntech-user:<password>@cluster.mongodb.net/voluntech
   ```
6. Replace `<password>` with your actual password
7. Replace `voluntech` at the end with your database name (or keep it)

---

## 2️⃣ MongoDB Compass (Optional GUI)

### Install MongoDB Compass

**Windows/Mac:**
- Download from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Install and open

**Linux:**
```bash
wget https://downloads.mongodb.com/compass/mongodb-compass_latest_amd64.deb
sudo dpkg -i mongodb-compass_latest_amd64.deb
```

### Connect to Atlas

1. Open MongoDB Compass
2. Click **New Connection**
3. Paste your connection string
4. Click **Connect**
5. Browse your database visually!

---

## 3️⃣ Email Service Setup

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password
3. Save credentials for `.env` file

### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com/)
2. Create API key
3. Use in `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   EMAIL_USER=apikey
   EMAIL_PASS=your_sendgrid_api_key
   ```

### Option 3: Custom SMTP

For other email providers, update `Backend/config/index.js`:
```javascript
email: {
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
```

---

## 4️⃣ Environment Configuration

### Create `.env` File

In `Backend/` directory, create `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database Configuration
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb+srv://voluntech-user:YOUR_PASSWORD@cluster.mongodb.net/voluntech

# JWT Configuration
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=VolunTech <noreply@voluntech.com>

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (Development - allow all)
CORS_ORIGIN=*
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | Min 32 characters |
| `JWT_EXPIRES_IN` | Token expiration | `7d` (7 days) |
| `EMAIL_USER` | Email account | `your@gmail.com` |
| `EMAIL_PASS` | Email password/API key | Gmail app password |

---

## 5️⃣ Install Dependencies

```bash
cd Backend
npm install
```

This installs:
- Express.js
- MongoDB/Mongoose
- JWT authentication
- Nodemailer
- Security packages
- And more...

---

## 6️⃣ Database Initialization

### Option A: Automatic (Recommended)

The app will automatically create collections when needed. Just start the server!

### Option B: Manual Setup

Run the setup script:
```bash
node setup-database.js
```

This creates:
- Users collection
- Events collection
- EventParticipants collection
- And more...

---

## 7️⃣ Start the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Expected Output:
```
🚀 Server running on http://localhost:4000
📱 Environment: development
🔒 Security middleware enabled
🔌 Socket.IO enabled for real-time communication
🗄️  Database: Connected to MongoDB Atlas
📡 Connection Status: {"isConnected":true,...}
```

---

## 8️⃣ Verify Setup

### Test Health Endpoint

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "environment": "development",
  "version": "1.0.0"
}
```

### Test Database Connection

In MongoDB Compass:
1. Connect to your cluster
2. You should see the `voluntech` database
3. Collections will appear after first use

### Test Email (Optional)

1. Start the server
2. Try signing up with a real email
3. Check your email for verification code
4. In development, code also logs to console

---

## 🔧 Troubleshooting

### Cannot connect to MongoDB

**Error**: `MongoNetworkError` or `ECONNREFUSED`

**Solutions**:
1. Check MongoDB Atlas Network Access allows your IP (0.0.0.0/0 for all)
2. Verify connection string has correct password
3. Check internet connection
4. Verify database user exists

### Email not sending

**Error**: `Invalid login` or `Authentication failed`

**Solutions**:
1. **Gmail**: Make sure you're using App Password, not regular password
2. Verify EMAIL_USER and EMAIL_PASS in `.env`
3. Check 2FA is enabled on Gmail
4. Try regenerating App Password

### Port already in use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

### JWT_SECRET missing

**Error**: `JWT_SECRET must be set`

**Solution**: Add `JWT_SECRET` to `.env` file (min 32 characters)

---

## 📊 Database Collections

Your database will have these collections:

| Collection | Purpose |
|------------|---------|
| `users` | User accounts (volunteers, orgs, admins) |
| `events` | Volunteer events |
| `eventparticipants` | Event registrations & attendance |
| `eventreviews` | Ratings & reviews |
| `virtualevents` | Online events with tasks |
| `conversations` | Chat conversations |
| `messages` | Chat messages |
| `emailverifications` | Verification codes |

---

## 🔐 Security Best Practices

### Production Checklist:

- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Restrict MongoDB Network Access to specific IPs
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Set CORS to specific origins only
- [ ] Use production email service (not Gmail)
- [ ] Enable MongoDB Atlas backup
- [ ] Monitor database usage
- [ ] Set up logging and alerts

### Generate Secure JWT Secret:

**Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [JWT Best Practices](https://jwt.io/introduction)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🆘 Getting Help

1. Check server logs: `Backend/logs/error.log`
2. Enable debug mode: Set `DEBUG=*` in `.env`
3. Test with Postman/cURL
4. Check MongoDB Atlas metrics
5. Review `Backend/README.md` for API documentation

---

**Setup complete! Your backend is ready to go! 🎉**

For API documentation, see `Backend/README.md`
For deployment, see `Backend/DEPLOYMENT.md`

