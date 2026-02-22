export default async function handler(req, res) {
  // 1. Only allow POST requests from your frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  try {
    // 2. Fetch from GROQ using your custom variable name
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are 'Smart Betting AI', the ultimate sports betting consultant. 
            Your goal: Help the user win R2 Million to buy their dream BMW. 
            Your Personality: Sharp, witty, encouraging, and highly analytical. 
            Context: It is February 2026. The Champions League KO play-offs (2nd leg) are happening. 
            Key Fixtures: 
            - Feb 24: Inter vs Bodø/Glimt, Newcastle vs Qarabag, Atleti vs Brugge, Leverkusen vs Olympiacos.
            - Feb 25: Juve vs Galatasaray, Real Madrid vs Benfica, PSG vs Monaco, Atalanta vs Dortmund.
            Advice Style: Be honest about the 'long shot' nature of away-goal bets but keep the 'BMW dream' alive. 
            Use South African slang like 'bru', 'sharp', or 'sho' to keep it local.` 
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    // 3. Error handling for the GROQ response
    if (data.error) {
      console.error("GROQ API Error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Failed to connect to Smart Betting AI." });
  }
}
