// /api/predict.js
export default async function handler(req, res) {
  // 1. Handle CORS (Allow your website to talk to this API)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { home_team, away_team, sport_title } = req.body;

  try {
    // 2. Call Groq AI
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional football analyst. Give a one-sentence, high-probability prediction for the match provided. Be concise and bold."
          },
          {
            role: "user",
            content: `Predict the outcome for ${home_team} vs ${away_team} in the ${sport_title}.`
          }
        ],
        max_tokens: 50
      })
    });

    const data = await response.json();
    const prediction = data.choices[0].message.content;

    return res.status(200).json({ prediction });
  } catch (error) {
    return res.status(500).json({ error: "AI Analysis failed" });
  }
}
