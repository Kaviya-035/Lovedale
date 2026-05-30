const express = require('express');
const router = express.Router();
const { getMemories, createMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMemories);
router.post('/', protect, createMemory);
router.delete('/:id', protect, deleteMemory);

module.exports = router;
