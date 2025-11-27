const UserReport = require('../../models/UserReport');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { findUserById } = require('../../database/dataAccess');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// Email transporter - lazy initialization
let emailTransporter = null;
const getEmailTransporter = () => {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'voluntech4@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'yqnm uduy dsdx swsm'
      }
    });
  }
  return emailTransporter;
};

// Create a new report
const createReport = async (req, res) => {
  try {
    const {
      reportedUserId,
      reason,
      description,
      evidence
    } = req.body;
    
    const reporterId = req.user.id || req.user.sub;
    
    // Get reporter and reported user details
    const reporter = await findUserById(reporterId);
    const reportedUser = await findUserById(reportedUserId);
    
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }
    
    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }
    
    const reportId = `RPT-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const report = new UserReport({
      reportId,
      reporterId,
      reporterName: reporter.name,
      reporterEmail: reporter.email,
      reporterRole: reporter.role,
      reportedUserId,
      reportedUserName: reportedUser.name,
      reportedUserEmail: reportedUser.email,
      reportedUserRole: reportedUser.role,
      reason,
      description,
      evidence: evidence || [],
      priority: reason === 'harassment' || reason === 'scam' ? 'high' : 'medium'
    });
    
    await report.save();
    
    // Notify all admins
    const admins = await User.find({ role: 'admin', accountStatus: 'active' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        type: 'new_report',
        title: '🚨 New User Report',
        message: `${reporter.name} reported ${reportedUser.name} for ${reason}. Click to review.`,
        data: {
          reportId,
          reporterName: reporter.name,
          reportedUserName: reportedUser.name,
          reason
        }
      });
    }
    
    // Send email to admins
    await sendNewReportEmailToAdmins(report);
    
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Admins will review it shortly.',
      reportId
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
};

// Get all reports (admin)
const getAllReports = async (req, res) => {
  try {
    const { status, priority, reportedUserId, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (reportedUserId) query.reportedUserId = reportedUserId;
    
    const reports = await UserReport.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await UserReport.countDocuments(query);
    
    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Get report by ID
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await UserReport.findOne({ reportId });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

// Review report (admin)
const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, actionTaken, adminNotes } = req.body;
    const adminId = req.user.id || req.user.sub;
    
    const admin = await findUserById(adminId);
    const report = await UserReport.findOne({ reportId });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.status = 'resolved';
    report.adminReview = {
      reviewedBy: {
        adminId,
        adminName: admin?.name || 'Admin'
      },
      reviewedAt: new Date(),
      decision,
      actionTaken,
      adminNotes
    };
    report.resolution = {
      resolvedAt: new Date(),
      outcome: `Admin decision: ${decision}. Action: ${actionTaken}`,
      notificationsSent: true
    };
    
    await report.save();
    
    // Notify reporter
    await Notification.create({
      userId: report.reporterId,
      type: 'report_resolved',
      title: '✅ Report Resolved',
      message: `Your report against ${report.reportedUserName} has been reviewed. Action taken: ${actionTaken}`,
      data: {
        reportId,
        decision,
        actionTaken
      }
    });
    
    // Notify reported user (if action taken)
    if (actionTaken !== 'no_action') {
      await Notification.create({
        userId: report.reportedUserId,
        type: 'report_action',
        title: '⚠️ Report Action',
        message: `A report against you has been reviewed. Action: ${actionTaken}. Contact support if you have questions.`,
        data: {
          reportId,
          actionTaken,
          adminNotes
        }
      });
    }
    
    // Send emails
    await sendReportResolutionEmails(report, decision, actionTaken);
    
    res.json({
      success: true,
      message: 'Report reviewed successfully'
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review report',
      error: error.message
    });
  }
};

// Get reports for a specific user
const getUserReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    
    const reportedAgainst = await UserReport.find({ 
      reportedUserId: userId,
      status: { $in: ['pending', 'under_review', 'resolved'] }
    }).sort({ createdAt: -1 });
    
    const myReports = await UserReport.find({ 
      reporterId: userId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      reportedAgainst,
      myReports
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Email helpers
const sendNewReportEmailToAdmins = async (report) => {
  try {
    const admins = await User.find({ role: 'admin', accountStatus: 'active' });
    
    for (const admin of admins) {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
        to: admin.email,
        subject: `🚨 New Report: ${report.reason}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New User Report Submitted</h2>
            <p><strong>Report ID:</strong> ${report.reportId}</p>
            <p><strong>Reporter:</strong> ${report.reporterName} (${report.reporterRole})</p>
            <p><strong>Reported User:</strong> ${report.reportedUserName} (${report.reportedUserRole})</p>
            <p><strong>Reason:</strong> ${report.reason}</p>
            <p><strong>Priority:</strong> ${report.priority.toUpperCase()}</p>
            <p><strong>Description:</strong> ${report.description}</p>
            <p style="margin-top: 20px;">Please log in to the admin dashboard to review this report.</p>
          </div>
        `
      };
      
      await getEmailTransporter().sendMail(mailOptions);
    }
  } catch (error) {
    console.error('Error sending report email to admins:', error);
  }
};

const sendReportResolutionEmails = async (report, decision, actionTaken) => {
  try {
    // Email to reporter
    const reporterMailOptions = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: report.reporterEmail,
      subject: '✅ Your Report Has Been Resolved',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Report Resolved</h2>
          <p>Dear ${report.reporterName},</p>
          <p>Your report against ${report.reportedUserName} has been reviewed.</p>
          <p><strong>Decision:</strong> ${decision}</p>
          <p><strong>Action Taken:</strong> ${actionTaken}</p>
          <p>Thank you for helping keep our community safe.</p>
        </div>
      `
    };
    
    await getEmailTransporter().sendMail(reporterMailOptions);
    
    // Email to reported user if action taken
    if (actionTaken !== 'no_action') {
      const reportedUserMailOptions = {
        from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
        to: report.reportedUserEmail,
        subject: '⚠️ Report Review - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Report Review Notification</h2>
            <p>Dear ${report.reportedUserName},</p>
            <p>A report against your account has been reviewed by our team.</p>
            <p><strong>Action Taken:</strong> ${actionTaken}</p>
            <p>If you have questions or concerns, please contact our support team.</p>
          </div>
        `
      };
      
      await getEmailTransporter().sendMail(reportedUserMailOptions);
    }
  } catch (error) {
    console.error('Error sending resolution emails:', error);
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  reviewReport,
  getUserReports
};

