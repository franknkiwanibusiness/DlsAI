import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        // Calling the 4B Speed model - Optimized for Latency
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const prompt = `
            Quick Scan: Extract the average squad rating and total coins from this DLS screenshot. 
            Provide a 1-sentence summary of the squad value.
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
        console.error("GEMMA_3_ERROR:", error.message);
        res.status(500).json({ error: "ENGINE_FAULT", details: "4B Speed Engine Error" });
    }
}
