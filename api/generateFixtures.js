import Groq from "groq-sdk";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

// Firebase config should be in your Vercel Environment Variables
const firebaseConfig = {
    databaseURL: process.env.FIREBASE_DATABASE_URL,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { teams, groupLetter } = req.body;

    const prompt = `
        You are a football league scheduler. 
        Teams: ${JSON.stringify(teams.map(t => ({id: t.uid, name: t.teamName})))}
        Task: Create a 6-match Round Robin schedule for Group ${groupLetter}.
        Rules:
        1. Every team must play exactly 3 matches.
        2. Format: JSON array of objects with keys: hUid, aUid, startTime (ISO string starting from tomorrow 18:00 CAT).
        3. Output ONLY the JSON array.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Use Groq's fast Llama 3 model
            response_format: { type: "json_object" }
        });

        const fixtures = JSON.parse(chatCompletion.choices[0].message.content);

        // Update Firebase directly from the server
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        await set(ref(db, `UCL_DATA/groups/Group ${groupLetter}/fixtures`), fixtures);

        return res.status(200).json({ success: true, fixtures });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
