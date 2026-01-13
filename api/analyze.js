import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}
const db = admin.firestore();

// Setup AI with your GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image data" });

    try {
        // USING GEMMA 3 12B FOR 14,400 FREE DAILY SCANS
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        
        const prompt = "Analyze this DLS squad. List every player name and rating. Return ONLY JSON like this: [{\"n\": \"Mbappe\", \"r\": 98}]";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/png" } }
        ]);

        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const players = JSON.parse(cleanJson);

        // Update Firebase in one batch
        const batch = db.batch();
        for (const player of players) {
            const docRef = db.collection("dlsvalueapi").doc(player.n);
            const worth = Math.max(player.r * 0.65, 45.00).toFixed(2);
            
            batch.set(docRef, {
                current_worth: worth,
                last_rating: player.r,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        await batch.commit();

        res.status(200).json({ success: true, playersFound: players.length });

    } catch (error) {
        console.error("Scanner Error:", error.message);
        res.status(500).json({ error: "Scan Failed", details: error.message });
    }
}
