import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { home, away, league } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  // Using the model that supports tools/search
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    TODAY'S DATE: February 26, 2026.
    MATCH: ${home} vs ${away} (${league}).

    INSTRUCTIONS:
    1. Perform a deep search for the latest injury news for both teams as of today.
    2. Analyze the last 3 matches (30-day form) for each team.
    3. Identify key absences (e.g., Is De Jong still out for Barca? Is Sunderland's injury list still 5+ players?).
    4. Provide the most accurate "Best Market" based on this data.

    RETURN ONLY JSON:
    {
      "best_market": "Selection + Odds",
      "scenario": "Short explanation (max 15 words) citing a specific 2026 injury or form trend."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    return new Response(text, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ best_market: "Check Manually", scenario: "Search failed" }));
  }
}
