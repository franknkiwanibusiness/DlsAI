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
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        // THE FIX: Added calculation logic and strict output formatting
        const prompt = `
            Quick Audit: Analyze this DLS squad image.
            1. Extract Average Rating and Total Coins.
            2. Calculate: (Avg Rating * $1) + (Coins/1000 * $1.50).
            
            CRITICAL: You must end the response with this exact line:
            ### Final Price Tag: **$[Total]**
        `;

        const base64Data = image.includes(",") ? image.split(",")[1] : image;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
            { text: prompt }, 
        ]);

        const response = await result.response;
        const text = response.text();

        // Sending both 'analysis' and 'report' ensures your frontend catches the data
        res.status(200).json({ analysis: text, report: text });

    } catch (error) {
        console.error("GEMMA_3_FAULT:", error.message);
        res.status(500).json({ 
            error: "ENGINE_FAULT", 
            details: error.message,
            engine: "Gemma 3 4B Speed" 
        });
    }
}
