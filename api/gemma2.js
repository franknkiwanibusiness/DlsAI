import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Calling the 12B Pro model - Balanced and Reliable
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        const prompt = `
            Analyze this DLS squad image. 
            Extract player names, ratings, and coin totals. 
            Provide a performance breakdown and a final account valuation. 
            Focus on accuracy for both the Starting 11 and Subs.
        `;

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
        res.status(200).json({ analysis: response.text() });

    } catch (error) {
        console.error("GEMMA_2_ERROR:", error.message);
        res.status(500).json({ error: "ENGINE_FAULT", details: "12B Engine Busy or Timeout" });
    }
}
