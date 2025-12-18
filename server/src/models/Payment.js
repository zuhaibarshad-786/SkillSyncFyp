// server/src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // User who made the payment (the learner)
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // User who receives the funds (the teacher) - optional if platform takes all fee
    payee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    // Status (e.g., paid, pending, failed)
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        required: true,
    },
    // Reference to the external transaction ID (e.g., Stripe Charge ID)
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    // What the payment covers (e.g., '60_minute_session', 'monthly_subscription')
    description: {
        type: String,
        required: true,
    },
    relatedMatch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        default: null,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);