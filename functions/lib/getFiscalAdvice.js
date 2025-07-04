"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiscalAdvice = void 0;
const https_1 = require("firebase-functions/v2/https");
const generative_ai_1 = require("@google/generative-ai");
// Configure this using Firebase CLI: firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
// Helper function for retries with exponential backoff
async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries > 0) {
            console.warn(`Retrying after error: ${error.message}. Retries left: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        else {
            throw error;
        }
    }
}
/**
 * Cloud Function to get fiscal advice using the Gemini API.
 * Triggered by an HTTP request (callable function).
 */
exports.getFiscalAdvice = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userQuery = request.data.query;
    const userData = request.data.userData; // Contextual user data
    if (!userQuery) {
        throw new https_1.HttpsError('invalid-argument', 'A query is required to get fiscal advice.');
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        let prompt = `Provide concise fiscal advice based on the following query. Focus on general principles and avoid specific legal or financial recommendations. Always include a disclaimer that this advice is for informational purposes only and not a substitute for professional consultation.
    User query: "${userQuery}"`;
        if (userData) {
            prompt += `

Consider the following user context: ${JSON.stringify(userData)}`;
        }
        const result = await retry(() => model.generateContent(prompt), 3, 1000);
        const response = await result.response;
        const text = response.text();
        return { advice: text };
    }
    catch (error) {
        console.error("Error getting fiscal advice from Gemini API:", error);
        throw new https_1.HttpsError('internal', 'Failed to get fiscal advice.', error);
    }
});
//# sourceMappingURL=getFiscalAdvice.js.map