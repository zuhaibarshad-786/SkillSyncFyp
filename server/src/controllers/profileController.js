// server/src/controllers/profileController.js

const User    = require('../models/User');
const Listing = require('../models/Listing');
const Skill   = require('../models/Skill');
const asyncHandler = require('express-async-handler');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get the logged-in user's own profile + listing
// @route   GET /api/profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserProfile = asyncHandler(async (req, res) => {
    const user    = await User.findById(req.user._id).select('-password');
    const listing = await Listing.findOne({ user: req.user._id });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({ profile: user, listing: listing || null });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get ANY user's public profile + listing (read-only)
// @route   GET /api/profile/:userId
// @access  Private  (must be logged in, but can view any user's public data)
//
// Deliberately omits email and password — only exposes safe public fields.
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
        'name bio location averageRating ratingCount teachingCount learningCount'
    );

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const listing = await Listing.findOne({ user: userId });

    res.json({ profile: user, listing: listing || null });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update the logged-in user's profile
// @route   PUT /api/profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Only update fields that were actually sent
    if (req.body.name     !== undefined) user.name     = req.body.name;
    if (req.body.bio      !== undefined) user.bio      = req.body.bio;
    if (req.body.location !== undefined) user.location = req.body.location;

    const updated = await user.save();

    res.json({
        _id:      updated._id,
        name:     updated.name,
        email:    updated.email,
        bio:      updated.bio,
        location: updated.location,
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create or update the logged-in user's skill listing
// @route   POST /api/profile/listing
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrUpdateListing = asyncHandler(async (req, res) => {
    const { skillsToTeach = [], skillsToLearn = [] } = req.body;

    if (skillsToTeach.length > 3 || skillsToLearn.length > 3) {
        res.status(400);
        throw new Error('Maximum 3 skills allowed per section.');
    }

    const allSkillIds = [
        ...skillsToTeach.map(s => s.skillId),
        ...skillsToLearn.map(s => s.skillId),
    ];

    if (allSkillIds.length > 0) {
        const validCount = await Skill.countDocuments({ _id: { $in: allSkillIds } });
        if (validCount !== allSkillIds.length) {
            res.status(400);
            throw new Error('One or more skills are not in the approved skills list.');
        }
    }

    const formattedTeach = skillsToTeach.map((s, i) => ({ ...s, priority: i + 1 }));
    const formattedLearn = skillsToLearn.map((s, i) => ({ ...s, priority: i + 1 }));

    const listing = await Listing.findOneAndUpdate(
        { user: req.user._id },
        { user: req.user._id, skillsToTeach: formattedTeach, skillsToLearn: formattedLearn },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json(listing);
});