// /api/chat.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "You are the M-Performance AI. Your goal is to help the user win R1 million for a BMW 3 Series and a house. You focus on sports betting strategy, top 5 league odds, and financial discipline. Be sharp, witty, and high-energy." 
                    },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || "Groq API Error");
        }

        // Send the AI response back to your frontend
        res.status(200).json(data.choices[0].message);

    } catch (error) {
        console.error("Vercel Function Error:", error);
        res.status(500).json({ error: "Turbo Lag: Connection to Groq failed." });
    }
}
