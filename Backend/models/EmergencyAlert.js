const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    index: true,
  },
  organizationName: {
    type: String,
    required: true,
  },
  organizationEmail: {
    type: String,
    required: true,
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
  emergencyType: {
    type: String,
    required: true,
    enum: ['fire', 'earthquake', 'flood', 'typhoon', 'hurricane', 'tsunami', 'landslide', 'medical', 'other'],
  },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high',
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    radius: Number, // in kilometers, for nearby volunteer targeting
  },
  instructions: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  volunteersNeeded: {
    type: Number,
    default: 0,
  },
  volunteersJoined: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active',
  },
  startTime: {
    type: Date,
  },
  estimatedDuration: {
    type: String, // e.g., "2 hours", "1 day"
  },
  requiredSkills: [{
    type: String,
  }],
  safetyGuidelines: {
    type: String,
  },
  contactInfo: {
    name: String,
    phone: String,
    email: String,
  },
  notificationsSent: {
    type: Number,
    default: 0,
  },
  broadcastedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
  verifiedByAdmin: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    adminId: String,
    adminName: String,
    verifiedAt: Date,
  },
  responses: [{
    volunteerId: String,
    volunteerName: String,
    volunteerEmail: String,
    joinedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['joined', 'checked-in', 'checked-out', 'completed', 'cancelled'],
      default: 'joined'
    },
    checkInTime: Date,
    checkOutTime: Date,
  }],
  analytics: {
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
    conversionRate: { type: Number, default: 0 }, // percentage
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

// Indexes for efficient queries
emergencyAlertSchema.index({ organizationId: 1, status: 1 });
emergencyAlertSchema.index({ emergencyType: 1, status: 1 });
emergencyAlertSchema.index({ urgencyLevel: 1, status: 1 });
emergencyAlertSchema.index({ broadcastedAt: -1 });
emergencyAlertSchema.index({ 'location.coordinates': '2dsphere' });

// Update the updatedAt timestamp before saving and handle backward compatibility
emergencyAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Convert old format volunteersNeeded/volunteersJoined to new format
  if (this.volunteersNeeded && typeof this.volunteersNeeded === 'object' && 'virtual' in this.volunteersNeeded) {
    this.volunteersNeeded = (this.volunteersNeeded.virtual || 0) + (this.volunteersNeeded.inPerson || 0);
  }
  if (this.volunteersJoined && typeof this.volunteersJoined === 'object' && 'virtual' in this.volunteersJoined) {
    this.volunteersJoined = (this.volunteersJoined.virtual || 0) + (this.volunteersJoined.inPerson || 0);
  }
  
  next();
});

// Static method to create emergency alert notification
emergencyAlertSchema.statics.createEmergencyAlertNotification = async function(alertData) {
  const Notification = mongoose.model('Notification');
  
  // Create notification for each volunteer (will be implemented with volunteer filtering)
  const notification = {
    type: 'emergency_alert',
    userId: alertData.volunteerId, // Will be set per volunteer
    title: `🚨 ${alertData.emergencyType.toUpperCase()} Emergency Alert`,
    message: `${alertData.organizationName} needs volunteers: ${alertData.title}`,
    data: {
      alertId: alertData.alertId,
      emergencyType: alertData.emergencyType,
      urgencyLevel: alertData.urgencyLevel,
      location: alertData.location.address,
      organizationName: alertData.organizationName,
    },
    priority: alertData.urgencyLevel === 'critical' ? 'high' : 'normal',
  };
  
  return notification;
};

// Calculate analytics
emergencyAlertSchema.methods.calculateAnalytics = function() {
  const responses = this.responses || [];
  const totalResponses = responses.length;
  
  if (totalResponses > 0) {
    // Calculate average response time
    const responseTimes = responses.map(r => {
      const joinedTime = new Date(r.joinedAt).getTime();
      const broadcastTime = new Date(this.broadcastedAt).getTime();
      return (joinedTime - broadcastTime) / (1000 * 60); // in minutes
    });
    
    this.analytics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Calculate conversion rate
    if (this.analytics.totalViews > 0) {
      this.analytics.conversionRate = (totalResponses / this.analytics.totalViews) * 100;
    }
  }
  
  return this.analytics;
};

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

module.exports = EmergencyAlert;

