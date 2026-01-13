import { GoogleGenerativeAI } from "@google/generative-ai"; // Removed SchemaType
import admin from "firebase-admin";

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
        if (!imageBase64) return res.status(400).json({ error: "Missing image data" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Standard string for Gemma 3
        const model = genAI.getGenerativeModel({ 
            model: "gemma-3-12b-it"
        });

        const prompt = "Identify DLS player cards. Count Gold (Legendary) and Blue (Rare). Return JSON ONLY: {'value': 0, 'legendary': 0, 'rare': 0}";

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        const aiData = JSON.parse(text);

        const docRef = await db.collection("valuations").add({
            ...aiData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ id: docRef.id, ...aiData });

    } catch (error) {
        console.error("Analysis Error:", error.message);
        return res.status(500).json({ error: "Uplink Failed", details: error.message });
    }
}
