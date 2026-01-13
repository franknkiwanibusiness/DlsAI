import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase Admin correctly for Vercel
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
        if (!imageBase64) return res.status(400).json({ error: "No image data provided" });

        // 1. Host on Imgur (Provides a URL for better AI processing and Leaderboard history)
        const imgurResponse = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: {
                Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: imageBase64, type: "base64" }),
        });
        
        const imgurData = await imgurResponse.json();
        const imageUrl = imgurData.success ? imgurData.data.link : null;

        // 2. Call Gemma 3 12B (State-of-the-art vision model for 2026)
        // Note: Using the official model string for the Gemma 3 12B multimodal model
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        
        const prompt = `
            Analyze this Dream League Soccer (DLS) squad screenshot.
            - Count Legendary players (Gold cards).
            - Count Rare players (Blue cards).
            - Estimate account value ($10/Legendary, $4/Rare).
            Return ONLY a valid JSON object: {"value": 0, "legendary": 0, "rare": 0}
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            },
            prompt
        ]);

        const responseText = result.response.text();
        // Clean up markdown markers if AI adds them
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const aiData = JSON.parse(cleanJson);

        // 3. Save Record to Firestore for Leaderboard/History
        const docRef = await db.collection("valuations").add({
            ...aiData,
            imageUrl: imageUrl,
            source: "gemma-3-12b",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 4. Send Result back to UI
        return res.status(200).json({
            id: docRef.id,
            ...aiData,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("Critical Analysis Error:", error);
        // Fallback: If Gemma-3-12b is not found in your specific region, use 1.5-flash
        return res.status(500).json({ 
            error: "Uplink Failed", 
            message: "Verify your Model string and Region in Google AI Studio." 
        });
    }
}
