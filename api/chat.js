import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

// Initialize Firebase with your saved environment tokens
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Initialize Gemini with your hidden backend key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messageHistory } = req.body;

    // Send the history to Gemini along with tools to query your database nodes
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messageHistory,
      config: {
        systemInstruction: "You are the automated chat agent for MINIMISTY. You help customers look up FrostBlade Pro orders using tools to pull real data from Firebase. If information isn't found or unrelated, politely ask them to email official store support.",
        tools: [{
          functionDeclarations: [{
            name: "fetchCustomerOrder",
            description: "Looks up order status, tracking updates, and items from the Firebase Realtime Database using a customer email or order ID string.",
            parameters: {
              type: "OBJECT",
              properties: {
                emailOrId: { type: "STRING", description: "The customer's order ID or email address." }
              },
              required: ["emailOrId"]
            }
          }]
        }]
      }
    });

    const functionCalls = response.functionCalls;

    // If Gemini requests a database lookup, execute it right here on your server
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === "fetchCustomerOrder") {
        const targetKey = call.args.emailOrId.replace(/[.#$\[\]]/g, "_"); // Sanitize for Firebase
        const orderRef = ref(db, `orders/${targetKey}`);
        const snapshot = await get(orderRef);
        const toolResult = snapshot.exists() ? snapshot.val() : { error: "No order record discovered." };

        // Send database values back to Gemini for the final natural answer
        const finalResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            ...messageHistory,
            response.candidates[0].content,
            {
              role: "tool",
              parts: [{ functionResponse: { name: "fetchCustomerOrder", response: toolResult } }]
            }
          ]
        });

        return res.status(200).json({ reply: finalResponse.text });
      }
    }

    // Return standard AI text if no database function was triggered
    return res.status(200).json({ reply: response.text });

  } catch (error) {
    return res.status(500).json({ error: "Internal backend bridge malfunction." });
  }
}
