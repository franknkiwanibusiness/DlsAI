import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { matches } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemma-3-4b" });

    const matchList = matches.map((m, i) => `${i+1}. ${m.home} vs ${m.away} (${m.league})`).join('\n');

    const prompt = `
      You are a Shonen Battle Strategist. Analyze these matches:
      ${matchList}

      For EACH match, provide a JSON object: 
      {"text": "1-sentence prediction with tactical reason", "conf": "number between 1 and 100"}
      
      Return a JSON array of these objects. Keep text under 20 words.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();

    res.status(200).json({ predictions: JSON.parse(text) });

  } catch (error) {
    res.status(500).json({ error: "Tactical Overload" });
  }
}
