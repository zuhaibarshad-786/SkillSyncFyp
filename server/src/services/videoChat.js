// server/src/services/videoChat.js
const { AccessToken } = require('twilio').jwt.accessToken;
const VideoGrant = AccessToken.VideoGrant;
const config = require('../config');

// Twilio credentials from environment variables (must be set in .env)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

/**
 * Generates a Twilio Access Token for a specific user and room.
 * This token grants access to the video service.
 * @param {string} userId - The unique ID of the user (Identity).
 * @param {string} roomName - The unique room/match identifier.
 * @returns {string} - The generated JWT token.
 */
exports.generateVideoToken = (userId, roomName) => {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
        console.error("Twilio credentials not fully configured.");
        throw new Error('Video service credentials missing.');
    }
    
    // 1. Create a Video Grant (allows connecting to a room)
    const videoGrant = new VideoGrant({
        room: roomName,
    });

    // 2. Create the Access Token
    const accessToken = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY_SID,
        TWILIO_API_KEY_SECRET,
        { identity: userId } // The user's identity
    );

    accessToken.addGrant(videoGrant);
    
    // The token expires in 1 hour (default)
    return accessToken.toJwt();
};

/**
 * Placeholder for creating a video room/session instance (optional depending on API).
 * Twilio Video rooms are often created implicitly when the first user joins.
 * @param {string} roomName - The unique room/match identifier.
 */
exports.createVideoRoom = async (roomName) => {
    // For many WebRTC APIs, this is a simple check or initialization call.
    console.log(`[Video Service] Ensuring room ${roomName} is ready...`);
    return { roomName, status: 'ready' };
};