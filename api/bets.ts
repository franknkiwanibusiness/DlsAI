import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const ODDS_API_KEY = '10257181b61bdaba7ac4ca4e276c9dae';
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 1. Get Live Odds from The Odds API
    const oddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h,totals&oddsFormat=decimal`);
    const fixtures = await oddsRes.json();

    // Take the top 3 matches to analyze
    const matchesToAnalyze = fixtures.slice(0, 3);

    // 2. Ask Gemini for the "Best Possible Scenario" using your strict rules
    const prompt = `
      CURRENT DATE: Feb 26, 2026.
      FIXTURES & ODDS: ${JSON.stringify(matchesToAnalyze)}

      STRICT ANALYSIS RULES:
      - DATA AGE: Ignore any H2H older than Nov 2025 (90 days).
      - RECENT FORM: Focus ONLY on the last 3 opponents for each team within the last 30 days.
      - INJURY SEARCH: Check if key players (e.g. Haaland, Saka, James Maddison) are out today.
      
      OUTPUT REQUIREMENT:
      Return a JSON array of objects:
      {
        "match": "Team A vs Team B",
        "best_market": "The specific market (e.g., Over 2.5)",
        "real_odds": "The actual decimal odds from the data",
        "scenario": "1-sentence explanation of why this will happen based on the 30-day data."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, ""); // Clean JSON block

    return new Response(text, { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
  }
}
