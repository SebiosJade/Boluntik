const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const conversationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  type: {
    type: String,
    enum: ['dm', 'group'],
    required: true
  },
  name: {
    type: String, // For group chats
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  eventId: {
    type: String, // If associated with a virtual event
    default: ''
  },
  avatar: {
    type: String, // Group avatar
    default: ''
  },
  lastMessage: {
    content: {
      type: String,
      default: ''
    },
    senderId: {
      type: String,
      default: ''
    },
    senderName: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ eventId: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Method to add participant
conversationSchema.methods.addParticipant = async function(userId, userName, userAvatar, role = 'member') {
  const exists = this.participants.some(p => p.userId === userId);
  if (!exists) {
    this.participants.push({ userId, userName, userAvatar, role });
    await this.save();
  }
  return this;
};

// Method to remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(p => p.userId !== userId);
  await this.save();
  return this;
};

// Method to update last message
conversationSchema.methods.updateLastMessage = async function(content, senderId, senderName) {
  this.lastMessage = {
    content,
    senderId,
    senderName,
    timestamp: new Date()
  };
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Static method to find DM between two users
conversationSchema.statics.findDM = function(userId1, userId2) {
  return this.findOne({
    type: 'dm',
    'participants.userId': { $all: [userId1, userId2] },
    isActive: true
  });
};

// Static method to find user's conversations
conversationSchema.statics.findUserConversations = function(userId) {
  return this.find({
    'participants.userId': userId,
    isActive: true
  }).sort({ 'lastMessage.timestamp': -1 });
};

module.exports = mongoose.model('Conversation', conversationSchema);






