// server/src/routes/api/profileRoutes.js
const express = require('express');
const { 
    getUserProfile, 
    updateUserProfile, 
    createOrUpdateListing 
} = require('../../controllers/profileController');
const { protect } = require('../../middleware/auth'); // Middleware to ensure user is logged in

const router = express.Router();

// Routes protected by authentication
router.route('/')
    .get(protect, getUserProfile)      // GET /api/profile
    .put(protect, updateUserProfile);  // PUT /api/profile

router.route('/listing')
    .post(protect, createOrUpdateListing); // POST /api/profile/listing

module.exports = router;