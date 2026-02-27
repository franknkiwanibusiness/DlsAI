import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home, away, league } = req.query;
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
    res.status(200).json({ insight: insight.replace(/[".]/g, "").trim() });
  } catch (error) {
    res.status(500).json({ insight: "RETRY" });
  }
}
