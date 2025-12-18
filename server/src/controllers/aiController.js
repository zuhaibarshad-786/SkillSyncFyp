// server/src/controllers/aiController.js (MODIFIED)
const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiRecommendationService');
const Listing = require('../models/Listing');

// @desc    Get AI recommended learning content based on user's desired skill
// @route   GET /api/ai/recommendations
// @access  Private
exports.getRecommendations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Find the user's "Wants to Learn" skill from the database
    // Ensure the model is correctly referenced (assuming Listing.js model)
    const userListing = await Listing.findOne({ user: userId }).select('skillToLearn').lean();

    if (!userListing || !userListing.skillToLearn || !userListing.skillToLearn.name) {
        return res.status(400).json({ message: "Please define the skill you want to learn in your listing to use AI search." });
    }

    const desiredSkill = userListing.skillToLearn.name;

    // 2. Fetch real recommendations using the Gemini Service
    const recommendations = await aiService.getRecommendations(desiredSkill);

    res.json({
        desiredSkill,
        recommendations
    });
});