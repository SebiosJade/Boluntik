const mongoose = require('mongoose');

const eventParticipantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'attended', 'no_show', 'cancelled'],
    default: 'registered'
  },
  attendanceStatus: {
    type: String,
    enum: ['pending', 'attended', 'not_attended'],
    default: 'pending'
  },
  attendanceMarkedAt: {
    type: Date
  },
  attendanceMarkedBy: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    givenAt: {
      type: Date
    },
    givenBy: {
      type: String
    }
  },
  badges: [{
    badgeType: {
      type: String,
      enum: ['participation', 'excellence', 'leadership', 'dedication', 'special', 'teamwork', 'innovation', 'commitment', 'impact', 'mentor'],
      required: true
    },
    badgeName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    awardedAt: {
      type: Date,
      default: Date.now
    },
    awardedBy: {
      type: String
    },
    eventId: {
      type: String
    }
  }],
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

// Compound index to prevent duplicate registrations
eventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventParticipantSchema.index({ eventId: 1 });
eventParticipantSchema.index({ userId: 1 });
eventParticipantSchema.index({ status: 1 });
eventParticipantSchema.index({ isActive: 1 });

// Virtual for participant details
eventParticipantSchema.virtual('participantDetails').get(function() {
  return {
    id: this.id,
    eventId: this.eventId,
    userId: this.userId,
    userName: this.userName,
    userEmail: this.userEmail,
    status: this.status,
    registrationDate: this.registrationDate,
    checkInTime: this.checkInTime,
    checkOutTime: this.checkOutTime,
    notes: this.notes,
    feedback: this.feedback,
    badges: this.badges,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to check in participant
eventParticipantSchema.methods.checkIn = async function() {
  this.status = 'confirmed';
  this.checkInTime = new Date();
  return await this.save();
};

// Method to check out participant
eventParticipantSchema.methods.checkOut = async function() {
  this.status = 'attended';
  this.checkOutTime = new Date();
  return await this.save();
};

// Method to cancel participation
eventParticipantSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.isActive = false;
  return await this.save();
};

// Static method to find participants by event
eventParticipantSchema.statics.findByEvent = function(eventId) {
  return this.find({ eventId, isActive: true }).sort({ registrationDate: -1 });
};

// Static method to find user's joined events
eventParticipantSchema.statics.findUserJoinedEvents = function(userId) {
  return this.find({ userId, isActive: true }).sort({ registrationDate: -1 });
};

// Static method to check if user is registered for event
eventParticipantSchema.statics.isUserRegistered = function(eventId, userId) {
  return this.findOne({ eventId, userId, isActive: true });
};

// Static method to get event participant count
eventParticipantSchema.statics.getEventParticipantCount = function(eventId) {
  return this.countDocuments({ eventId, isActive: true });
};

// Pre-save middleware to update updatedAt
eventParticipantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EventParticipant', eventParticipantSchema);
