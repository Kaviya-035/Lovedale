const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Map userId -> socketId for online tracking
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`💘 User connected: ${socket.user.name} (${userId})`);

    // Track online user
    onlineUsers.set(userId, socket.id);

    // Update user online status in DB
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Mark pending messages as delivered
    try {
      const pendingMessages = await Message.find({
        receiver: userId,
        status: 'sent'
      });

      if (pendingMessages.length > 0) {
        await Message.updateMany(
          { receiver: userId, status: 'sent' },
          { status: 'delivered' }
        );

        // Notify senders
        pendingMessages.forEach(msg => {
          const senderSocketId = onlineUsers.get(msg.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageStatusUpdate', {
              messageId: msg._id,
              status: 'delivered'
            });
          }
        });
      }
    } catch (err) {
      console.error('Error updating delivery status on connection:', err);
    }

    // --- MESSAGING EVENTS ---

    // Send Message
    socket.on('sendMessage', async (messageData) => {
      try {
        const { receiverId, text, messageType, mediaUrl, replyTo } = messageData;

        const newMessage = new Message({
          sender: userId,
          receiver: receiverId,
          text,
          messageType: messageType || 'text',
          mediaUrl,
          replyTo,
          status: 'sent',
        });

        await newMessage.save();

        // --- STREAK TRACKING LOGIC ---
        const senderUser = await User.findById(userId);
        const lastDate = senderUser.lastInteractionDate;
        const today = new Date();
        let newStreak = senderUser.currentStreak || 0;

        if (lastDate) {
          const diffInMs = today - lastDate;
          const diffInHours = diffInMs / (1000 * 60 * 60);
          
          if (diffInHours > 48) {
            newStreak = 1; // Streak broken
          } else if (today.toDateString() !== lastDate.toDateString()) {
            newStreak += 1; // Next day
          }
        } else {
          newStreak = 1;
        }

        await User.updateMany(
          { _id: { $in: [userId, receiverId] } },
          { lastInteractionDate: today, currentStreak: newStreak }
        );

        // Emit streak update
        io.to(onlineUsers.get(userId)).emit('streakUpdated', newStreak);
        if (onlineUsers.has(receiverId)) {
          io.to(onlineUsers.get(receiverId)).emit('streakUpdated', newStreak);
        }
        // ------------------------------

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('replyTo', 'text messageType mediaUrl sender')
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        // Emit to sender
        socket.emit('messageSent', populatedMessage);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          // Update status to delivered if receiver is online
          populatedMessage.status = 'delivered';
          await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
          
          io.to(receiverSocketId).emit('newMessage', populatedMessage);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Message Seen
    socket.on('messageSeen', async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: 'seen' });
        
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageStatusUpdate', { messageId, status: 'seen' });
        }
      } catch (error) {
        console.error('Error updating seen status:', error);
      }
    });

    // Edit Message
    socket.on('editMessage', async ({ messageId, newText, receiverId }) => {
      try {
        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId, sender: userId },
          { text: newText, isEdited: true },
          { new: true }
        )
          .populate('replyTo', 'text messageType mediaUrl sender')
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        if (updatedMessage) {
          socket.emit('messageUpdated', updatedMessage);
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('messageUpdated', updatedMessage);
          }
        }
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });

    // Delete Message
    socket.on('deleteMessage', async ({ messageId, receiverId }) => {
      try {
        await Message.findOneAndUpdate(
          { _id: messageId, sender: userId },
          { isDeleted: true }
        );

        socket.emit('messageDeleted', messageId);
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('messageDeleted', messageId);
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    // Add Reaction
    socket.on('reactMessage', async ({ messageId, emoji, receiverId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Toggle reaction
        const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId);
        
        if (existingReactionIndex > -1) {
          if (message.reactions[existingReactionIndex].emoji === emoji) {
            message.reactions.splice(existingReactionIndex, 1); // Remove
          } else {
            message.reactions[existingReactionIndex].emoji = emoji; // Update
          }
        } else {
          message.reactions.push({ userId, emoji }); // Add
        }

        await message.save();
        
        const updatedMessage = await Message.findById(messageId)
          .populate('replyTo', 'text messageType mediaUrl sender')
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        socket.emit('messageUpdated', updatedMessage);
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('messageUpdated', updatedMessage);
        }
      } catch (error) {
        console.error('Error reacting to message:', error);
      }
    });

    // Typing Indicators
    socket.on('typing', (receiverId) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', userId);
      }
    });

    socket.on('stopTyping', (receiverId) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userStopTyping', userId);
      }
    });
    
    // Mood Synchronization
    socket.on('changeMood', ({ mood, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('moodChanged', mood);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`💔 User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = { initializeSocket, onlineUsers };

