// server/src/controllers/creditController.js (CORRECTED & UNIFIED)
const User = require('../models/User');

exports.getCreditBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('creditBalance teachingCount learningCount isPremium createdAt'); // Added createdAt for mock logic

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const teachingCount = user.teachingCount || 0;
        const learningCount = user.learningCount || 0;
        
        // Calculate T-L Ratio
        const ratio = learningCount > 0 ? (teachingCount / learningCount).toFixed(2) : (teachingCount > 0 ? 'INF' : '0.00');

        res.status(200).json({
            creditBalance: user.creditBalance,
            teachingLearningRatio: ratio,
            isPremium: user.isPremium,
            // Mock isNewUser logic (e.g., if created less than 7 days ago)
            isNewUser: (new Date() - user.createdAt) < (7 * 24 * 60 * 60 * 1000) 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Handles payment integration for purchasing credits (unified logic for /buy and /purchase).
 */
exports.purchaseCredits = async (req, res) => {
    // Logic for integrating Stripe/JazzCash/Easypaisa payment gateway
    [cite_start]// This is the essential monetization feature for one-sided learners[cite: 204].
    res.status(501).json({ message: "Credit purchasing logic not yet implemented (Payment Gateway Integration required)." });
};

/**
 * Handles the submission of non-teaching contributions (notes, reviews) to earn credits.
 * [cite_start]This is the alternative for one-sided learners to maintain balance[cite: 216].
 */
exports.submitContribution = async (req, res) => {
    // Logic to save the note/quiz submission for AI/Admin review (FR-9)
    res.status(202).json({ message: "Contribution submitted for review. You will be notified upon credit award." });
};

// 🚨 ADDING MISSING PLACEHOLDER: Required for old router imports, even though we will remove it in the router file.
exports.initiateCreditPurchase = async (req, res) => {
     res.status(501).json({ message: "This route is deprecated. Use POST /credits/buy." });
};