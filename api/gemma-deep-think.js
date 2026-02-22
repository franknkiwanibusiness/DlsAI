import { togetherai } from '@ai-sdk/togetherai';
import { generateText } from 'ai';

export default async function handler(req, res) {
  const { homeTeam, awayTeam, league, odds, stats } = req.body;

  // 1. SCOUT PHASE: Gemma 4B processes the raw data
  const scout = await generateText({
    model: togetherai('google/gemma-3-4b-it'),
    prompt: `Analyze stats for ${homeTeam} vs ${awayTeam}. 
    Focus on: 1st leg results, key injuries to strikers/GKs, and team motivation. 
    Summarize in 3 bullet points.`
  });

  // 2. TACTICIAN PHASE: Gemma 27B performs Deep Thinking
  const finalOutcome = await generateText({
    model: togetherai('google/gemma-3-27b-it'),
    prompt: `
    ACT AS: Professional Football Analyst.
    INPUT DATA: ${scout.text}
    LEAGUE RULES: [Apply your 10 custom league rules here]
    
    DEEP THINKING TASK:
    Compare the home striker's form vs the away goalkeeper's recent saves. 
    If this is a cup game, calculate the 'Risk of Desperation' (will they attack and leave gaps?).
    
    REQUIRED OUTPUT (JSON ONLY):
    {
      "market": "The Single Best Market",
      "price": "Current Odd",
      "reasoning": "Explain the deep tactical reason involving injuries and 1st leg context",
      "confidence": "Percentage"
    }`
  });

  res.status(200).json(JSON.parse(finalOutcome.text));
}
