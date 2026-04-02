import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Initialize Groq with your Vercel Environment Variable
  const groq = new Groq({
    apiKey: process.env.EASYBET_API_KEY,
  });

  try {
    const { message } = req.body;

    // 3. Request completion from Groq (using Llama 3 for speed)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are FRESH-AI, a helpful betting and development assistant."
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama3-8b-8192", // Fast and efficient for chat
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    
    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error("Groq Error:", error);
    return res.status(500).json({ error: "Failed to fetch AI response" });
  }
}
