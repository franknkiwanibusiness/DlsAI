import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// 1. GLOBAL INITIALIZATION
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
        })
    });
}
const db = admin.firestore(); // Defined globally so it's accessible everywhere

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64 } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // UPDATED 2026 MODEL LIST
    const modelsToTry = [
        "gemma-3-12b-it", 
        "gemma-3-4b-it", 
        "gemini-2.5-flash" // Replaced 1.5-flash with 2.5-flash
    ];
    
    for (const modelId of modelsToTry) {
        try {
            console.log(`Scanning with ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });

            const prompt = `Identify DLS player cards. Count Gold (Legendary) and Blue (Rare). JSON ONLY: {"value": 0, "legendary": 0, "rare": 0}`;

            const result = await model.generateContent([
                { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
                prompt
            ]);

            const responseText = result.response.text().replace(/```json|```/g, "").trim();
            const aiData = JSON.parse(responseText);

            // Using the global 'db' variable
            await db.collection("valuations").add({
                ...aiData,
                modelUsed: modelId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.status(200).json(aiData);

        } catch (error) {
            console.error(`${modelId} failed:`, error.message);
            if (modelId === modelsToTry[modelsToTry.length - 1]) {
                return res.status(503).json({ error: "All AI engines are offline. Try again later." });
            }
        }
    }
}
