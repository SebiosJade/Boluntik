const { findEventParticipantsByEvent, updateEventParticipant, findUserById, findEventParticipantsByUser } = require('../../database/dataAccess');
const { findEventById } = require('../../database/dataAccess');
const Notification = require('../../models/Notification');
const logger = require('../../utils/logger');

// Get all volunteers for a specific event
async function getEventVolunteers(req, res) {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const participants = await findEventParticipantsByEvent(eventId);
    
    // Get additional user details for each participant
    const volunteersWithDetails = await Promise.all(
      participants.map(async (participant) => {
        const user = await findUserById(participant.userId);
        return {
          ...participant,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            skills: user.skills,
            bio: user.bio,
            certificates: user.certificates || []
          } : null
        };
      })
    );

    res.json({
      success: true,
      volunteers: volunteersWithDetails,
      total: volunteersWithDetails.length
    });
  } catch (error) {
    logger.error('Error getting event volunteers:', error);
    res.status(500).json({ message: 'Failed to get event volunteers' });
  }
}

// Update volunteer status (check-in, check-out, etc.)
async function updateVolunteerStatus(req, res) {
  try {
    const { eventId, userId } = req.params;
    const { status, notes, action } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ message: 'Event ID and User ID are required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['registered', 'confirmed', 'attended', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get current participant status
    const existingParticipants = await findEventParticipantsByEvent(eventId);
    const existingParticipant = existingParticipants.find(p => p.userId === userId);
    
    if (!existingParticipant) {
      return res.status(404).json({ message: 'Volunteer not found for this event' });
    }

    // Check for duplicate check-in time
    if (action === 'checkin' && existingParticipant.checkInTime) {
      return res.status(400).json({ 
        message: 'Check-in time already recorded',
        alreadyCheckedIn: true 
      });
    }

    // Check for duplicate check-out time
    if (action === 'checkout' && existingParticipant.checkOutTime) {
      return res.status(400).json({ 
        message: 'Check-out time already recorded',
        alreadyCheckedOut: true 
      });
    }

    const updateData = {};
    if (notes) updateData.notes = notes;
    
    // Handle check-in action (only time tracking, no status change)
    if (action === 'checkin') {
      updateData.checkInTime = new Date();
    }
    
    // Handle check-out action (only time tracking, no status change)
    if (action === 'checkout') {
      updateData.checkOutTime = new Date();
    }

    // Handle undo check-in (only clear time, no status change)
    if (action === 'undo_checkin') {
      updateData.checkInTime = null;
    }

    // Handle undo check-out (only clear time, no status change)
    if (action === 'undo_checkout') {
      updateData.checkOutTime = null;
    }

    // Only update status if it's not a time tracking action
    if (!['checkin', 'checkout', 'undo_checkin', 'undo_checkout'].includes(action)) {
      updateData.status = status;
    }

    const participant = await updateEventParticipant(eventId, userId, updateData);

    let message = 'Volunteer status updated successfully';
    if (action === 'checkin') {
      message = 'Check-in time recorded successfully';
    } else if (action === 'checkout') {
      message = 'Check-out time recorded successfully';
    } else if (action === 'undo_checkin') {
      message = 'Check-in time cleared successfully';
    } else if (action === 'undo_checkout') {
      message = 'Check-out time cleared successfully';
    }

    res.json({
      success: true,
      message,
      participant
    });
  } catch (error) {
    logger.error('Error updating volunteer status:', error);
    res.status(500).json({ message: 'Failed to update volunteer status' });
  }
}

// Give feedback/review to a volunteer
async function giveVolunteerFeedback(req, res) {
  try {
    const { eventId, userId } = req.params;
    const { rating, feedback, skills } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ message: 'Event ID and User ID are required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if feedback already exists
    const existingParticipants = await findEventParticipantsByEvent(eventId);
    const existingParticipant = existingParticipants.find(p => p.userId === userId);
    
    if (existingParticipant && existingParticipant.feedback && existingParticipant.feedback.rating) {
      return res.status(400).json({ 
        message: 'Feedback already given for this volunteer',
        alreadyGiven: true 
      });
    }

    const feedbackData = {
      rating: parseInt(rating),
      feedback: feedback || '',
      skills: skills || [],
      givenAt: new Date(),
      givenBy: req.user?.id // Assuming auth middleware sets req.user
    };

    const participant = await updateEventParticipant(eventId, userId, {
      feedback: feedbackData
    });

    if (!participant) {
      return res.status(404).json({ message: 'Volunteer not found for this event' });
    }

    // Send notification to volunteer about feedback
    try {
      const event = await findEventById(eventId);
      const organizationName = event?.organizationName || 'the organization';
      
      await Notification.createFeedbackNotification(
        userId,
        parseInt(rating),
        event?.title || 'the event',
        organizationName,
        eventId
      );
      logger.info(`📧 Feedback notification sent to user ${userId}`);
    } catch (notifError) {
      logger.error('Error sending feedback notification:', notifError);
      // Don't fail feedback if notification fails
    }

    res.json({
      success: true,
      message: 'Feedback given successfully',
      feedback: feedbackData
    });
  } catch (error) {
    logger.error('Error giving volunteer feedback:', error);
    res.status(500).json({ message: 'Failed to give feedback' });
  }
}

// Award badge to a volunteer
async function awardBadge(req, res) {
  try {
    const { eventId, userId } = req.params;
    const { badgeType, badgeName, description } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ message: 'Event ID and User ID are required' });
    }

    if (!badgeType || !badgeName) {
      return res.status(400).json({ message: 'Badge type and name are required' });
    }

    const validBadgeTypes = ['participation', 'excellence', 'leadership', 'dedication', 'special', 'teamwork', 'innovation', 'commitment', 'impact', 'mentor'];
    if (!validBadgeTypes.includes(badgeType)) {
      return res.status(400).json({ message: 'Invalid badge type' });
    }

    // Check if badge of this type already exists
    const existingParticipants = await findEventParticipantsByEvent(eventId);
    const existingParticipant = existingParticipants.find(p => p.userId === userId);
    
    if (existingParticipant && existingParticipant.badges) {
      const hasBadgeOfType = existingParticipant.badges.some(badge => badge.badgeType === badgeType);
      if (hasBadgeOfType) {
        return res.status(400).json({ 
          message: `Badge of type '${badgeType}' already awarded to this volunteer`,
          alreadyGiven: true 
        });
      }
    }

    const badgeData = {
      badgeType,
      badgeName,
      description: description || '',
      awardedAt: new Date(),
      awardedBy: req.user?.id,
      eventId
    };

    // Get current participant to append badge to existing badges array
    const existingBadges = existingParticipant?.badges || [];
    
    const participant = await updateEventParticipant(eventId, userId, {
      badges: [...existingBadges, badgeData]
    });

    if (!participant) {
      return res.status(404).json({ message: 'Volunteer not found for this event' });
    }

    // Send notification to volunteer about badge
    try {
      const event = await findEventById(eventId);
      await Notification.createBadgeNotification(
        userId,
        badgeName,
        description || '',
        event?.title || 'the event'
      );
      logger.info(`📧 Badge notification sent to user ${userId}`);
    } catch (notifError) {
      logger.error('Error sending badge notification:', notifError);
      // Don't fail badge award if notification fails
    }

    res.json({
      success: true,
      message: 'Badge awarded successfully',
      badge: badgeData
    });
  } catch (error) {
    logger.error('Error awarding badge:', error);
    res.status(500).json({ message: 'Failed to award badge' });
  }
}

// Get volunteer's feedback history
async function getVolunteerFeedback(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get all participations for this user
    const participations = await findEventParticipantsByUser(userId);
    
    // Extract feedback and badges from participations
    const achievements = {
      feedback: [],
      badges: [],
      totalEvents: participations.length,
      attendedEvents: participations.filter(p => p.status === 'attended').length
    };

    participations.forEach(participation => {
      // Add feedback if it exists
      if (participation.feedback && participation.feedback.rating) {
        achievements.feedback.push({
          eventId: participation.eventId,
          rating: participation.feedback.rating,
          feedback: participation.feedback.feedback,
          skills: participation.feedback.skills || [],
          givenAt: participation.feedback.givenAt,
          givenBy: participation.feedback.givenBy
        });
      }

      // Add badges if they exist
      if (participation.badges && participation.badges.length > 0) {
        participation.badges.forEach(badge => {
          achievements.badges.push({
            eventId: participation.eventId,
            badgeType: badge.badgeType,
            badgeName: badge.badgeName,
            description: badge.description,
            awardedAt: badge.awardedAt,
            awardedBy: badge.awardedBy
          });
        });
      }
    });

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    logger.error('Error getting volunteer feedback:', error);
    res.status(500).json({ message: 'Failed to get volunteer feedback' });
  }
}

module.exports = {
  getEventVolunteers,
  updateVolunteerStatus,
  giveVolunteerFeedback,
  awardBadge,
  getVolunteerFeedback
};
