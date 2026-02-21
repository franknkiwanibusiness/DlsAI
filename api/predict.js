// api/predict.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { home, away, odds } = req.body;

  try {
    // Using gemma-2-9b via the Google API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const prompt = `You are a professional football analyst. 
    Analyze this match: ${home} vs ${away}. 
    Current Odds: ${odds}. 
    Provide the single best market bet and a 1-sentence reason. 
    Format: [Pick] | [Reason]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ prediction: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ prediction: "Gemma engine offline. Check API key." });
  }
}
