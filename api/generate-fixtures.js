import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, push, set } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
    projectId: "itzhoyoo-f9f7e",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Fetch current active managers
        const snapshot = await get(ref(db, 'users/players'));
        const players = snapshot.val();
        
        if (!players) return res.status(400).json({ error: 'No managers found in database' });

        const teamList = Object.values(players).map(p => ({
            id: p.id,
            team: p.team,
            logo: p.logo
        }));

        // 2. Call Groq AI to generate pairings
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Using 70b for better logic with 24 teams
                messages: [
                    {
                        role: "system",
                        content: "You are a Football League Scheduler. I will provide a list of teams. You must pair them into 12 unique matches (Home vs Away). Use every team exactly once. Return ONLY a JSON object with a 'matches' array containing objects with 'homeId' and 'awayId'."
                    },
                    {
                        role: "user",
                        content: `Generate 12 fixtures from this list: ${JSON.stringify(teamList)}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        const aiResult = await groqResponse.json();
        const pairings = JSON.parse(aiResult.choices[0].message.content).matches;

        // 3. Set Kickoff Time (Today at 18:00 local time)
        const kickoff = new Date();
        kickoff.setHours(18, 0, 0, 0);

        // 4. Push to Firebase
        const fixturesRef = ref(db, 'fixtures');
        const tasks = pairings.map(match => {
            const home = players[match.homeId];
            const away = players[match.awayId];

            return push(fixturesRef, {
                homeName: home.team,
                homeLogo: home.logo,
                homeScore: 0,
                awayName: away.team,
                awayLogo: away.logo,
                awayScore: 0,
                kickOffTime: kickoff.toISOString(),
                ended: false
            });
        });

        await Promise.all(tasks);

        return res.status(200).json({ 
            success: true, 
            message: `Match Day Generated: 12 Fixtures created for ${teamList.length} teams.` 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "AI Generation Failed: " + error.message });
    }
}
