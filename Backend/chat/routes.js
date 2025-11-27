const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserConversations,
  getUnreadCountWithUser,
  createOrGetDM,
  createGroupChat,
  getConversation,
  addParticipant,
  leaveConversation
} = require('./controllers/conversationController');
const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addReaction
} = require('./controllers/messageController');

// Conversation routes
router.get('/conversations', authenticateToken, getUserConversations);
router.get('/conversations/unread/:otherUserId', authenticateToken, getUnreadCountWithUser);
router.post('/conversations/dm', authenticateToken, createOrGetDM);
router.post('/conversations/group', authenticateToken, createGroupChat);
router.get('/conversations/:conversationId', authenticateToken, getConversation);
router.post('/conversations/:conversationId/participants', authenticateToken, addParticipant);
router.delete('/conversations/:conversationId/leave', authenticateToken, leaveConversation);

// Message routes
router.post('/conversations/:conversationId/messages', authenticateToken, sendMessage);
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);
router.patch('/messages/:messageId', authenticateToken, editMessage);
router.delete('/messages/:messageId', authenticateToken, deleteMessage);
router.post('/messages/:messageId/reactions', authenticateToken, addReaction);

module.exports = router;






