// server/src/routes/api/creditsRoutes.js (CORRECTED & CLEANED)
const express = require('express');
const { 
    // 🚨 IMPORTANT: Import ALL functions exported by the controller, even if deprecated in the routes file.
    getCreditBalance,
    purchaseCredits, 
    submitContribution,
    // Keep this imported to avoid an error if another file requires it, though it's unused below.
    initiateCreditPurchase 
} = require('../../controllers/creditController');
const { protect } = require('../../middleware/auth'); 

const router = express.Router();

/**
 * @route GET /api/credits/balance
 * @desc Retrieve the current credit balance, T-L ratio, and premium status.
 * @access Private
 */
router.get('/balance', protect, getCreditBalance);

/**
 * @route POST /api/credits/buy
 * @desc Purchase credits (This is the primary endpoint for purchasing credits).
 * @access Private
 */
router.post('/buy', protect, purchaseCredits); 

/**
 * @route POST /api/credits/contribute
 * @desc Submit non-teaching contribution to earn credits.
 * @access Private
 */
router.post('/contribute', protect, submitContribution);

// 🚨 REMOVED: The problematic router.post('/purchase', ...) line that was causing the crash (line 37 in your original file).

module.exports = router;