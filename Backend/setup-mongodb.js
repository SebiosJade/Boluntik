#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

console.log('🚀 Setting up MongoDB Atlas configuration...\n');

// Create .env file with MongoDB configuration
const envContent = `# MongoDB Atlas Configuration
NODE_ENV=development
PORT=4000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Database Configuration - MongoDB Atlas
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/voluntech?retryWrites=true&w=majority

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=voluntech4@gmail.com
EMAIL_PASS=yqnm uduy dsdx swsm
EMAIL_FROM=VolunTech <noreply@voluntech.com>

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
`;

async function setupMongoDB() {
  try {
    // Create .env file
    const envPath = path.join(__dirname, '.env');
    await fs.writeFile(envPath, envContent);
    console.log('✅ Created .env file with MongoDB Atlas configuration');
    
    // Create .env.example file
    const envExamplePath = path.join(__dirname, '.env.example');
    const envExampleContent = envContent.replace('your_super_secret_jwt_key_here_change_in_production', 'your_super_secret_jwt_key_here');
    await fs.writeFile(envExamplePath, envExampleContent);
    console.log('✅ Created .env.example file');
    
    console.log('\n📝 Configuration files created successfully!');
    console.log('\n🔧 Next steps:');
    console.log('1. Run: npm run migrate:atlas');
    console.log('2. Start your server: npm run dev');
    console.log('3. Test your application');
    
  } catch (error) {
    console.error('❌ Error setting up MongoDB configuration:', error.message);
    process.exit(1);
  }
}

setupMongoDB();
