// server/src/controllers/authController.js
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken'); // 👈 Import JWT here

/**
 * Helper function to generate a JWT (No separate authUtils file)
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d', 
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, isPaymentUser } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password, isPaymentUser });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isPaymentUser: user.isPaymentUser,
            token: generateToken(user._id), // 👈 Use local helper
            message: 'Registration successful.'
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password'); 

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id), // 👈 Use local helper
            message: 'Login successful'
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Log out user
// @route   POST /api/auth/logout
// @access  Private (or public depending on token setup)
exports.logoutUser = (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
};