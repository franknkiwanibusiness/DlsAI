export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { messages } = req.body; // Expecting an array of messages for memory

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Powerful & fast GROQ model
                messages: [
                    { 
                        role: "system", 
                        content: "You are DLSVALUE AI, a professional Dream League Soccer coach. You provide tactical advice, player upgrade tips, and market value insights. Keep responses concise and use football terminology." 
                    },
                    ...messages
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "GROQ Engine Error" });
    }
}
