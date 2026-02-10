// // server/src/routes/api/profileRoutes.js
// const express = require('express');
// const { 
//     getUserProfile, 
//     updateUserProfile, 
//     createOrUpdateListing 
// } = require('../../controllers/profileController');
// const { protect } = require('../../middleware/auth'); // Middleware to ensure user is logged in

// const router = express.Router();

// // Routes protected by authentication
// router.route('/')
//     .get(protect, getUserProfile)      // GET /api/profile
//     .put(protect, updateUserProfile);  // PUT /api/profile

// router.route('/listing')
//     .post(protect, createOrUpdateListing); // POST /api/profile/listing

// module.exports = router;

const express = require('express');
const { 
    getUserProfile, 
    updateUserProfile, 
    createOrUpdateListing 
} = require('../../controllers/profileController');
const { protect } = require('../../middleware/auth'); // Ensure this file exists at this path

const router = express.Router();

// Base profile routes: GET and PUT at /api/profile
router.route('/')
    .get(protect, getUserProfile)      // Fetches profile and listing
    .put(protect, updateUserProfile);  // Updates basic bio/name

// Listing route: POST at /api/profile/listing
router.route('/listing')
    .post(protect, createOrUpdateListing); // Handles multi-skill priority logic

module.exports = router;