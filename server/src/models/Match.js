// server/src/models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    // User who initiated or accepted the match
    userA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The complementary user
    userB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The skill User A is learning from User B
    skillLearnedByA: {
        type: String,
        required: true,
    },
    // The skill User B is learning from User A (null if User B is a payment user)
    skillLearnedByB: {
        type: String,
        default: null,
    },
    // Status of the match (e.g., active, completed, cancelled)
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'active',
    },
    // Reference to the conversation/chat
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        // Optional: you might create the chat document upon match acceptance
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);