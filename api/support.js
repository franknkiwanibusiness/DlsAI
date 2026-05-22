// api/support.js — Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, context } = req.body;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `You are a friendly, concise support assistant for MINIMISTY.store, a premium cooling fan product store. 
You help with: order tracking, shipping times (Standard 8-16 days, Prime Express 5-12 days), returns (30-day policy), 
product info (FrostBlade Pro fan), and general checkout help. Keep replies under 3 sentences. Be warm and use 1 emoji max.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    return res.status(500).json({ reply: "I'm having trouble right now. Email support@minimisty.store for help!" });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Let me connect you with our team!";
  return res.status(200).json({ reply });
}