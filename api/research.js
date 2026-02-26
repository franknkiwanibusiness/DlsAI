import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { home, away, league } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // SWITCHED TO GEMMA 3 4B 
    // Optimized for speed and high-volume requests
    const model = genAI.getGenerativeModel({ model: "gemma-3-4b" });

    const prompt = `
      Match Analysis: ${home} vs ${away} (${league}).
      Role: Shonen Battle Strategist.
      Task: 
      1. Predict the most likely outcome (e.g., Over 1.5, Away Win).
      2. 1-sentence tactical reasoning.
      3. Confidence Score: %
      
      Constraint: Keep it sharp, bold, and under 20 words. No fluff.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ 
        prediction: text.trim() || "Strategy gathering..." 
    });

  } catch (error) {
    console.error("Gemma Error:", error);
    res.status(200).json({ 
        prediction: "Tactical Pause... (API Limit). Try again in 30s." 
    });
  }
}
