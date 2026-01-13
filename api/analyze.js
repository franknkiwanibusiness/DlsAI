import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64 } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemma-3-12b-it as requested
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        const prompt = `Return ONLY JSON. Is this a Dream League Soccer squad? 
        If NO: {"error": "INVALID"}. 
        If YES: {"value": 50, "legendary": 5, "rare": 3}`; // Example logic

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const responseText = result.response.text().replace(/```json|```/g, "").trim();
        return res.status(200).json(JSON.parse(responseText));

    } catch (error) {
        return res.status(500).json({ message: "AI Scan failed: " + error.message });
    }
}
