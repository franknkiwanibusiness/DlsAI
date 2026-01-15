import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure your GEMINI_API_KEY is set in Vercel Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Calling the flagship 27B model for maximum accuracy
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        const prompt = `
            Analyze this DLS (Dream League Soccer) squad screenshot with high precision:
            1. LIST: All players and their 2-digit ratings.
            2. EXTRACT: Total Coins and Diamonds from the top UI bar.
            3. CALCULATE: 
               - Avg Rating = (Sum of ratings / Total players)
               - Net Worth = (Avg Rating * $1) + (Coins / 1000 * $1.50).
            4. REPORT: Return a detailed 'Neural Audit' with the final Price Tag.
        `;

        // Clean base64 data
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
        const report = response.text();

        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("GEMMA_1_CRITICAL_ERROR:", error.message);
        res.status(500).json({ error: "ENGINE_FAULT", details: error.message });
    }
}
