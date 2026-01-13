import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64 } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // DIFFERENT MODEL: Gemma-3 is lightweight and portable
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        const prompt = "DLS Analysis: Return ONLY JSON format. Count Legendary and Rare cards. Format: {\"value\": number, \"legendary\": number, \"rare\": number}";

        const result = await model.generateContent([
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            prompt
        ]);

        const text = result.response.text().replace(/```json|```/g, "").trim();
        return res.status(200).json(JSON.parse(text));
    } catch (err) {
        return res.status(500).json({ message: "V2 Engine (Gemma) Busy" });
    }
}
