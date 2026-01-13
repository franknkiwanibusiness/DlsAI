import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { imageBase64 } = req.body;

    try {
        // Switching back to 12b for the "Smart" OCR
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: "ACT AS OCR: Find every football player card in this DLS screenshot. For each card, extract the NAME and the main OVERALL RATING number. Output ONLY a valid JSON array: [{\"n\":\"Name\",\"r\":88}]. Ensure names are spelled exactly as shown." },
                    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
                ]
            }],
            generationConfig: {
                temperature: 0.1, // Low temp keeps it focused
                topP: 0.1,
                maxOutputTokens: 800,
            }
        });

        const text = result.response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        
        if (!jsonMatch) throw new Error("Could not find player data");
        
        const players = JSON.parse(jsonMatch[0]);

        res.status(200).json({ success: true, players, playersFound: players.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "AI failed to read image" });
    }
}
