require('dotenv').config();
const mongoose = require('mongoose');

// Test different connection strings
const connectionStrings = [
  // Your exact URI with database name
  'mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/voluntech?retryWrites=true&w=majority',
  
  // Your exact URI without database name
  'mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/?retryWrites=true&w=majority',
  
  // Your exact URI with test database
  'mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/test?retryWrites=true&w=majority'
];

async function testConnection(uri, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in output
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing MongoDB Atlas connections...\n');
  
  let success = false;
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], `Option ${i + 1}`);
    if (success) {
      console.log(`\n🎉 SUCCESS! Use this connection string:`);
      console.log(`   ${connectionStrings[i]}`);
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ All connection attempts failed.');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your MongoDB Atlas username and password');
    console.log('2. Verify user has "Read and write to any database" permissions');
    console.log('3. Add your IP address to Network Access (or use 0.0.0.0/0)');
    console.log('4. Make sure your cluster is running');
    console.log('5. Get the connection string from MongoDB Atlas dashboard');
  }
}

main().catch(console.error);
