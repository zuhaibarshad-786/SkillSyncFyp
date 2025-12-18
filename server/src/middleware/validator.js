// server/src/middleware/validator.js
const { body, validationResult } = require('express-validator');
const Listing = require('../models/Listing'); // Used for custom listing validation

/**
 * Middleware that checks for validation errors after running express-validator checks.
 * If errors are found, it stops the request and returns a 400 Bad Request.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    // Aggregate errors for a clean response
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(400).json({
        success: false,
        errors: extractedErrors,
    });
};

// --- Specific Validation Chains ---

exports.validateRegistration = [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('isPaymentUser').isBoolean().withMessage('isPaymentUser must be true or false.'),
    validate, // Run the validation check
];

exports.validateListing = [
    // Validate Skill to Teach
    body('skillToTeach.name').notEmpty().withMessage('Teaching skill name is required.'),
    body('skillToTeach.level').isIn(['Beginner', 'Intermediate', 'Expert']).withMessage('Invalid teaching level.'),
    
    // Validate Skill to Learn
    body('skillToLearn.name').notEmpty().withMessage('Learning skill name is required.'),
    body('skillToLearn.level').isIn(['Beginner', 'Intermediate', 'Expert']).withMessage('Invalid learning level.'),

    validate, // Run the validation check
];

// NOTE: You would export other specific chains (e.g., validateLogin, validateProfileUpdate) here.