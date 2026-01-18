import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    // 1. Setup CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Handle Preflight Request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Ensure it's a POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { image } = req.body;
    
    if (!image) {
        return res.status(400).json({ error: "No image data provided" });
    }

    try {
        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "system",
                    content: `Professional DLS Valuator. Identify players/ratings/coins. 
                    Formula: (Avg Rating * $1) + (Coins/1000 * $1.5). 
                    The final line MUST be: ### Final Price Tag: **$[Total]**`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this DLS squad." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
                    ]
                }
            ],
            temperature: 0.1
        });
        const report = response.choices[0]?.message?.content;
        res.status(200).json({ analysis: report, report: report });
    } catch (error) {
        console.error("Groq Error:", error.message);
        res.status(500).json({ error: error.message });
    }
}
