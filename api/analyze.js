import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n') 
        : undefined;

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // 1. Validate Method
    if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

    try {
        const { imageBase64, mimeType } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "No image provided" });

        // 2. Call Gemini 3 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
        const prompt = `
            Analyze this DLS squad image. 
            Count the players: Legendary (Gold), Rare (Blue), and Maxed.
            Calculate USD value: $10/Legendary, $4/Rare, +$5 for each Maxed player.
            Return ONLY JSON: {"value": 0, "legendary": 0, "rare": 0, "maxed": 0}
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
        ]);

        // 3. Parse AI Response
        const textResponse = result.response.text().replace(/```json|```/g, "").trim();
        const aiResponse = JSON.parse(textResponse);

        // 4. Save to Firestore (using admin collection)
        const docRef = await db.collection("valuations").add({
            ...aiResponse,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. Return Success
        return res.status(200).json({ id: docRef.id, ...aiResponse });

    } catch (error) {
        console.error("Analysis Error:", error);
        return res.status(500).json({ error: "Internal AI Error", details: error.message });
    }
}
