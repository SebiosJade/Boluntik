const mongoose = require('mongoose');

const eventReviewSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  eventTitle: {
    type: String,
    required: true
  },
  volunteerId: {
    type: String,
    required: true,
    index: true
  },
  volunteerName: {
    type: String,
    required: true
  },
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  organizationName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500,
    default: ''
  },
  badges: [{
    type: {
      type: String,
      enum: ['excellence', 'impact', 'responsive', 'professional', 'inspiring', 'friendly']
    },
    name: String,
    icon: String
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  isEdited: {
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
  timestamps: true
});

// Compound index to ensure one review per volunteer per event
eventReviewSchema.index({ eventId: 1, volunteerId: 1 }, { unique: true });

// Index for organization queries
eventReviewSchema.index({ organizationId: 1, createdAt: -1 });

// Static method to calculate average rating for an event
eventReviewSchema.statics.calculateEventRating = async function(eventId) {
  const result = await this.aggregate([
    { $match: { eventId, isVisible: true } },
    {
      $group: {
        _id: '$eventId',
        average: { $avg: '$rating' },
        total: { $sum: 1 },
        ratings: { $push: '$rating' }
      }
    }
  ]);

  if (result.length === 0) {
    return { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const ratings = result[0].ratings;
  const breakdown = {
    5: ratings.filter(r => r === 5).length,
    4: ratings.filter(r => r === 4).length,
    3: ratings.filter(r => r === 3).length,
    2: ratings.filter(r => r === 2).length,
    1: ratings.filter(r => r === 1).length
  };

  return {
    average: Math.round(result[0].average * 10) / 10, // Round to 1 decimal
    total: result[0].total,
    breakdown
  };
};

// Static method to get organization badge summary
eventReviewSchema.statics.getOrganizationBadges = async function(organizationId) {
  const result = await this.aggregate([
    { $match: { organizationId, isVisible: true } },
    { $unwind: '$badges' },
    {
      $group: {
        _id: '$badges.type',
        count: { $sum: 1 },
        name: { $first: '$badges.name' },
        icon: { $first: '$badges.icon' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return result.map(badge => ({
    type: badge._id,
    name: badge.name,
    icon: badge.icon,
    count: badge.count
  }));
};

// Method to check if review can be edited
eventReviewSchema.methods.canEdit = function() {
  const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  return hoursSinceCreation < 24; // Can edit within 24 hours
};

module.exports = mongoose.model('EventReview', eventReviewSchema);

