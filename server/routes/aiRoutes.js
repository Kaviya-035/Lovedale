const express = require('express');
const router = express.Router();
const { askLoveAssistant } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/ask', protect, askLoveAssistant);

module.exports = router;
