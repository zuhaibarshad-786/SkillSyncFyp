// server/src/services/aiRecommendationService.js (MODIFIED for Gemini API)
const { GoogleGenAI } = require('@google/genai'); // Use the correct SDK

// Initialize the Gemini client. It automatically uses GEMINI_API_KEY from process.env
const ai = new GoogleGenAI({}); 

const GEMINI_MODEL = "gemini-2.5-flash"; // Fast and capable model

/**
 * Searches Gemini API for learning materials related to the given skill.
 * @param {string} skillName - The skill the user wants to learn (e.g., Python).
 * @returns {Array} - List of recommended resources based on Gemini's response.
 */
exports.getRecommendations = async (skillName) => {
    
    // Structured Prompt to request specific information (links, titles, platforms)
    const prompt = `
        As an expert tutor, suggest 3 highly relevant learning resources (like YouTube video links, official documentation, or Coursera courses) for a beginner student who wants to learn "${skillName}". 
        
        The response MUST be a clean JSON object adhering strictly to the following format. Do NOT include any introductory or explanatory text.
        
        JSON Format:
        {
          "recommendations": [
            { "title": "Resource Title", "link": "URL", "platform": "YouTube, Coursera, or Docs" },
            { "title": "Resource Title", "link": "URL", "platform": "YouTube, Coursera, or Docs" }
          ]
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                // Instruct Gemini to return only JSON output for easy parsing
                responseMimeType: "application/json", 
            },
        });
        
        // Extract the JSON text from the response
        const jsonText = response.text.trim();
        
        // Safely parse the JSON response
        const data = JSON.parse(jsonText);
        
        // Add default icons for frontend mapping
        return data.recommendations.map(rec => ({
            ...rec,
            icon: rec.platform.includes("YouTube") ? "FaYoutube" : rec.platform.includes("Coursera") ? "FaUniversity" : "FaLink"
        }));

    } catch (error) {
        console.error(`Error calling Gemini API for ${skillName}:`, error);
        // Fallback or detailed error message
        return [
            { title: "AI Search Failed. Check API Key.", link: "#", platform: "Error", icon: "FaExclamationCircle" }
        ];
    }
};