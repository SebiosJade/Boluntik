const User = require('../../models/User');
const Event = require('../../models/Event');
const EventParticipant = require('../../models/EventParticipant');
const Campaign = require('../../models/Campaign');
const Resource = require('../../models/Resource');
const EmergencyAlert = require('../../models/EmergencyAlert');
const PaymentSettings = require('../../models/PaymentSettings');
const mongoose = require('mongoose');

// Get usage analytics
const getUsageAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, userType } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    
    // User statistics
    const userQuery = {};
    if (userType) userQuery.role = userType;
    if (hasDateFilter) userQuery.createdAt = dateFilter;
    
    const userDateCondition = hasDateFilter ? { createdAt: dateFilter } : {};
    const eventDateCondition = hasDateFilter ? { createdAt: dateFilter } : {};
    const participantDateCondition = hasDateFilter ? { createdAt: dateFilter } : {};
    
    const totalUsers = await User.countDocuments({ accountStatus: { $ne: 'deleted' }, ...userDateCondition });
    const activeUsers = await User.countDocuments({ accountStatus: 'active', ...userDateCondition });
    const suspendedUsers = await User.countDocuments({ accountStatus: 'suspended', ...userDateCondition });
    const volunteers = await User.countDocuments({ role: 'volunteer', accountStatus: 'active', ...userDateCondition });
    const organizations = await User.countDocuments({ role: 'organization', accountStatus: 'active', ...userDateCondition });
    const admins = await User.countDocuments({ role: 'admin', accountStatus: 'active', ...userDateCondition });
    
    // Event statistics
    const totalEvents = await Event.countDocuments(eventDateCondition);
    const activeEvents = await Event.countDocuments({ status: 'upcoming', isActive: true, ...eventDateCondition });
    const completedEvents = await Event.countDocuments({ status: 'completed', ...eventDateCondition });
    
    // Participation statistics
    const totalParticipations = await EventParticipant.countDocuments(participantDateCondition);
    const confirmedParticipations = await EventParticipant.countDocuments({ 
      $or: [{ attended: true }, { attendance: 'confirmed' }],
      ...participantDateCondition
    });
    
    // Recent activity
    const recentLoginMatch = { lastLoginAt: { $exists: true } };
    if (hasDateFilter) recentLoginMatch.lastLoginAt = dateFilter;
    const recentLogins = await User.find(recentLoginMatch)
      .select('id name email role lastLoginAt loginCount')
      .sort({ lastLoginAt: -1 })
      .limit(20);
    
    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          accountStatus: { $ne: 'deleted' },
          ...(hasDateFilter ? { createdAt: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    // Calculate total volunteer hours
    const volunteerHoursData = await EventParticipant.aggregate([
      {
        $match: { 
          $or: [{ status: 'attended' }, { attendanceStatus: 'attended' }],
          checkInTime: { $exists: true, $ne: null },
          checkOutTime: { $exists: true, $ne: null },
          ...(hasDateFilter ? { createdAt: dateFilter } : {})
        }
      },
      {
        $addFields: {
          hours: {
            $divide: [
              { $subtract: ['$checkOutTime', '$checkInTime'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $match: {
          hours: { $gt: 0.001 } // Only count sessions longer than ~3.6 seconds
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hours' },
          avgHours: { $avg: '$hours' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalVolunteerHours = volunteerHoursData.length > 0 ? volunteerHoursData[0].totalHours || 0 : 0;
    
    // Top volunteers by hours
    const topVolunteers = await EventParticipant.aggregate([
      {
        $match: { 
          $or: [{ status: 'attended' }, { attendanceStatus: 'attended' }],
          checkInTime: { $exists: true, $ne: null },
          checkOutTime: { $exists: true, $ne: null },
          ...(hasDateFilter ? { createdAt: dateFilter } : {})
        }
      },
      {
        $addFields: {
          sessionHours: {
            $divide: [
              { $subtract: ['$checkOutTime', '$checkInTime'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $match: {
          sessionHours: { $gt: 0.001 } // Only count sessions longer than ~3.6 seconds
        }
      },
      {
        $group: {
          _id: '$userId',
          totalEvents: { $sum: 1 },
          totalHours: { $sum: '$sessionHours' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          totalEvents: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      },
      {
        $sort: { totalHours: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Feature adoption metrics (placeholder - would need actual feature usage tracking)
    const featureAdoption = [
      { feature: 'Events', usage: totalParticipations, adoptionRate: 85.5 },
      { feature: 'Crowdfunding', usage: await Campaign.countDocuments(), adoptionRate: 45.2 },
      { feature: 'Resources', usage: await Resource.countDocuments(), adoptionRate: 30.1 },
      { feature: 'Emergency', usage: await EmergencyAlert.countDocuments(), adoptionRate: 15.8 }
    ];
    
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          volunteers,
          organizations,
          admins
        },
        events: {
          total: totalEvents,
          active: activeEvents,
          completed: completedEvents
        },
        participation: {
          total: totalParticipations,
          confirmed: confirmedParticipations,
          rate: totalEvents > 0 ? (totalParticipations / totalEvents).toFixed(2) : 0
        },
        totalVolunteerHours,
        topVolunteers,
        featureAdoption,
        recentLogins,
        userGrowth
      }
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const paymentSettings = await PaymentSettings.getSettings();
    const platformFeePercentage = paymentSettings?.platformFeePercentage ?? 5;
    const commissionRate = platformFeePercentage / 100;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Crowdfunding revenue (5% commission)
    const crowdfundingQuery = { status: { $in: ['completed', 'disbursed'] } };
    if (Object.keys(dateFilter).length > 0) crowdfundingQuery.completedAt = dateFilter;
    
    const campaigns = await Campaign.find(crowdfundingQuery);
    const crowdfundingRevenue = campaigns.reduce((sum, campaign) => {
      if (campaign.status === 'disbursed' && campaign.disbursementDetails?.platformFee != null) {
        return sum + campaign.disbursementDetails.platformFee;
      }
      const amount = typeof campaign.currentAmount === 'number' ? campaign.currentAmount : 0;
      return sum + (amount * commissionRate);
    }, 0);
    
    // Organization subscriptions (would need a Subscription model - placeholder)
    const subscriptionRevenue = 0; // To be implemented with subscription system
    
    const totalRevenue = crowdfundingRevenue + subscriptionRevenue;
    
    // Revenue by month
    const revenueByMonth = await Campaign.aggregate([
      {
        $match: { status: { $in: ['completed', 'disbursed'] } }
      },
      {
        $addFields: {
          effectiveDate: {
            $ifNull: ['$disbursementDetails.disbursedAt', '$completedAt']
          },
          commissionAmount: {
            $cond: [
              { $gt: ['$disbursementDetails.platformFee', 0] },
              '$disbursementDetails.platformFee',
              { $multiply: ['$currentAmount', commissionRate] }
            ]
          }
        }
      },
      {
        $match: {
          effectiveDate: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$effectiveDate' },
            month: { $month: '$effectiveDate' }
          },
          totalAmount: { $sum: '$currentAmount' },
          campaignCount: { $sum: 1 },
          commission: { $sum: '$commissionAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      revenue: {
        total: totalRevenue,
        crowdfunding: crowdfundingRevenue,
        subscriptions: subscriptionRevenue,
        byMonth: revenueByMonth,
        completedCampaigns: campaigns.length
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

// Get system overview
const getSystemOverview = async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const overview = {
      users: {
        total: await User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
        newThisMonth: await User.countDocuments({ 
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          accountStatus: { $ne: 'deleted' }
        }),
        activeToday: await User.countDocuments({ 
          lastLoginAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) }
        })
      },
      events: {
        total: await Event.countDocuments(),
        upcoming: await Event.countDocuments({ status: 'upcoming', isActive: true }),
        thisMonth: await Event.countDocuments({
          date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
        }),
        virtual: await mongoose.connection.db.collection('virtualevents').countDocuments()
      },
      crowdfunding: {
        activeCampaigns: await Campaign.countDocuments({ status: 'active' }),
        totalRaised: (await Campaign.aggregate([
          { $match: { status: { $in: ['active', 'completed', 'disbursed'] } } },
          { $group: { _id: null, total: { $sum: '$currentAmount' } } }
        ]))[0]?.total || 0
      },
      campaignPerformance: await Campaign.aggregate([
        {
          $match: { status: { $in: ['active', 'completed'] } }
        },
        {
          $project: {
            title: 1,
            targetAmount: { $ifNull: ['$goalAmount', 0] },
            currentAmount: 1,
            successRate: {
              $cond: [
                { $gt: ['$goalAmount', 0] },
                { $multiply: [{ $divide: ['$currentAmount', '$goalAmount'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { successRate: -1 }
        },
        {
          $limit: 10
        }
      ]),
      resources: {
        activeOffers: await Resource.countDocuments({ type: 'offer', status: 'active' }),
        activeRequests: await Resource.countDocuments({ type: 'request', status: 'active' })
      },
      emergency: {
        activeAlerts: await EmergencyAlert.countDocuments({ status: 'active', verifiedByAdmin: true }),
        pendingVerification: await EmergencyAlert.countDocuments({ verifiedByAdmin: false })
      },
      reports: {
        pending: await require('../../models/UserReport').countDocuments({ status: 'pending' }),
        resolved: await require('../../models/UserReport').countDocuments({ status: 'resolved' })
      }
    };
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system overview',
      error: error.message
    });
  }
};

const sendNewReportEmailToAdmins = async (report) => {
  // Already defined in userReportController, but including here for reference
  return true;
};

const sendReportResolutionEmails = async (report, decision, actionTaken) => {
  try {
    // Email to reporter
    const reporterMail = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: report.reporterEmail,
      subject: '✅ Your Report Has Been Resolved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Report Resolved</h2>
          <p>Dear ${report.reporterName},</p>
          <p>Your report (ID: ${report.reportId}) has been reviewed by our admin team.</p>
          <p><strong>Decision:</strong> ${decision}</p>
          <p><strong>Action Taken:</strong> ${actionTaken}</p>
          <p>Thank you for helping maintain a safe community.</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(reporterMail);
    
    // Email to reported user if action taken
    if (actionTaken !== 'no_action') {
      const reportedMail = {
        from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
        to: report.reportedUserEmail,
        subject: '⚠️ Account Review Notification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Account Review Notification</h2>
            <p>Dear ${report.reportedUserName},</p>
            <p>A report against your account has been reviewed.</p>
            <p><strong>Action Taken:</strong> ${actionTaken}</p>
            <p>If you have questions or believe this is an error, please contact our support team.</p>
          </div>
        `
      };
      
      await emailTransporter.sendMail(reportedMail);
    }
  } catch (error) {
    console.error('Error sending resolution emails:', error);
  }
};

module.exports = {
  getUsageAnalytics,
  getRevenueAnalytics,
  getSystemOverview
};

