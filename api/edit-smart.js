// api/edit-smart.js
import { Groq } from 'groq-sdk';

// Helper: split snippet into safe chunks (max 12k chars)
function splitIntoChunks(text, instruction) {
  const MAX_CHUNK_SIZE = 12000;
  if (text.length <= MAX_CHUNK_SIZE) return [text];

  const isCss = /[.#@][\w-]+\s*\{/.test(text);
  if (isCss) {
    // split by each CSS rule block
    const rules = text.split(/(?<=})\s*(?=[.#@])/);
    const chunks = [];
    let current = '';
    for (let rule of rules) {
      if ((current + rule).length > MAX_CHUNK_SIZE) {
        if (current) chunks.push(current);
        current = rule;
      } else {
        current += rule;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  } else {
    // HTML: split by top-level tags
    const parts = text.split(/(?=<\w+[^>]*>)/);
    const chunks = [];
    let current = '';
    for (let part of parts) {
      if ((current + part).length > MAX_CHUNK_SIZE) {
        if (current) chunks.push(current);
        current = part;
      } else {
        current += part;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }
}

// Edit a single chunk with Groq
async function editChunk(codeChunk, instruction, groq) {
  const prompt = `You are an expert web developer. Edit the following code according to the instruction.
IMPORTANT: Return ONLY the modified code, no explanations, no markdown, no extra text.

INSTRUCTION: ${instruction}

CODE TO EDIT:
${codeChunk}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-70b-8192',
    temperature: 0.2,
    max_tokens: 4096
  });
  return completion.choices[0].message.content;
}

// Merge edited chunks back into the original full code
function mergeChunks(editedChunks, originalFullCode, originalSnippet) {
  const mergedSnippet = editedChunks.join('\n');
  if (originalFullCode.includes(originalSnippet)) {
    return originalFullCode.replace(originalSnippet, mergedSnippet);
  } else {
    console.warn('Original snippet not found – returning merged snippet only');
    return mergedSnippet;
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullCode, snippet, instruction, fileName } = req.body;
  if (!snippet || !instruction) {
    return res.status(400).json({ error: 'Missing snippet or instruction' });
  }

  // Initialize Groq with your API key (set in environment variables)
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    console.log(`Processing: snippet length ${snippet.length}, instruction: "${instruction.slice(0, 50)}..."`);

    // 1. Split snippet into manageable chunks
    const chunks = splitIntoChunks(snippet, instruction);
    console.log(`Split into ${chunks.length} chunk(s)`);

    // 2. Edit each chunk in parallel
    const editedChunks = await Promise.all(
      chunks.map(chunk => editChunk(chunk, instruction, groq))
    );

    // 3. Merge back into the original full code
    const finalResult = mergeChunks(editedChunks, fullCode, snippet);

    res.status(200).json({ result: finalResult });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}