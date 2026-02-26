import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  try {
    const { home, away, league } = JSON.parse(req.body);
    
    // Using the most generous free-tier model in 2026
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      Match: ${home} vs ${away} (${league}). 
      Task: Short 1-sentence betting outcome research. 
      Include a probability percentage.
      Style: Sharp, expert, cartoonic wit.
    `;

    const result = await model.generateContent(prompt);
    const prediction = result.response.text();

    res.status(200).json({ prediction: prediction.trim() });
  } catch (error) {
    res.status(200).json({ prediction: "Researching... (AI taking a breather)" });
  }
}
