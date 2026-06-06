const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Create new account (Lender or Renter)
router.post('/register', register);

// POST /api/auth/login — Authenticate and receive JWT
router.post('/login', login);

// GET /api/auth/me — Get current user profile (protected)
router.get('/me', protect, getMe);

// PUT /api/auth/profile — Update user profile (protected)
router.put('/profile', protect, updateProfile);

module.exports = router;
