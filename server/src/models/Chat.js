// server/src/models/Chat.js
// KEY FIX: Removed broken unique index on participants[].
//          chatId (composite sorted string) is the unique key now.
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    // Composite key: "smallerUserId_largerUserId" — always sorted alphabetically
    chatId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'rejected'],
        default: 'pending',
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Users who soft-deleted this chat from their own view
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Chat', chatSchema);