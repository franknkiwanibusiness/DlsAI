import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, uid } = req.body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "system",
                    content: `You are a professional DLS Squad Valuator. Your task is to extract data and perform precise math:
                    1. IDENTIFY: List Starting 11 and Subs with ratings.
                    2. CURRENCY: Extract Coin and Diamond totals.
                    3. MATH - PERFORMANCE VALUE: Calculate the average rating of the entire squad (Starting 11 + Subs). The "Performance Value" is exactly equal to the average rating in USD (e.g., 86.1 average = $86.10).
                    4. MATH - ASSET VALUE: Calculate Coin Value ($1.50 per 1,000 coins). Formula: (Coins / 1000) * 1.5.
                    5. TOTAL NETWORTH: Sum of Performance Value + Asset Value.
                    6. REPORT: Provide a breakdown and a final 'Price Tag' for the account.`
                },
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "Analyze this DLS squad. Calculate the average rating and the total net worth based on the $1.50/1k coins and $1/average-point rules." 
                        },
                        { 
                            type: "image_url", 
                            image_url: { url: image } 
                        }
                    ]
                }
            ],
            temperature: 0.1, // Lower temperature for more accurate math
            max_tokens: 1024
        });

        const report = response.choices[0]?.message?.content;
        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("STABLE_LINK_ERROR:", error.message);
        res.status(500).json({ error: "ENGINE_FAULT", details: error.message });
    }
}
