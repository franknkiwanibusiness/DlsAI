import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from "firebase-admin";

// Initialize Firebase with your fixed Secret
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
}
const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('POST only');
    const { imageBase64 } = req.body;

    try {
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Elite Prompt for Data Extraction
        const result = await visionModel.generateContent([
            "Return ONLY a JSON array of every DLS player card name and rating: [{\"n\":\"Name\",\"r\":85}]. Be precise with spelling.",
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ]);

        const rawText = result.response.text();
        const players = JSON.parse(rawText.match(/\[.*\]/s)[0]);

        const batch = db.batch();
        const processedPlayers = [];

        for (const p of players) {
            // Self-Learning Logic: Search for existing players with similar names
            const playerRef = db.collection("dls_players").doc(p.n.toLowerCase().trim());
            const doc = await playerRef.get();

            let finalName = p.n;
            
            if (doc.exists) {
                // Use the "Clean" name stored in your DB if it exists
                finalName = doc.data().cleanName;
            } else {
                // If it's a new name, save it as a "Master" for next time
                batch.set(playerRef, {
                    cleanName: p.n,
                    rating: p.r,
                    lastSeen: new Date().toISOString()
                });
            }

            processedPlayers.push({
                n: finalName,
                r: p.r,
                worth: (p.r * 0.65).toFixed(2)
            });
        }

        await batch.commit();

        res.status(200).json({ 
            success: true, 
            players: processedPlayers, 
            playersFound: processedPlayers.length 
        });

    } catch (error) {
        console.error("Scanner Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}
