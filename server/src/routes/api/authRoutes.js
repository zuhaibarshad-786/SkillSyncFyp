// server/src/routes/api/authRoutes.js
const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../../controllers/authController');
// const { protect } = require('../../middleware/auth'); // Assuming protect middleware exists

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private Routes
// router.post('/logout', protect, logoutUser); // Example usage of protect middleware

module.exports = router;