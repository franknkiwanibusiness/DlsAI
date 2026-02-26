// api/research.js
export default async function handler(req, res) {
  const { home, away } = JSON.parse(req.body);
  // Call Google Gemini API using process.env.GEMINI_API_KEY
  // Prompt: "Analyze the match between ${home} and ${away} and give a 1-sentence betting tip."
  res.status(200).json({ prediction: "Suggested: " + home + " to Win or Draw" });
}
