// server/src/models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
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
    // NEW: Tracks which users have deleted the chat from their view
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true 
});

chatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);