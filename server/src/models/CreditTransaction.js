// server/src/models/CreditTransaction.js (NEW)
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: { // Purchase or Consumption (Spend)
        type: String,
        enum: ['purchase', 'consumption', 'reward'],
        required: true,
    },
    amount: { // Amount of credits added or subtracted
        type: Number,
        required: true,
    },
    method: { // JazzCash, Easypaisa, PayPal, etc. [cite: 12]
        type: String,
        default: 'N/A'
    },
    referenceId: { // Payment Gateway transaction ID
        type: String,
        unique: true,
        sparse: true // Allows nulls while ensuring uniqueness for non-nulls
    },
    notes: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('CreditTransaction', transactionSchema);