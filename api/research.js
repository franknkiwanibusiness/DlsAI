import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { home, away, league } = JSON.parse(req.body);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Using Flash-Lite for maximum free credits
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Act as a professional football data analyst. 
    Match: ${home} vs ${away} in ${league}.
    Date: Feb 2026.
    
    Provide a deep research prediction including:
    1. A specific market recommendation (e.g., BTTS, Over/Under 2.5, Asian Handicap).
    2. A 1-sentence tactical reason why.
    3. A confidence percentage (e.g., 75%).
    
    Format: [Market] | [Reason] | [Confidence %]
    Keep it under 25 words.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.status(200).json({ prediction: response.text() });
  } catch (e) {
    res.status(500).json({ prediction: "AI scout is busy. Try again." });
  }
}
