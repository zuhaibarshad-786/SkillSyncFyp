// server/src/services/matchingEngine.js
const Listing = require('../models/Listing');

/**
 * Finds complementary matches where one user teaches what the other wants to learn.
 * @param {string} currentUserId - The ID of the user seeking a match.
 * @returns {Array} - An array of potential match listings.
 */
exports.findComplementaryMatches = async (currentUserId) => {
    // 1. Get the current user's listing (what they teach/want to learn)
    const currentUserListing = await Listing.findOne({ user: currentUserId }).lean();

    if (!currentUserListing) {
        return [];
    }

    const teachSkill = currentUserListing.skillToTeach.name;
    const learnSkill = currentUserListing.skillToLearn.name;

    // 2. Find listings where:
    const matches = await Listing.find({
        // CRITICAL LINE: Exclude the current user's own listing
        user: { $ne: currentUserId }, 
        $or: [
            // Case A: Current user wants to learn Y, Candidate teaches Y
            { 'skillToTeach.name': learnSkill },
            // Case B: Current user teaches X, Candidate wants to learn X
            { 'skillToLearn.name': teachSkill }
        ]
    })
    .populate('user', 'name profilePicture') 
    .lean();
    
    // 3. Score and Filter Matches (Basic Scoring)
    const scoredMatches = matches.map(match => {
        let score = 0;
        let matchReason = [];

        // Score 1: Partner teaches skill user wants to learn (Y)
        if (match.skillToTeach.name === learnSkill) {
            score += 50;
            matchReason.push(`Teaches the skill you want to learn: **${learnSkill}**`);
        }

        // Score 2: Partner wants to learn the skill user teaches (X)
        if (match.skillToLearn.name === teachSkill) {
            score += 50;
            matchReason.push(`Wants to learn your skill: **${teachSkill}**`);
        }

        return {
            ...match,
            score,
            matchReason: matchReason.join(' and ')
        };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

    return scoredMatches;
};