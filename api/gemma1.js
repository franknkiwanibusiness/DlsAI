import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Keeping your requested model
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        const prompt = `
            Perform a high-precision Neural Audit of this DLS squad.
            1. LIST players and 2-digit ratings.
            2. EXTRACT Coins and Diamonds.
            3. CALCULATE:
               - Performance Value = Average Rating * $1.00
               - Asset Value = (Coins / 1000) * $1.50
            
            OUTPUT REQUIREMENT:
            The very last line must display the total as:
            ### Final Price Tag: **$[Total]**
            (Example: **$67.99**)
        `;

        // THE BASE CODE FIX: Ensure the base64 is clean and passed as an object
        const base64Data = image.includes(",") ? image.split(",")[1] : image;

        // Correct order: [Prompt String, Image Data Object]
        const result = await model.generateContent([
            prompt, 
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            }
        ]);

        const response = await result.response;
        const report = response.text();

        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("GEMMA_1_IMAGE_READ_ERROR:", error.message);
        res.status(500).json({ 
            error: "ENGINE_FAULT", 
            message: "Gemma-3 could not process the image stream. Ensure image is valid base64." 
        });
    }
}
