// server/src/config/index.js
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration Object
 * Centralizes access to environment variables.
 */
const config = {
    // --- Server & Environment ---
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    
    // --- Frontend Configuration ---
    // Using port 5173 for Vite development server
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

    // --- Database (MongoDB Atlas) ---
    MONGO_URI: process.env.MONGO_URI, // e.g., 'mongodb+srv://user:pass@cluster0.abc.mongodb.net/skill-exchange'

    // --- Authentication & Security ---
    JWT_SECRET: process.env.JWT_SECRET || 'a-very-strong-default-secret',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',

    // --- Payment (Stripe) ---
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    
    // --- Video/WebRTC (e.g., Twilio/Agora) ---
    VIDEO_API_KEY: process.env.VIDEO_API_KEY,
    
    // --- Email Service ---
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
};

// Simple check to ensure critical keys are set in production
if (config.NODE_ENV === 'production' && !config.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in production mode!');
    process.exit(1);
}

module.exports = config;