const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getStatuses, createStatus, viewStatus, likeStatus, deleteStatus } = require('../controllers/statusController');

router.get('/',           protect, getStatuses);
router.post('/',          protect, createStatus);
router.patch('/:id/view', protect, viewStatus);
router.patch('/:id/like', protect, likeStatus);
router.delete('/:id',     protect, deleteStatus);

module.exports = router;
