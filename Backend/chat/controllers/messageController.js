const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type, replyTo } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Get conversation
    const conversation = await Conversation.findOne({ id: conversationId, isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant of this conversation' });
    }

    // Create message
    const message = new Message({
      id: uuidv4(),
      conversationId,
      senderId: userId,
      senderName: participant.userName,
      senderAvatar: participant.userAvatar,
      content: content.trim(),
      type: type || 'text',
      replyTo: replyTo || undefined
    });

    await message.save();

    // Update conversation's last message
    await conversation.updateLastMessage(content.trim(), userId, participant.userName);

    logger.info(`Message sent: ${message.id} in conversation ${conversationId}`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get conversation messages
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Check if user is participant
    const conversation = await Conversation.findOne({ id: conversationId, isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant of this conversation' });
    }

    // Get messages
    const messages = await Message.getConversationMessages(
      conversationId,
      parseInt(limit),
      (page - 1) * parseInt(limit)
    );

    const total = await Message.countDocuments({ conversationId, isDeleted: false });

    // Mark messages as read
    const unreadMessages = messages.filter(m => m.senderId !== userId);
    await Promise.all(unreadMessages.map(m => m.markAsRead(userId)));

    // Update last read timestamp
    const participant = conversation.participants.find(p => p.userId === userId);
    if (participant) {
      participant.lastReadAt = new Date();
      await conversation.save();
    }

    res.json({
      messages: messages.reverse(), // Oldest first for display
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({ id: messageId, isDeleted: false });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    logger.info(`Message edited: ${messageId}`);

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error editing message:', error);
    res.status(500).json({ message: 'Failed to edit message' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({ id: messageId });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.content = 'This message has been deleted';
    await message.save();

    logger.info(`Message deleted: ${messageId}`);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({ id: messageId, isDeleted: false });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Get user details
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.userId === userId && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        userId,
        userName: user.name,
        emoji,
        timestamp: new Date()
      });
    }

    await message.save();

    res.json({
      message: 'Reaction updated',
      data: message
    });
  } catch (error) {
    logger.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
};

module.exports = exports;


