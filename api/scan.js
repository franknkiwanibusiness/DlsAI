import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const { image } = req.body;

  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "You are a DLS Data Extractor. Analyze screenshots and return ONLY: 1. Player Names & Ratings 2. Total Coins 3. Total Diamonds 4. Squad Health (0-100). Do not use conversational filler."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Scan this DLS squad and extract the numbers." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ],
      temperature: 0.0, // Set to 0 for maximum mathematical accuracy
      max_tokens: 500
    });

    res.status(200).json({ report: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Scan Failed" });
  }
}
