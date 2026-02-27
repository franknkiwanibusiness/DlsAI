// api/gemma.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { home, away, league } = req.query;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Using 'gemma-2-9b-it' or 'gemini-1.5-flash' depending on your project settings
  const model = genAI.getGenerativeModel({ model: "gemma-2-9b-it" });

  const prompt = `Perform deep research on the football match: ${home} vs ${away} in ${league}.
    Analyze their recent attacking and defensive patterns. 
    Provide ONE best betting market outcome (e.g., Total Corners Over 8.5, Over 2.5 Goals, Under 2.5 Goals).
    Format the response as a short, punchy 1-sentence prediction. 
    Focus on WHY (e.g., 'Both teams score high but defend poorly, pick Over 2.5 goals').`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ insight: text });
  } catch (error) {
    res.status(500).json({ insight: "Gemma is currently over-capacity. Try again later." });
  }
}
