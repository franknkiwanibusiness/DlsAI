import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// 1. IMPROVED FIREBASE INIT (Fixes the Decoder error)
if (!admin.apps.length) {
    try {
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
    } catch (e) {
        console.error("Firebase Init Error:", e.message);
    }
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    
    const { imageBase64 } = req.body;

    try {
        // USE THE CORRECT 2026 MODEL NAME
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        
        const prompt = "Extract DLS player names and ratings. Return ONLY JSON array: [{\"n\":\"Name\",\"r\":85}]";
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const match = text.match(/\[.*\]/s);
        if (!match) throw new Error("AI did not return valid JSON");
        
        const players = JSON.parse(match[0]);

        const batch = db.batch();
        players.forEach(p => {
            const docRef = db.collection("dlsvalueapi").doc(p.n);
            batch.set(docRef, { 
                current_worth: Math.max(p.r * 0.65, 45).toFixed(2), 
                updatedAt: new Date().toISOString() 
            }, { merge: true });
        });
        await batch.commit();

        res.status(200).json({ success: true, playersFound: players.length });

    } catch (error) {
        console.error("API Error Detail:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}
