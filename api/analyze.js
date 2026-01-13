import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL // For Realtime DB
    });
}

const db = admin.database(); // Using Realtime Database as requested

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64, userId } = req.body;
    
    // 1. Check if user is logged in
    if (!userId) return res.status(401).json({ error: "Auth required" });

    // 2. Check points before starting
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    if (!userData || userData.points < 10) {
        return res.status(403).json({ error: "INSUFFICIENT_POINTS", message: "Need 10 points to scan." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

    try {
        // 3. Strict Training/Prompt for DLS only
        const prompt = `
            VALIDATION: Is this a Dream League Soccer (DLS) team management or squad screen? 
            If it is NOT a DLS game screenshot (e.g. a house, person, or different game), return ONLY: {"error": "INVALID_IMAGE"}.
            If it IS DLS: Count Legendary (Gold) and Rare (Blue) player cards. 
            Calculate total value: $10 per Legendary, $4 per Rare.
            Output JSON ONLY: {"value": number, "legendary": number, "rare": number}
        `;

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const responseText = result.response.text().replace(/```json|```/g, "").trim();
        const aiData = JSON.parse(responseText);

        if (aiData.error === "INVALID_IMAGE") {
            return res.status(400).json({ error: "INVALID_IMAGE", message: "Only DLS screenshots allowed!" });
        }

        // 4. Success: Deduct 10 points
        await userRef.update({
            points: userData.points - 10,
            lastScan: admin.database.ServerValue.TIMESTAMP
        });

        return res.status(200).json({ ...aiData, remainingPoints: userData.points - 10 });

    } catch (error) {
        return res.status(500).json({ error: "AI_ERROR", message: error.message });
    }
}
