// server/src/models/Skill.js
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['Technology', 'Language', 'Arts', 'Science', 'Finance', 'Other'],
        required: true,
    },
    // Optional: Keep track of how popular a skill is
    listingCount: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);