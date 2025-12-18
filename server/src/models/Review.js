// server/src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // The user writing the review
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The user being reviewed (teacher or learner)
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Rating given (1 to 5 stars)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        maxlength: 1000,
        trim: true,
    },
    // Reference to the match that led to this review
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
    },
    // Type of interaction being reviewed
    reviewType: {
        type: String,
        enum: ['Teaching', 'Learning', 'General_Interaction'],
        required: true,
    }
}, {
    timestamps: true
});

// Ensure a user can only review another user once per match
reviewSchema.index({ match: 1, reviewer: 1 }, { unique: true });

// Post-save hook to update the reviewee's average rating on the User model
reviewSchema.post('save', async function() {
    // Requires a service/controller function to handle the aggregation logic
    // e.g., await updateAverageRating(this.reviewee);
    console.log(`Review saved. Need to run rating update service for user: ${this.reviewee}`);
});

module.exports = mongoose.model('Review', reviewSchema);