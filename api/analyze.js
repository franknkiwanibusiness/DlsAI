import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { imageBase64 } = req.body;

    try {
        // Gemma 3 1b/4b class - Optimized for speed
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });
        
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: "List players and ratings. JSON ONLY: [{\"n\":\"Name\",\"r\":88}]" },
                    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
                ]
            }],
            generationConfig: {
                temperature: 0.0, // Absolute zero for maximum speed and accuracy
                maxOutputTokens: 300,
            }
        });

        const text = result.response.text();
        const players = JSON.parse(text.match(/\[.*\]/s)[0]);

        res.status(200).json({ success: true, players, playersFound: players.length });
    } catch (error) {
        res.status(500).json({ success: false, error: "AI Busy. Try again." });
    }
}
