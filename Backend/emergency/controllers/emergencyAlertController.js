const EmergencyAlert = require('../../models/EmergencyAlert');
const EmergencyAnalytics = require('../../models/EmergencyAnalytics');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { v4: uuidv4 } = require('uuid');
const { findUserById } = require('../../database/dataAccess');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for emergency image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/emergency';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `emergency-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'voluntech4@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'yqnm uduy dsdx swsm'
  }
});

// Create emergency alert
const createEmergencyAlert = async (req, res) => {
  try {
    const {
      title,
      description,
      emergencyType,
      urgencyLevel,
      location,
      instructions,
      volunteersNeeded,
      startTime,
      estimatedDuration,
      requiredSkills,
      safetyGuidelines,
      contactInfo,
    } = req.body;

    const organizationId = req.user.id || req.user.sub;
    const organizationName = req.user.organizationName || req.user.name;
    
    // Get organization details for email
    const organization = await findUserById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Parse location if it's a JSON string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (e) {
        parsedLocation = { address: location };
      }
    }

    // Parse requiredSkills if it's a JSON string
    let parsedSkills = requiredSkills;
    if (typeof requiredSkills === 'string') {
      try {
        parsedSkills = JSON.parse(requiredSkills);
      } catch (e) {
        parsedSkills = [];
      }
    }

    // Create alert
    const alertId = `EA-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const alert = new EmergencyAlert({
      alertId,
      organizationId,
      organizationName: organizationName,
      organizationEmail: organization.email || req.user.email,
      title,
      description,
      emergencyType,
      urgencyLevel: urgencyLevel || 'high',
      location: parsedLocation,
      instructions,
      image: req.file ? `/uploads/emergency/${req.file.filename}` : '',
      volunteersNeeded: volunteersNeeded || 0,
      startTime,
      estimatedDuration,
      requiredSkills: parsedSkills || [],
      safetyGuidelines,
      contactInfo: contactInfo || {
        name: organizationName,
        email: organization.email || req.user.email,
        phone: organization.phone || '',
      },
      broadcastedAt: new Date(),
    });

    await alert.save();

    // NOTE: Alert is created but NOT broadcasted yet
    // It needs admin verification first before sending to volunteers

    res.status(201).json({
      success: true,
      message: 'Emergency alert created successfully. Waiting for admin verification before broadcasting to volunteers.',
      alert: {
        alertId: alert.alertId,
        title: alert.title,
        status: alert.status,
        verifiedByAdmin: alert.verifiedByAdmin,
        createdAt: alert.broadcastedAt,
      },
    });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency alert',
      error: error.message,
    });
  }
};

// Broadcast alert to volunteers
const broadcastAlert = async (alert) => {
  try {
    console.log(`Starting broadcast for alert: ${alert.alertId}`);
    
    // Find all volunteers
    const volunteers = await User.find({ role: 'volunteer' });
    console.log(`Found ${volunteers.length} volunteers to notify`);
    
    let notificationCount = 0;
    
    // TODO: Filter volunteers by proximity if location-based targeting is needed
    // For now, broadcast to all volunteers
    
    for (const volunteer of volunteers) {
      try {
        console.log(`Notifying volunteer: ${volunteer.id} (${volunteer.email})`);
        
        // Create in-app notification
        await Notification.createEmergencyAlertNotification(
          volunteer.id,
          alert.organizationName,
          alert.title,
          alert.emergencyType,
          alert.urgencyLevel,
          alert.alertId
        );
        console.log(`✓ In-app notification created for ${volunteer.email}`);
        
        // Send email notification
        const emailSent = await sendEmergencyEmail(volunteer, alert);
        
        if (emailSent) {
          notificationCount++;
          console.log(`✓ Email sent to ${volunteer.email}`);
        } else {
          console.log(`✗ Email failed for ${volunteer.email}`);
        }
      } catch (error) {
        console.error(`✗ Error notifying volunteer ${volunteer.id}:`, error.message);
      }
    }
    
    // Update alert with notification count
    alert.notificationsSent = notificationCount;
    await alert.save();
    
    console.log(`Broadcast complete: ${notificationCount} notifications sent successfully`);
    
    return notificationCount;
  } catch (error) {
    console.error('Error broadcasting alert:', error);
    throw error;
  }
};

// Send emergency email to volunteer
const sendEmergencyEmail = async (volunteer, alert) => {
  try {
    const joinUrl = `${process.env.WEB_URL || 'http://localhost:8081'}/emergency/join/${alert.alertId}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${getUrgencyColor(alert.urgencyLevel)}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-badge { display: inline-block; background-color: ${getEmergencyTypeColor(alert.emergencyType)}; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
          .button { display: inline-block; background-color: #DC2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .details { background-color: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${getUrgencyColor(alert.urgencyLevel)}; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 EMERGENCY ALERT</h1>
            <p style="font-size: 18px; margin: 10px 0;">Your Help is Urgently Needed!</p>
          </div>
          <div class="content">
            <div class="alert-badge">${alert.emergencyType.toUpperCase()} - ${alert.urgencyLevel.toUpperCase()} URGENCY</div>
            
            <h2>${alert.title}</h2>
            <p>${alert.description}</p>
            
            <div class="details">
              <h3>📍 Location</h3>
              <p>${alert.location.address}</p>
              
              <h3>📋 Instructions</h3>
              <p>${alert.instructions}</p>
              
              ${alert.startTime ? `<h3>🕐 Start Time</h3><p>${new Date(alert.startTime).toLocaleString()}</p>` : ''}
              
              ${alert.estimatedDuration ? `<h3>⏱️ Duration</h3><p>${alert.estimatedDuration}</p>` : ''}
              
              ${alert.requiredSkills.length > 0 ? `<h3>🎯 Required Skills</h3><p>${alert.requiredSkills.join(', ')}</p>` : ''}
              
              ${alert.safetyGuidelines ? `<h3>🛡️ Safety Guidelines</h3><p>${alert.safetyGuidelines}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #fee2e2; border: 2px solid #DC2626; border-radius: 8px; padding: 20px;">
                <p style="font-size: 18px; font-weight: bold; color: #DC2626; margin: 0 0 10px 0;">
                  ⚠️ IMMEDIATE ACTION REQUIRED
                </p>
                <p style="font-size: 16px; color: #111827; margin: 0;">
                  <strong>Open the VolunteerHub app now</strong> to respond to this emergency alert.
                </p>
              </div>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 6px;">
              <h3>📞 Emergency Contact</h3>
              <p><strong>${alert.contactInfo.name}</strong></p>
              ${alert.contactInfo.phone ? `<p>Phone: ${alert.contactInfo.phone}</p>` : ''}
              <p>Email: ${alert.contactInfo.email}</p>
            </div>
          </div>
          <div class="footer">
            <p>You're receiving this because you're registered as a volunteer.</p>
            <p>© ${new Date().getFullYear()} VolunteerHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'voluntech4@gmail.com',
      to: volunteer.email,
      subject: `🚨 URGENT: ${alert.emergencyType.toUpperCase()} Emergency - ${alert.title}`,
      html: emailHtml,
    };
    
    await emailTransporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error('Error sending emergency email:', error);
    return false;
  }
};

// Helper functions for email styling
const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'critical': return '#7F1D1D';
    case 'high': return '#DC2626';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const getEmergencyTypeColor = (type) => {
  const colors = {
    fire: '#DC2626',
    earthquake: '#7C2D12',
    flood: '#1E40AF',
    typhoon: '#581C87',
    hurricane: '#6B21A8',
    tsunami: '#0C4A6E',
    landslide: '#78350F',
    medical: '#BE123C',
    other: '#4B5563',
  };
  return colors[type] || '#6B7280';
};

// Get all alerts (admin) - includes unverified alerts
const getAllAlerts = async (req, res) => {
  try {
    const { status, emergencyType, urgencyLevel, verified, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (emergencyType) query.emergencyType = emergencyType;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;
    if (verified !== undefined) query.verifiedByAdmin = verified === 'true';
    
    const alerts = await EmergencyAlert.find(query)
      .sort({ broadcastedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await EmergencyAlert.countDocuments(query);
    
    res.json({
      success: true,
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
};

// Get organization's alerts
const getOrganizationAlerts = async (req, res) => {
  try {
    const organizationId = req.user.id || req.user.sub;
    const { status } = req.query;
    
    const query = { organizationId };
    if (status) query.status = status;
    
    const alerts = await EmergencyAlert.find(query).sort({ broadcastedAt: -1 });
    
    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching organization alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
    });
  }
};

// Get active alerts for volunteers
const getActiveAlerts = async (req, res) => {
  try {
    // Only show alerts that are active AND verified by admin
    const alerts = await EmergencyAlert.find({ 
      status: 'active',
      verifiedByAdmin: true 
    })
      .sort({ urgencyLevel: 1, broadcastedAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active alerts',
      error: error.message,
    });
  }
};

// Get alert by ID
const getAlertById = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    // Increment view count
    alert.analytics.totalViews++;
    await alert.save();
    
    res.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message,
    });
  }
};

// Volunteer joins emergency alert
const joinAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const volunteerId = req.user.id || req.user.sub;
    
    // Get volunteer details
    const volunteer = await findUserById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Only volunteers can join emergency alerts',
      });
    }
    
    // Find alert
    const alert = await EmergencyAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    if (alert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This alert is no longer active',
      });
    }
    
    // Check if already joined
    const existingResponse = alert.responses.find(r => r.volunteerId === volunteerId);
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this emergency alert',
      });
    }
    
    // Add response
    alert.responses.push({
      volunteerId,
      volunteerName: volunteer.name,
      volunteerEmail: volunteer.email,
      joinedAt: new Date(),
      status: 'joined',
    });
    
    // Increment counters
    alert.volunteersJoined = (alert.volunteersJoined || 0) + 1;
    alert.analytics.totalClicks++;
    
    await alert.save();
    
    // Send confirmation notification to volunteer
    await Notification.createEmergencyResponseConfirmation(
      volunteerId,
      alert.title,
      alert.organizationName,
      'in-person'
    );
    
    // Notify organization
    await Notification.createVolunteerJoinedNotification(
      alert.organizationId,
      volunteer.name,
      alert.title,
      alertId
    );
    
    res.json({
      success: true,
      message: 'Successfully joined the emergency response',
      alert: {
        alertId: alert.alertId,
        title: alert.title,
      },
    });
  } catch (error) {
    console.error('Error joining alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join alert',
      error: error.message,
    });
  }
};

// Update alert status
const updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;
    const userId = req.user.id || req.user.sub;
    
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    // Check authorization
    if (alert.organizationId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this alert',
      });
    }
    
    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = new Date();
    }
    
    await alert.save();
    
    res.json({
      success: true,
      message: 'Alert status updated successfully',
      alert: {
        alertId: alert.alertId,
        status: alert.status,
      },
    });
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert status',
      error: error.message,
    });
  }
};

// Verify alert (admin only)
const verifyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const adminId = req.user.id || req.user.sub;
    
    console.log(`Admin ${adminId} is verifying alert ${alertId}`);
    
    const admin = await findUserById(adminId);
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      console.log(`Alert ${alertId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    console.log(`Alert found: ${alert.title}, current status: ${alert.status}`);
    
    alert.verifiedByAdmin = true;
    alert.status = 'active'; // Change status to active
    alert.verifiedBy = {
      adminId,
      adminName: admin?.name || 'Admin',
      verifiedAt: new Date(),
    };
    
    await alert.save();
    console.log(`Alert ${alertId} marked as verified and active`);
    
    // NOW broadcast to volunteers (email + in-app notifications)
    console.log(`Broadcasting alert ${alertId} to volunteers...`);
    const notificationCount = await broadcastAlert(alert);
    console.log(`Broadcast complete. ${notificationCount} notifications sent`);
    
    res.json({
      success: true,
      message: 'Alert verified and broadcasted to volunteers successfully',
      alert: {
        alertId: alert.alertId,
        title: alert.title,
        status: alert.status,
        notificationsSent: alert.notificationsSent,
      },
    });
  } catch (error) {
    console.error('Error verifying alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify alert',
      error: error.message,
    });
  }
};

// Volunteer check-in
const checkIn = async (req, res) => {
  try {
    const { alertId } = req.params;
    const volunteerId = req.user.id || req.user.sub;
    
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    const response = alert.responses.find(r => r.volunteerId === volunteerId);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'You have not joined this alert',
      });
    }
    
    response.status = 'checked-in';
    response.checkInTime = new Date();
    
    await alert.save();
    
    res.json({
      success: true,
      message: 'Checked in successfully',
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message,
    });
  }
};

// Volunteer check-out with feedback
const checkOut = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { rating, comment } = req.body;
    const volunteerId = req.user.id || req.user.sub;
    
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    const response = alert.responses.find(r => r.volunteerId === volunteerId);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'You have not joined this alert',
      });
    }
    
    response.status = 'completed';
    response.checkOutTime = new Date();
    response.feedback = {
      rating: rating || 0,
      comment: comment || '',
      submittedAt: new Date(),
    };
    
    alert.calculateAnalytics();
    await alert.save();
    
    res.json({
      success: true,
      message: 'Checked out successfully. Thank you for your service!',
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message,
    });
  }
};

// Get volunteer's emergency responses
const getMyResponses = async (req, res) => {
  try {
    const volunteerId = req.user.id || req.user.sub;
    
    const alerts = await EmergencyAlert.find({
      'responses.volunteerId': volunteerId,
    }).sort({ broadcastedAt: -1 });
    
    // Map to include only relevant response data
    const myResponses = alerts.map(alert => {
      const myResponse = alert.responses.find(r => r.volunteerId === volunteerId);
      return {
        alert: {
          alertId: alert.alertId,
          title: alert.title,
          emergencyType: alert.emergencyType,
          urgencyLevel: alert.urgencyLevel,
          location: alert.location,
          organizationName: alert.organizationName,
          status: alert.status,
          broadcastedAt: alert.broadcastedAt,
        },
        response: myResponse,
      };
    });
    
    res.json({
      success: true,
      responses: myResponses,
    });
  } catch (error) {
    console.error('Error fetching my responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responses',
      error: error.message,
    });
  }
};

// Delete emergency alert (organization only)
const deleteEmergencyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const organizationId = req.user.id || req.user.sub;
    
    console.log(`Organization ${organizationId} is trying to delete alert ${alertId}`);
    
    const alert = await EmergencyAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }
    
    // Check if the alert belongs to this organization
    if (alert.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own alerts',
      });
    }
    
    // Delete the alert
    await EmergencyAlert.deleteOne({ alertId });
    console.log(`Alert ${alertId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Emergency alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  createEmergencyAlert,
  getAllAlerts,
  getOrganizationAlerts,
  getActiveAlerts,
  getAlertById,
  joinAlert,
  updateAlertStatus,
  verifyAlert,
  checkIn,
  checkOut,
  getMyResponses,
  deleteEmergencyAlert,
};

