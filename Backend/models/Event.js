const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  date: {
    type: String,
    required: true,
    match: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/
  },
  time: {
    type: String,
    required: true,
    match: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i
  },
  endTime: {
    type: String,
    match: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  maxParticipants: {
    type: Number,
    min: 1,
    max: 1000,
    default: 50
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  organizationId: {
    type: String,
    required: true
  },
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: [
      'volunteer', 'workshop', 'training', 'conference', 'fundraiser',
      'community service', 'educational', 'recreational', 'professional development', 'other'
    ],
    default: 'volunteer'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'all levels'],
    default: 'all levels'
  },
  cause: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  skills: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  ageRestriction: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  equipment: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'Completed', 'Upcoming', 'Ongoing', 'Cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  reviewCount: {
    type: Number,
    default: 0
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

// Indexes for better query performance
eventSchema.index({ organizationId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ date: 1 });

// Virtual for event details
eventSchema.virtual('details').get(function() {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    date: this.date,
    time: this.time,
    endTime: this.endTime,
    location: this.location,
    maxParticipants: this.maxParticipants,
    currentParticipants: this.currentParticipants,
    organizationId: this.organizationId,
    organizationName: this.organizationName,
    eventType: this.eventType,
    difficulty: this.difficulty,
    cause: this.cause,
    skills: this.skills,
    ageRestriction: this.ageRestriction,
    equipment: this.equipment,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to check if event is full
eventSchema.methods.isFull = function() {
  return this.currentParticipants >= this.maxParticipants;
};

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  return this.status === 'upcoming';
};

// Method to update participant count
eventSchema.methods.updateParticipantCount = async function() {
  const EventParticipant = mongoose.model('EventParticipant');
  const count = await EventParticipant.countDocuments({ 
    eventId: this.id, 
    isActive: true 
  });
  this.currentParticipants = count;
  return await this.save();
};

// Static method to find events by organization
eventSchema.statics.findByOrganization = function(organizationId) {
  return this.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function() {
  return this.find({ 
    status: 'upcoming', 
    isActive: true 
  }).sort({ date: 1, time: 1 });
};

// Pre-save middleware to update updatedAt
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
