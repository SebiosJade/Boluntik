const EmergencyAlert = require('../../models/EmergencyAlert');
const EmergencyAnalytics = require('../../models/EmergencyAnalytics');

// Get emergency analytics for a specific period
const getAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }
    
    // Check if analytics already exists for this period
    let analytics = await EmergencyAnalytics.findOne({
      period,
      startDate: start,
      endDate: end,
    });
    
    if (!analytics) {
      // Calculate and store new analytics
      const analyticsData = await EmergencyAnalytics.calculatePeriodAnalytics(period, start, end);
      analytics = new EmergencyAnalytics(analyticsData);
      await analytics.save();
    }
    
    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get current month alerts
    const monthAlerts = await EmergencyAlert.find({
      broadcastedAt: { $gte: startOfMonth },
    });
    
    // Calculate stats
    const stats = {
      totalAlerts: monthAlerts.length,
      activeAlerts: monthAlerts.filter(a => a.status === 'active').length,
      resolvedAlerts: monthAlerts.filter(a => a.status === 'resolved').length,
      totalVolunteers: new Set(monthAlerts.flatMap(a => a.responses.map(r => r.volunteerId))).size,
      totalResponses: monthAlerts.reduce((sum, a) => sum + a.responses.length, 0),
      averageResponseTime: 0,
      joinRate: 0,
      criticalAlerts: monthAlerts.filter(a => a.urgencyLevel === 'critical').length,
      highAlerts: monthAlerts.filter(a => a.urgencyLevel === 'high').length,
    };
    
    // Calculate average response time
    const responseTimes = monthAlerts.flatMap(alert => 
      alert.responses.map(response => {
        const responseTime = (new Date(response.joinedAt) - new Date(alert.broadcastedAt)) / (1000 * 60);
        return responseTime;
      })
    );
    
    if (responseTimes.length > 0) {
      stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
    
    // Calculate join rate
    const totalNotifications = monthAlerts.reduce((sum, a) => sum + (a.notificationsSent || 0), 0);
    if (totalNotifications > 0) {
      stats.joinRate = (stats.totalResponses / totalNotifications) * 100;
    }
    
    // Get alerts by type
    const alertsByType = {};
    monthAlerts.forEach(alert => {
      alertsByType[alert.emergencyType] = (alertsByType[alert.emergencyType] || 0) + 1;
    });
    
    // Get recent alerts
    const recentAlerts = await EmergencyAlert.find()
      .sort({ broadcastedAt: -1 })
      .limit(10)
      .select('alertId title emergencyType urgencyLevel status broadcastedAt responses volunteersNeeded location organizationName notificationsSent analytics');
    
    // Get top responding volunteers
    const volunteerStats = {};
    monthAlerts.forEach(alert => {
      alert.responses.forEach(response => {
        if (!volunteerStats[response.volunteerId]) {
          volunteerStats[response.volunteerId] = {
            volunteerId: response.volunteerId,
            volunteerName: response.volunteerName,
            responsesCount: 0,
            completedCount: 0,
          };
        }
        volunteerStats[response.volunteerId].responsesCount++;
        if (response.status === 'completed') {
          volunteerStats[response.volunteerId].completedCount++;
        }
      });
    });
    
    const topVolunteers = Object.values(volunteerStats)
      .sort((a, b) => b.responsesCount - a.responsesCount)
      .slice(0, 10);
    
    res.json({
      success: true,
      stats,
      alertsByType,
      recentAlerts,
      topVolunteers,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// Get organization statistics
const getOrganizationStats = async (req, res) => {
  try {
    const organizationId = req.user.id || req.user.sub;
    
    const alerts = await EmergencyAlert.find({ organizationId });
    
    const stats = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
      totalVolunteersRecruited: new Set(alerts.flatMap(a => a.responses.map(r => r.volunteerId))).size,
      totalResponses: alerts.reduce((sum, a) => sum + a.responses.length, 0),
      averageVolunteersPerAlert: 0,
      averageResponseTime: 0,
      completionRate: 0,
    };
    
    if (alerts.length > 0) {
      stats.averageVolunteersPerAlert = stats.totalResponses / alerts.length;
    }
    
    // Calculate average response time
    const responseTimes = alerts.flatMap(alert => 
      alert.responses.map(response => {
        const responseTime = (new Date(response.joinedAt) - new Date(alert.broadcastedAt)) / (1000 * 60);
        return responseTime;
      })
    );
    
    if (responseTimes.length > 0) {
      stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
    
    // Calculate completion rate
    const completedResponses = alerts.reduce((sum, a) => 
      sum + a.responses.filter(r => r.status === 'completed').length, 0
    );
    
    if (stats.totalResponses > 0) {
      stats.completionRate = (completedResponses / stats.totalResponses) * 100;
    }
    
    // Get alert history
    const alertHistory = alerts
      .sort((a, b) => new Date(b.broadcastedAt) - new Date(a.broadcastedAt))
      .map(alert => ({
        alertId: alert.alertId,
        title: alert.title,
        emergencyType: alert.emergencyType,
        urgencyLevel: alert.urgencyLevel,
        status: alert.status,
        broadcastedAt: alert.broadcastedAt,
        volunteersJoined: alert.responses.length,
        volunteersNeeded: typeof alert.volunteersNeeded === 'number' 
          ? alert.volunteersNeeded 
          : (alert.volunteersNeeded?.virtual || 0) + (alert.volunteersNeeded?.inPerson || 0),
      }));
    
    res.json({
      success: true,
      stats,
      alertHistory,
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization statistics',
      error: error.message,
    });
  }
};

// Get volunteer statistics
const getVolunteerStats = async (req, res) => {
  try {
    const volunteerId = req.user.id || req.user.sub;
    
    const alerts = await EmergencyAlert.find({
      'responses.volunteerId': volunteerId,
    });
    
    const myResponses = alerts.map(alert => 
      alert.responses.find(r => r.volunteerId === volunteerId)
    );
    
    const stats = {
      totalResponses: myResponses.length,
      activeResponses: myResponses.filter(r => r.status === 'joined' || r.status === 'confirmed' || r.status === 'checked-in').length,
      completedResponses: myResponses.filter(r => r.status === 'completed').length,
      virtualResponses: myResponses.filter(r => r.responseType === 'virtual').length,
      inPersonResponses: myResponses.filter(r => r.responseType === 'in-person').length,
      averageResponseTime: 0,
      totalHoursVolunteered: 0,
      averageRating: 0,
    };
    
    // Calculate average response time
    const responseTimes = alerts.map((alert, index) => {
      const response = myResponses[index];
      const responseTime = (new Date(response.joinedAt) - new Date(alert.broadcastedAt)) / (1000 * 60);
      return responseTime;
    });
    
    if (responseTimes.length > 0) {
      stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
    
    // Calculate total hours volunteered
    myResponses.forEach(response => {
      if (response.checkInTime && response.checkOutTime) {
        const hours = (new Date(response.checkOutTime) - new Date(response.checkInTime)) / (1000 * 60 * 60);
        stats.totalHoursVolunteered += hours;
      }
    });
    
    // Calculate average rating from feedback
    const ratings = myResponses
      .filter(r => r.feedback && r.feedback.rating)
      .map(r => r.feedback.rating);
    
    if (ratings.length > 0) {
      stats.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
    
    // Get response history
    const responseHistory = alerts.map((alert, index) => ({
      alertId: alert.alertId,
      title: alert.title,
      emergencyType: alert.emergencyType,
      organizationName: alert.organizationName,
      joinedAt: myResponses[index].joinedAt,
      status: myResponses[index].status,
      responseType: myResponses[index].responseType,
      hoursVolunteered: myResponses[index].checkInTime && myResponses[index].checkOutTime
        ? ((new Date(myResponses[index].checkOutTime) - new Date(myResponses[index].checkInTime)) / (1000 * 60 * 60)).toFixed(1)
        : 0,
    })).sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    
    res.json({
      success: true,
      stats,
      responseHistory,
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer statistics',
      error: error.message,
    });
  }
};

// Get feature adoption metrics (admin only)
const getFeatureAdoptionMetrics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const alerts = await EmergencyAlert.find({
      broadcastedAt: { $gte: start, $lte: end },
    });
    
    // Calculate metrics
    const metrics = {
      alertBroadcastRate: {
        total: alerts.length,
        perDay: alerts.length / Math.ceil((end - start) / (24 * 60 * 60 * 1000)),
        byType: {},
        byUrgency: {},
      },
      volunteerJoinRate: {
        totalNotifications: alerts.reduce((sum, a) => sum + (a.notificationsSent || 0), 0),
        totalJoins: alerts.reduce((sum, a) => sum + a.responses.length, 0),
        percentage: 0,
      },
      averageResponseTime: {
        overall: 0,
        byEmergencyType: {},
        byUrgency: {},
      },
      retentionRate: {
        firstTime: 0,
        returning: 0,
        percentage: 0,
      },
      deploymentMetrics: {
        total: alerts.reduce((sum, a) => sum + a.responses.length, 0),
        completed: alerts.reduce((sum, a) => sum + a.responses.filter(r => r.status === 'completed').length, 0),
        completionRate: 0,
      },
      engagement: {
        totalVolunteers: new Set(alerts.flatMap(a => a.responses.map(r => r.volunteerId))).size,
        averageVolunteersPerAlert: 0,
        peakHours: {},
      },
    };
    
    // Calculate join rate percentage
    if (metrics.volunteerJoinRate.totalNotifications > 0) {
      metrics.volunteerJoinRate.percentage = 
        (metrics.volunteerJoinRate.totalJoins / metrics.volunteerJoinRate.totalNotifications) * 100;
    }
    
    // Calculate completion rate
    if (metrics.deploymentMetrics.total > 0) {
      metrics.deploymentMetrics.completionRate = 
        (metrics.deploymentMetrics.completed / metrics.deploymentMetrics.total) * 100;
    }
    
    // Calculate average volunteers per alert
    if (alerts.length > 0) {
      metrics.engagement.averageVolunteersPerAlert = 
        metrics.volunteerJoinRate.totalJoins / alerts.length;
    }
    
    // Group alerts by type and urgency
    alerts.forEach(alert => {
      metrics.alertBroadcastRate.byType[alert.emergencyType] = 
        (metrics.alertBroadcastRate.byType[alert.emergencyType] || 0) + 1;
      metrics.alertBroadcastRate.byUrgency[alert.urgencyLevel] = 
        (metrics.alertBroadcastRate.byUrgency[alert.urgencyLevel] || 0) + 1;
    });
    
    // Calculate average response times
    const responseTimes = alerts.flatMap(alert => 
      alert.responses.map(response => ({
        time: (new Date(response.joinedAt) - new Date(alert.broadcastedAt)) / (1000 * 60),
        type: alert.emergencyType,
        urgency: alert.urgencyLevel,
      }))
    );
    
    if (responseTimes.length > 0) {
      metrics.averageResponseTime.overall = 
        responseTimes.reduce((sum, rt) => sum + rt.time, 0) / responseTimes.length;
      
      // By emergency type
      const typeGroups = {};
      responseTimes.forEach(rt => {
        if (!typeGroups[rt.type]) typeGroups[rt.type] = [];
        typeGroups[rt.type].push(rt.time);
      });
      
      Object.keys(typeGroups).forEach(type => {
        metrics.averageResponseTime.byEmergencyType[type] = 
          typeGroups[type].reduce((a, b) => a + b, 0) / typeGroups[type].length;
      });
      
      // By urgency
      const urgencyGroups = {};
      responseTimes.forEach(rt => {
        if (!urgencyGroups[rt.urgency]) urgencyGroups[rt.urgency] = [];
        urgencyGroups[rt.urgency].push(rt.time);
      });
      
      Object.keys(urgencyGroups).forEach(urgency => {
        metrics.averageResponseTime.byUrgency[urgency] = 
          urgencyGroups[urgency].reduce((a, b) => a + b, 0) / urgencyGroups[urgency].length;
      });
    }
    
    // Calculate retention rate
    const allVolunteers = alerts.flatMap(a => a.responses.map(r => r.volunteerId));
    const volunteerCounts = {};
    allVolunteers.forEach(vid => {
      volunteerCounts[vid] = (volunteerCounts[vid] || 0) + 1;
    });
    
    metrics.retentionRate.firstTime = Object.values(volunteerCounts).filter(count => count === 1).length;
    metrics.retentionRate.returning = Object.values(volunteerCounts).filter(count => count > 1).length;
    
    if (metrics.engagement.totalVolunteers > 0) {
      metrics.retentionRate.percentage = 
        (metrics.retentionRate.returning / metrics.engagement.totalVolunteers) * 100;
    }
    
    // Analyze peak hours
    alerts.forEach(alert => {
      alert.responses.forEach(response => {
        const hour = new Date(response.joinedAt).getHours();
        metrics.engagement.peakHours[hour] = (metrics.engagement.peakHours[hour] || 0) + 1;
      });
    });
    
    res.json({
      success: true,
      period: {
        start,
        end,
        type: period,
      },
      metrics,
    });
  } catch (error) {
    console.error('Error fetching feature adoption metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature adoption metrics',
      error: error.message,
    });
  }
};

module.exports = {
  getAnalytics,
  getDashboardStats,
  getOrganizationStats,
  getVolunteerStats,
  getFeatureAdoptionMetrics,
};

