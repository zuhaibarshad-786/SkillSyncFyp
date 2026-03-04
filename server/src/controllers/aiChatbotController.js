// server/src/controllers/aiChatbotController.js
const asyncHandler = require('express-async-handler');
const { GoogleGenAI } = require('@google/genai');

// Ensure the API Key is set in the server/.env file
const ai = new GoogleGenAI({});
const GEMINI_MODEL = "gemini-2.5-flash"; 

/**
 * Handles interactive chat requests, asking Gemini for suggestions.
 * @route POST /api/ai/chat
 * @access Private
 */
exports.handleAIChat = asyncHandler(async (req, res) => {
    const { message } = req.body; 

    if (!message) {
        res.status(400);
        throw new Error('Message content is required.');
    }

 const prompt = `
    You are a supportive skill recommendation expert for "SkillSync".
    User Query: "${message}"

    INSTRUCTIONS:
    1. Provide 2-3 sentences of advice.
    2. Suggest 2-3 resources. 
    3. IMPORTANT: For YouTube videos, provide the link on a NEW LINE like this:
       VIDEO: [Title](https://www.youtube.com/watch?v=VIDEO_ID)
    4. Use Markdown for other parts.
    5. Separate sections with (---).
`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });

        const textResponse = response.text;
        
        res.json({
            response: textResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Gemini Chat Error:', error);
        res.status(500).json({
            error: 'AI service failed to respond. Check API key and server logs.',
        });
    }
});