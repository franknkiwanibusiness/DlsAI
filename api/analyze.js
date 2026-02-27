// /api/analyze.js
import { Groq } from "groq-sdk";

// Initialize Groq with your Secret Key from Vercel Environment Variables
const groq = new Groq({
  apiKey: process.env.EASYBET_API_KEY, 
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { home, away, league } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite sports betting analyst. 
          Analyze the match based on current form and league standings. 
          Identify the highest probability market (e.g., 'Home Win', 'Over 2.5 Goals', 'BTTS - Yes'). 
          Return ONLY a JSON object with two fields: 'market' and 'reason'.
          Keep the 'reason' under 15 words.`
        },
        {
          role: "user",
          content: `Analyze: ${home} vs ${away} in ${league}.`
        }
      ],
      model: "mixtral-8x7b-32768",
      response_format: { type: "json_object" },
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    // Send back to your HTML frontend
    res.status(200).json(aiResponse);

  } catch (error) {
    console.error("Groq Bridge Error:", error);
    res.status(500).json({ 
      market: "Market Analysis Offline", 
      reason: "AI connection currently resetting." 
    });
  }
}
