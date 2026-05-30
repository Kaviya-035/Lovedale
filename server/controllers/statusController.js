const Status = require('../models/Status');

// GET /api/status  — all active statuses (not expired)
const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/status  — create a new status
const createStatus = async (req, res) => {
  try {
    const { type, text, bgColor, fontStyle, mediaUrl, caption,
            songTitle, songArtist, songArtwork, songPreviewUrl, songStartSec } = req.body;

    const status = new Status({
      postedBy: req.user._id,
      type,
      text, bgColor, fontStyle,
      mediaUrl, caption,
      songTitle, songArtist, songArtwork, songPreviewUrl,
      songStartSec: songStartSec || 0,
    });

    const saved = await status.save();
    const populated = await saved.populate('postedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/status/:id/view  — mark as viewed
const viewStatus = async (req, res) => {
  try {
    await Status.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewedBy: req.user._id },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/status/:id/like  — toggle like
const likeStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: 'Not found' });

    const uid = req.user._id.toString();
    const alreadyLiked = status.likedBy.map(id => id.toString()).includes(uid);

    if (alreadyLiked) {
      await Status.findByIdAndUpdate(req.params.id, { $pull: { likedBy: req.user._id } });
    } else {
      await Status.findByIdAndUpdate(req.params.id, { $addToSet: { likedBy: req.user._id } });
    }

    const updated = await Status.findById(req.params.id);
    res.json({ liked: !alreadyLiked, likeCount: updated.likedBy.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/status/:id
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: 'Not found' });
    if (status.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await status.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStatuses, createStatus, viewStatus, likeStatus, deleteStatus };
