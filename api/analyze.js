import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import admin from "firebase-admin";

// 1. Firebase Admin Setup
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
        })
    });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    try {
        const { imageBase64 } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 2. IMPORTANT: The exact model ID for Gemma 3 Multimodal in 2026
        const model = genAI.getGenerativeModel({ 
            model: "models/gemma-3-12b-it",
            // This forces the AI to ONLY talk in JSON
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            Identify player cards in this DLS screenshot. 
            Count Legendary (Gold) and Rare (Blue). 
            Calculate value: $10/Legendary, $4/Rare.
            Format: {"value": number, "legendary": number, "rare": number}
        `;

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        // 3. Parse the result (No cleaning needed with responseMimeType!)
        const aiData = JSON.parse(result.response.text());

        // 4. Save to Firestore
        const docRef = await db.collection("valuations").add({
            ...aiData,
            model: "gemma-3-12b",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ id: docRef.id, ...aiData });

    } catch (error) {
        console.error("Gemma 3 Uplink Error:", error.message);
        return res.status(400).json({ 
            error: "Uplink Failed", 
            reason: error.message.includes("not found") ? "Model ID Mismatch" : "Invalid Image Data" 
        });
    }
}
