import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. Set CORS Headers (Crucial for the "Dead Bridge")
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { home, away, league } = req.query;
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    const prompt = `Match: ${home} vs ${away} (${league}). Date: Feb 27, 2026.
    Requirement: 30-day form, injury check, tactical pick.
    Return JSON ONLY: {"insight": "...", "pick": "..."}`;

    // BRAIN 1: Groq (Llama 3.3)
    const groqTask = groq.chat.completions.create({
      messages: [{ role: "system", content: "You are a pro scout." }, { role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    // BRAIN 2: Gemini (Standard Fetch - Bypass SDK issues)
    const geminiTask = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt + " Output JSON format." }] }] })
    }).then(r => r.json());

    const [groqRes, geminiRes] = await Promise.all([groqTask, geminiTask]);

    // Parse Brain 1
    const dataGroq = JSON.parse(groqRes.choices[0].message.content);
    
    // Parse Brain 2 (Gemini structure is different in raw fetch)
    let dataGemini = { pick: "" };
    try {
      const rawText = geminiRes.candidates[0].content.parts[0].text;
      dataGemini = JSON.parse(rawText.replace(/```json|```/g, ""));
    } catch (e) { console.log("Gemini parse failed"); }

    const agreement = dataGroq.pick.toLowerCase().includes(dataGemini.pick.toLowerCase());

    res.status(200).json({
      insight: agreement ? `[CONSENSUS]: ${dataGroq.insight}` : `[TACTICAL]: ${dataGroq.insight}`,
      pick: agreement ? `🔥 ${dataGroq.pick}` : `⚖️ ${dataGroq.pick}`,
      confidence: agreement ? "HIGH" : "MEDIUM"
    });

  } catch (error) {
    console.error("Bridge Error:", error);
    res.status(500).json({ insight: "Tactical Bridge collapsed. Check Vercel Logs.", pick: "RETRY" });
  }
}
