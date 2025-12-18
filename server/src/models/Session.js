// server/src/models/Session.js (UPDATED to store composite chatId)
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    // CHANGED: Store composite chatId string instead of ObjectId reference
    chatId: {
        type: String, // e.g., "user1_id_user2_id"
        required: true
    },
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skill: {
        type: String,
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    isBarter: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'rated', 'canceled'],
        default: 'scheduled'
    },
    markedCompletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    }
}, { timestamps: true });

// Index for faster lookups
sessionSchema.index({ chatId: 1, status: 1 });
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);