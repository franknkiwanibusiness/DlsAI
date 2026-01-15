import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with your Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Use Gemini 1.5 Flash - It's the best for speed and OCR math
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // System instructions passed as a clear prompt
        const prompt = `
            You are a professional DLS Squad Valuator. Analyze the provided image and perform precise math:
            
            1. IDENTIFY: List Starting 11 and Subs with their 2-digit ratings.
            2. CURRENCY: Extract Coin and Diamond totals shown in the top bar.
            3. MATH - PERFORMANCE VALUE: Calculate the average rating of the entire squad. The "Performance Value" is exactly equal to the average rating in USD (e.g., 86.1 average = $86.10).
            4. MATH - ASSET VALUE: Calculate Coin Value ($1.50 per 1,000 coins). Formula: (Coins / 1000) * 1.5.
            5. TOTAL NETWORTH: Sum of Performance Value + Asset Value.
            6. REPORT: Provide a professional breakdown including Average Rating, Coin Value, and the final 'Price Tag' for the account.
            
            Keep the tone professional and the math accurate.
        `;

        // Clean the base64 string (remove the "data:image/png;base64," prefix)
        const base64Data = image.split(",")[1];

        // Gemini's specific image+text format
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg", // or "image/png"
                },
            },
        ]);

        const response = await result.response;
        const report = response.text();

        // Return consistent keys so your frontend doesn't break
        res.status(200).json({ 
            analysis: report, 
            report: report 
        });

    } catch (error) {
        console.error("GEMINI_ENGINE_ERROR:", error.message);
        res.status(500).json({ 
            error: "ENGINE_FAULT", 
            details: "Gemini failed to process image or math." 
        });
    }
}
