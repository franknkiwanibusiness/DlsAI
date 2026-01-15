// api/scan.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { image, uid } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const prompt = `
            Analyze this DLS (Dream League Soccer) squad screenshot.
            1. Identify all player ratings (the 2-digit numbers).
            2. List them as "Position: Rating" (e.g., GK: 84, CB: 89).
            3. Provide a 'Neural Squad Valuation' based on these ratings.
            Return the report in a professional AI scout tone.
        `;

        // Gemini expects the base64 data without the "data:image/png;base64," prefix
        const base64Data = image.split(",")[1];

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg", 
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Send the report back to your frontend
        res.status(200).json({ analysis: text });

    } catch (error) {
        console.error("Gemini Engine Error:", error);
        res.status(500).json({ details: "Engine Failure" });
    }
}
