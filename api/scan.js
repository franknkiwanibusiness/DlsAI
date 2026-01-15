import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        const response = await groq.chat.completions.create({
            // UPDATED TO 2026 STABLE VISION MODEL
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "Analyze this DLS squad. Identify the formation, list every player with their rating, and provide a strategic scout report." 
                        },
                        { 
                            type: "image_url", 
                            image_url: { url: image } // Accepts the full Data URL
                        }
                    ]
                }
            ],
            temperature: 0.2,
            max_tokens: 1024
        });

        const report = response.choices[0]?.message?.content;
        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("STABLE_LINK_ERROR:", error.message);
        res.status(500).json({ error: "ENGINE_FAULT", details: error.message });
    }
}
