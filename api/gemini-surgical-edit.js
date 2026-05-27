// File: /api/gemini-surgical-edit.js

export default async function handler(req, res) {
  // Enforce cross-origin security rules
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { sourceCode, userInstructions } = req.body;
    
    // Fetch your API key from the Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing backend configuration: GEMINI_API_KEY is not defined on Vercel." });
    }

    // Surgical system prompt injection to ensure clean, untruncated code replacement
    const promptPayload = `You are a surgical front-end development optimizer. Analyze this code entirely, but do not truncate sections or omit parts with short placeholder remarks like "rest of code remains the same". Deliver the fully optimized codebase back with the requested modifications applied seamlessly.

Original Input Code:
\`\`\`html
${sourceCode}
\`\`\`

Modifications Requested:
${userInstructions}

Provide your response wrapped exactly inside standard markdown code blocks without any conversational filler text or conversational intro/outro lines.`;

    // Direct HTTP handshake pipeline targeting Google's optimized production gateway
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptPayload }
            ]
          }
        ]
      })
    });

    if (!googleResponse.ok) {
      const errText = await googleResponse.text();
      console.error('Google Gateway Error Log:', errText);
      throw new Error(`Google API Server responded with status: ${googleResponse.status}`);
    }

    const data = await googleResponse.json();
    
    // Extract generated string safely from response matrix
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      throw new Error("Empty response received from the model architecture.");
    }

    // Strip markdown formatting boundaries if present
    if (generatedText.includes("```html")) {
        generatedText = generatedText.split("```html")[1].split("```")[0].trim();
    } else if (generatedText.includes("```")) {
        generatedText = generatedText.split("```")[1].split("```")[0].trim();
    }

    // Deliver exact payload back to your custom user interface
    return res.status(200).json({ optimizedCode: generatedText });

  } catch (error) {
    console.error('Surgical Edit API Error:', error);
    return res.status(500).json({ error: error.message || "Internal server pipeline failure." });
  }
}
