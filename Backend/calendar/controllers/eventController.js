const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { 
  readEvents, 
  writeEvents, 
  readEventParticipants, 
  writeEventParticipants,
  findEventById,
  findAllEvents,
  findEventsByOrganization,
  findEventsByUser,
  createEvent: createEventInDB,
  updateEvent: updateEventInDB,
  deleteEvent: deleteEventInDB,
  findEventParticipantsByEvent,
  findEventParticipantsByUser,
  createEventParticipant: createParticipantInDB,
  removeEventParticipant: removeParticipantInDB
} = require('../../database/dataAccess');

// Note: Using the unified data access layer instead of local helper functions
// The data access layer automatically handles both MongoDB and file-based storage

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await findAllEvents();
    
    // Add actual participant count to each event using MongoDB
    const eventsWithParticipants = await Promise.all(events.map(async (event) => {
      const participants = await findEventParticipantsByEvent(event.id);
      return {
        ...event,
        actualParticipants: participants.length.toString()
      };
    }));
    
    res.json(eventsWithParticipants);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Get events by organization
const getEventsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organizationEvents = await findEventsByOrganization(organizationId);
    
    // Add actual participant count to each event using MongoDB
    const eventsWithParticipants = await Promise.all(organizationEvents.map(async (event) => {
      const participants = await findEventParticipantsByEvent(event.id);
      return {
        ...event,
        actualParticipants: participants.length.toString()
      };
    }));
    
    res.json(eventsWithParticipants);
  } catch (error) {
    console.error('Error getting organization events:', error);
    res.status(500).json({ error: 'Failed to get organization events' });
  }
};

// Get events by user ID
const getEventsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userEvents = await findEventsByUser(userId);
    
    // Add actual participant count to each event using MongoDB
    const eventsWithParticipants = await Promise.all(userEvents.map(async (event) => {
      const participants = await findEventParticipantsByEvent(event.id);
      return {
        ...event,
        actualParticipants: participants.length.toString()
      };
    }));
    
    res.json(eventsWithParticipants);
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ error: 'Failed to get user events' });
  }
};

// Get single event
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await findEventById(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
};

// Create new event
const createEventController = async (req, res) => {
  console.log('=== CREATE EVENT DEBUG ===');
  console.log('Request body:', req.body);
  try {
    const {
      title,
      description,
      date,
      time,
      endTime,
      location,
      maxParticipants,
      eventType,
      difficulty,
      cause,
      skills,
      ageRestriction,
      equipment,
      org,
      organizationId,
      organizationName,
      createdBy,
      createdByName,
      createdByEmail,
      createdByRole
    } = req.body;

    // Validation
    if (!title || !date || !time || !location || !organizationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, date, time, location, organizationId' 
      });
    }

    const eventData = {
      id: uuidv4(),
      title,
      description: description || '',
      date,
      time,
      endTime: endTime || '',
      location,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : 50,
      eventType: eventType || 'volunteer',
      difficulty: difficulty || 'all levels',
      cause: cause || '',
      skills: skills || '',
      ageRestriction: ageRestriction || '',
      equipment: equipment || '',
      org: org || organizationName || '',
      organizationId,
      organizationName: organizationName || '',
      createdBy: createdBy || organizationId,
      createdByName: createdByName || '',
      createdByEmail: createdByEmail || '',
      createdByRole: createdByRole || 'organization',
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating event with data:', eventData);
    const newEvent = await createEventInDB(eventData);
    console.log('Created event:', newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to create event',
      details: error.message 
    });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Use the new MongoDB data access layer
    const updatedEvent = await updateEventInDB(id, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use the new MongoDB data access layer
    const deletedEvent = await deleteEventInDB(id);
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Join an event
const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, userName, userEmail } = req.body;

    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ error: 'User information is required' });
    }

    // Check if event exists and get event details using MongoDB
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already joined using MongoDB
    const existingParticipants = await findEventParticipantsByEvent(eventId);
    const existingParticipation = existingParticipants.find(
      p => p.userId === userId
    );

    if (existingParticipation) {
      return res.status(400).json({ error: 'User is already joined to this event' });
    }

    // Check if event is full
    const currentParticipants = existingParticipants.length;
    const maxParticipants = parseInt(event.maxParticipants) || 0;
    
    if (currentParticipants >= maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Create new participant using MongoDB
    const newParticipant = {
      id: uuidv4(),
      eventId, 
      eventTitle: event.title || '',
      userId,
      userName,
      userEmail,
      status: 'registered', // Default status for new participants
      registrationDate: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    };

    const createdParticipant = await createParticipantInDB(newParticipant);

    // Update event's currentParticipants count in MongoDB
    await updateEventInDB(eventId, {
      currentParticipants: currentParticipants + 1,
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      message: 'Successfully joined event',
      participant: createdParticipant,
      currentParticipants: currentParticipants + 1
    });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
};

// Unjoin an event
const unjoinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user is joined using MongoDB
    const existingParticipants = await findEventParticipantsByEvent(eventId);
    const existingParticipation = existingParticipants.find(
      p => p.userId === userId
    );

    if (!existingParticipation) {
      return res.status(404).json({ error: 'User is not joined to this event' });
    }

    // Remove participant using MongoDB
    await removeParticipantInDB(eventId, userId);

    // Update event's currentParticipants count in MongoDB
    const currentParticipants = existingParticipants.length - 1;
    await updateEventInDB(eventId, {
      currentParticipants: Math.max(0, currentParticipants),
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      message: 'Successfully unjoined event',
      currentParticipants: currentParticipants
    });
  } catch (error) {
    console.error('Error unjoining event:', error);
    res.status(500).json({ error: 'Failed to unjoin event' });
  }
};

// Get user's joined events
const getUserJoinedEvents = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId.trim() === '') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Use the new data access layer methods
    const userParticipations = await findEventParticipantsByUser(userId);
    const joinedEvents = [];
    
    for (const participation of userParticipations) {
      const event = await findEventById(participation.eventId);
      if (event) {
        joinedEvents.push({
          ...event,
          joinedAt: participation.joinedAt
        });
      }
    }

    res.json(joinedEvents);
  } catch (error) {
    console.error('Error getting user joined events:', error);
    res.status(500).json({ error: 'Failed to get user joined events' });
  }
};

// Check if user has joined an event
const checkUserParticipation = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const participants = await findEventParticipantsByEvent(eventId);
    
    const participation = participants.find(
      p => p.userId === userId
    );

    res.json({ 
      hasJoined: !!participation,
      joinedAt: participation?.joinedAt || null
    });
  } catch (error) {
    console.error('Error checking user participation:', error);
    res.status(500).json({ error: 'Failed to check user participation' });
  }
};

module.exports = {
  getAllEvents,
  getEventsByOrganization,
  getEventsByUser,
  getEventById,
  createEvent: createEventController,
  updateEvent,
  deleteEvent,
  joinEvent,
  unjoinEvent,
  getUserJoinedEvents,
  checkUserParticipation
};
