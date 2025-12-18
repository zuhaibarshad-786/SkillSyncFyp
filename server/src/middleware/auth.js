// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Protects routes, ensuring a valid JWT is present and belongs to an active user.
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in the Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token (e.g., "Bearer YOUR_TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user by ID from the token payload and attach to request object
            // Exclude the password for security, even though it's already selected: false
            req.user = await User.findById(decoded.id).select('-password'); 

            if (!req.user) {
                res.status(401);
                throw new Error('User not found. Token is invalid.');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed or expired.');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token provided.');
    }
});

/**
 * Middleware for restricting access to administrators.
 */
exports.admin = (req, res, next) => {
    // NOTE: Requires a 'role' or 'isAdmin' field on the User model
    // if (req.user && req.user.isAdmin) {
    //     next();
    // } else {
    //     res.status(403);
    //     throw new Error('Not authorized as an admin.');
    // }
    next(); // Placeholder: implement logic based on User model roles
};