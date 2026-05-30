const express = require('express');
const router = express.Router();
const { askLoveAssistant, generateMovie } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/ask',   protect, askLoveAssistant);
router.post('/movie', protect, generateMovie);

module.exports = router;
