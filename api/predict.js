// /api/predict.js
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const { home, away, odds } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a pro sports analyst. Provide a 1-sentence prediction and a 'confidence score' (1-10) for the match provided. Be direct."
        },
        {
          role: "user",
          content: `Match: ${home} vs ${away}. Odds: ${odds}. What is the most realistic outcome?`
        }
      ],
      model: "llama3-8b-8192", // Fast and efficient for this task
    });

    res.status(200).json({ prediction: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "AI logic failed" });
  }
}
