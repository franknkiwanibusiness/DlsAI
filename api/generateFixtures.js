import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import Groq from "groq-sdk";

// Initialize Firebase once
const firebaseConfig = {
    databaseURL: process.env.FIREBASE_DATABASE_URL // Ensure this is the full https://... url
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Use a clear name for the key

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { teams, groupLetter } = req.body;

        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a professional UEFA league scheduler. 
                    Structure: 3 Matchdays (MD), 2 matches per MD.
                    Rules:
                    - MD1: Tomorrow 18:00 and 21:00.
                    - MD2: Day after 18:00 and 21:00.
                    - MD3: Two days after 18:00 and 21:00.
                    Return ONLY this JSON format: {"fixtures": [{"hUid": "string", "aUid": "string", "startTime": "ISO_STRING", "matchday": 1}]}` 
                },
                { 
                    role: "user", 
                    content: `Schedule 6 matches for Group ${groupLetter} using these UIDs: ${JSON.stringify(teams)}` 
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const responseData = JSON.parse(completion.choices[0].message.content);
        
        // SAVE TO THE SAME PATH THE LIVE APP USES
        await set(ref(db, `DLSVALUE/UCL_DATA/groups/Group ${groupLetter}/fixtures`), responseData.fixtures);

        return res.status(200).json({ success: true, fixtures: responseData.fixtures });

    } catch (error) {
        console.error("Groq/Firebase Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
