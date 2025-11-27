const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { v4: uuidv4 } = require('uuid');

// Authenticate socket connections
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.sub;
    socket.userName = decoded.name;
    next();
  });
};

// Initialize socket handlers
const initializeSocketHandlers = (io) => {
  // Socket authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userName})`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join conversation room
    socket.on('join:conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({ id: conversationId });
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(p => p.userId === socket.userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
        
        socket.emit('joined:conversation', { conversationId });
      } catch (error) {
        logger.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type, replyTo } = data;

        const conversation = await Conversation.findOne({ id: conversationId });
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const participant = conversation.participants.find(p => p.userId === socket.userId);
        if (!participant) {
          socket.emit('error', { message: 'Not a participant' });
          return;
        }

        const message = new Message({
          id: uuidv4(),
          conversationId,
          senderId: socket.userId,
          senderName: participant.userName,
          senderAvatar: participant.userAvatar,
          content: content.trim(),
          type: type || 'text',
          replyTo: replyTo || undefined
        });

        await message.save();
        await conversation.updateLastMessage(content.trim(), socket.userId, participant.userName);

        // Broadcast to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send notifications to offline participants
        const Notification = require('../models/Notification');
        for (const p of conversation.participants) {
          if (p.userId !== socket.userId) {
            // Send real-time socket notification
            io.to(`user:${p.userId}`).emit('notification:message', {
              conversationId,
              message,
              unreadCount: 1
            });

            // Create persistent notification in database
            try {
              await Notification.createChatMessageNotification(
                p.userId,
                participant.userName,
                content.trim(),
                conversationId
              );
            } catch (notifError) {
              logger.error('Error creating chat notification:', notifError);
            }
          }
        }

        logger.info(`Message sent: ${message.id} in conversation ${conversationId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false
      });
    });

    // Message read receipt
    socket.on('message:read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        const message = await Message.findOne({ id: messageId });
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notify sender
          io.to(`user:${message.senderId}`).emit('message:read', {
            messageId,
            conversationId,
            userId: socket.userId
          });
        }
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });

    // WebRTC signaling for video calls
    socket.on('call:initiate', (data) => {
      const { targetUserId, roomId, offer } = data;
      io.to(`user:${targetUserId}`).emit('call:incoming', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        roomId,
        offer
      });
      logger.info(`Call initiated from ${socket.userId} to ${targetUserId}`);
    });

    socket.on('call:answer', (data) => {
      const { targetUserId, roomId, answer } = data;
      io.to(`user:${targetUserId}`).emit('call:answered', {
        fromUserId: socket.userId,
        roomId,
        answer
      });
      logger.info(`Call answered by ${socket.userId}`);
    });

    socket.on('call:ice-candidate', (data) => {
      const { targetUserId, candidate } = data;
      io.to(`user:${targetUserId}`).emit('call:ice-candidate', {
        fromUserId: socket.userId,
        candidate
      });
    });

    socket.on('call:end', (data) => {
      const { targetUserId, roomId } = data;
      io.to(`user:${targetUserId}`).emit('call:ended', {
        fromUserId: socket.userId,
        roomId
      });
      logger.info(`Call ended by ${socket.userId}`);
    });

    // Join video call room
    socket.on('video:join-room', async (roomId) => {
      try {
        logger.info(`🎥 User ${socket.userId} (${socket.userName}) joining video room ${roomId}`);
        
        socket.join(`video:${roomId}`);
        logger.info(`✅ User ${socket.userId} joined room video:${roomId}`);
        
        // Get existing participants from the room
        const roomSockets = await io.in(`video:${roomId}`).fetchSockets();
        logger.info(`📊 Total sockets in room: ${roomSockets.length}`);
        
        const existingParticipants = roomSockets
          .filter(s => s.userId !== socket.userId)
          .map(s => ({
            userId: s.userId,
            userName: s.userName
          }));
        
        logger.info(`👥 Existing participants (excluding self): ${existingParticipants.length}`, existingParticipants);
        
        // Send existing participants to the newly joined user
        socket.emit('video:existing-participants', existingParticipants);
        logger.info(`📤 Sent existing participants to ${socket.userId}`);
        
        // Notify others about the new user
        socket.to(`video:${roomId}`).emit('video:user-joined', {
          userId: socket.userId,
          userName: socket.userName
        });
        logger.info(`📢 Notified others in room about ${socket.userName} joining`);
        
        logger.info(`✅ Video room join complete: ${socket.userName} in ${roomId}, ${existingParticipants.length} existing participants`);
      } catch (error) {
        logger.error('❌ Error joining video room:', error);
      }
    });

    // Leave video call room
    socket.on('video:leave-room', (roomId) => {
      socket.leave(`video:${roomId}`);
      socket.to(`video:${roomId}`).emit('video:user-left', {
        userId: socket.userId
      });
      logger.info(`User ${socket.userId} left video room ${roomId}`);
    });

    // Video state changes
    socket.on('video:toggle', (data) => {
      const { roomId, isEnabled } = data;
      socket.to(`video:${roomId}`).emit('video:user-toggle', {
        userId: socket.userId,
        isEnabled
      });
    });

    socket.on('audio:toggle', (data) => {
      const { roomId, isEnabled } = data;
      socket.to(`video:${roomId}`).emit('audio:user-toggle', {
        userId: socket.userId,
        isEnabled
      });
    });

    // WebRTC Signaling
    socket.on('webrtc:offer', (data) => {
      const { roomId, toUserId, offer } = data;
      logger.info(`📞 WebRTC offer from ${socket.userId} to ${toUserId}`);
      io.to(`user:${toUserId}`).emit('webrtc:offer', {
        fromUserId: socket.userId,
        offer: offer
      });
    });

    socket.on('webrtc:answer', (data) => {
      const { roomId, toUserId, answer } = data;
      logger.info(`📞 WebRTC answer from ${socket.userId} to ${toUserId}`);
      io.to(`user:${toUserId}`).emit('webrtc:answer', {
        fromUserId: socket.userId,
        answer: answer
      });
    });

    socket.on('webrtc:ice-candidate', (data) => {
      const { roomId, toUserId, candidate } = data;
      io.to(`user:${toUserId}`).emit('webrtc:ice-candidate', {
        fromUserId: socket.userId,
        candidate: candidate
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  logger.info('Socket.IO handlers initialized');
};

module.exports = initializeSocketHandlers;

