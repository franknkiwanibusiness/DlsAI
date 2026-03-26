import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import Groq from "groq-sdk";

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Use POST');

    try {
        const { teams, groupLetter } = req.body;

        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a professional UEFA-style league scheduler. 
                    Structure: 3 Matchdays (MD), 2 matches per MD.
                    Timing Rules:
                    - MD1: Tomorrow at 18:00 and 21:00 CAT.
                    - MD2: The following day at 18:00 and 21:00 CAT.
                    - MD3: Two days from now at 18:00 and 21:00 CAT.
                    Return ONLY a JSON object: {"fixtures": [{hUid, aUid, startTime (ISO string), matchday: 1}]}` 
                },
                { 
                    role: "user", 
                    content: `Schedule 6 matches for Group ${groupLetter} using: ${JSON.stringify(teams)}` 
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const responseData = JSON.parse(completion.choices[0].message.content);
        const fixtures = responseData.fixtures;

        // Save to Firebase
        await set(ref(db, `UCL_DATA/groups/Group ${groupLetter}/fixtures`), fixtures);

        return res.status(200).json({ success: true, message: "Schedule Separated!" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
