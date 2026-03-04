// server/src/models/Message.js (PERSISTENT - with delete features)
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    // Users who deleted this message only for themselves
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // True if sender deleted for everyone
    deletedForEveryone: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);