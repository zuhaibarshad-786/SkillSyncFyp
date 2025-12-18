// server/src/routes/api/paymentRoutes.js
const express = require('express');
const { 
    createCheckoutSession, 
    handleWebhook 
} = require('../../controllers/paymentController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// Private Route: Initiates a payment checkout session (protected for authenticated users)
router.post('/checkout', protect, createCheckoutSession); // POST /api/payments/checkout

// Public Route: Endpoint for Stripe/PayPal to send payment events (CRITICAL)
// Note: Webhooks must be raw body, so this needs to bypass the JSON parser in index.js
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook); 

module.exports = router;