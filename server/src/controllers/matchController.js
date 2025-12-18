// server/src/controllers/matchController.js
const Match = require('../models/Match');
const matchingEngine = require('../services/matchingEngine');
const asyncHandler = require('express-async-handler');

// @desc    Get complementary match suggestions for the current user
// @route   GET /api/matches/suggestions
// @access  Private
exports.getMatchSuggestions = asyncHandler(async (req, res) => {
    // The core logic is delegated to the service layer
    const suggestions = await matchingEngine.findComplementaryMatches(req.user._id);

    if (suggestions.length === 0) {
        return res.json({ message: 'No complementary matches found yet. Update your listing!' });
    }
    
    // Filter out users the current user has already matched/rejected/messaged
    // (A real implementation requires complex history checks here)

    res.json(suggestions);
});

// @desc    Accept a match suggestion (initiates a match and creates a chat room)
// @route   POST /api/matches/accept/:targetUserId
// @access  Private
exports.acceptMatch = asyncHandler(async (req, res) => {
    const userAId = req.user._id;
    const userBId = req.params.targetUserId;

    // 1. Ensure a match doesn't already exist between the two users (A -> B or B -> A)
    const existingMatch = await Match.findOne({
        $or: [
            { userA: userAId, userB: userBId },
            { userA: userBId, userB: userAId }
        ]
    });

    if (existingMatch) {
        res.status(400);
        throw new Error('Match already active or pending.');
    }
    
    // 2. Determine the skills being exchanged (requires fetching listings)
    // NOTE: In a real app, this should confirm it's a valid complementary match
    const newMatch = await Match.create({
        userA: userAId,
        userB: userBId,
        skillLearnedByA: 'Example Skill B Teaches',
        skillLearnedByB: 'Example Skill A Teaches',
        status: 'active',
        // conversationId: createdChat._id // Should create a chat document here
    });

    // 3. (Optional) Send real-time notification to userB via WebSocket
    
    res.status(201).json(newMatch);
});