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

module.exports = router;
