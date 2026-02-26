export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const home = searchParams.get('home');
  const away = searchParams.get('away');
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!home || !away) {
    return new Response(JSON.stringify({ error: "Missing teams" }), { status: 400 });
  }

  // WE REMOVE THE WORD "BETTING" ENTIRELY. 
  // We ask for a "tactical probability" instead.
  const prompt = `Football Match: ${home} vs ${away}. 
  Identify the most likely statistical trend for this match (e.g. "High scoring game expected" or "Home victory likely").
  Max 5 words.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" }
          ]
        })
      }
    );

    const data = await response.json();
    
    // Check if the response was blocked by the safety system
    if (data.promptFeedback?.blockReason) {
        return new Response(JSON.stringify({ prediction: "Analysis Restricted" }), { status: 200 });
    }

    const prediction = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!prediction) {
        return new Response(JSON.stringify({ prediction: "Outcome: Balanced Match" }), { status: 200 });
    }

    return new Response(JSON.stringify({ prediction: prediction.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Service Busy" }), { status: 500 });
  }
}
