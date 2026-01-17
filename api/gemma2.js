import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // 1. Setup Headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Keeping your requested 12B model
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        // THE FORMAT FIX: Forces the AI to give the result your JS is looking for
        const prompt = `
            Analyze this DLS (Dream League Soccer) squad image with high precision.
            1. IDENTIFY: Player names and their 2-digit ratings (Starting 11 + Subs).
            2. EXTRACT: Total Coins from the top menu.
            3. MATH:
               - Performance Value = Average Rating * $1.00
               - Asset Value = (Coins / 1000) * $1.50
            
            CRITICAL OUTPUT REQUIREMENT:
            The very last line of your report must be:
            ### Final Price Tag: **$[Total]**
            (Example: **$45.50**)
        `;

        // THE IMAGE DATA FIX: Cleans the prefix so the model doesn't error out
        const base64Data = image.includes(",") ? image.split(",")[1] : image;

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

        // Returning both fields to ensure compatibility with your frontend fetch
        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("GEMMA_2_12B_ERROR:", error.message);
        res.status(500).json({ 
            error: "ENGINE_FAULT", 
            message: "12B Engine could not process image data.",
            details: error.message 
        });
    }
}
