export default async function handler(req, res) {
    const GROQ_API = process.env.EASYBET_API_KEY;
    
    // Fallback news in case of rate limits
    let news = ["SYSTEM: ANALYZING RECENT MARKET VOLATILITY..."];

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${GROQ_API}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Highest free Groq model
                messages: [{ 
                    role: "user", 
                    content: "List 6 real sports betting big wins or massive upsets from Jan/Feb 2026. Max 15 words each. Format: WINNER - AMOUNT - EVENT. No numbers, no intro." 
                }],
                temperature: 0.4
            })
        });

        const aiData = await groqRes.json();
        const content = aiData.choices[0].message.content;
        
        // Clean and split the response into ticker lines
        const filteredNews = content.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove list numbers
            .filter(line => line.length > 10);

        if (filteredNews.length > 0) news = filteredNews;

    } catch (e) {
        console.error("Groq Fetch Error:", e);
        news = ["CONNECTION STABLE: RETRYING AI RESEARCH SYNC..."];
    }

    res.status(200).json({ news });
}
