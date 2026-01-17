import Groq from "groq-sdk";

// Ensure GROQ_API_KEY is added to your Vercel Environment Variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { isPlayerSearch, playerName, isManual, manualData } = req.body;

  try {
    // PATHWAY A: NEURAL PLAYER SEARCH (SCOUTING)
    if (isPlayerSearch) {
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are a DLS 2026 Scout. Search your knowledge and return ONLY valid JSON."
          },
          {
            role: "user",
            content: `Search for player: ${playerName}. Provide: 
            1. Full Name.
            2. 2-sentence 2026 scouting report (Club & form).
            3. Market Premium Value (Between 1.00 and 4.50).
            4. Current 2026 DLS Rating.
            5. A direct headshot image URL (use official sources or Wikipedia).
            JSON Format: {"name": "", "description": "", "premiumValue": 0.0, "rating": 0, "imageUrl": ""}`
          }
        ],
        response_format: { type: "json_object" }
      });

      return res.status(200).json(JSON.parse(completion.choices[0].message.content));
    }

    // PATHWAY B: FINAL MANUAL AUDIT REPORT
    if (isManual) {
      const { avg, coins, star, valuation } = manualData;
      const report = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: `Write a high-tech DLS 2026 Squad Audit. 
            Inputs: Squad Avg ${avg}, Coins ${coins}, Star Asset ${star || 'None'}. 
            Final Valuation: ${valuation}. 
            Format using Markdown with emojis and clear sections.`
          }
        ]
      });

      return res.status(200).json({ report: report.choices[0].message.content });
    }

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ error: "Failed to connect to Neural Engine." });
  }
}
