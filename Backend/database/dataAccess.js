const config = require('../config');
const fs = require('fs-extra');
const path = require('path');

// MongoDB Models
const User = require('../models/User');
const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const EmailVerification = require('../models/EmailVerification');

// File paths for JSON storage
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const EVENT_PARTICIPANTS_FILE = path.join(DATA_DIR, 'eventParticipants.json');
const EMAIL_VERIFICATIONS_FILE = path.join(DATA_DIR, 'emailVerifications.json');

class DataAccess {
  constructor() {
    this.isMongoDB = config.database.type === 'mongodb';
  }

  // ==================== USER OPERATIONS ====================
  
  async readUsers() {
    if (this.isMongoDB) {
      try {
        const users = await User.find({ isActive: true });
        return users.map(user => user.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      // File-based storage
      try {
        await fs.ensureDir(DATA_DIR);
        if (await fs.pathExists(USERS_FILE)) {
          const data = await fs.readJson(USERS_FILE);
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error) {
        return [];
      }
    }
  }

  async writeUsers(users) {
    if (this.isMongoDB) {
      try {
        // For MongoDB, we'll update users individually
        // This method is mainly used for bulk operations during migration
        return { success: true };
      } catch (error) {
        throw error;
      }
    } else {
      // File-based storage
      try {
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(USERS_FILE, users, { spaces: 2 });
        return { success: true };
      } catch (error) {
        throw error;
      }
    }
  }

  async findUserById(userId) {
    if (this.isMongoDB) {
      try {
        const user = await User.findOne({ id: userId, isActive: true });
        return user ? user.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const users = await this.readUsers();
      return users.find(user => user.id === userId) || null;
    }
  }

  async findUserByEmail(email) {
    if (this.isMongoDB) {
      try {
        const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
        return user ? user.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const users = await this.readUsers();
      return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
    }
  }

  async createUser(userData) {
    if (this.isMongoDB) {
      try {
        const user = new User(userData);
        await user.save();
        return user.toJSON();
      } catch (error) {
        throw error;
      }
    } else {
      const users = await this.readUsers();
      users.push(userData);
      await this.writeUsers(users);
      return userData;
    }
  }

  async updateUser(userId, updateData) {
    if (this.isMongoDB) {
      try {
        const user = await User.findOneAndUpdate(
          { id: userId, isActive: true },
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        return user ? user.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const users = await this.readUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...updateData };
        await this.writeUsers(users);
        return users[userIndex];
      }
      return null;
    }
  }

  async deleteUser(userId) {
    if (this.isMongoDB) {
      try {
        const user = await User.findOneAndUpdate(
          { id: userId },
          { isActive: false, updatedAt: new Date() },
          { new: true }
        );
        return user ? user.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const users = await this.readUsers();
      const filteredUsers = users.filter(user => user.id !== userId);
      await this.writeUsers(filteredUsers);
      return true;
    }
  }

  // ==================== EVENT OPERATIONS ====================

  async readEvents() {
    if (this.isMongoDB) {
      try {
        const events = await Event.find({ isActive: true });
        return events.map(event => event.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        if (await fs.pathExists(EVENTS_FILE)) {
          const data = await fs.readJson(EVENTS_FILE);
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error) {
        return [];
      }
    }
  }

  async writeEvents(events) {
    if (this.isMongoDB) {
      try {
        console.log('MongoDB writeEvents called - this should be replaced with individual event operations');
        return { success: true };
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(EVENTS_FILE, events, { spaces: 2 });
        return { success: true };
      } catch (error) {
        throw error;
      }
    }
  }

  async findEventById(eventId) {
    if (this.isMongoDB) {
      try {
        const event = await Event.findOne({ id: eventId, isActive: true });
        return event ? event.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      return events.find(event => event.id === eventId) || null;
    }
  }

  async findAllEvents() {
    if (this.isMongoDB) {
      try {
        const events = await Event.find({ isActive: true }).sort({ createdAt: -1 });
        return events.map(event => event.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      return events.filter(event => event.isActive !== false);
    }
  }

  async findEventsByOrganization(organizationId) {
    if (this.isMongoDB) {
      try {
        const events = await Event.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
        return events.map(event => event.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      return events.filter(event => event.organizationId === organizationId);
    }
  }

  async findEventsByUser(userId) {
    if (this.isMongoDB) {
      try {
        // Find events where user is either the creator or the organization
        const events = await Event.find({ 
          $or: [
            { createdBy: userId, isActive: true },
            { organizationId: userId, isActive: true }
          ]
        }).sort({ createdAt: -1 });
        return events.map(event => event.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      return events.filter(event => 
        event.createdBy === userId || event.organizationId === userId
      );
    }
  }

  async createEvent(eventData) {
    if (this.isMongoDB) {
      try {
        const event = new Event(eventData);
        await event.save();
        return event.toJSON();
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      events.push(eventData);
      await this.writeEvents(events);
      return eventData;
    }
  }

  async updateEvent(eventId, updateData) {
    if (this.isMongoDB) {
      try {
        const event = await Event.findOneAndUpdate(
          { id: eventId, isActive: true },
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        return event ? event.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      const eventIndex = events.findIndex(event => event.id === eventId);
      if (eventIndex >= 0) {
        events[eventIndex] = { ...events[eventIndex], ...updateData };
        await this.writeEvents(events);
        return events[eventIndex];
      }
      return null;
    }
  }

  async deleteEvent(eventId) {
    if (this.isMongoDB) {
      try {
        // Soft delete - set isActive to false
        const event = await Event.findOneAndUpdate(
          { id: eventId, isActive: true },
          { isActive: false, updatedAt: new Date() },
          { new: true }
        );
        return event ? event.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const events = await this.readEvents();
      const eventIndex = events.findIndex(event => event.id === eventId);
      if (eventIndex >= 0) {
        events.splice(eventIndex, 1);
        await this.writeEvents(events);
        return { id: eventId, deleted: true };
      }
      return null;
    }
  }

  // ==================== EMAIL VERIFICATION OPERATIONS ====================

  async readEmailVerifications() {
    if (this.isMongoDB) {
      try {
        const verifications = await EmailVerification.find({ isActive: true });
        return verifications.map(verification => verification.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        if (await fs.pathExists(EMAIL_VERIFICATIONS_FILE)) {
          const data = await fs.readJson(EMAIL_VERIFICATIONS_FILE);
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error) {
        return [];
      }
    }
  }

  async writeEmailVerifications(verifications) {
    if (this.isMongoDB) {
      try {
        console.log('MongoDB writeEmailVerifications called - this should be replaced with individual verification operations');
        return { success: true };
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(EMAIL_VERIFICATIONS_FILE, verifications, { spaces: 2 });
        return { success: true };
      } catch (error) {
        throw error;
      }
    }
  }

  async createEmailVerification(verificationData) {
    if (this.isMongoDB) {
      try {
        const verification = new EmailVerification(verificationData);
        await verification.save();
        return verification.toJSON();
      } catch (error) {
        throw error;
      }
    } else {
      const verifications = await this.readEmailVerifications();
      verifications.push(verificationData);
      await this.writeEmailVerifications(verifications);
      return verificationData;
    }
  }

  async findEmailVerification(email, code, type = 'email_verification') {
    if (this.isMongoDB) {
      try {
        // Find verification with matching code (can be verified or unverified)
        const verification = await EmailVerification.findOne({
          email: email.toLowerCase(),
          code,
          type,
          isActive: true,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: 5 }
        });
        return verification ? verification.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const verifications = await this.readEmailVerifications();
      return verifications.find(v => 
        v.email === email.toLowerCase() && 
        v.code === code && 
        v.type === type &&
        !v.verified &&
        new Date(v.expiresAt) > new Date()
      ) || null;
    }
  }

  async findVerifiedEmailVerification(email, code, type = 'email_verification') {
    if (this.isMongoDB) {
      try {
        // Find verified verification with matching code
        const verification = await EmailVerification.findOne({
          email: email.toLowerCase(),
          code,
          type,
          verified: true,
          isActive: true,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: 5 }
        });
        return verification ? verification.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const verifications = await this.readEmailVerifications();
      return verifications.find(v => 
        v.email === email.toLowerCase() && 
        v.code === code && 
        v.type === type &&
        v.verified === true &&
        v.isActive !== false &&
        new Date(v.expiresAt) > new Date() &&
        v.attempts < 5
      ) || null;
    }
  }

  async updateEmailVerification(email, updateData) {
    if (this.isMongoDB) {
      try {
        const verification = await EmailVerification.findOneAndUpdate(
          { email: email.toLowerCase() },
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        return verification ? verification.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const verifications = await this.readEmailVerifications();
      const verificationIndex = verifications.findIndex(v => v.email === email.toLowerCase());
      if (verificationIndex >= 0) {
        verifications[verificationIndex] = { ...verifications[verificationIndex], ...updateData };
        await this.writeEmailVerifications(verifications);
        return verifications[verificationIndex];
      }
      return null;
    }
  }

  async deleteEmailVerification(email) {
    if (this.isMongoDB) {
      try {
        const result = await EmailVerification.deleteOne({ email: email.toLowerCase() });
        return result.deletedCount > 0;
      } catch (error) {
        throw error;
      }
    } else {
      const verifications = await this.readEmailVerifications();
      const filteredVerifications = verifications.filter(v => v.email !== email.toLowerCase());
      if (filteredVerifications.length !== verifications.length) {
        await this.writeEmailVerifications(filteredVerifications);
        return true;
      }
      return false;
    }
  }

  // ==================== EVENT PARTICIPANT OPERATIONS ====================

  async readEventParticipants() {
    if (this.isMongoDB) {
      try {
        const participants = await EventParticipant.find({ isActive: true });
        return participants.map(participant => participant.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        if (await fs.pathExists(EVENT_PARTICIPANTS_FILE)) {
          const data = await fs.readJson(EVENT_PARTICIPANTS_FILE);
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error) {
        return [];
      }
    }
  }

  async writeEventParticipants(participants) {
    if (this.isMongoDB) {
      try {
        console.log('MongoDB writeEventParticipants called - this should be replaced with individual participant operations');
        return { success: true };
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(EVENT_PARTICIPANTS_FILE, participants, { spaces: 2 });
        return { success: true };
      } catch (error) {
        throw error;
      }
    }
  }

  async findEventParticipantsByEvent(eventId) {
    if (this.isMongoDB) {
      try {
        const participants = await EventParticipant.findByEvent(eventId);
        return participants.map(participant => participant.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      const participants = await this.readEventParticipants();
      return participants.filter(p => p.eventId === eventId);
    }
  }

  async findEventParticipantsByUser(userId) {
    if (this.isMongoDB) {
      try {
        const participants = await EventParticipant.findUserJoinedEvents(userId);
        return participants.map(participant => participant.toJSON());
      } catch (error) {
        throw error;
      }
    } else {
      const participants = await this.readEventParticipants();
      return participants.filter(p => p.userId === userId);
    }
  }

  async createEventParticipant(participantData) {
    if (this.isMongoDB) {
      try {
        const participant = new EventParticipant(participantData);
        await participant.save();
        return participant.toJSON();
      } catch (error) {
        throw error;
      }
    } else {
      const participants = await this.readEventParticipants();
      participants.push(participantData);
      await this.writeEventParticipants(participants);
      return participantData;
    }
  }

  async removeEventParticipant(eventId, userId) {
    if (this.isMongoDB) {
      try {
        const participant = await EventParticipant.findOneAndDelete(
          { eventId, userId }
        );
        return participant ? participant.toJSON() : null;
      } catch (error) {
        console.error('Error removing event participant:', error);
        throw error;
      }
    } else {
      const participants = await this.readEventParticipants();
      const filteredParticipants = participants.filter(p => !(p.eventId === eventId && p.userId === userId));
      await this.writeEventParticipants(filteredParticipants);
      return true;
    }
  }

  async updateEventParticipant(eventId, userId, updateData) {
    if (this.isMongoDB) {
      try {
        const participant = await EventParticipant.findOneAndUpdate(
          { eventId, userId },
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
        return participant ? participant.toJSON() : null;
      } catch (error) {
        throw error;
      }
    } else {
      const participants = await this.readEventParticipants();
      const participantIndex = participants.findIndex(p => p.eventId === eventId && p.userId === userId);
      if (participantIndex >= 0) {
        participants[participantIndex] = { ...participants[participantIndex], ...updateData };
        await this.writeEventParticipants(participants);
        return participants[participantIndex];
      }
      return null;
    }
  }
}

// Create singleton instance
const dataAccess = new DataAccess();

// Export the same interface as the original dataAccess
module.exports = {
  readUsers: () => dataAccess.readUsers(),
  writeUsers: (users) => dataAccess.writeUsers(users),
  readEvents: () => dataAccess.readEvents(),
  writeEvents: (events) => dataAccess.writeEvents(events),
  readEventParticipants: () => dataAccess.readEventParticipants(),
  writeEventParticipants: (participants) => dataAccess.writeEventParticipants(participants),
  readEmailVerifications: () => dataAccess.readEmailVerifications(),
  writeEmailVerifications: (verifications) => dataAccess.writeEmailVerifications(verifications),
  
  // New MongoDB-specific methods
  findUserById: (userId) => dataAccess.findUserById(userId),
  findUserByEmail: (email) => dataAccess.findUserByEmail(email),
  createUser: (userData) => dataAccess.createUser(userData),
  updateUser: (userId, updateData) => dataAccess.updateUser(userId, updateData),
  deleteUser: (userId) => dataAccess.deleteUser(userId),
  
  findEventById: (eventId) => dataAccess.findEventById(eventId),
  findAllEvents: () => dataAccess.findAllEvents(),
  findEventsByOrganization: (organizationId) => dataAccess.findEventsByOrganization(organizationId),
  findEventsByUser: (userId) => dataAccess.findEventsByUser(userId),
  createEvent: (eventData) => dataAccess.createEvent(eventData),
  updateEvent: (eventId, updateData) => dataAccess.updateEvent(eventId, updateData),
  deleteEvent: (eventId) => dataAccess.deleteEvent(eventId),
  
  findEmailVerification: (email, code, type) => dataAccess.findEmailVerification(email, code, type),
  findVerifiedEmailVerification: (email, code, type) => dataAccess.findVerifiedEmailVerification(email, code, type),
  createEmailVerification: (verificationData) => dataAccess.createEmailVerification(verificationData),
  updateEmailVerification: (email, updateData) => dataAccess.updateEmailVerification(email, updateData),
  deleteEmailVerification: (email) => dataAccess.deleteEmailVerification(email),
  
  findEventParticipantsByEvent: (eventId) => dataAccess.findEventParticipantsByEvent(eventId),
  findEventParticipantsByUser: (userId) => dataAccess.findEventParticipantsByUser(userId),
  createEventParticipant: (participantData) => dataAccess.createEventParticipant(participantData),
  removeEventParticipant: (eventId, userId) => dataAccess.removeEventParticipant(eventId, userId),
  updateEventParticipant: (eventId, userId, updateData) => dataAccess.updateEventParticipant(eventId, userId, updateData)
};
