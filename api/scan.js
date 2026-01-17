import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { image } = req.body;
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
        res.status(500).json({ error: error.message });
    }
}
