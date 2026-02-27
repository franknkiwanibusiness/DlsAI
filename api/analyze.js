export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { home, away, league } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a betting expert. Return ONLY JSON with 'market' and 'reason' (max 12 words). Market should be 'Home Win', 'Away Win', 'Draw', 'Over 2.5', or 'BTTS'."
          },
          {
            role: "user",
            content: `Analyze ${home} vs ${away} (${league})`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const aiResponse = JSON.parse(data.choices[0].message.content);
      res.status(200).json(aiResponse);
    } else {
      throw new Error("Invalid Groq Response");
    }

  } catch (error) {
    console.error("Bridge Error:", error);
    res.status(200).json({ 
      market: "Check Odds", 
      reason: "AI limit reached or Key missing. Check Vercel Logs." 
    });
  }
}
