const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Get user's conversations
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findUserConversations(userId);

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.getUnreadCount(conv.id, userId);
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// Get unread count with specific user
exports.getUnreadCountWithUser = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    // Find DM conversation between these users
    const conversation = await Conversation.findDM(userId, otherUserId);
    
    if (!conversation) {
      return res.json({ unreadCount: 0 });
    }

    const unreadCount = await Message.getUnreadCount(conversation.id, userId);
    res.json({ unreadCount });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Create or get DM conversation
exports.createOrGetDM = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id;

    if (userId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create DM with yourself' });
    }

    // Check if DM already exists
    let conversation = await Conversation.findDM(userId, otherUserId);

    if (conversation) {
      return res.json({ conversation, isNew: false });
    }

    // Get both users' details
    const [user1, user2] = await Promise.all([
      User.findOne({ id: userId }),
      User.findOne({ id: otherUserId })
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new DM conversation
    conversation = new Conversation({
      id: uuidv4(),
      type: 'dm',
      participants: [
        {
          userId: user1.id,
          userName: user1.name,
          userAvatar: user1.avatar,
          role: 'member'
        },
        {
          userId: user2.id,
          userName: user2.name,
          userAvatar: user2.avatar,
          role: 'member'
        }
      ]
    });

    await conversation.save();

    logger.info(`DM conversation created: ${conversation.id} between ${userId} and ${otherUserId}`);

    res.status(201).json({ conversation, isNew: true });
  } catch (error) {
    logger.error('Error creating DM:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};

// Create group conversation
exports.createGroupChat = async (req, res) => {
  try {
    const { name, description, participantIds, eventId } = req.body;
    const userId = req.user.id;

    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'Name and participants are required' });
    }

    // Get creator details
    const creator = await User.findOne({ id: userId });
    if (!creator) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all participants' details
    const users = await User.find({ id: { $in: [...participantIds, userId] } });
    
    const participants = users.map(user => ({
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      role: user.id === userId ? 'admin' : 'member'
    }));

    const conversation = new Conversation({
      id: uuidv4(),
      type: 'group',
      name,
      description: description || '',
      participants,
      eventId: eventId || ''
    });

    await conversation.save();

    logger.info(`Group chat created: ${conversation.id} by ${userId}`);

    res.status(201).json({
      message: 'Group chat created successfully',
      conversation
    });
  } catch (error) {
    logger.error('Error creating group chat:', error);
    res.status(500).json({ message: 'Failed to create group chat' });
  }
};

// Get conversation details
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({ id: conversationId, isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant of this conversation' });
    }

    res.json({ conversation });
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};

// Add participant to group
exports.addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId: newUserId } = req.body;
    const requesterId = req.user.id;

    const conversation = await Conversation.findOne({ id: conversationId, type: 'group', isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    // Check if requester is admin
    const requester = conversation.participants.find(p => p.userId === requesterId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add participants' });
    }

    // Get new user details
    const newUser = await User.findOne({ id: newUserId });
    if (!newUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await conversation.addParticipant(newUserId, newUser.name, newUser.avatar);

    logger.info(`User ${newUserId} added to conversation ${conversationId}`);

    res.json({
      message: 'Participant added successfully',
      conversation
    });
  } catch (error) {
    logger.error('Error adding participant:', error);
    res.status(500).json({ message: 'Failed to add participant' });
  }
};

// Leave conversation
exports.leaveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({ id: conversationId, isActive: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.type === 'dm') {
      return res.status(400).json({ message: 'Cannot leave DM conversations' });
    }

    await conversation.removeParticipant(userId);

    logger.info(`User ${userId} left conversation ${conversationId}`);

    res.json({ message: 'Left conversation successfully' });
  } catch (error) {
    logger.error('Error leaving conversation:', error);
    res.status(500).json({ message: 'Failed to leave conversation' });
  }
};

module.exports = exports;






