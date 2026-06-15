// /api/coding.js

export default async function handler(req, res) {
  // Ensure CORS and options request safety
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, fileContent, fileName } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY inside environment configuration." });
    }

    let finalPrompt = message;
    if (fileContent) {
      finalPrompt = `[Attached File: ${fileName}]\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser Question: ${message}`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound", 
        messages: [
          { role: "system", content: "You are an elite, minimal pair programmer. Use clear markdown formatting for code outputs." },
          { role: "user", content: finalPrompt }
        ]
      })
    });

    // Capture explicit upstream API response payloads 
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || `Groq returned status code: ${response.status}` 
      });
    }

    const remaining = response.headers.get("x-ratelimit-remaining-requests") || "250";

    return res.status(200).json({
      text: data.choices[0].message.content,
      remaining: remaining
    });

  } catch (error) {
    // Catches network drops or script runtime breaks safely as valid JSON
    return res.status(500).json({ error: error.message });
  }
}
