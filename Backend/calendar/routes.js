const express = require('express');
const {
  getAllEvents,
  getEventsByOrganization,
  getEventsByUser,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
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

module.exports = router;
