// File: /api/gemini-surgical-edit.js
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Enforce CORS cross-origin safe validation rules
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sourceCode, userInstructions } = req.body;
    
    // Auto-fetch variable straight from system server parameters
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing backend configuration key environmental parameters." });
    }

    // Initialize standard official current SDK packages calls 
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Enforce system instructions that require it to act as an inline diff editor
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using current stable optimized flash execution engines
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a surgical front-end development optimizer. Analyze this code entirely, but do not drop sections or truncate parts with short remarks. Deliver the fully optimized codebase back with the requested modifications applied seamlessly.

Original Input Code:
\`\`\`html
${sourceCode}
\`\`\`

Modifications Requested:
${userInstructions}

Provide your response wrapped exactly inside standard code blocks without conversational filler text.`
            }
          ]
        }
      ]
    });

    let generatedText = response.text || "";

    // Parse clean up code wrapper backticks arrays formatting if present
    if (generatedText.includes("```html")) {
        generatedText = generatedText.split("```html")[1].split("```")[0].trim();
    } else if (generatedText.includes("```")) {
        generatedText = generatedText.split("```")[1].split("```")[0].trim();
    }

    // Deliver exact payload parameters straight to your HTML engine interface
    return res.status(200).json({ optimizedCode: generatedText });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
