// server/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false, // Don't return by default
    },
    profilePicture: {
        type: String,
        default: 'default_avatar.png',
    },
    bio: {
        type: String,
        maxlength: 500,
    },
    location: {
        type: String,
        trim: true,
    },
    // Trust Mechanism: Average of all ratings received
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    // Payment Role: true if the user only learns and pays, false if they teach/exchange
    isPaymentUser: {
        type: Boolean,
        default: false, 
    },
    // Stripe Customer ID (for paying learners)
    stripeCustomerId: {
        type: String,
        select: false,
    },
    // --- MONETIZATION & GAMIFICATION ---
    creditBalance: { // New field for Paid Credit System [cite: 12, 58]
        type: Number,
        default: 0,
        min: 0
    },
    // Trust Mechanism: Average of all ratings received
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    // Reputation System: Teaching-to-Learning Ratio [cite: 57]
    teachingCount: {
        type: Number,
        default: 0
    },
    learningCount: {
        type: Number,
        default: 0
    },
    
    // Gamification/Verified Status [cite: 13, 48]
    isPremium: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
},
 {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);