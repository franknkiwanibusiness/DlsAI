import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // 1. ADD CORS HEADERS (Required for Vercel to respond to your frontend)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // 2. USE CORRECT GEMMA 3 MODEL ID
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const prompt = `Quick Scan: Extract the average squad rating and total coins from this DLS screenshot. 
        Provide a 1-sentence summary of the squad value.`;

        // 3. CLEAN BASE64 DATA
        // If the frontend sends the data URI (data:image/jpeg;base64,...), this strips it
        const base64Data = image.includes(",") ? image.split(",")[1] : image;

        // 4. GENERATE MULTIMODAL CONTENT
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
            { text: prompt }, // Placing text after image often improves vision accuracy
        ]);

        const response = await result.response;
        const text = response.text();

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
