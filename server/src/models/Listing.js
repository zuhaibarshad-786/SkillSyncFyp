// // server/src/models/Listing.js
// const mongoose = require('mongoose');

// const listingSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//         unique: true // A user can only have one active listing
//     },
//     // Skill the user WANTS TO TEACH
//     skillToTeach: {
//         skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
//         name: { type: String, required: true },
//         level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
//         description: { type: String, maxlength: 500 }
//     },
//     // Skill the user WANTS TO LEARN
//     skillToLearn: {
//         skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
//         name: { type: String, required: true },
//         level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
//         description: { type: String, maxlength: 500 }
//     },
//     // Matches the User model's 'isPaymentUser' field, but stored here for fast listing search
//     isTeachingOnly: { 
//         type: Boolean,
//         default: false
//     },
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Listing', listingSchema);

// server/src/models/Listing.js
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
    priority: { type: Number, required: true, min: 1, max: 3 }, // 1 = Highest
    description: { type: String, maxlength: 500 }
});

const listingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Array of skills (Max 3)
    skillsToTeach: [skillSchema],
    skillsToLearn: [skillSchema],
    isTeachingOnly: { 
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

// Validation to ensure max 3 skills per category
listingSchema.pre('save', function(next) {
    if (this.skillsToTeach.length > 3) {
        return next(new Error('You can only have a maximum of 3 teaching skills.'));
    }
    if (this.skillsToLearn.length > 3) {
        return next(new Error('You can only have a maximum of 3 learning skills.'));
    }
    next();
});

module.exports = mongoose.model('Listing', listingSchema);