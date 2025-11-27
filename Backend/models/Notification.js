const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'donation_verified', 
      'donation_rejected', 
      'donation_received',
      'campaign_created',
      'event_reminder', 
      'badge_earned',
      'certificate_awarded',
      'feedback_received',
      'resource_request_received',
      'resource_offer_received',
      'resource_request_accepted',
      'resource_request_declined',
      'resource_offer_accepted',
      'resource_offer_declined',
      'resource_fulfilled',
      'resource_message',
      'chat_message',
      'emergency_alert',
      'emergency_response_confirmation',
      'volunteer_joined_alert',
      'account_suspended',
      'account_unsuspended',
      'password_reset',
      'profile_updated',
      'new_user',
      'new_report',
      'report_resolved',
      'report_action',
      'general'
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

// Static method to create donation notifications (for donors)
notificationSchema.statics.createDonationNotification = async function(
  userId, 
  type, 
  campaignTitle, 
  donationAmount, 
  additionalData = {}
) {
  const isVerified = type === 'donation_verified';
  const title = isVerified ? 'Donation Verified!' : 'Donation Update';
  const message = isVerified 
    ? `Your donation of ₱${donationAmount} to "${campaignTitle}" has been verified and is now counted towards the campaign goal.`
    : `Your donation of ₱${donationAmount} to "${campaignTitle}" could not be verified. Please check your payment details and try again.`;

  return await this.create({
    userId,
    type,
    title,
    message,
    data: {
      campaignTitle,
      donationAmount,
      ...additionalData,
    },
  });
};

// Static method to create new donation notification (for org and admin)
notificationSchema.statics.createNewDonationNotification = async function(
  userId,
  donorName,
  campaignTitle,
  donationAmount,
  additionalData = {}
) {
  return await this.create({
    userId,
    type: 'donation_received',
    title: 'New Donation Received!',
    message: `${donorName} donated ₱${donationAmount} to "${campaignTitle}". Please review and verify the donation.`,
    data: {
      donorName,
      campaignTitle,
      donationAmount,
      ...additionalData,
    },
  });
};

// Static method to create campaign notification (for admin and volunteers)
notificationSchema.statics.createCampaignNotification = async function(
  userId,
  campaignTitle,
  organizationName,
  goalAmount,
  additionalData = {}
) {
  return await this.create({
    userId,
    type: 'campaign_created',
    title: 'New Campaign Created!',
    message: `${organizationName} created a new campaign "${campaignTitle}" with a goal of ₱${goalAmount}. Check it out and support the cause!`,
    data: {
      campaignTitle,
      organizationName,
      goalAmount,
      ...additionalData,
    },
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create resource request notification
notificationSchema.statics.createResourceRequestNotification = async function(
  ownerId,
  requesterName,
  resourceTitle,
  resourceId,
  interactionId
) {
  return await this.create({
    userId: ownerId,
    type: 'resource_request_received',
    title: 'New Request Received!',
    message: `${requesterName} requested your resource "${resourceTitle}". Review and respond in My Offers.`,
    data: {
      resourceId,
      interactionId,
      requesterName,
      resourceTitle,
    },
  });
};

// Static method to create resource offer notification
notificationSchema.statics.createResourceOfferNotification = async function(
  ownerId,
  offererName,
  resourceTitle,
  resourceId,
  interactionId
) {
  return await this.create({
    userId: ownerId,
    type: 'resource_offer_received',
    title: 'New Offer Received!',
    message: `${offererName} offered to help with your request "${resourceTitle}". Review and respond in My Requests.`,
    data: {
      resourceId,
      interactionId,
      offererName,
      resourceTitle,
    },
  });
};

// Static method to create interaction status notification
notificationSchema.statics.createResourceStatusNotification = async function(
  userId,
  ownerName,
  resourceTitle,
  resourceType,
  status,
  resourceId
) {
  const isRequest = resourceType === 'offer'; // If resource is offer, user made a request
  const isAccepted = status === 'accepted';
  
  const actionText = isRequest 
    ? (isAccepted ? 'accepted your request' : 'declined your request')
    : (isAccepted ? 'accepted your offer' : 'declined your offer');
  
  const type = isRequest
    ? (isAccepted ? 'resource_request_accepted' : 'resource_request_declined')
    : (isAccepted ? 'resource_offer_accepted' : 'resource_offer_declined');
  
  const title = isAccepted ? 'Request Accepted!' : 'Request Update';
  
  const message = `${ownerName} ${actionText} for "${resourceTitle}".${isAccepted ? ' You can now coordinate via chat!' : ''}`;
  
  return await this.create({
    userId,
    type,
    title,
    message,
    data: {
      resourceId,
      ownerName,
      resourceTitle,
      status,
    },
  });
};

// Static method to create resource fulfilled notification
notificationSchema.statics.createResourceFulfilledNotification = async function(
  userId,
  resourceTitle,
  resourceType,
  resourceId
) {
  const message = resourceType === 'offer'
    ? `Your offer "${resourceTitle}" has been fulfilled!`
    : `Your request "${resourceTitle}" has been fulfilled!`;
  
  return await this.create({
    userId,
    type: 'resource_fulfilled',
    title: 'Resource Fulfilled!',
    message,
    data: {
      resourceId,
      resourceTitle,
      resourceType,
    },
  });
};

// Static method to create chat message notification
notificationSchema.statics.createChatMessageNotification = async function(
  userId,
  senderName,
  messagePreview,
  conversationId
) {
  return await this.create({
    userId,
    type: 'chat_message',
    title: `New message from ${senderName}`,
    message: messagePreview.length > 100 ? `${messagePreview.substring(0, 100)}...` : messagePreview,
    data: {
      conversationId,
      senderName,
    },
  });
};

// Static method to create certificate awarded notification
notificationSchema.statics.createCertificateNotification = async function(
  userId,
  eventTitle,
  certificateType,
  organizationName,
  certificateId
) {
  return await this.create({
    userId,
    type: 'certificate_awarded',
    title: '🎓 Certificate Awarded!',
    message: `You received a ${certificateType} certificate for "${eventTitle}" from ${organizationName}`,
    data: {
      eventTitle,
      certificateType,
      organizationName,
      certificateId,
    },
  });
};

// Static method to create badge earned notification
notificationSchema.statics.createBadgeNotification = async function(
  userId,
  badgeName,
  badgeDescription,
  eventTitle
) {
  return await this.create({
    userId,
    type: 'badge_earned',
    title: '🏆 New Badge Earned!',
    message: `Congratulations! You earned the "${badgeName}" badge for "${eventTitle}". ${badgeDescription}`,
    data: {
      badgeName,
      badgeDescription,
      eventTitle,
    },
  });
};

// Static method to create feedback/rating received notification
notificationSchema.statics.createFeedbackNotification = async function(
  userId,
  rating,
  eventTitle,
  organizationName,
  eventId
) {
  const stars = '⭐'.repeat(rating);
  return await this.create({
    userId,
    type: 'feedback_received',
    title: '📝 New Feedback Received',
    message: `You received a ${stars} (${rating}/5) rating for your participation in "${eventTitle}" from ${organizationName}`,
    data: {
      rating,
      eventTitle,
      organizationName,
      eventId,
    },
  });
};

// Emergency Alert Notification - sent to volunteers when alert is broadcasted
notificationSchema.statics.createEmergencyAlertNotification = async function(
  volunteerId,
  organizationName,
  alertTitle,
  emergencyType,
  urgencyLevel,
  alertId
) {
  const urgencyEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  
  return await this.create({
    userId: volunteerId,
    type: 'emergency_alert',
    title: `${urgencyEmoji[urgencyLevel]} Emergency Alert: ${emergencyType.toUpperCase()}`,
    message: `${organizationName} needs volunteers immediately: ${alertTitle}. Tap to respond!`,
    data: {
      alertId,
      emergencyType,
      urgencyLevel,
      organizationName,
      alertTitle,
    },
    priority: urgencyLevel === 'critical' || urgencyLevel === 'high' ? 'high' : 'normal',
  });
};

// Emergency Response Confirmation - sent to volunteer after joining
notificationSchema.statics.createEmergencyResponseConfirmation = async function(
  volunteerId,
  alertTitle,
  organizationName,
  responseType
) {
  return await this.create({
    userId: volunteerId,
    type: 'emergency_response_confirmation',
    title: '✅ Emergency Response Confirmed',
    message: `You have successfully joined the ${responseType} response for "${alertTitle}". ${organizationName} will contact you shortly with details.`,
    data: {
      alertTitle,
      organizationName,
      responseType,
    },
  });
};

// Volunteer Joined Alert - sent to organization when volunteer joins
notificationSchema.statics.createVolunteerJoinedNotification = async function(
  organizationId,
  volunteerName,
  alertTitle,
  alertId
) {
  return await this.create({
    userId: organizationId,
    type: 'volunteer_joined_alert',
    title: '👥 New Volunteer Joined',
    message: `${volunteerName} has joined the emergency response for "${alertTitle}"`,
    data: {
      volunteerName,
      alertTitle,
      alertId,
    },
  });
};

// Admin & Report Notifications
notificationSchema.statics.createNewUserNotification = async function(
  adminId,
  userName,
  userEmail,
  userRole,
  userId
) {
  return await this.create({
    userId: adminId,
    type: 'new_user',
    title: '👤 New User Registered',
    message: `${userName} (${userEmail}) has registered as a ${userRole}`,
    data: {
      userName,
      userEmail,
      userRole,
      userId,
    },
  });
};

notificationSchema.statics.createNewReportNotification = async function(
  adminId,
  reporterName,
  reportedUserName,
  reason,
  reportId
) {
  return await this.create({
    userId: adminId,
    type: 'new_report',
    title: '🚩 New User Report Submitted',
    message: `${reporterName} reported ${reportedUserName} for ${reason}`,
    data: {
      reporterName,
      reportedUserName,
      reason,
      reportId,
    },
  });
};

notificationSchema.statics.createReportResolvedNotification = async function(
  userId,
  reportId,
  resolution
) {
  return await this.create({
    userId: userId,
    type: 'report_resolved',
    title: '✅ Report Resolved',
    message: `Your report has been resolved: ${resolution}`,
    data: {
      reportId,
      resolution,
    },
  });
};

notificationSchema.statics.createReportActionNotification = async function(
  userId,
  action,
  reportId
) {
  return await this.create({
    userId: userId,
    type: 'report_action',
    title: '⚠️ Action Taken on Report',
    message: `Action taken: ${action}`,
    data: {
      action,
      reportId,
    },
  });
};

notificationSchema.statics.createAccountSuspendedNotification = async function(
  userId,
  reason
) {
  return await this.create({
    userId: userId,
    type: 'account_suspended',
    title: '🚫 Account Suspended',
    message: `Your account has been suspended. Reason: ${reason}`,
    data: {
      reason,
    },
  });
};

notificationSchema.statics.createAccountUnsuspendedNotification = async function(
  userId
) {
  return await this.create({
    userId: userId,
    type: 'account_unsuspended',
    title: '✅ Account Restored',
    message: 'Your account has been unsuspended. You can now access all features.',
    data: {},
  });
};

notificationSchema.statics.createPasswordResetNotification = async function(
  userId,
  tempPassword
) {
  return await this.create({
    userId: userId,
    type: 'password_reset',
    title: '🔑 Password Reset by Admin',
    message: `Your password has been reset. Use the temporary password sent to your email to log in.`,
    data: {
      tempPassword, // Only for notification, email will have the actual password
    },
  });
};

notificationSchema.statics.createProfileUpdatedNotification = async function(
  userId,
  fieldsChanged
) {
  return await this.create({
    userId: userId,
    type: 'profile_updated',
    title: '✏️ Profile Updated by Admin',
    message: `An admin has updated your profile. Fields changed: ${fieldsChanged.join(', ')}`,
    data: {
      fieldsChanged,
    },
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
