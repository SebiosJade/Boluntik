const mongoose = require('mongoose');

const emergencyAnalyticsSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  metrics: {
    // Alert Broadcast Metrics
    totalAlerts: { type: Number, default: 0 },
    alertsByType: {
      fire: { type: Number, default: 0 },
      earthquake: { type: Number, default: 0 },
      flood: { type: Number, default: 0 },
      typhoon: { type: Number, default: 0 },
      hurricane: { type: Number, default: 0 },
      tsunami: { type: Number, default: 0 },
      landslide: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    alertsByUrgency: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    alertsResolved: { type: Number, default: 0 },
    alertsActive: { type: Number, default: 0 },
    alertsCancelled: { type: Number, default: 0 },
    
    // Volunteer Response Metrics
    totalVolunteerResponses: { type: Number, default: 0 },
    uniqueVolunteers: { type: Number, default: 0 },
    virtualResponses: { type: Number, default: 0 },
    inPersonResponses: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
    
    // Join Rate Metrics
    totalNotificationsSent: { type: Number, default: 0 },
    totalJoins: { type: Number, default: 0 },
    joinRate: { type: Number, default: 0 }, // percentage
    
    // Retention Metrics
    firstTimeVolunteers: { type: Number, default: 0 },
    returningVolunteers: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 }, // percentage
    
    // Deployment Metrics
    totalDeployments: { type: Number, default: 0 },
    completedDeployments: { type: Number, default: 0 },
    averageDeploymentTime: { type: Number, default: 0 }, // in hours
    
    // Engagement Metrics
    averageVolunteersPerAlert: { type: Number, default: 0 },
    peakResponseTime: { type: String }, // e.g., "14:00-16:00"
    mostActiveDay: { type: String }, // e.g., "Monday"
    
    // Organization Metrics
    activeOrganizations: { type: Number, default: 0 },
    totalOrganizations: { type: Number, default: 0 },
    averageAlertsPerOrganization: { type: Number, default: 0 },
    
    // Feedback Metrics
    averageRating: { type: Number, default: 0 },
    totalFeedbacks: { type: Number, default: 0 },
  },
  topOrganizations: [{
    organizationId: String,
    organizationName: String,
    alertsCreated: Number,
    volunteersRecruited: Number,
  }],
  topVolunteers: [{
    volunteerId: String,
    volunteerName: String,
    responsesCount: Number,
    hoursVolunteered: Number,
  }],
  performanceByRegion: [{
    location: String,
    alertsCount: Number,
    volunteersCount: Number,
    averageResponseTime: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
emergencyAnalyticsSchema.index({ period: 1, startDate: -1 });
emergencyAnalyticsSchema.index({ startDate: 1, endDate: 1 });

// Update timestamp
emergencyAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to calculate and store analytics for a period
emergencyAnalyticsSchema.statics.calculatePeriodAnalytics = async function(period, startDate, endDate) {
  const EmergencyAlert = mongoose.model('EmergencyAlert');
  
  // Fetch all alerts in the period
  const alerts = await EmergencyAlert.find({
    broadcastedAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
  
  // Initialize metrics
  const metrics = {
    totalAlerts: alerts.length,
    alertsByType: {},
    alertsByUrgency: {},
    totalVolunteerResponses: 0,
    uniqueVolunteers: new Set(),
    virtualResponses: 0,
    inPersonResponses: 0,
    totalNotificationsSent: 0,
    totalJoins: 0,
    firstTimeVolunteers: new Set(),
    returningVolunteers: new Set(),
    totalDeployments: 0,
    completedDeployments: 0,
    responseTimes: [],
    deploymentTimes: [],
    ratings: [],
  };
  
  // Process each alert
  alerts.forEach(alert => {
    // Count by type
    metrics.alertsByType[alert.emergencyType] = (metrics.alertsByType[alert.emergencyType] || 0) + 1;
    
    // Count by urgency
    metrics.alertsByUrgency[alert.urgencyLevel] = (metrics.alertsByUrgency[alert.urgencyLevel] || 0) + 1;
    
    // Count notifications
    metrics.totalNotificationsSent += alert.notificationsSent || 0;
    
    // Process responses
    alert.responses.forEach(response => {
      metrics.totalVolunteerResponses++;
      metrics.uniqueVolunteers.add(response.volunteerId);
      
      if (response.responseType === 'virtual') metrics.virtualResponses++;
      if (response.responseType === 'in-person') metrics.inPersonResponses++;
      
      metrics.totalJoins++;
      
      // Calculate response time
      const responseTime = (new Date(response.joinedAt) - new Date(alert.broadcastedAt)) / (1000 * 60);
      metrics.responseTimes.push(responseTime);
      
      // Check if deployment completed
      if (response.status === 'completed') {
        metrics.completedDeployments++;
        if (response.checkInTime && response.checkOutTime) {
          const deploymentTime = (new Date(response.checkOutTime) - new Date(response.checkInTime)) / (1000 * 60 * 60);
          metrics.deploymentTimes.push(deploymentTime);
        }
      }
      
      if (response.feedback && response.feedback.rating) {
        metrics.ratings.push(response.feedback.rating);
      }
    });
  });
  
  // Calculate derived metrics
  const analyticsData = {
    period,
    startDate,
    endDate,
    metrics: {
      totalAlerts: metrics.totalAlerts,
      alertsByType: metrics.alertsByType,
      alertsByUrgency: metrics.alertsByUrgency,
      alertsResolved: alerts.filter(a => a.status === 'resolved').length,
      alertsActive: alerts.filter(a => a.status === 'active').length,
      alertsCancelled: alerts.filter(a => a.status === 'cancelled').length,
      totalVolunteerResponses: metrics.totalVolunteerResponses,
      uniqueVolunteers: metrics.uniqueVolunteers.size,
      virtualResponses: metrics.virtualResponses,
      inPersonResponses: metrics.inPersonResponses,
      averageResponseTime: metrics.responseTimes.length > 0 
        ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
        : 0,
      totalNotificationsSent: metrics.totalNotificationsSent,
      totalJoins: metrics.totalJoins,
      joinRate: metrics.totalNotificationsSent > 0 
        ? (metrics.totalJoins / metrics.totalNotificationsSent) * 100 
        : 0,
      totalDeployments: metrics.totalVolunteerResponses,
      completedDeployments: metrics.completedDeployments,
      averageDeploymentTime: metrics.deploymentTimes.length > 0 
        ? metrics.deploymentTimes.reduce((a, b) => a + b, 0) / metrics.deploymentTimes.length 
        : 0,
      averageVolunteersPerAlert: metrics.totalAlerts > 0 
        ? metrics.totalVolunteerResponses / metrics.totalAlerts 
        : 0,
      averageRating: metrics.ratings.length > 0 
        ? metrics.ratings.reduce((a, b) => a + b, 0) / metrics.ratings.length 
        : 0,
      totalFeedbacks: metrics.ratings.length,
    },
  };
  
  return analyticsData;
};

const EmergencyAnalytics = mongoose.model('EmergencyAnalytics', emergencyAnalyticsSchema);

module.exports = EmergencyAnalytics;

