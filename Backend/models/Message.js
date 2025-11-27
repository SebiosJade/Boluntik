const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: String
  }],
  replyTo: {
    messageId: String,
    content: String,
    senderName: String
  },
  readBy: [{
    userId: String,
    readAt: Date
  }],
  reactions: [{
    userId: String,
    userName: String,
    emoji: String,
    timestamp: Date
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
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
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

// Method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(r => r.userId === userId);
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
    await this.save();
  }
  return this;
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, limit = 50, skip = 0) {
  return this.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(conversationId, userId) {
  return this.countDocuments({
    conversationId,
    isDeleted: false,
    senderId: { $ne: userId },
    'readBy.userId': { $ne: userId }
  });
};

module.exports = mongoose.model('Message', messageSchema);






