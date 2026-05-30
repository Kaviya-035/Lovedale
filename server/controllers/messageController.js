const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get chat history with a specific user
// @route   GET /api/messages/:otherUserId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;

    // Fetch messages between current user and other user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate('replyTo', 'text messageType mediaUrl sender')
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// @desc    Upload media (image or voice)
// @route   POST /api/messages/upload
// @access  Private
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Cloudinary returns req.file.path as the full HTTPS URL
    // Local disk returns a filename — build a relative path
    const fileUrl = req.file.path
      ? req.file.path                          // Cloudinary: full https://res.cloudinary.com/...
      : `/uploads/${req.file.filename}`;       // Local fallback

    res.json({ url: fileUrl, type: req.body.type || 'image' });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading media', error: error.message });
  }
};

// @desc    Send a message via REST (for status replies)
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType, mediaUrl, statusRef } = req.body;
    if (!receiverId || !text) {
      return res.status(400).json({ message: 'receiverId and text are required' });
    }

    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      text,
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || null,
      statusRef: statusRef || null,
      status: 'sent',
    });

    await newMessage.save();
    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'name')
      .populate('receiver', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMessages,
  uploadMedia,
  sendMessage,
};
