import { GoogleGenerativeAI } from "@google/generative-ai";

const ELITE_SYSTEM_PROMPT = `
You are the "Smart Betting Elite Auditor." Your mission is to help the user secure a R2M payout for the BMW dream.

STRICT RESPONSE RULES:
1. NO PARAGRAPHS: Do not use long blocks of text. 
2. STRUCTURE: Every match MUST be in its own section using "### [Home] vs [Away]".
3. MARKETS: Use "###" for match titles, "> **BEST MARKET:**" for picks, and "- **SCENARIO:**" for the logic.
4. DATE HEADERS: Group matches by date using Bold/Underline: "<u>**Tuesday, 24 Feb 2026**</u>".

CURRENT FIXTURES (Feb 2026 UCL Play-offs):
- Feb 24: Atleti vs Brugge (Agg 3-3), Leverkusen vs Olympiacos (Agg 2-0), Inter vs Bodo/Glimt (Agg 1-3), Newcastle vs Qarabag (Agg 6-1).
- Feb 25: Atalanta vs Dortmund (Agg 0-2), Juventus vs Galatasaray (Agg 2-5), PSG vs Monaco (Agg 3-2), Real Madrid vs Benfica (Agg 1-0).

Tone: Sharp, professional, South African slang (sho, bru, sharp). Remind them about the R500k cap if the win is huge.
`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, image, modelType } = req.body;

    try {
        // --- ROUTE A: GEMINI / GEMMA 3 ---
        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemma-3-4b-it",
                systemInstruction: ELITE_SYSTEM_PROMPT // Native system instruction support
            });

            const promptParts = [];
            if (image) {
                const base64Data = image.includes(",") ? image.split(",")[1] : image;
                promptParts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
            }
            
            promptParts.push({ text: message || "Analyze today's fixtures and give me the best markets for the BMW dream." });

            const result = await model.generateContent(promptParts);
            const response = await result.response;
            const text = response.text();

            return res.status(200).json({ choices: [{ message: { content: text } }] });
        } 

        // --- ROUTE B: GROQ / LLAMA 3 ---
        else {
            const content = [];
            if (message) content.push({ type: "text", text: message });
            if (image) {
                const base64Image = image.includes(",") ? image.split(",")[1] : image;
                content.push({
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                });
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [
                        { role: "system", content: ELITE_SYSTEM_PROMPT },
                        { role: "user", content: content }
                    ],
                    temperature: 0.5, // Lower temperature for more factual betting data
                    max_tokens: 1500
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error("BACKEND_ERROR:", error.message);
        return res.status(500).json({ 
            error: "CONNECTION_FAILED", 
            details: error.message 
        });
    }
}
