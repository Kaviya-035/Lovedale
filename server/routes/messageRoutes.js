const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { getMessages, uploadMedia, sendMessage } = require('../controllers/messageController');

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = /image\/(jpeg|jpg|png|gif|webp|heic|heif)|audio\/(mpeg|mp3|wav|ogg|m4a|webm|aac)/;
    const allowedExt = /\.(jpeg|jpg|png|gif|webp|heic|heif|mp3|wav|ogg|m4a|webm|aac)$/i;

    const mimeOk = allowedMime.test(file.mimetype);
    const extOk  = allowedExt.test(path.extname(file.originalname));

    if (mimeOk || extOk) {
      return cb(null, true);
    } else {
      cb(new Error('Images and Audio files only!'));
    }
  },
});

router.get('/:otherUserId', protect, getMessages);
router.post('/upload', protect, upload.single('media'), uploadMedia);
router.post('/send',   protect, sendMessage);

module.exports = router;
