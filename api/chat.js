import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Safety Check: Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, image, modelType } = req.body;

    try {
        // --- ROUTE A: GEMINI / GEMMA 3 ---
        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

            const promptParts = [];
            if (image) {
                const base64Data = image.includes(",") ? image.split(",")[1] : image;
                promptParts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
            }
            // Use your "Elite Auditor" instructions
            promptParts.push({ text: message || "Audit this slip for the BMW dream." });

            const result = await model.generateContent(promptParts);
            const response = await result.response;
            const text = response.text();

            return res.status(200).json({ choices: [{ message: { content: text } }] });
        } 

        // --- ROUTE B: GROQ / LLAMA 3 ---
        else {
            const content = [];
            if (message) content.push({ type: "text", text: message });
            if (image) {
                const base64Image = image.includes(",") ? image.split(",")[1] : image;
                content.push({
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                });
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [
                        { role: "system", content: "You are the Smart Betting Elite Auditor. Use bold headers and SA slang. Focus on UCL Feb 2026 fixtures." },
                        { role: "user", content: content }
                    ],
                    temperature: 0.6
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error("BACKEND_ERROR:", error.message);
        return res.status(500).json({ 
            error: "CONNECTION_FAILED", 
            details: "Ensure both GEMINI_API_KEY and EASYBET_API_KEY are set in Vercel." 
        });
    }
}
