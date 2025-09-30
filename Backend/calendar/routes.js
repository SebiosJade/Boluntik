const express = require('express');
const {
  getAllEvents,
  getEventsByOrganization,
  getEventsByUser,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  unjoinEvent,
  getUserJoinedEvents,
  checkUserParticipation
} = require('./controllers/eventController');
const {
  getEventVolunteers,
  updateVolunteerStatus,
  giveVolunteerFeedback,
  awardBadge,
  getVolunteerFeedback
} = require('./controllers/volunteerManagementController');
const {
  markAttendance,
  getEventAttendance,
  bulkMarkAttendance
} = require('./controllers/attendanceController');
const {
  eventValidation,
  eventUpdateValidation,
  eventIdValidation,
  userIdValidation,
  organizationIdValidation
} = require('../middleware/validation');

const router = express.Router();

// Get all events
router.get('/', getAllEvents);

// Get events by organization (most specific first)
router.get('/organization/:organizationId', organizationIdValidation, getEventsByOrganization);

// Get user's joined events (most specific first)
router.get('/user/:userId/joined', userIdValidation, getUserJoinedEvents);

// Get events by user
router.get('/user/:userId', userIdValidation, getEventsByUser);

// Get single event (least specific last)
router.get('/:id', eventIdValidation, getEventById);

// Create new event
router.post('/', eventValidation, createEvent);

// Update event
router.put('/:id', eventIdValidation, eventUpdateValidation, updateEvent);

// Delete event
router.delete('/:id', eventIdValidation, deleteEvent);

// Join an event
router.post('/:eventId/join', eventIdValidation, joinEvent);

// Unjoin an event
router.post('/:eventId/unjoin', eventIdValidation, unjoinEvent);


// Check if user has joined an event
router.get('/:eventId/participation/:userId', eventIdValidation, userIdValidation, checkUserParticipation);

// Volunteer Management Routes
// Get all volunteers for an event
router.get('/:eventId/volunteers', eventIdValidation, getEventVolunteers);

// Update volunteer status (check-in, check-out, etc.)
router.patch('/:eventId/volunteers/:userId/status', eventIdValidation, userIdValidation, updateVolunteerStatus);

// Give feedback to a volunteer
router.post('/:eventId/volunteers/:userId/feedback', eventIdValidation, userIdValidation, giveVolunteerFeedback);

// Award badge to a volunteer
router.post('/:eventId/volunteers/:userId/badge', eventIdValidation, userIdValidation, awardBadge);

// Get volunteer's feedback history
router.get('/volunteers/:userId/feedback', userIdValidation, getVolunteerFeedback);

// Get user achievements (badges and feedback)
router.get('/achievements/:userId', userIdValidation, getVolunteerFeedback);

// Attendance tracking routes
// Get attendance for an event
router.get('/:eventId/attendance', eventIdValidation, getEventAttendance);

// Mark attendance for a specific volunteer
router.patch('/:eventId/attendance/:userId', eventIdValidation, userIdValidation, markAttendance);

// Bulk mark attendance for multiple volunteers
router.patch('/:eventId/attendance/bulk', eventIdValidation, bulkMarkAttendance);

module.exports = router;
