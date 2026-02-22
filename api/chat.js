export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { message } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using a top-tier Groq model
        messages: [
          { 
            role: "system", 
            content: "You are Smart Betting AI. Your tone is witty, expert, and highly supportive. You help users analyze high-odds sports bets (accumulators). You call them 'champ' or 'legend' and always keep the 'BMW dream' alive while giving honest risk assessments." 
          },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from GROQ" });
  }
}
