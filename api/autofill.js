/**
 * /api/autofill.js  —  Siterifty AI AutoFill
 *
 * Two-step endpoint called by the AutoFill modal:
 *
 *   POST { url, step: "meta" }
 *     → Fetches the target URL, extracts all relevant meta tags
 *     → Returns: { meta: { title, ogTitle, description, ogDescription, ogSiteName, ogType, h1 } }
 *
 *   POST { url, step: "enhance", meta: { ... } }
 *     → Sends the raw meta to GROQ llama-3.1-8b-instant
 *     → AI writes a punchy listing title (≤80 chars) and a rich description (~480 chars)
 *     → Returns: { title, description }
 *
 * Required env variable:
 *   GROQ_API_KEY  —  set in Vercel project settings → Environment Variables
 *
 * Place this file at  /api/autofill.js  in your Vercel / Next.js project root.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = 'llama-3.1-8b-instant';
const FETCH_TIMEOUT  = 10_000;   // 10 s for the target site
const MAX_BODY_CHARS = 60_000;   // cap HTML we process to keep memory low

// ─── Vercel config ────────────────────────────────────────────────────────────

export const config = {
  api: {
    bodyParser: true,        // JSON body — no multipart needed here
    responseLimit: '2mb',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely decode HTML entities in attribute values / text content.
 */
function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .trim();
}

/**
 * Extract a single meta tag value from raw HTML by name or property.
 */
function getMeta(html, nameOrProp) {
  // Matches both name= and property= variants; content can use ' or "
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=['"](${nameOrProp})['"'][^>]+content=['"']([^'"]*)['"']` +
    `|<meta[^>]+content=['"']([^'"]*)['"'][^>]+(?:name|property)=['"](${nameOrProp})['"']`,
    'i'
  );
  const m = html.match(re);
  if (!m) return '';
  return decodeHtml(m[2] || m[3] || '');
}

/**
 * Extract <title> tag text.
 */
function getTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtml(m[1]) : '';
}

/**
 * Extract the first <h1> text (visible heading, no inner tags).
 */
function getH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  // Strip inner HTML tags
  return decodeHtml(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

/**
 * Fetch the target URL with a timeout and return the HTML body.
 */
async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiteriftyBot/1.0; +https://siterifty.com)',
        'Accept':     'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Site returned HTTP ${res.status}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) {
      throw new Error(`URL does not return HTML (got: ${ct})`);
    }

    const text = await res.text();
    // Cap size so regex stays fast
    return text.slice(0, MAX_BODY_CHARS);

  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call GROQ chat completions.
 */
async function callGroq(systemPrompt, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured.');

  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      max_tokens:  700,
      temperature: 0.72,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GROQ API ${res.status}: ${t.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Parse the JSON block the AI returns.
 */
function parseAiJson(raw) {
  // Strip markdown fences
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const match = clean.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ─── Step handlers ────────────────────────────────────────────────────────────

/**
 * STEP 1 — "meta"
 * Fetch the URL and extract all useful meta signals.
 */
async function stepMeta(url) {
  let html;
  try {
    html = await fetchHtml(url);
  } catch (err) {
    return { error: `Could not reach that URL: ${err.message}` };
  }

  const meta = {
    title:         getTitle(html),
    ogTitle:       getMeta(html, 'og:title'),
    description:   getMeta(html, 'description'),
    ogDescription: getMeta(html, 'og:description'),
    twitterTitle:  getMeta(html, 'twitter:title'),
    twitterDesc:   getMeta(html, 'twitter:description'),
    ogSiteName:    getMeta(html, 'og:site_name'),
    ogType:        getMeta(html, 'og:type'),
    h1:            getH1(html),
  };

  return { meta };
}

/**
 * STEP 2 — "enhance"
 * Send the raw meta to GROQ and get back polished listing copy.
 */
async function stepEnhance(url, meta) {
  if (!meta) return { error: 'No meta data provided.' };

  // Build a compact context string from all available signals
  const signals = [
    meta.ogTitle       && `OG Title: ${meta.ogTitle}`,
    meta.title         && `Page Title: ${meta.title}`,
    meta.twitterTitle  && `Twitter Title: ${meta.twitterTitle}`,
    meta.ogSiteName    && `Site Name: ${meta.ogSiteName}`,
    meta.h1            && `H1 Heading: ${meta.h1}`,
    meta.ogDescription && `OG Description: ${meta.ogDescription}`,
    meta.description   && `Meta Description: ${meta.description}`,
    meta.twitterDesc   && `Twitter Description: ${meta.twitterDesc}`,
    meta.ogType        && `Type: ${meta.ogType}`,
    url                && `URL: ${url}`,
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are an expert marketplace copywriter for Siterifty, a website-flipping marketplace.
Your job is to write persuasive, buyer-focused listing copy for a website being sold.

Rules:
- LISTING TITLE: max 80 characters, punchy, specific, mention what the site does + a key metric if possible (e.g. "Profitable SaaS Tool — 800 MRR · 2yr Old · Fully Automated"). No fluff.
- DESCRIPTION: between 420 and 500 characters exactly. Rich, enticing, honest. Cover: what the site does, who the audience is, why it's a good buy, and a brief value proposition. End with a compelling hook. No bullet points — flowing prose only. Do NOT pad with meaningless filler.
- If the meta signals are sparse, infer from the URL and make sensible, honest claims.
- Respond ONLY with a JSON object, no markdown, no explanation:
{"title":"...","description":"..."}`;

  const userMessage = `Here are the raw signals from the website being listed:\n\n${signals}\n\nWrite the listing title and description now. Remember: description must be 420–500 characters.`;

  let rawResponse;
  try {
    rawResponse = await callGroq(systemPrompt, userMessage);
  } catch (err) {
    return { error: `AI error: ${err.message}` };
  }

  const parsed = parseAiJson(rawResponse);
  if (!parsed || !parsed.title || !parsed.description) {
    // Fallback: try to extract from raw text
    console.warn('[autofill] Could not parse AI JSON:', rawResponse.slice(0, 300));
    return { error: 'AI returned an unexpected format. Please try again.' };
  }

  // Enforce hard limits
  const title       = parsed.title.slice(0, 80).trim();
  const description = parsed.description.slice(0, 500).trim();

  return { title, description };
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, step, meta } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  // Validate URL shape
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Block private / local addresses
  const host = parsedUrl.hostname;
  if (/^(localhost|127\.|192\.168\.|10\.|0\.0\.0\.0)/.test(host)) {
    return res.status(400).json({ error: 'Private URLs are not allowed' });
  }

  try {
    if (step === 'meta') {
      const result = await stepMeta(parsedUrl.href);
      return res.status(result.error ? 400 : 200).json(result);
    }

    if (step === 'enhance') {
      const result = await stepEnhance(parsedUrl.href, meta);
      return res.status(result.error ? 400 : 200).json(result);
    }

    return res.status(400).json({ error: `Unknown step "${step}". Use "meta" or "enhance".` });

  } catch (err) {
    console.error('[autofill] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}
