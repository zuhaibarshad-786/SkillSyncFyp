// server/src/routes/api/skillRoutes.js
const express = require('express');
const { 
    getSkills, 
    createSkill, 
    searchSkills 
} = require('../../controllers/skillController');
// const { protect, admin } = require('../../middleware/auth'); // Assuming admin middleware exists

const router = express.Router();

// Public Routes for fetching and searching skills
router.get('/', getSkills);              // GET /api/skills
router.get('/search', searchSkills);    // GET /api/skills/search?q=...

// Private/Admin Route for adding new skills
// router.post('/', protect, admin, createSkill); // POST /api/skills

module.exports = router;