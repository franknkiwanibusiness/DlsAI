import Groq from "groq-sdk";

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { home, away, league } = req.query;

  // Initialize Groq with your specific Key Name
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional football analyst. Provide deep research based on recent team form, injuries, and tactical matchups."
        },
        {
          role: "user",
          content: `Analyze: ${home} vs ${away} in ${league}. 
          Give ONE high-confidence betting market and a 1-sentence reason why. 
          Format: [Market Name] - [Short Logic]`
        }
      ],
      model: "llama-3.3-70b-versatile", // Best model for deep research
      temperature: 0.5,
      max_tokens: 100,
    });

    const insight = chatCompletion.choices[0]?.message?.content || "";
    res.status(200).json({ insight: insight.trim() });
    
  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ insight: "Groq is processing other bets. Try in 5s." });
  }
}
