const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createVirtualEvent,
  getAllVirtualEvents,
  getOrganizationEvents,
  getVirtualEvent,
  joinVirtualEvent,
  unjoinVirtualEvent,
  getUserJoinedEvents,
  updateVirtualEvent,
  startVirtualEvent,
  endVirtualEvent,
  deleteVirtualEvent,
  addTask,
  updateTask,
  deleteTask,
  getEventTasks,
  updateGoogleMeetLink,
  getEventParticipants,
  fixConversationParticipants,
  uploadTaskOutput,
  deleteTaskOutput
} = require('./controllers/virtualEventController');
const { uploadTaskFiles, upload } = require('./controllers/fileUploadController');

// Public routes
router.get('/events', getAllVirtualEvents);
router.get('/events/:eventId', getVirtualEvent);

// Protected routes
router.post('/events', authenticateToken, createVirtualEvent);
router.get('/organizations/:organizationId/events', authenticateToken, getOrganizationEvents);
router.get('/users/joined-events', authenticateToken, getUserJoinedEvents);
router.post('/events/:eventId/join', authenticateToken, joinVirtualEvent);
router.post('/events/:eventId/unjoin', authenticateToken, unjoinVirtualEvent);
router.patch('/events/:eventId', authenticateToken, updateVirtualEvent);
router.post('/events/:eventId/start', authenticateToken, startVirtualEvent);
router.post('/events/:eventId/end', authenticateToken, endVirtualEvent);
router.delete('/events/:eventId', authenticateToken, deleteVirtualEvent);

// Task management routes
router.post('/events/:eventId/tasks', authenticateToken, addTask);
router.get('/events/:eventId/tasks', authenticateToken, getEventTasks);
router.patch('/events/:eventId/tasks/:taskId', authenticateToken, updateTask);
router.delete('/events/:eventId/tasks/:taskId', authenticateToken, deleteTask);

// Google Meet link management
router.patch('/events/:eventId/google-meet', authenticateToken, updateGoogleMeetLink);

// Get event participants
router.get('/events/:eventId/participants', authenticateToken, getEventParticipants);

// Fix conversation participants
router.post('/events/:eventId/fix-participants', authenticateToken, fixConversationParticipants);

// File upload for tasks
router.post('/upload-task-files', authenticateToken, upload.array('files', 5), uploadTaskFiles);

// Task outputs (volunteer deliverables)
router.post('/events/:eventId/tasks/:taskId/outputs', authenticateToken, uploadTaskOutput);
router.delete('/events/:eventId/tasks/:taskId/outputs/:outputIndex', authenticateToken, deleteTaskOutput);

module.exports = router;


