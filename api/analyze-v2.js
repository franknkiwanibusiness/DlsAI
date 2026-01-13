import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64 } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Using the powerful Gemma-3-27b-it
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        const prompt = `Analyze this DLS (Dream League Soccer) screenshot. 
        1. Identify if this is a squad/team management screen.
        2. Count the number of Gold (Legendary) cards and Blue (Rare) cards.
        3. Assign a market value: $15 per Legendary, $5 per Rare.
        4. Return ONLY JSON: {"value": number, "legendary": number, "rare": number, "valid": boolean}`;

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        
        // Find JSON block in case AI talks too much
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch[0]);

        if (data.valid === false) {
            return res.status(400).json({ message: "Invalid DLS Screenshot detected." });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("AI Error:", error.message);
        // If Gemma-3 is busy, fallback message
        return res.status(500).json({ message: "Gemma-3 Engine is calibrating. Please retry in 5 seconds." });
    }
}
