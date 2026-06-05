// api/edit-smart.js
// This endpoint receives a code snippet + instruction, sends it to Groq,
// and returns the edited code. It works with the HTML Surgeon frontend.

export default async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // 2. Parse request body
  const { fullCode, snippet, instruction, fileName } = req.body;
  if (!snippet || !instruction) {
    return res.status(400).json({ error: 'Missing snippet or instruction' });
  }

  // 3. Prepare the AI prompt
  // Tell Groq to only return the modified code, no explanations.
  const prompt = `You are an expert web developer. Edit the following code according to the instruction.

IMPORTANT: Return ONLY the modified code, no explanations, no markdown, no extra text.

INSTRUCTION: ${instruction}

CODE TO EDIT:
${snippet}`;

  // 4. Call Groq API
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // or 'llama3-70b-8192'
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a code editing assistant. Always output only the edited code, no extra text.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      return res.status(500).json({ error: 'AI service error. Please try again later.' });
    }

    const data = await response.json();
    let editedCode = data.choices?.[0]?.message?.content || '';

    // Clean up any markdown code fences that Groq might add
    editedCode = editedCode.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');

    // 5. Merge the edited snippet back into the original full code
    let finalResult;
    if (fullCode && fullCode.includes(snippet)) {
      finalResult = fullCode.replace(snippet, editedCode);
    } else {
      // If snippet not found (e.g., user manually edited the code area), just return the edited snippet
      finalResult = editedCode;
    }

    return res.status(200).json({ result: finalResult });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}