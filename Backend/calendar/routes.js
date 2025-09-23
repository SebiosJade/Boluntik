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

const router = express.Router();

// Get all events
router.get('/', getAllEvents);

// Get events by organization
router.get('/organization/:organizationId', getEventsByOrganization);

// Get events by user
router.get('/user/:userId', getEventsByUser);

// Get single event
router.get('/:id', getEventById);

// Create new event
router.post('/', createEvent);

// Update event
router.put('/:id', updateEvent);

// Delete event
router.delete('/:id', deleteEvent);

// Join an event
router.post('/:eventId/join', joinEvent);

// Unjoin an event
router.post('/:eventId/unjoin', unjoinEvent);

// Get user's joined events
router.get('/user/:userId/joined', getUserJoinedEvents);

// Check if user has joined an event
router.get('/:eventId/participation/:userId', checkUserParticipation);

module.exports = router;
