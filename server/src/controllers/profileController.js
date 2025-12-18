// server/src/controllers/profileController.js
const User = require('../models/User');
const Listing = require('../models/Listing');
const asyncHandler = require('express-async-handler');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the auth middleware
    const user = await User.findById(req.user._id).select('-password'); 
    const listing = await Listing.findOne({ user: req.user._id });

    if (user) {
        res.json({
            profile: user,
            listing: listing
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.location = req.body.location || user.location;
        // Handle password change separately if necessary

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            // ... other updated fields
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create or Update a Skill Listing
// @route   POST /api/profile/listing
// @access  Private
exports.createOrUpdateListing = asyncHandler(async (req, res) => {
    const { skillToTeach, skillToLearn } = req.body;
    
    // Find and update the existing listing or create a new one
    const listing = await Listing.findOneAndUpdate(
        { user: req.user._id },
        { 
            user: req.user._id, // upsert needs this
            skillToTeach,
            skillToLearn
        },
        { new: true, upsert: true, setDefaultsOnInsert: true } // key for creation or update
    );

    res.status(200).json(listing);
});