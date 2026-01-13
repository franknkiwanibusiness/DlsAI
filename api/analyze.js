import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// 1. Initialize Firebase (Prevents "duplicate app" errors in Vercel)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replaces escape characters for Vercel's private key format
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}
const db = admin.firestore();

// 2. Setup the AI Client using your Vercel Variable: GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // MODEL ROTATION: Try Gemini first, then Gemma (14.4k daily limit)
    const modelsToTry = ["gemini-2.5-flash", "gemma-3-12b-it"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Analyze this DLS squad. Extract player names and current ratings. Return ONLY JSON: [{\"n\": \"Player\", \"r\": 85}]";

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType: "image/png" } }
            ]);

            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, "").trim();
            const players = JSON.parse(cleanJson);

            // 3. Database Price Logic (The $45.00 Floor)
            const batch = db.batch();
            for (const player of players) {
                const docRef = db.collection("dlsvalueapi").doc(player.n);
                
                // MATH: Rating * 0.65 but never below $45.00
                const worth = Math.max(player.r * 0.65, 45.00).toFixed(2);

                batch.set(docRef, {
                    current_worth: worth,
                    last_rating: player.r,
                    source: modelName, // Tracks which model set the price
                    last_update: new Date().toISOString()
                }, { merge: true });
            }
            await batch.commit();

            return res.status(200).json({ 
                success: true, 
                playersFound: players.length, 
                activeBrain: modelName 
            });

        } catch (error) {
            console.error(`Attempt with ${modelName} failed:`, error.message);
            lastError = error;
            // Only switch to Gemma if Gemini hit its 20-scan limit (Error 429)
            if (!error.message.includes("429")) break;
        }
    }

    res.status(500).json({ error: "All models unavailable", details: lastError.message });
}
