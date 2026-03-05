import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { messages } = await req.json();

  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are DADDYHOYOO, the ultimate betting AI. 
    You have access to live fixtures. 
    Your mission: Help the user build a R11,000,000 payout ticket on BetXchange.
    Focus on finding "Draws" and "Value Underdogs" in top European leagues.
    Tone: Cold, analytical, and aggressive. March 2026 Season.`,
    messages,
    maxSteps: 5, // Allows AI to call the tool, get data, and then speak
    tools: {
      get_live_intel: tool({
        description: 'Fetch real-time football fixtures and odds for top leagues.',
        parameters: z.object({
          league: z.enum([
            'soccer_epl', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league', 
            'soccer_uefa_conf_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 
            'soccer_germany_bundesliga', 'soccer_france_ligue_1'
          ])
        }),
        execute: async ({ league }) => {
          const res = await fetch(`https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${process.env.EASYBET_API_KEY}&regions=eu&markets=h2h`);
          const data = await res.json();
          return data.map(m => ({
            match: `${m.home_team} vs ${m.away_team}`,
            odds: m.bookmakers[0]?.markets[0]?.outcomes.map(o => `${o.name}: ${o.price}`).join(' | ')
          }));
        }
      })
    }
  });

  return result.toDataStreamResponse();
}
