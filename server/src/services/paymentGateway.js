// server/src/services/paymentGateway.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const config = require('../config');

/**
 * Creates a new Stripe Customer associated with a new 'pay-to-learn' user.
 * @param {string} email - User's email address.
 * @param {string} name - User's name.
 * @returns {string} - The new Stripe Customer ID.
 */
exports.createStripeCustomer = async (email, name) => {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
            description: `Customer for Skill Exchange Platform`,
        });
        return customer.id;
    } catch (error) {
        console.error('Stripe Customer Creation Error:', error.message);
        throw new Error('Failed to set up payment customer.');
    }
};

/**
 * Creates a Stripe Checkout Session for a single session or subscription payment.
 * @param {string} customerId - The user's Stripe Customer ID.
 * @param {number} amountInCents - Amount to charge (in cents).
 * @param {string} description - Description for the transaction.
 * @param {string} successUrl - URL to redirect to on success.
 * @param {string} cancelUrl - URL to redirect to on cancellation.
 * @returns {object} - Object containing the Stripe Session ID and URL.
 */
exports.createCheckoutSession = async (customerId, amountInCents, description, matchId) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', // Can be 'subscription' or 'payment'
            customer: customerId,
            line_items: [{
                price_data: {
                    currency: config.DEFAULT_CURRENCY,
                    product_data: {
                        name: description,
                        description: `Payment for session related to match ID: ${matchId}`,
                    },
                    unit_amount: amountInCents,
                },
                quantity: 1,
            }],
            // Pass custom metadata to retrieve data on webhook
            metadata: { match_id: matchId, user_id: customerId },
            success_url: `${config.CLIENT_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.CLIENT_URL}/payments/cancel`,
        });

        return { sessionId: session.id, sessionUrl: session.url };
    } catch (error) {
        console.error('Stripe Checkout Session Error:', error.message);
        throw new Error('Failed to create checkout session.');
    }
};

/**
 * Verifies the Stripe webhook signature to ensure the request is legitimate.
 * @param {buffer} rawBody - The raw body of the request (must not be parsed).
 * @param {string} signature - The Stripe-Signature header value.
 * @returns {object} - The Stripe Event object.
 */
exports.verifyWebhook = (rawBody, signature) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
        );
        return event;
    } catch (error) {
        console.error('Stripe Webhook Signature Verification Failed:', error.message);
        throw new Error('Webhook signature verification failed.');
    }
};