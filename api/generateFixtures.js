import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

// Firebase Config from Environment Variables
const firebaseConfig = {
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

export default async function handler(req, res) {
    // Enable CORS for your mobile dashboard
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { teams, groupLetter } = req.body;

        // 1. Call Groq Llama 3
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a football scheduler. Return ONLY a raw JSON array of 6 match objects." },
                { role: "user", content: `Create 6 matches for Group ${groupLetter} using these teams: ${JSON.stringify(teams)}. Format: {hUid, aUid, startTime (ISO string 18:00 CAT)}.` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const rawData = JSON.parse(completion.choices[0].message.content);
        // Ensure we get an array even if the AI wraps it in an object
        const fixtures = Array.isArray(rawData) ? rawData : (rawData.fixtures || Object.values(rawData)[0]);

        // 2. Update Firebase
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        await set(ref(db, `UCL_DATA/groups/Group ${groupLetter}/fixtures`), fixtures);

        return res.status(200).json({ success: true, count: fixtures.length });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
