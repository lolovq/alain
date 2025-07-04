import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure this using Firebase CLI: firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper function for retries with exponential backoff
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Retrying after error: ${error.message}. Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return retry(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}

/**
 * Cloud Function to get fiscal advice using the Gemini API.
 * Triggered by an HTTP request (callable function).
 */
export const getFiscalAdvice = onCall(async (request: CallableRequest) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userQuery = request.data.query;
  const userData = request.data.userData; // Contextual user data

  if (!userQuery) {
    throw new HttpsError(
      'invalid-argument',
      'A query is required to get fiscal advice.'
    );
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
  } catch (error) {
    console.error("Error getting fiscal advice from Gemini API:", error);
    throw new HttpsError(
      'internal',
      'Failed to get fiscal advice.',
      error
    );
  }
});

