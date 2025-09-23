const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EVENTS_FILE = path.join(__dirname, '../../data/events.json');

// Helper function to read events
const readEvents = async () => {
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading events:', error);
    return [];
  }
};

// Helper function to write events
const writeEvents = async (events) => {
  try {
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing events:', error);
    return false;
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await readEvents();
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Get events by organization
const getEventsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const events = await readEvents();
    const organizationEvents = events.filter(event => event.organizationId === organizationId);
    res.json(organizationEvents);
  } catch (error) {
    console.error('Error getting organization events:', error);
    res.status(500).json({ error: 'Failed to get organization events' });
  }
};

// Get events by user ID
const getEventsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const events = await readEvents();
    const userEvents = events.filter(event => event.createdBy === userId);
    res.json(userEvents);
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ error: 'Failed to get user events' });
  }
};

// Get single event
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await readEvents();
    const event = events.find(e => e.id === id);
    
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
const createEvent = async (req, res) => {
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

    const events = await readEvents();
    
    const newEvent = {
      id: uuidv4(),
      title,
      description: description || '',
      date,
      time,
      endTime: endTime || '',
      location,
      maxParticipants: maxParticipants || '',
      eventType: eventType || '',
      difficulty: difficulty || '',
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
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    events.push(newEvent);
    const success = await writeEvents(events);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save event' });
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update event with new data
    events[eventIndex] = {
      ...events[eventIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const success = await writeEvents(events);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update event' });
    }

    res.json(events[eventIndex]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events.splice(eventIndex, 1);
    const success = await writeEvents(events);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete event' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

module.exports = {
  getAllEvents,
  getEventsByOrganization,
  getEventsByUser,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
