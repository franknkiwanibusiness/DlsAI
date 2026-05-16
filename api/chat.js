import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messageHistory } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === "fetchCustomerOrder") {
        const targetKey = call.args.emailOrId.replace(/[.#$\[\]]/g, "_");
        const orderRef = ref(db, `orders/${targetKey}`);
        const snapshot = await get(orderRef);
        const toolResult = snapshot.exists() ? snapshot.val() : { error: "No order record discovered." };

        const finalResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
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

    return res.status(200).json({ reply: response.text });

  } catch (error) {
    console.error("Backend Error Details:", error);
    return res.status(500).json({ error: "Internal backend bridge malfunction." });
  }
}
