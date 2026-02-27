import Groq from "groq-sdk";
const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home, away, league } = req.query;

  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const prompt = `Perform DEEP RESEARCH on ${home} vs ${away} (${league}) for today Feb 27, 2026.
    1. Check last 30 days form only.
    2. Check confirmed injuries/lineups.
    3. Evaluate ALL markets: H2H, Over/Under, BTTS, Double Chance.
    4. Provide 1 tactical insight and 1 high-probability PICK.
    Return ONLY JSON: {"insight": "...", "pick": "..."}`;

    // Run both AI brains in parallel for maximum speed
    const [groqRes, geminiRes] = await Promise.all([
      groq.chat.completions.create({
        messages: [{ role: "system", content: "You are a pro scout." }, { role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      }),
      genAI.getGenerativeModel({ model: "gemini-1.5-pro" }).generateContent(prompt)
    ]);

    const dataGroq = JSON.parse(groqRes.choices[0].message.content);
    const dataGemini = JSON.parse(geminiRes.response.text());

    // Compare Brains: If they agree on the pick, label it HIGH CONFIDENCE
    const agreement = dataGroq.pick.toLowerCase() === dataGemini.pick.toLowerCase();
    
    res.status(200).json({
      insight: agreement ? `[DUAL-BRAIN AGREEMENT]: ${dataGroq.insight}` : `[GROQ]: ${dataGroq.insight} | [GEMINI]: ${dataGemini.insight}`,
      pick: agreement ? `🔥 ${dataGroq.pick}` : `⚖️ ${dataGroq.pick} (Low Consensus)`,
      confidence: agreement ? "HIGH" : "MEDIUM"
    });

  } catch (error) {
    res.status(500).json({ insight: "Error in Dual-Brain sync.", pick: "RETRY" });
  }
}
