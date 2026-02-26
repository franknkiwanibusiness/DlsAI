export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { home, away, league } = await req.json();
  
  // Use your Groq Key from Vercel
  const GROQ_KEY = process.env.EASYBET_API_KEY;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional sports analyst. Today is Feb 26, 2026. Return ONLY raw JSON."
          },
          {
            role: "user",
            content: `Deep Research: ${home} vs ${away} in ${league}. 
            Check 30-day form and Feb 26 injury news (e.g., Sunderland's Brobbey/Mukiele OUT, Barca's De Jong OUT).
            
            Return JSON format: {"best_market": "Selection + Odds", "scenario": "Max 15 words on why."}`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" } // Forces Groq to give clean JSON
      })
    });

    const data = await res.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(aiResponse, { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ best_market: "N/A", scenario: "Groq Offline" }));
  }
}
