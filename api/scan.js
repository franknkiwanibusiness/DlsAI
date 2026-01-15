import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    try {
        // Using the 2026 Flagship Model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-pro-preview",
            // Enables the 'Deep Think' mode for maximum math accuracy
            thinkingConfig: { thinkingBudget: 2048 } 
        });

        const prompt = `
            Perform a Deep Scan of this DLS Squad. 
            1. Extract all player ratings. 
            2. Identify total Coins and Diamonds precisely.
            3. Apply the valuation formula: ($1.50 per 1k coins) + ($1 per squad average point).
            4. Output a professional 'Neural Scout Report' with a clear final Price Tag.
        `;

        const base64Data = image.split(",")[1];
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        res.status(200).json({ analysis: response.text() });

    } catch (error) {
        console.error("GEMINI_3_ERROR:", error);
        res.status(500).json({ error: "ENGINE_FAULT", details: error.message });
    }
}
