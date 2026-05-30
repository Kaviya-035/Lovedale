const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'music'],
      required: true,
    },
    // text status
    text: { type: String, maxlength: 300 },
    bgColor: { type: String, default: '#1a0a18' },
    fontStyle: { type: String, default: 'serif' },
    // media status (image / video)
    mediaUrl: { type: String },
    caption: { type: String, maxlength: 200 },
    // music status
    songTitle:  { type: String },
    songArtist: { type: String },
    songArtwork: { type: String },
    songPreviewUrl: { type: String },
    songStartSec:   { type: Number, default: 0 },
    // views
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // likes
    likedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // auto-expire after 24 h
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB deletes documents when expiresAt is reached
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', statusSchema);
