import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

    const { image, model } = req.body; // 'model' passed from your engine selector
    if (!image) return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.2-11b-vision-preview", // Note: Ensure you use a Vision-capable model
            messages: [
                {
                    role: "system",
                    content: `You are the Ultra-Level Neural Engine for DLSVALUE. Analyze the provided squad image with extreme precision.
                    
                    STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:
                    
                    ## 1. SQUAD COMPOSITION
                    List every player identified and their rating.
                    
                    ## 2. CURRENCY & ASSETS
                    - Total Coins: [Number]
                    - Total Diamonds: [Number]
                    
                    ## 3. VALUATION MATH
                    - **Performance Value**: (Average Squad Rating) x $1.00.
                    - **Asset Value**: (Coins / 1000) x $1.50.
                    
                    ## 4. FINAL BREAKDOWN
                    Provide a brief strategic summary of the team's strengths.
                    
                    ## 5. TOTAL VALUATION
                    ### Final Price Tag: **$[Insert Total Sum Here]**
                    
                    CRITICAL: The very last line must contain the total price inside double asterisks like this: **$67.99**.`
                },
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "Perform a deep-scan valuation of this DLS squad. Use the $1/rating-point and $1.50/1k-coins formulas." 
                        },
                        { 
                            type: "image_url", 
                            image_url: { url: `data:image/jpeg;base64,${image}` } 
                        }
                    ]
                }
            ],
            temperature: 0.1, // Low temperature for high math accuracy
            max_tokens: 1024
        });

        const report = response.choices[0]?.message?.content;
        res.status(200).json({ analysis: report, report: report });

    } catch (error) {
        console.error("GROQ_API_ERROR:", error.message);
        res.status(500).json({ 
            error: "ENGINE_FAULT", 
            message: error.message 
        });
    }
}
