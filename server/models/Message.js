const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'voice'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Status reply/mention — snapshot of the status card
    statusRef: {
      type: {
        statusId:   String,
        statusType: String,   // text | image | video | music
        mediaUrl:   String,
        text:       String,
        bgColor:    String,
        songTitle:  String,
        songArtwork: String,
        posterName: String,
      },
      default: null,
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
      },
    ],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat history queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

