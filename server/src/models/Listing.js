// server/src/models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // A user can only have one active listing
    },
    // Skill the user WANTS TO TEACH
    skillToTeach: {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
        name: { type: String, required: true },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
        description: { type: String, maxlength: 500 }
    },
    // Skill the user WANTS TO LEARN
    skillToLearn: {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
        name: { type: String, required: true },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
        description: { type: String, maxlength: 500 }
    },
    // Matches the User model's 'isPaymentUser' field, but stored here for fast listing search
    isTeachingOnly: { 
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);