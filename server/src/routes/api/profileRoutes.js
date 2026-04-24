// server/src/routes/api/profileRoutes.js

const express = require('express');
const {
    getUserProfile,
    getPublicProfile,
    updateUserProfile,
    createOrUpdateListing,
} = require('../../controllers/profileController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// ── Own profile (logged-in user) ──────────────────────────────────────────────
// GET  /api/profile        → fetch own profile + listing
// PUT  /api/profile        → update own name / bio / location
router.route('/')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// ── Own listing ───────────────────────────────────────────────────────────────
// POST /api/profile/listing → create or update skill listing
router.route('/listing')
    .post(protect, createOrUpdateListing);

// ── Public profile of any user ────────────────────────────────────────────────
// GET /api/profile/:userId  → read-only, safe public fields only
//
// IMPORTANT: this route must come AFTER /listing so that Express doesn't
// interpret the literal string "listing" as a :userId param.
router.route('/:userId')
    .get(protect, getPublicProfile);

module.exports = router;