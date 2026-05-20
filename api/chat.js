export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { system, messages } = req.body;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ reply: 'Sorry, I could not get a response right now.' });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'Sorry, no response.';
  res.json({ reply });
}