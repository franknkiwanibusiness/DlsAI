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
          content: "You are a football tactical analyst. Ignore betting odds. Research the playing styles and recent form of the two teams. Provide a 1-sentence tactical prediction and a suggested outcome in uppercase. Return ONLY JSON: { 'insight': 'TEAM ANALYSIS HERE', 'pick': 'PICK HERE' }"
        },
        {
          role: "user",
          content: `Research match: ${home} vs ${away} in ${league}.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const data = JSON.parse(chatCompletion.choices[0]?.message?.content);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ insight: "Tactical data unavailable.", pick: "RETRY" });
  }
}
