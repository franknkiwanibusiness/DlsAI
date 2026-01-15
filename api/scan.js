import Groq from "groq-sdk";

// Ensure GROQ_API_KEY is set in Vercel Environment Variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, uid } = req.body;

    try {
        const response = await groq.chat.completions.create({
            // THE STABLE 2026 MODEL
            model: "meta-llama/llama-4-scout-17b-16e-instruct", 
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "Act as a professional DLS Scout. Scan this screenshot. List all player names, their ratings, and positions. If visible, also list total coins and gems. Format as a clean, aggressive neural report for a gamer." 
                        },
                        { 
                            type: "image_url", 
                            image_url: { url: `data:image/jpeg;base64,${image}` } 
                        }
                    ]
                }
            ],
            temperature: 0.2, // Low temperature for higher accuracy in ratings
            max_tokens: 1000
        });

        const report = response.choices[0].message.content;
        res.status(200).json({ report });

    } catch (error) {
        console.error("Groq Production Error:", error);
        res.status(500).json({ error: "NEURAL_LINK_FAILED", details: error.message });
    }
}
