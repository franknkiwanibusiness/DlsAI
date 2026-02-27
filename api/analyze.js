import Groq from "groq-sdk";

export default async function handler(req, res) {
  // Setup Headers for CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { home, away, league } = req.query;
  
  // Verify API Key
  if (!process.env.EASYBET_API_KEY) {
      return res.status(500).json({ insight: "KEY MISSING" });
  }

  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a betting bot. Respond ONLY with the market name in uppercase. No explanation. No extra words. Example: OVER 2.5 GOALS"
        },
        {
          role: "user",
          content: `${home} vs ${away} (${league})`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 10,
    });

    const insight = chatCompletion.choices[0]?.message?.content || "";
    // Clean and return the prediction
    res.status(200).json({ insight: insight.replace(/[".]/g, "").trim() });
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ insight: "RETRY" });
  }
}
