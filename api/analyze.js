import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

export default async function handler(req, res) {
    // Crucial: Vercel needs to know this is JSON
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64, userId } = req.body;
    if (!userId) return res.status(401).json({ error: "Login required" });

    try {
        // 1. Check Points
        const userRef = db.ref(`users/${userId}`);
        const snap = await userRef.once('value');
        const userData = snap.val();

        if (!userData || (userData.points < 10)) {
            return res.status(403).json({ message: "Insufficient Points (10 needed)" });
        }

        // 2. AI Analysis
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        const prompt = "DLS Squad Analysis: Is this DLS? If no, return {'error': 'INVALID'}. If yes, return JSON only: {'value': number, 'legendary': number, 'rare': number}";

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const text = result.response.text().replace(/```json|```/g, "").trim();
        const aiData = JSON.parse(text);

        if (aiData.error) return res.status(400).json({ message: "Invalid DLS Image" });

        // 3. Deduct Points & Return
        await userRef.update({ points: userData.points - 10 });
        
        return res.status(200).json({ ...aiData, modelUsed: "Gemma-3-12b" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "AI Engine Busy. Try again." });
    }
}
