const { v4: uuidv4 } = require('uuid');
const EventReview = require('../../models/EventReview');
const Event = require('../../models/Event');
const User = require('../../models/User');
const EventParticipant = require('../../models/EventParticipant');
const { catchAsync } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

// Badge definitions
const BADGE_TYPES = {
  excellence: { name: 'Excellence', icon: '🏆' },
  impact: { name: 'Impact', icon: '💖' },
  responsive: { name: 'Responsive', icon: '⚡' },
  professional: { name: 'Professional', icon: '🎯' },
  inspiring: { name: 'Inspiring', icon: '🌟' },
  friendly: { name: 'Friendly', icon: '🤝' }
};

// Submit or update a review
exports.submitReview = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { rating, review, badges } = req.body;
  const userId = req.user.id;

  // Validation
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  // Get event
  const event = await Event.findOne({ id: eventId });
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if event is completed
  if (event.status !== 'completed' && event.status !== 'Completed') {
    return res.status(400).json({ message: 'Can only review completed events' });
  }

  // Check if user attended the event
  const participation = await EventParticipant.findOne({
    eventId,
    userId,
    isActive: true
  });

  if (!participation) {
    return res.status(403).json({ 
      message: 'You must register for this event before you can review it',
      hint: 'Click "Join Event" button to register for the event first'
    });
  }

  // Verify the participation is registered (status should be 'registered' or higher)
  if (!['registered', 'confirmed', 'attended'].includes(participation.status)) {
    return res.status(403).json({ 
      message: 'Invalid participation status',
      currentStatus: participation.status
    });
  }

  // Check if attendance was marked as "attended"
  if (participation.attendanceStatus !== 'attended') {
    return res.status(403).json({ 
      message: 'You can only review events you actually attended',
      hint: 'The organization must mark your attendance as "attended" before you can leave a review',
      currentStatus: participation.attendanceStatus
    });
  }

  // Get user details
  const user = await User.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Process badges
  const processedBadges = (badges || []).map(badgeType => ({
    type: badgeType,
    name: BADGE_TYPES[badgeType]?.name || badgeType,
    icon: BADGE_TYPES[badgeType]?.icon || '⭐'
  })).slice(0, 3); // Max 3 badges

  // Check if review already exists
  let existingReview = await EventReview.findOne({ eventId, volunteerId: userId });

  if (existingReview) {
    // Update existing review
    if (!existingReview.canEdit()) {
      return res.status(403).json({ message: 'Review can only be edited within 24 hours of creation' });
    }

    existingReview.rating = rating;
    existingReview.review = review || '';
    existingReview.badges = processedBadges;
    existingReview.isEdited = true;
    existingReview.updatedAt = new Date();

    await existingReview.save();
    logger.info(`Review updated for event ${eventId} by user ${userId}`);

    // Update event rating stats
    await updateEventRatingStats(eventId);

    // Update organization badges
    if (processedBadges.length > 0) {
      await updateOrganizationBadges(event.organizationId, processedBadges, eventId, event.title, userId, user.name);
    }

    return res.status(200).json({
      message: 'Review updated successfully',
      review: existingReview
    });
  }

  // Create new review
  const newReview = new EventReview({
    id: uuidv4(),
    eventId,
    eventTitle: event.title,
    volunteerId: userId,
    volunteerName: user.name,
    organizationId: event.organizationId,
    organizationName: event.organizationName,
    rating,
    review: review || '',
    badges: processedBadges
  });

  await newReview.save();
  logger.info(`Review created for event ${eventId} by user ${userId}`);

  // Update event rating stats
  await updateEventRatingStats(eventId);

  // Add badges to organization
  if (processedBadges.length > 0) {
    await updateOrganizationBadges(event.organizationId, processedBadges, eventId, event.title, userId, user.name);
  }

  res.status(201).json({
    message: 'Review submitted successfully',
    review: newReview
  });
});

// Get volunteer's review for an event
exports.getMyReview = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const review = await EventReview.findOne({ eventId, volunteerId: userId });

  if (!review) {
    return res.status(404).json({ message: 'No review found' });
  }

  res.status(200).json({ review });
});

// Get all reviews for an event
exports.getEventReviews = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await EventReview.find({ eventId, isVisible: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await EventReview.countDocuments({ eventId, isVisible: true });

  // Get rating summary
  const ratingStats = await EventReview.calculateEventRating(eventId);

  res.status(200).json({
    reviews,
    ratingStats,
    totalReviews: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });
});

// Get all reviews for an organization
exports.getOrganizationReviews = catchAsync(async (req, res) => {
  const { orgId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await EventReview.find({ organizationId: orgId, isVisible: true })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await EventReview.countDocuments({ organizationId: orgId, isVisible: true });

  // Calculate overall stats
  const allReviews = await EventReview.find({ organizationId: orgId, isVisible: true });
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

  res.status(200).json({
    reviews,
    stats: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: allReviews.length
    },
    totalReviews: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });
});

// Get organization badges
exports.getOrganizationBadges = catchAsync(async (req, res) => {
  const { orgId } = req.params;

  const badges = await EventReview.getOrganizationBadges(orgId);

  // Get detailed badge info from User model
  const organization = await User.findOne({ id: orgId });
  const detailedBadges = organization?.badges || [];

  res.status(200).json({
    badgeSummary: badges,
    allBadges: detailedBadges,
    totalBadges: detailedBadges.length
  });
});

// Get volunteer's attendance status for events
exports.getUserAttendanceStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Get all participation records for this user
  const participations = await EventParticipant.find({ userId, isActive: true });

  // Create a map of eventId -> attendanceStatus
  const attendanceMap = {};
  participations.forEach(p => {
    attendanceMap[p.eventId] = {
      status: p.attendanceStatus || 'pending',
      canReview: p.attendanceStatus === 'attended'
    };
  });

  res.status(200).json({ attendanceStatus: attendanceMap });
});

// Development helper: Create EventParticipant and mark as attended
exports.createAttendanceForTesting = catchAsync(async (req, res) => {
  const { eventId, userId } = req.params;

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Only available in development mode' });
  }

  // Check if event exists
  const event = await Event.findOne({ id: eventId });
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if participation already exists
  let participation = await EventParticipant.findOne({ eventId, userId });

  if (participation) {
    // Update existing
    participation.status = 'registered';
    participation.attendanceStatus = 'attended';
    participation.isActive = true;
    await participation.save();
    
    return res.status(200).json({
      message: 'Attendance updated',
      participation
    });
  }

  // Create new EventParticipant
  const newParticipation = new EventParticipant({
    id: uuidv4(),
    eventId,
    userId,
    userName: user.name,
    userEmail: user.email,
    status: 'registered',
    attendanceStatus: 'attended',
    isActive: true
  });

  await newParticipation.save();

  logger.info(`EventParticipant created for testing: user ${userId} event ${eventId}`);

  res.status(201).json({
    message: 'EventParticipant created and marked as attended',
    participation: newParticipation
  });
});

// Delete review (within 24 hours)
exports.deleteReview = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const review = await EventReview.findOne({ eventId, volunteerId: userId });

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  if (!review.canEdit()) {
    return res.status(403).json({ message: 'Review can only be deleted within 24 hours of creation' });
  }

  await EventReview.deleteOne({ _id: review._id });
  logger.info(`Review deleted for event ${eventId} by user ${userId}`);

  // Update event rating stats
  await updateEventRatingStats(eventId);

  res.status(200).json({ message: 'Review deleted successfully' });
});

// Helper function to update event rating stats
async function updateEventRatingStats(eventId) {
  const ratingStats = await EventReview.calculateEventRating(eventId);
  const reviewCount = await EventReview.countDocuments({ eventId, isVisible: true });

  await Event.updateOne(
    { id: eventId },
    {
      $set: {
        'ratings.average': ratingStats.average,
        'ratings.total': ratingStats.total,
        'ratings.breakdown': ratingStats.breakdown,
        reviewCount
      }
    }
  );
}

// Helper function to update organization badges
async function updateOrganizationBadges(orgId, badges, eventId, eventTitle, awardedBy, awardedByName) {
  const Notification = require('../../models/Notification');
  
  const badgesToAdd = badges.map(badge => ({
    id: uuidv4(),
    type: badge.type,
    name: badge.name,
    icon: badge.icon,
    eventId,
    eventTitle,
    awardedBy,
    awardedByName,
    awardedAt: new Date()
  }));

  await User.updateOne(
    { id: orgId },
    { $push: { badges: { $each: badgesToAdd } } }
  );

  // Send notification for each badge
  for (const badge of badgesToAdd) {
    try {
      await Notification.createBadgeNotification(
        orgId,
        badge.name,
        `Awarded by ${awardedByName}`,
        eventTitle
      );
      logger.info(`📧 Badge notification sent to organization ${orgId}`);
    } catch (notifError) {
      logger.error('Error sending organization badge notification:', notifError);
    }
  }
}

module.exports = exports;

