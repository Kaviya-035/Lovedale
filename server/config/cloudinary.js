const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'lovedale',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'mp3', 'wav', 'ogg', 'm4a', 'webm', 'aac'],
      transformation: isImage ? [{ quality: 'auto', fetch_format: 'auto' }] : undefined,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMime = /image\/(jpeg|jpg|png|gif|webp|heic|heif)|audio\/(mpeg|mp3|wav|ogg|m4a|webm|aac)/;
    const allowedExt  = /\.(jpeg|jpg|png|gif|webp|heic|heif|mp3|wav|ogg|m4a|webm|aac)$/i;
    if (allowedMime.test(file.mimetype) || allowedExt.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Images and Audio files only!'));
    }
  },
});

module.exports = { cloudinary, upload };
