require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const EmailVerification = require('../models/EmailVerification');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/voluntech?retryWrites=true&w=majority';

// File paths
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const EVENT_PARTICIPANTS_FILE = path.join(DATA_DIR, 'eventParticipants.json');
const EMAIL_VERIFICATIONS_FILE = path.join(DATA_DIR, 'emailVerifications.json');

async function connectToMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    throw error;
  }
}

async function readJsonFile(filePath) {
  try {
    if (await fs.pathExists(filePath)) {
      const data = await fs.readJson(filePath);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

async function migrateUsers() {
  console.log('\n👥 Migrating users...');
  const users = await readJsonFile(USERS_FILE);
  
  if (users.length === 0) {
    console.log('No users to migrate');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ id: userData.id });
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create new user document
      const user = new User({
        ...userData,
        _id: new mongoose.Types.ObjectId() // Let MongoDB generate _id
      });

      await user.save();
      console.log(`✅ Migrated user: ${userData.email}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating user ${userData.email}:`, error.message);
    }
  }

  console.log(`👥 Users migration complete: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateEvents() {
  console.log('\n📅 Migrating events...');
  const events = await readJsonFile(EVENTS_FILE);
  
  if (events.length === 0) {
    console.log('No events to migrate');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const eventData of events) {
    try {
      // Check if event already exists
      const existingEvent = await Event.findOne({ id: eventData.id });
      if (existingEvent) {
        console.log(`⏭️  Event ${eventData.title} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Transform data to match schema
      const event = new Event({
        ...eventData,
        maxParticipants: parseInt(eventData.maxParticipants) || 50,
        currentParticipants: parseInt(eventData.actualParticipants) || 0,
        status: eventData.status?.toLowerCase() || 'upcoming',
        _id: new mongoose.Types.ObjectId()
      });

      await event.save();
      console.log(`✅ Migrated event: ${eventData.title}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating event ${eventData.title}:`, error.message);
    }
  }

  console.log(`📅 Events migration complete: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateEventParticipants() {
  console.log('\n👥 Migrating event participants...');
  const participants = await readJsonFile(EVENT_PARTICIPANTS_FILE);
  
  if (participants.length === 0) {
    console.log('No event participants to migrate');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const participantData of participants) {
    try {
      // Check if participant already exists
      const existingParticipant = await EventParticipant.findOne({ id: participantData.id });
      if (existingParticipant) {
        console.log(`⏭️  Participant ${participantData.userName} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create new participant document
      const participant = new EventParticipant({
        ...participantData,
        status: 'registered', // Default status
        registrationDate: new Date(participantData.joinedAt),
        _id: new mongoose.Types.ObjectId()
      });

      await participant.save();
      console.log(`✅ Migrated participant: ${participantData.userName}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating participant ${participantData.userName}:`, error.message);
    }
  }

  console.log(`👥 Event participants migration complete: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateEmailVerifications() {
  console.log('\n📧 Migrating email verifications...');
  const verifications = await readJsonFile(EMAIL_VERIFICATIONS_FILE);
  
  if (verifications.length === 0) {
    console.log('No email verifications to migrate');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const verificationData of verifications) {
    try {
      // Check if verification already exists
      const existingVerification = await EmailVerification.findOne({ 
        email: verificationData.email,
        code: verificationData.code 
      });
      if (existingVerification) {
        console.log(`⏭️  Verification for ${verificationData.email} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create new verification document
      const verification = new EmailVerification({
        id: uuidv4(),
        email: verificationData.email,
        code: verificationData.code,
        type: verificationData.type || 'email_verification',
        verified: verificationData.verified || false,
        verifiedAt: verificationData.verifiedAt ? new Date(verificationData.verifiedAt) : null,
        expiresAt: new Date(verificationData.expiresAt),
        attempts: 0,
        _id: new mongoose.Types.ObjectId()
      });

      await verification.save();
      console.log(`✅ Migrated verification for: ${verificationData.email}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating verification for ${verificationData.email}:`, error.message);
    }
  }

  console.log(`📧 Email verifications migration complete: ${migrated} migrated, ${skipped} skipped`);
}

async function updateEventParticipantCounts() {
  console.log('\n📊 Updating event participant counts...');
  
  try {
    const events = await Event.find({});
    let updated = 0;

    for (const event of events) {
      const participantCount = await EventParticipant.countDocuments({ 
        eventId: event.id, 
        isActive: true 
      });
      
      if (event.currentParticipants !== participantCount) {
        event.currentParticipants = participantCount;
        await event.save();
        console.log(`✅ Updated participant count for event: ${event.title} (${participantCount} participants)`);
        updated++;
      }
    }

    console.log(`📊 Updated participant counts for ${updated} events`);
  } catch (error) {
    console.error('❌ Error updating participant counts:', error.message);
  }
}

async function createBackup() {
  console.log('\n💾 Creating backup of JSON files...');
  
  const backupDir = path.join(__dirname, '../backups', new Date().toISOString().split('T')[0]);
  await fs.ensureDir(backupDir);
  
  const files = [
    { src: USERS_FILE, dest: path.join(backupDir, 'users.json') },
    { src: EVENTS_FILE, dest: path.join(backupDir, 'events.json') },
    { src: EVENT_PARTICIPANTS_FILE, dest: path.join(backupDir, 'eventParticipants.json') },
    { src: EMAIL_VERIFICATIONS_FILE, dest: path.join(backupDir, 'emailVerifications.json') }
  ];

  for (const file of files) {
    if (await fs.pathExists(file.src)) {
      await fs.copy(file.src, file.dest);
      console.log(`✅ Backed up ${path.basename(file.src)}`);
    }
  }

  console.log(`💾 Backup created in: ${backupDir}`);
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB migration...\n');
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Create backup
    await createBackup();
    
    // Migrate data
    await migrateUsers();
    await migrateEvents();
    await migrateEventParticipants();
    await migrateEmailVerifications();
    
    // Update participant counts
    await updateEventParticipantCounts();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with: DATABASE_TYPE=mongodb');
    console.log('2. Set MONGODB_URI=mongodb+srv://Voluntech:voluntech123@cluster0.fskbcni.mongodb.net/voluntech');
    console.log('3. Restart your backend server');
    console.log('4. Test the application to ensure everything works');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
