// api/research.js
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
  const { home, away } = req.body;

  const prompt = `Analyze the football match: ${home} vs ${away}. 
  Based on recent form, return a JSON object with:
  1. "market": Choose ONLY from ['h2h', 'btts', 'totals']
  2. "reason": A 10-word witty explanation.
  3. "pick": The specific side (e.g., "Yes", "Away", or "Over")`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(chatCompletion.choices[0].message.content);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ market: "h2h", reason: "AI is sleeping, use standard odds.", pick: "Home" });
  }
}
