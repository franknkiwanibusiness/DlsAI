import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import Groq from "groq-sdk";

// Firebase Config for Node.js
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Prevent re-initializing the app on every hot-reload in Vercel
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Use POST');

    try {
        const { teams, groupLetter } = req.body;

        // 1. Get Fixtures from Groq
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a league scheduler. Return ONLY a JSON object with a key 'fixtures' containing an array of 6 match objects." },
                { role: "user", content: `Create 6 matches for Group ${groupLetter} using these teams: ${JSON.stringify(teams)}. Format: {hUid, aUid, startTime (ISO string 18:00 CAT)}.` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const responseData = JSON.parse(completion.choices[0].message.content);
        const fixtures = responseData.fixtures;

        // 2. Write to Firebase
        // Path matches your UCL_DATA structure
        await set(ref(db, `UCL_DATA/groups/Group ${groupLetter}/fixtures`), fixtures);

        return res.status(200).json({ success: true, message: `Fixtures set for Group ${groupLetter}` });

    } catch (error) {
        console.error("DEPLOYMENT ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
}
