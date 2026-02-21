// /api/predict.js
import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  const { home, away, odds } = req.body;
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a professional football analyst. Compare the two teams, look at their quality, and the current odds. Provide the single most likely market to bet on (e.g., 'Real Madrid Win' or 'Under 2.5 Goals') and a 1-sentence reason why." },
      { role: "user", content: `Match: ${home} vs ${away}. Market Odds: ${odds}.` }
    ],
    model: "llama3-8b-8192",
  });
  res.status(200).json({ prediction: completion.choices[0].message.content });
}
