// server/src/routes/api/matchRoutes.js
const express = require('express');
const { 
    getMatchSuggestions, 
    acceptMatch 
} = require('../../controllers/matchController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// Routes for the complementary matching engine
router.get('/suggestions', protect, getMatchSuggestions);   // GET /api/matches/suggestions
// router.post('/accept/:targetUserId', protect, acceptMatch); // POST /api/matches/accept/123

module.exports = router;