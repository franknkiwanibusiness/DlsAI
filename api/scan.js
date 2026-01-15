import Groq from "groq-sdk";

// Initialize Groq with your Vercel Environment Variable
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
    // 1. Security & Method Check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    const { image, uid } = req.body;

    // 2. Data Validation
    if (!image) {
        return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });
    }

    try {
        // 3. AI Vision Analysis Request
        const response = await groq.chat.completions.create({
            // Using the specialized 2026 Vision model for high-accuracy OCR
            model: "llama-3.2-11b-vision-preview", 
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: `Act as a professional DLS (Dream League Soccer) Scout. 
                                   Scan this screenshot carefully.
                                   1. Identify the Team Formation.
                                   2. List every Player Name, Rating, and Position.
                                   3. Extract current Coin and Gem totals.
                                   4. Provide a 'Scout's Advice' for team improvement.
                                   Format the response as a clean, aggressive neural report using bullet points and headers.` 
                        },
                        { 
                            type: "image_url", 
                            image_url: { 
                                // We use the full base64 string provided by the reader.result
                                url: image 
                            } 
                        }
                    ]
                }
            ],
            temperature: 0.1, // Set low for data extraction accuracy
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        // 4. Extract content and check for validity
        const report = response.choices[0]?.message?.content;

        if (!report) {
            throw new Error("AI_RETURNED_EMPTY_RESPONSE");
        }

        // 5. Successful Response 
        // We provide both keys to ensure the frontend .analysis or .report both work
        res.status(200).json({ 
            analysis: report, 
            report: report,
            status: "SUCCESS"
        });

    } catch (error) {
        // 6. Detailed Error Logging for Vercel Dashboard
        console.error("GROQ_API_CRITICAL_FAILURE:", error.message);

        res.status(500).json({ 
            error: "NEURAL_LINK_FAILED", 
            details: error.message,
            tip: "Check if GROQ_API_KEY is active in Vercel settings."
        });
    }
}
