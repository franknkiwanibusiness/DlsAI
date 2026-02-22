export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const { home, away } = req.body;
  // Vercel automatically injects this from your Environment Variables
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Search live Feb 2026 news for ${home} vs ${away}. List injuries and provide a 1-sentence betting verdict.` }] 
        }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    const aiReport = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ report: aiReport });
  } catch (error) {
    res.status(500).json({ report: "Scout temporarily offline. Match data is standard." });
  }
}
