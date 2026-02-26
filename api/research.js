import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  try {
    const { home, away, league } = JSON.parse(req.body);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Upgraded to Gemini 3 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const prompt = `
      Expert Football Analysis: ${home} vs ${away} (${league}).
      Provide:
      - Recommended Market (e.g., BTTS, Over 2.5, Home Win)
      - 1-sentence tactical reason
      - Confidence: XX%
      Keep it neat, professional, and under 20 words.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ prediction: text.trim() });
  } catch (error) {
    // If it fails, we send a 429 so the frontend knows to retry
    res.status(429).json({ error: "Rate limit hit" });
  }
}
