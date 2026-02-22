import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Fetch Live Odds from the API
async function getLiveSportsData() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b"; // Your Odds API Key
        // Fetching Champions League & Premier League for maximum BMW dream value
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer_uefa_champions_league/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return "No live fixtures found right now.";

        return data.map(match => {
            const home = match.home_team;
            const away = match.away_team;
            const bookie = match.bookmakers[0];
            if (!bookie) return `${home} vs ${away} (Odds pending)`;
            
            const odds = bookie.markets[0].outcomes;
            const homePrice = odds.find(o => o.name === home)?.price || "N/A";
            const awayPrice = odds.find(o => o.name === away)?.price || "N/A";
            const drawPrice = odds.find(o => o.name === "Draw")?.price || "N/A";

            return `MATCH: ${home} vs ${away} | ODDS: Home(${homePrice}), Draw(${drawPrice}), Away(${awayPrice})`;
        }).join('\n');
    } catch (err) {
        return "Live odds offline. Proceeding with historical logic.";
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message, image, modelType } = req.body;

    try {
        const liveData = await getLiveSportsData();
        
        const ELITE_PROMPT = `
            You are the "Smart Betting Elite Auditor."
            DATE: Sunday, 22 February 2026.
            
            LIVE FIXTURE DATA:
            ${liveData}
            
            STRICT RULES:
            1. DASHBOARD LAYOUT: Use "### [Home] vs [Away]" for match titles.
            2. MARKET BOX: Use "> **BEST MARKET:** [Your Pick]" for the suggested bet.
            3. SCENARIO: Explain why that market wins (Over/Under, BTTS, or 1X2).
            4. BMW CHECK: If a multi-bet potential is over R800k, remind them it pays for the BMW 3 Series.
            5. CAP WARNING: If potential win > R500k, mention the Easybet payout cap.
            
            Tone: Sharp, professional, South African slang (sho, bru, sharp).
        `;

        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

            const parts = [{ text: ELITE_PROMPT }];
            if (image) {
                const base = image.includes(",") ? image.split(",")[1] : image;
                parts.push({ inlineData: { data: base, mimeType: "image/jpeg" } });
            }
            parts.push({ text: message || "Analyze today's fixtures and find me value." });

            const result = await model.generateContent(parts);
            const text = result.response.text();
            return res.status(200).json({ choices: [{ message: { content: text } }] });

        } else {
            // Groq Route
            const content = [{ type: "text", text: ELITE_PROMPT }];
            if (image) {
                const base = image.includes(",") ? image.split(",")[1] : image;
                content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base}` } });
            }
            content.push({ type: "text", text: message || "Give me a winning multi for the BMW." });

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [{ role: "user", content: content }],
                    temperature: 0.4
                }),
            });
            const data = await response.json();
            return res.status(200).json(data);
        }

    } catch (error) {
        return res.status(500).json({ error: "ENGINE_FAULT", audit: error.message });
    }
}
