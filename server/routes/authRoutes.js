const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, getMe, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);


module.exports = router;
