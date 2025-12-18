// server/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import individual API route files
const authRoutes = require('./api/authRoutes');
const profileRoutes = require('./api/profileRoutes');
const skillRoutes = require('./api/skillRoutes');
const matchRoutes = require('./api/matchRoutes');
const paymentRoutes = require('./api/paymentRoutes');
const chatRoutes = require('./api/chatRoutes');
const aiRoutes = require('./api/aiRoutes');
const sessionRoutes = require('./api/sessionRoutes'); // 🚨 Imported
const creditsRoutes = require('./api/creditsRoutes');

// --- API Route Mapping ---

// All routes here will be prepended with /api (from the index.js usage)

// Authentication
router.use('/auth', authRoutes);

// User Profile and Listing Management
router.use('/profile', profileRoutes);

// Skill Taxonomy
router.use('/skills', skillRoutes);

// Matching Engine
router.use('/matches', matchRoutes);

// Payments (for non-exchanging learners)
router.use('/payments', paymentRoutes);

// Chat and Scheduling
router.use('/chat', chatRoutes);

router.use('/sessions', sessionRoutes); 
router.use('/credits', creditsRoutes);

router.use('/ai', aiRoutes); 

module.exports = router;