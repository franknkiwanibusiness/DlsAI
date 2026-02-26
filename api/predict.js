export const config = {
  runtime: 'edge', // Makes it start instantly and run faster
};

export default async function handler(req) {
  // 1. Get params from the URL (e.g., /api/predict?home=Chelsea&away=Arsenal)
  const { searchParams } = new URL(req.url);
  const home = searchParams.get('home');
  const away = searchParams.get('away');

  const API_KEY = process.env.GEMINI_API_KEY;

  // 2. Safety check
  if (!home || !away) {
    return new Response(JSON.stringify({ error: "Missing teams" }), { status: 400 });
  }

  const prompt = `Match: ${home} vs ${away}. 
  Act as a pro football analyst. Provide only the single best betting market prediction (e.g., "Over 2.5 Goals" or "BTTS"). 
  Max 5 words. No fluff.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    
    // 3. Drill into the specific Gemini response structure
    const prediction = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No tip available";

    return new Response(JSON.stringify({ prediction: prediction.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "AI Failed" }), { status: 500 });
  }
}
