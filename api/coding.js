// /api/coding.js
const { API_KEY } = process.env; // Reads GROQ_API_KEY from environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, fileContent, fileName } = req.body;

    let finalPrompt = message;
    if (fileContent) {
      finalPrompt = `[Attached File: ${fileName}]\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser Question: ${message}`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound", // Hits the multi-tool server-side executor
        messages: [
          { role: "system", content: "You are an elite, minimal pair programmer. Use clear markdown formatting for code outputs." },
          { role: "user", content: finalPrompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || "Groq Error" });
    }

    const data = await response.json();
    const remaining = response.headers.get("x-ratelimit-remaining-requests") || "250";

    return res.status(200).json({
      text: data.choices[0].message.content,
      remaining: remaining
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
