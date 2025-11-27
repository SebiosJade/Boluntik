const VirtualEvent = require('../../models/VirtualEvent');
const EventParticipant = require('../../models/EventParticipant');
const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

// Create a virtual event
exports.createVirtualEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      date,
      time,
      duration,
      platform,
      maxParticipants,
      tags,
      requirements,
      hasChat,
      hasVideo
    } = req.body;

    const userId = req.user.id;

    // Get organization details
    const organization = await User.findOne({ id: userId, role: 'organization' });
    if (!organization) {
      return res.status(403).json({ message: 'Only organizations can create virtual events' });
    }

    // Generate room ID for in-app platform
    const roomId = platform === 'in-app' ? uuidv4() : '';

    // Create Daily.co room if using in-app video
    if (platform === 'in-app' && hasVideo !== false && roomId) {
      try {
        const dailyApiKey = process.env.DAILY_API_KEY;
        if (dailyApiKey) {
          const roomName = `VolunTech${roomId.replace(/[^a-zA-Z0-9]/g, '')}`;
          
          logger.info(`Creating Daily.co room: ${roomName}`);
          
          const postData = JSON.stringify({
            name: roomName,
            privacy: 'public',
            properties: {
              enable_screenshare: true,
              enable_chat: true,
              enable_knocking: false,
              enable_prejoin_ui: false,
              start_video_off: false,
              start_audio_off: false,
            }
          });

          const options = {
            hostname: 'api.daily.co',
            path: '/v1/rooms',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${dailyApiKey}`,
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          await new Promise((resolve) => {
            const req = https.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                  const roomData = JSON.parse(data);
                  logger.info(`✅ Daily.co room created: ${roomName}`);
                  logger.info(`   Room URL: ${roomData.url}`);
                } else {
                  logger.warn(`⚠️ Room creation response (${res.statusCode}): ${data}`);
                  logger.info(`   This is OK - room will be created on first join`);
                }
                resolve();
              });
            });
            req.on('error', (error) => {
              logger.error('Error creating Daily.co room:', error);
              resolve();
            });
            req.write(postData);
            req.end();
          });
        } else {
          logger.warn('DAILY_API_KEY not set, room will be created on first join');
        }
      } catch (error) {
        logger.error('Error creating Daily.co room:', error);
        // Don't fail event creation if Daily room creation fails
      }
    }

    const virtualEvent = new VirtualEvent({
      id: uuidv4(),
      title,
      description,
      organizationId: userId,
      organizationName: organization.name,
      eventType,
      date,
      time,
      duration: duration || 60,
      platform,
      meetingLink: req.body.meetingLink || '',
      roomId,
      maxParticipants: maxParticipants || 100,
      tags: tags || [],
      requirements: requirements || '',
      hasChat: hasChat !== false,
      hasVideo: hasVideo !== false
    });

    await virtualEvent.save();

    // Auto-create group chat for the event if hasChat is true
    if (virtualEvent.hasChat) {
      const conversation = new Conversation({
        id: uuidv4(),
        type: 'group',
        name: `${virtualEvent.title} - Event Chat`,
        description: `Group chat for ${virtualEvent.title}`,
        participants: [{
          userId: organization.id,
          userName: organization.name,
          userAvatar: organization.avatar || '',
          role: 'admin'
        }],
        eventId: virtualEvent.id
      });

      await conversation.save();
      logger.info(`Event chat created: ${conversation.id} for event ${virtualEvent.id}`);
    }

    logger.info(`Virtual event created: ${virtualEvent.id} by ${userId}`);

    res.status(201).json({
      message: 'Virtual event created successfully',
      event: virtualEvent
    });
  } catch (error) {
    logger.error('Error creating virtual event:', error);
    res.status(500).json({ message: 'Failed to create virtual event' });
  }
};

// Get all virtual events
exports.getAllVirtualEvents = async (req, res) => {
  try {
    const { status, eventType, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;

    const events = await VirtualEvent.find(query)
      .sort({ date: 1, time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VirtualEvent.countDocuments(query);

    res.json({
      events,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error('Error fetching virtual events:', error);
    res.status(500).json({ message: 'Failed to fetch virtual events' });
  }
};

// Get organization's virtual events
exports.getOrganizationEvents = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const events = await VirtualEvent.find({
      organizationId,
      isActive: true
    }).sort({ date: 1, time: 1 });

    res.json({ events });
  } catch (error) {
    logger.error('Error fetching organization events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// Get single virtual event
exports.getVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await VirtualEvent.findOne({ id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Get participants
    const participants = await EventParticipant.find({
      eventId,
      isActive: true
    });

    // Get event chat if exists
    const conversation = await Conversation.findOne({ eventId, type: 'group', isActive: true });

    res.json({
      event,
      participants,
      participantCount: participants.length,
      conversationId: conversation?.id || null
    });
  } catch (error) {
    logger.error('Error fetching virtual event:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};

// Join virtual event
exports.joinVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Check if already joined
    const existing = await EventParticipant.findOne({ eventId, userId });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: 'Already joined this event' });
      } else {
        // Reactivate existing participant
        existing.isActive = true;
        await existing.save();
        
        event.currentParticipants += 1;
        await event.save();
        
        // Re-add to event chat if exists
        if (event.hasChat) {
          const conversation = await Conversation.findOne({ eventId, type: 'group', isActive: true });
          if (conversation) {
            await conversation.addParticipant(userId, user.name, user.avatar || '', 'member');
            logger.info(`User ${userId} re-added to event chat ${conversation.id}`);
          }
        }
        
        logger.info(`User ${userId} rejoined virtual event ${eventId}`);
        
        return res.json({
          message: 'Successfully rejoined event',
          event,
          participant: existing
        });
      }
    }

    // Check if event is full
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Get user details
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    // Create participant record
    const participant = new EventParticipant({
      id: uuidv4(),
      eventId,
      userId,
      userName: user.name,
      userEmail: user.email,
      status: 'registered'
    });

    await participant.save();

    // Update event participant count
    event.currentParticipants += 1;
    await event.save();

    // Add user to event chat if it exists
    if (event.hasChat) {
      const conversation = await Conversation.findOne({ eventId, type: 'group', isActive: true });
      if (conversation) {
        await conversation.addParticipant(userId, user.name, user.avatar || '', 'member');
        logger.info(`User ${userId} added to event chat ${conversation.id}`);
      }
    }

    logger.info(`User ${userId} joined virtual event ${eventId}`);

    res.json({
      message: 'Successfully joined event',
      event,
      participant
    });
  } catch (error) {
    logger.error('Error joining virtual event:', error);
    res.status(500).json({ message: 'Failed to join event' });
  }
};

// Update virtual event
exports.updateVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Check if user is the organizer
    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can update this event' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'organizationId') {
        event[key] = updates[key];
      }
    });

    await event.save();

    logger.info(`Virtual event updated: ${eventId} by ${userId}`);

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    logger.error('Error updating virtual event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// Start virtual event (go live)
exports.startVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can start this event' });
    }

    event.status = 'live';
    await event.save();

    logger.info(`Virtual event started: ${eventId}`);

    res.json({
      message: 'Event is now live',
      event
    });
  } catch (error) {
    logger.error('Error starting virtual event:', error);
    res.status(500).json({ message: 'Failed to start event' });
  }
};

// End virtual event
exports.endVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can end this event' });
    }

    event.status = 'completed';
    await event.save();

    logger.info(`Virtual event ended: ${eventId}`);

    res.json({
      message: 'Event completed',
      event
    });
  } catch (error) {
    logger.error('Error ending virtual event:', error);
    res.status(500).json({ message: 'Failed to end event' });
  }
};

// Unjoin virtual event
exports.unjoinVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Find and deactivate participant record
    const participant = await EventParticipant.findOne({ eventId, userId, isActive: true });
    if (!participant) {
      return res.status(400).json({ message: 'You are not registered for this event' });
    }

    participant.isActive = false;
    await participant.save();

    // Update event participant count
    if (event.currentParticipants > 0) {
      event.currentParticipants -= 1;
      await event.save();
    }

    logger.info(`User ${userId} left virtual event ${eventId}`);

    res.json({
      message: 'Successfully left event',
      event
    });
  } catch (error) {
    logger.error('Error leaving virtual event:', error);
    res.status(500).json({ message: 'Failed to leave event' });
  }
};

// Get user's joined events
exports.getUserJoinedEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all events user has joined
    const participants = await EventParticipant.find({
      userId,
      isActive: true
    });

    const eventIds = participants.map(p => p.eventId);

    // Get the actual events
    const events = await VirtualEvent.find({
      id: { $in: eventIds },
      isActive: true
    }).sort({ date: 1, time: 1 });

    // Get conversation IDs for each event
    const eventsWithChat = await Promise.all(
      events.map(async (event) => {
        const conversation = await Conversation.findOne({ 
          eventId: event.id, 
          type: 'group', 
          isActive: true 
        });
        return {
          ...event.toObject(),
          conversationId: conversation?.id || null
        };
      })
    );

    res.json({ events: eventsWithChat });
  } catch (error) {
    logger.error('Error fetching user joined events:', error);
    res.status(500).json({ message: 'Failed to fetch joined events' });
  }
};

// Delete virtual event
exports.deleteVirtualEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can delete this event' });
    }

    event.isActive = false;
    await event.save();

    logger.info(`Virtual event deleted: ${eventId}`);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting virtual event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// Task Management Functions

// Add task to virtual event
exports.addTask = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, assignedTo, assignedToName, priority, dueDate, links, attachments } = req.body;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can add tasks' });
    }

    const taskData = {
      title,
      description,
      assignedTo,
      assignedToName,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      links: links || [],
      attachments: attachments || []
    };

    await event.addTask(taskData);

    logger.info(`Task added to event ${eventId}: ${title}`);

    res.json({ message: 'Task added successfully', task: event.tasks[event.tasks.length - 1] });
  } catch (error) {
    logger.error('Error adding task:', error);
    res.status(500).json({ message: 'Failed to add task' });
  }
};

// Update task status
exports.updateTask = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { status, title, description, priority, dueDate, links, attachments } = req.body;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    const task = event.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions: organizer can update any task, assigned user can update their own task status
    const isOrganizer = event.organizationId === userId;
    const isAssignedUser = task.assignedTo === userId;

    if (!isOrganizer && !isAssignedUser) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // If not organizer, only allow status updates
    const updateData = isOrganizer ? 
      { 
        status, 
        title, 
        description, 
        priority, 
        dueDate: dueDate ? new Date(dueDate) : null,
        links: links !== undefined ? links : task.links,
        attachments: attachments !== undefined ? attachments : task.attachments
      } :
      { status };

    await event.updateTask(taskId, updateData);

    logger.info(`Task updated in event ${eventId}: ${taskId}`);

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Upload task output (volunteer deliverables)
exports.uploadTaskOutput = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { outputs } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    const task = event.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    // Check if task is in-progress or completed (can upload outputs)
    if (task.status === 'pending') {
      return res.status(400).json({ message: 'Task must be started before uploading outputs' });
    }

    // Add outputs with uploader information
    const newOutputs = outputs.map(output => ({
      ...output,
      uploadedBy: userId,
      uploadedByName: userName,
      uploadedAt: new Date()
    }));

    if (!task.outputs) {
      task.outputs = [];
    }
    task.outputs.push(...newOutputs);

    await event.save();

    logger.info(`Outputs uploaded for task ${taskId} in event ${eventId} by ${userName}`);

    res.json({ 
      message: 'Outputs uploaded successfully',
      outputs: task.outputs
    });
  } catch (error) {
    logger.error('Error uploading task output:', error);
    res.status(500).json({ message: 'Failed to upload outputs' });
  }
};

// Delete task output
exports.deleteTaskOutput = async (req, res) => {
  try {
    const { eventId, taskId, outputIndex } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    const task = event.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is organizer
    const isOrganizer = event.organizationId === userId;
    const isAssignedUser = task.assignedTo === userId;

    if (!isOrganizer && !isAssignedUser) {
      return res.status(403).json({ message: 'Not authorized to delete this output' });
    }

    if (!task.outputs || !task.outputs[outputIndex]) {
      return res.status(404).json({ message: 'Output not found' });
    }

    task.outputs.splice(outputIndex, 1);
    await event.save();

    logger.info(`Output deleted from task ${taskId} in event ${eventId}`);

    res.json({ message: 'Output deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task output:', error);
    res.status(500).json({ message: 'Failed to delete output' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can delete tasks' });
    }

    await event.deleteTask(taskId);

    logger.info(`Task deleted from event ${eventId}: ${taskId}`);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// Get tasks for an event
exports.getEventTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Check if user is organizer or participant
    const isOrganizer = event.organizationId === userId;
    const participant = await EventParticipant.findOne({ 
      eventId: eventId, 
      userId: userId, 
      isActive: true 
    });

    if (!isOrganizer && !participant) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this event' });
    }

    // If organizer, return all tasks; if participant, return only their tasks
    const tasks = isOrganizer ? event.tasks : event.getTasksByUser(userId);

    res.json({ tasks });
  } catch (error) {
    logger.error('Error getting event tasks:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
};

// Update Google Meet link
exports.updateGoogleMeetLink = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { googleMeetLink } = req.body;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can update the Google Meet link' });
    }

    event.googleMeetLink = googleMeetLink;
    await event.save();

    logger.info(`Google Meet link updated for event ${eventId}`);

    res.json({ message: 'Google Meet link updated successfully' });
  } catch (error) {
    logger.error('Error updating Google Meet link:', error);
    res.status(500).json({ message: 'Failed to update Google Meet link' });
  }
};

// Get event participants (volunteers who joined)
exports.getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    // Check if user is the organizer
    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can view participants' });
    }

    // Get all active participants
    const participants = await EventParticipant.find({
      eventId: eventId,
      isActive: true
    });

    // Get user details for each participant
    const formattedParticipants = await Promise.all(
      participants.map(async (p) => {
        const userDetails = await User.findOne({ id: p.userId });
        return {
          userId: p.userId,
          userName: p.userName,
          userEmail: p.userEmail,
          profilePicture: userDetails?.avatar || null,
          joinedAt: p.createdAt
        };
      })
    );

    logger.info(`Retrieved ${formattedParticipants.length} participants for event ${eventId}`);

    res.json({ participants: formattedParticipants });
  } catch (error) {
    logger.error('Error getting event participants:', error);
    res.status(500).json({ message: 'Failed to get participants' });
  }
};

// Fix/Update conversation participants with correct user data
exports.fixConversationParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await VirtualEvent.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Virtual event not found' });
    }

    if (event.organizationId !== userId) {
      return res.status(403).json({ message: 'Only the organizer can fix participants' });
    }

    const conversation = await Conversation.findOne({ eventId, type: 'group', isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Event chat not found' });
    }

    // Get all active participants
    const eventParticipants = await EventParticipant.find({
      eventId: eventId,
      isActive: true
    });

    // Update each participant in the conversation with correct data
    for (const ep of eventParticipants) {
      const user = await User.findOne({ id: ep.userId });
      if (user) {
        // Remove old entry
        conversation.participants = conversation.participants.filter(p => p.userId !== ep.userId);
        
        // Add with correct data
        conversation.participants.push({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar || '',
          role: user.role === 'organization' ? 'admin' : 'member'
        });
        
        logger.info(`Fixed participant: ${user.id} -> ${user.name} (was: ${ep.userName})`);
      }
    }

    await conversation.save();

    logger.info(`Fixed ${eventParticipants.length} participants in conversation ${conversation.id}`);

    res.json({ 
      message: 'Conversation participants fixed successfully',
      participantCount: conversation.participants.length
    });
  } catch (error) {
    logger.error('Error fixing conversation participants:', error);
    res.status(500).json({ message: 'Failed to fix participants' });
  }
};

module.exports = exports;


