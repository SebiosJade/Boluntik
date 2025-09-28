#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates data from JSON files to MongoDB/PostgreSQL
 * 
 * Usage:
 * node scripts/migrateToDatabase.js --database=mongodb
 * node scripts/migrateToDatabase.js --database=postgresql
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

// Import models (uncomment when database is set up)
// const User = require('../models/User');
// const Event = require('../models/Event');
// const EventParticipant = require('../models/EventParticipant');

class DatabaseMigrator {
  constructor(databaseType = 'mongodb') {
    this.databaseType = databaseType;
    this.dataPath = path.join(__dirname, '../data');
  }

  async migrate() {
    console.log(`🚀 Starting migration to ${this.databaseType}...`);
    
    try {
      // Read existing JSON data
      const users = await this.readJSONFile('users.json');
      const events = await this.readJSONFile('events.json');
      const eventParticipants = await this.readJSONFile('eventParticipants.json');
      const emailVerifications = await this.readJSONFile('emailVerifications.json');

      console.log(`📊 Found data:
        - ${users.length} users
        - ${events.length} events
        - ${eventParticipants.length} event participants
        - ${emailVerifications.length} email verifications`);

      // Migrate users
      console.log('👥 Migrating users...');
      await this.migrateUsers(users);

      // Migrate events
      console.log('📅 Migrating events...');
      await this.migrateEvents(events);

      // Migrate event participants
      console.log('🎫 Migrating event participants...');
      await this.migrateEventParticipants(eventParticipants);

      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  async readJSONFile(filename) {
    const filePath = path.join(this.dataPath, filename);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`⚠️  Could not read ${filename}:`, error.message);
      return [];
    }
  }

  async migrateUsers(users) {
    if (this.databaseType === 'mongodb') {
      await this.migrateUsersToMongoDB(users);
    } else if (this.databaseType === 'postgresql') {
      await this.migrateUsersToPostgreSQL(users);
    }
  }

  async migrateEvents(events) {
    if (this.databaseType === 'mongodb') {
      await this.migrateEventsToMongoDB(events);
    } else if (this.databaseType === 'postgresql') {
      await this.migrateEventsToPostgreSQL(events);
    }
  }

  async migrateEventParticipants(participants) {
    if (this.databaseType === 'mongodb') {
      await this.migrateEventParticipantsToMongoDB(participants);
    } else if (this.databaseType === 'postgresql') {
      await this.migrateEventParticipantsToPostgreSQL(participants);
    }
  }

  // MongoDB Migration Methods
  async migrateUsersToMongoDB(users) {
    console.log('📝 MongoDB migration for users (placeholder)');
    // Implementation would go here when MongoDB is set up
    // Example:
    // for (const userData of users) {
    //   const user = new User(userData);
    //   await user.save();
    //   console.log(`✅ Migrated user: ${user.email}`);
    // }
  }

  async migrateEventsToMongoDB(events) {
    console.log('📝 MongoDB migration for events (placeholder)');
    // Implementation would go here when MongoDB is set up
  }

  async migrateEventParticipantsToMongoDB(participants) {
    console.log('📝 MongoDB migration for event participants (placeholder)');
    // Implementation would go here when MongoDB is set up
  }

  // PostgreSQL Migration Methods
  async migrateUsersToPostgreSQL(users) {
    console.log('📝 PostgreSQL migration for users (placeholder)');
    // Implementation would go here when PostgreSQL is set up
  }

  async migrateEventsToPostgreSQL(events) {
    console.log('📝 PostgreSQL migration for events (placeholder)');
    // Implementation would go here when PostgreSQL is set up
  }

  async migrateEventParticipantsToPostgreSQL(participants) {
    console.log('📝 PostgreSQL migration for event participants (placeholder)');
    // Implementation would go here when PostgreSQL is set up
  }

  // Utility method to create backup of JSON files
  async createBackup() {
    const backupPath = path.join(this.dataPath, 'backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupPath, `migration-${timestamp}`);

    await fs.ensureDir(backupDir);

    const files = ['users.json', 'events.json', 'eventParticipants.json', 'emailVerifications.json'];
    
    for (const file of files) {
      const sourcePath = path.join(this.dataPath, file);
      const destPath = path.join(backupDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`📋 Backed up ${file}`);
      }
    }

    console.log(`💾 Backup created at: ${backupDir}`);
    return backupDir;
  }

  // Validation methods
  validateUserData(user) {
    const required = ['id', 'name', 'email', 'passwordHash', 'role'];
    const missing = required.filter(field => !user[field]);
    
    if (missing.length > 0) {
      throw new Error(`User validation failed: missing fields ${missing.join(', ')}`);
    }

    if (!['volunteer', 'organization', 'admin'].includes(user.role)) {
      throw new Error(`Invalid user role: ${user.role}`);
    }

    return true;
  }

  validateEventData(event) {
    const required = ['id', 'title', 'date', 'time', 'location', 'organizationId'];
    const missing = required.filter(field => !event[field]);
    
    if (missing.length > 0) {
      throw new Error(`Event validation failed: missing fields ${missing.join(', ')}`);
    }

    return true;
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const databaseArg = args.find(arg => arg.startsWith('--database='));
  const databaseType = databaseArg ? databaseArg.split('=')[1] : 'mongodb';

  if (!['mongodb', 'postgresql'].includes(databaseType)) {
    console.error('❌ Invalid database type. Use --database=mongodb or --database=postgresql');
    process.exit(1);
  }

  const migrator = new DatabaseMigrator(databaseType);
  
  // Create backup before migration
  console.log('💾 Creating backup...');
  await migrator.createBackup();
  
  // Run migration
  await migrator.migrate();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseMigrator;
