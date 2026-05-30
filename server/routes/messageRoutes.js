const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, uploadMedia, sendMessage } = require('../controllers/messageController');

// Use Cloudinary if credentials are set, otherwise fall back to local disk
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const { upload: cloudUpload } = require('../config/cloudinary');
  upload = cloudUpload;
} else {
  const multer = require('multer');
  const path   = require('path');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
  upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = /image\/(jpeg|jpg|png|gif|webp|heic|heif)|audio\/(mpeg|mp3|wav|ogg|m4a|webm|aac)/.test(file.mimetype)
              || /\.(jpeg|jpg|png|gif|webp|heic|heif|mp3|wav|ogg|m4a|webm|aac)$/i.test(path.extname(file.originalname));
      ok ? cb(null, true) : cb(new Error('Images and Audio files only!'));
    },
  });
}

router.get('/:otherUserId', protect, getMessages);
router.post('/upload', protect, upload.single('media'), uploadMedia);
router.post('/send',   protect, sendMessage);

module.exports = router;
