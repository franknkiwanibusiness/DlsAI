// api/coding.js

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Handle CORS Preflight Options request safely
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { message, fileContent, fileName } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: "Server configuration issue: Missing GROQ_API_KEY in environment variables." 
      });
    }

    // Process optional attached file content seamlessly into context
    let finalPrompt = message;
    if (fileContent) {
      finalPrompt = `[Attached File: ${fileName}]\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser Prompt: ${message}`;
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound", // Agentic tool-execution model
        messages: [
          { 
            role: "system", 
            content: "You are an elite, hyper-focused pair programmer. Always wrap code adjustments in explicit markdown code blocks." 
          },
          { role: "user", content: finalPrompt }
        ]
      })
    });

    // Check if the upstream service returned readable JSON text
    const contentType = groqResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const rawText = await groqResponse.text();
      return res.status(502).json({ error: "Groq API returned an unreadable non-JSON payload." });
    }

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({ 
        error: data.error?.message || `Groq API responded with status ${groqResponse.status}` 
      });
    }

    // Capture remaining requests out of the 250 quota limit
    const remainingReqs = groqResponse.headers.get("x-ratelimit-remaining-requests") || "250";

    return res.status(200).json({
      text: data.choices[0].message.content,
      remaining: remainingReqs
    });

  } catch (error) {
    // Catch-all block forces a structured JSON block output back to frontend
    return res.status(500).json({ error: error.message || "Internal server break." });
  }
}
