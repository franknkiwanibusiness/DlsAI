import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { imageBase64 } = req.body;

    try {
        // USING THE 15K LIMIT MODEL ONLY
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        const prompt = "Analyze this DLS squad. Extract player names and ratings. Return ONLY JSON: [{\"n\": \"Name\", \"r\": 85}]";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/png" } }
        ]);

        const text = result.response.text().replace(/```json|```/g, "").trim();
        const players = JSON.parse(text);

        const batch = db.batch();
        for (const player of players) {
            const docRef = db.collection("dlsvalueapi").doc(player.n);
            const worth = Math.max(player.r * 0.65, 45.00).toFixed(2);
            batch.set(docRef, { current_worth: worth, last_rating: player.r, updatedAt: new Date().toISOString() }, { merge: true });
        }
        await batch.commit();

        res.status(200).json({ success: true, playersFound: players.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
