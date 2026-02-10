// // server/src/controllers/profileController.js
// const User = require('../models/User');
// const Listing = require('../models/Listing');
// const asyncHandler = require('express-async-handler');

// // @desc    Get current user profile
// // @route   GET /api/profile
// // @access  Private
// exports.getUserProfile = asyncHandler(async (req, res) => {
//     // req.user is populated by the auth middleware
//     const user = await User.findById(req.user._id).select('-password'); 
//     const listing = await Listing.findOne({ user: req.user._id });

//     if (user) {
//         res.json({
//             profile: user,
//             listing: listing
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });

// // @desc    Update user profile
// // @route   PUT /api/profile
// // @access  Private
// exports.updateUserProfile = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);

//     if (user) {
//         user.name = req.body.name || user.name;
//         user.bio = req.body.bio || user.bio;
//         user.location = req.body.location || user.location;
//         // Handle password change separately if necessary

//         const updatedUser = await user.save();

//         res.json({
//             _id: updatedUser._id,
//             name: updatedUser.name,
//             email: updatedUser.email,
//             // ... other updated fields
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });

// // @desc    Create or Update a Skill Listing
// // @route   POST /api/profile/listing
// // @access  Private
// exports.createOrUpdateListing = asyncHandler(async (req, res) => {
//     const { skillToTeach, skillToLearn } = req.body;
    
//     // Find and update the existing listing or create a new one
//     const listing = await Listing.findOneAndUpdate(
//         { user: req.user._id },
//         { 
//             user: req.user._id, // upsert needs this
//             skillToTeach,
//             skillToLearn
//         },
//         { new: true, upsert: true, setDefaultsOnInsert: true } // key for creation or update
//     );

//     res.status(200).json(listing);
// });

const User = require('../models/User'); // Required for profile info
const Listing = require('../models/Listing'); // Required for skill updates
const Skill = require('../models/Skill'); // Required for master list validation
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

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create or Update a Multi-Skill Listing with Priority
// @route   POST /api/profile/listing
// @access  Private
exports.createOrUpdateListing = asyncHandler(async (req, res) => {
    const { skillsToTeach, skillsToLearn } = req.body;

    // 1. Basic Length Validation: Max 3 skills per section
    if (skillsToTeach.length > 3 || skillsToLearn.length > 3) {
        res.status(400);
        throw new Error('Selection limit exceeded: Maximum 3 skills allowed per section.');
    }

    // 2. Validate against Master Skill List
    const allSkillIds = [
        ...skillsToTeach.map(s => s.skillId),
        ...skillsToLearn.map(s => s.skillId)
    ];

    const validSkillsCount = await Skill.countDocuments({ _id: { $in: allSkillIds } });
    if (validSkillsCount !== allSkillIds.length) {
        res.status(400);
        throw new Error('This skill is not available in the approved skills list.');
    }

    // 3. Auto-assign Priority based on array index (1, 2, 3)
    const formattedTeach = skillsToTeach.map((s, index) => ({ ...s, priority: index + 1 }));
    const formattedLearn = skillsToLearn.map((s, index) => ({ ...s, priority: index + 1 }));

    const listing = await Listing.findOneAndUpdate(
        { user: req.user._id },
        { 
            user: req.user._id,
            skillsToTeach: formattedTeach,
            skillsToLearn: formattedLearn
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json(listing);
});