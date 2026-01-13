import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase Admin
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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    try {
        const { imageBase64 } = req.body;

        // 1. Upload to Imgur (Optional but recommended for speed)
        const imgurResponse = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: {
                Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: imageBase64, type: "base64" }),
        });
        const imgurData = await imgurResponse.json();
        const imageUrl = imgurData.data.link;

        // 2. Call Gemini 3 Flash with the Image URL
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
        const prompt = "Analyze this DLS squad. Identify Legendary/Rare cards and estimate total account value in USD. Return JSON: {'value': 0, 'legendary': 0, 'rare': 0}";

        // We use the image URL for faster processing
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } } // Fallback to direct data
        ]);

        const aiData = JSON.parse(result.response.text().replace(/```json|```/g, ""));

        // 3. Save to Firestore
        await db.collection("valuations").add({
            ...aiData,
            imageUrl: imageUrl, // Keep a record of the squad
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json(aiData);

    } catch (error) {
        console.error("Critical Error:", error);
        return res.status(500).json({ error: "Uplink Failed", details: error.message });
    }
}
