# MongoDB Atlas Integration Guide

This guide will help you set up MongoDB Atlas for your VolunTech application.

## 🚀 Quick Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE** M0 Sandbox cluster (512 MB storage)

### 2. Create a Cluster

1. **Cloud Provider**: Choose AWS, Google Cloud, or Azure
2. **Region**: Choose a region close to your users
3. **Cluster Tier**: Select M0 (Free Tier)
4. **Cluster Name**: `voluntech-cluster` (or any name you prefer)
5. Click "Create Cluster"

### 3. Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `voluntech-user` (or any username)
5. **Password**: Generate a secure password (save this!)
6. **Database User Privileges**: Read and write to any database
7. Click **"Add User"**

### 4. Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. **Access List Entry**: 
   - For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production: Add your server's IP address
4. Click **"Confirm"**

### 5. Get Connection String

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. Copy the connection string

The connection string looks like:
```
mongodb+srv://voluntech-user:<password>@voluntech-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 🔧 Environment Configuration

### 1. Update Your .env File

Create or update your `.env` file in the Backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://voluntech-user:YOUR_PASSWORD@voluntech-cluster.xxxxx.mongodb.net/voluntech?retryWrites=true&w=majority
DATABASE_TYPE=mongodb

# Other existing environment variables...
NODE_ENV=development
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Important**: Replace `YOUR_PASSWORD` with the actual password you created for the database user.

### 2. Install Dependencies

```bash
cd Backend
npm install
```

This will install the `mongoose` package that was added to package.json.

## 📦 Migration Process

### 1. Backup Your Data

The migration script automatically creates backups, but it's good practice to manually backup your JSON files:

```bash
# Create a backup directory
mkdir -p Backend/backups/manual

# Copy your JSON files
cp Backend/data/*.json Backend/backups/manual/
```

### 2. Run the Migration

```bash
cd Backend
npm run migrate:mongodb
```

This will:
- ✅ Create automatic backups
- ✅ Connect to MongoDB Atlas
- ✅ Migrate all users
- ✅ Migrate all events
- ✅ Migrate all event participants
- ✅ Migrate all email verifications
- ✅ Show detailed statistics

### 3. Verify Migration

After migration, you can verify the data in MongoDB Atlas:

1. Go to your cluster in MongoDB Atlas
2. Click **"Browse Collections"**
3. You should see collections: `users`, `events`, `eventparticipants`, `emailverifications`

## 🚀 Starting the Server

Once migration is complete, start your server:

```bash
cd Backend
npm run dev
```

You should see logs indicating MongoDB Atlas connection:
```
🚀 Server running on http://localhost:4000
📱 Environment: development
🔒 Security middleware enabled
🗄️  Database: Connected to MongoDB Atlas
📡 Connection Status: {"isConnected":true,"readyState":1,"host":"...","name":"voluntech"}
```

## 🔄 Switching Between Storage Types

You can easily switch between file-based and MongoDB storage:

### Use MongoDB Atlas:
```env
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb+srv://...
```

### Use File-based Storage:
```env
DATABASE_TYPE=file
# MONGODB_URI=... (comment out or remove)
```

## 🛠️ Troubleshooting

### Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**: 
- Check your username and password in the connection string
- Ensure the database user has proper permissions

**Error**: `MongoNetworkError: failed to connect to server`

**Solution**:
- Check your Network Access settings in Atlas
- Ensure your IP address is whitelisted
- For development, use "Allow Access from Anywhere" (0.0.0.0/0)

**Error**: `MongoParseError: Invalid connection string`

**Solution**:
- Ensure the connection string is properly formatted
- Check that special characters in password are URL-encoded
- Verify the cluster name and region in the connection string

### Migration Issues

**Error**: `E11000 duplicate key error`

**Solution**:
- The migration script clears existing data by default
- If you want to keep existing data, comment out the `deleteMany()` calls in the migration script

**Error**: `ValidationError: Path 'email' is required`

**Solution**:
- Check your JSON data for missing required fields
- The migration script handles missing fields with defaults

## 📊 MongoDB Atlas Features

### Monitoring
- **Metrics**: CPU, Memory, Connections, Operations
- **Real-time Performance**: Query performance, slow operations
- **Alerts**: Set up alerts for performance issues

### Security
- **Encryption**: Data encrypted in transit and at rest
- **Access Control**: IP whitelisting, database user permissions
- **Audit Logs**: Track database access and changes

### Scaling
- **Auto-scaling**: Automatically scale based on demand
- **Sharding**: Distribute data across multiple servers
- **Read Replicas**: Improve read performance

## 🔐 Production Considerations

### 1. Security
- Use strong passwords for database users
- Restrict network access to your server IPs only
- Enable MongoDB Atlas security features (encryption, audit logs)

### 2. Performance
- Monitor your cluster metrics
- Set up alerts for performance issues
- Consider upgrading to a paid tier for production

### 3. Backups
- Enable automated backups in MongoDB Atlas
- Test backup restoration procedures
- Keep multiple backup copies

### 4. Environment Variables
- Use environment-specific connection strings
- Store sensitive data in environment variables, not in code
- Use different database users for different environments

## 📈 Next Steps

After successful MongoDB Atlas integration:

1. **Monitor Performance**: Use MongoDB Atlas metrics to monitor your application
2. **Set Up Alerts**: Configure alerts for important metrics
3. **Optimize Queries**: Use MongoDB Compass to analyze and optimize queries
4. **Scale as Needed**: Upgrade your cluster as your application grows

## 🆘 Support

If you encounter issues:

1. Check the MongoDB Atlas [documentation](https://docs.atlas.mongodb.com/)
2. Review the [Mongoose documentation](https://mongoosejs.com/docs/)
3. Check the application logs for detailed error messages
4. Verify your environment configuration

## 🎉 Congratulations!

You've successfully integrated MongoDB Atlas with your VolunTech application! Your data is now stored in a scalable, managed cloud database with automatic backups, monitoring, and security features.
