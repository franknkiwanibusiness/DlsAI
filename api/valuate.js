/**
 * /api/valuate.js — AI site valuation via Groq
 * POST /api/valuate
 * Body: { revenue, traffic, desc, url? }
 * Returns: { result, urlFetched }
 *
 * Required env var: GROQ_API_KEY
 */

import https from 'https';

function request(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers: { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function groqChat(messages, { model = 'llama3-8b-8192', max_tokens = 600, system } = {}) {
  const msgs = system ? [{ role: 'system', content: system }, ...messages] : messages;
  const res = await request('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages: msgs, max_tokens, temperature: 0.7 }),
  });
  if (res.status !== 200) throw new Error('Groq error: ' + JSON.stringify(res.body));
  return res.body.choices?.[0]?.message?.content || '';
}

function setCORS(req, res) {
  const origin = (req.headers && req.headers.origin) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Valuation service not configured (missing GROQ_API_KEY)' });
  }

  const rawBody = await readBody(req);
  let body = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { revenue, traffic, desc, url } = body;

  if (!url && !desc && !revenue) {
    return res.status(400).json({ error: 'Provide at least one of: url, desc, revenue' });
  }

  let urlContent = '';
  let urlFetched = false;

  if (url) {
    try {
      const r = await request(url);
      urlContent = typeof r.body === 'string'
        ? r.body.replace(/<[^>]+>/g, ' ').slice(0, 1500)
        : '';
      urlFetched = true;
    } catch { /* URL fetch is optional — ignore errors */ }
  }

  const prompt = `You are a website valuation expert. Provide a concise but detailed valuation.
Site details:
- Monthly revenue: $${revenue || 0}
- Monthly traffic: ${traffic || 0} visitors
- Description: ${desc || 'N/A'}
${urlFetched ? `- Site content snippet: ${urlContent}` : ''}

Provide:
1. **Estimated value range** (use standard 24–40x monthly revenue multiple for revenue-generating sites)
2. **Key value drivers** (2–3 bullet points)
3. **Risk factors** (1–2 bullet points)
4. **Recommendation** (buy/sell/hold assessment)

Keep the response under 200 words and use **bold** for headings.`;

  try {
    const result = await groqChat([{ role: 'user', content: prompt }], {
      model: 'llama3-8b-8192',
      max_tokens: 400,
    });
    return res.status(200).json({ result, urlFetched });
  } catch (groqErr) {
    console.error('[/api/valuate groq error]', groqErr);
    return res.status(502).json({ error: 'AI valuation failed: ' + (groqErr.message || 'unknown error') });
  }
}
