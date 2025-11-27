const mongoose = require('mongoose');

// Schema for interactions (requests on offers, or offers on requests)
const interactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    enum: ['volunteer', 'organization'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  message: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const resourceSchema = new mongoose.Schema({
  // Resource owner info
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  ownerRole: {
    type: String,
    enum: ['volunteer', 'organization'],
    required: true,
  },

  // Resource details
  type: {
    type: String,
    enum: ['offer', 'request'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['equipment', 'human-resources', 'supplies', 'furniture', 'technology', 'other'],
    required: true,
    index: true,
  },
  quantity: {
    type: String,
    default: '1',
  },
  location: {
    type: String,
    required: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active',
    index: true,
  },
  
  // Interactions (requests on offers, or offers on requests)
  interactions: [interactionSchema],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  fulfilledAt: {
    type: Date,
  },
  fulfilledBy: {
    userId: String,
    userName: String,
  },
});

// Indexes for efficient queries
resourceSchema.index({ ownerId: 1, type: 1, status: 1 });
resourceSchema.index({ type: 1, status: 1, createdAt: -1 });
resourceSchema.index({ 'interactions.userId': 1, status: 1 });

// Update timestamps on save
resourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
resourceSchema.methods.addInteraction = function(interactionData) {
  this.interactions.push(interactionData);
  return this.save();
};

resourceSchema.methods.updateInteractionStatus = function(interactionId, status) {
  const interaction = this.interactions.id(interactionId);
  if (interaction) {
    interaction.status = status;
    interaction.updatedAt = Date.now();
    
    // If accepted, mark resource as fulfilled
    if (status === 'accepted') {
      this.status = 'fulfilled';
      this.fulfilledAt = Date.now();
      this.fulfilledBy = {
        userId: interaction.userId,
        userName: interaction.userName,
      };
    }
  }
  return this.save();
};

resourceSchema.methods.getInteractionsByUser = function(userId) {
  return this.interactions.filter(i => i.userId === userId);
};

// Static methods
resourceSchema.statics.getActiveOffers = function() {
  return this.find({ type: 'offer', status: 'active' })
    .sort({ createdAt: -1 });
};

resourceSchema.statics.getActiveRequests = function() {
  return this.find({ type: 'request', status: 'active' })
    .sort({ createdAt: -1 });
};

resourceSchema.statics.getUserOffers = function(userId) {
  return this.find({ ownerId: userId, type: 'offer' })
    .sort({ createdAt: -1 });
};

resourceSchema.statics.getUserRequests = function(userId) {
  return this.find({ ownerId: userId, type: 'request' })
    .sort({ createdAt: -1 });
};

resourceSchema.statics.getUserRequestedFromOthers = function(userId) {
  return this.find({
    type: 'offer',
    'interactions.userId': userId,
  }).sort({ createdAt: -1 });
};

resourceSchema.statics.getUserHelpOffered = function(userId) {
  return this.find({
    type: 'request',
    'interactions.userId': userId,
  }).sort({ createdAt: -1 });
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;


