import { GoogleGenerativeAI } from "@google/generative-ai";

const ELITE_SYSTEM_PROMPT = `
You are the "Smart Betting Elite Auditor." mission: R2M BMW dream.
FORMAT: 
- Use "### [Match]" for headers.
- Use "> **MARKET:**" for picks.
- Use "<u>**[Date]**</u>" for dates.
Tone: Sharp, SA slang (sho, bru).
`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message, image, modelType } = req.body;

    try {
        // --- ROUTE A: GEMINI ---
        if (modelType === 'gemini') {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("Missing GEMINI_API_KEY in Vercel settings.");
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

            const promptParts = [{ text: ELITE_SYSTEM_PROMPT }];
            
            if (image) {
                const base64Data = image.includes(",") ? image.split(",")[1] : image;
                promptParts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
            }
            
            promptParts.push({ text: message || "Analyze today's fixtures." });

            const result = await model.generateContent(promptParts);
            const response = await result.response;
            const text = response.text();

            return res.status(200).json({ choices: [{ message: { content: text } }] });
        } 

        // --- ROUTE B: GROQ ---
        else {
            if (!process.env.EASYBET_API_KEY) {
                throw new Error("Missing EASYBET_API_KEY in Vercel settings.");
            }

            const content = [{ type: "text", text: ELITE_SYSTEM_PROMPT }];
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
                    messages: [{ role: "user", content: content }],
                    temperature: 0.5
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error("DEBUG_LOG:", error.message);
        // This sends the SPECIFIC error back to your frontend
        return res.status(500).json({ error: "ENGINE_FAULT", audit: `Error: ${error.message}` });
    }
}
