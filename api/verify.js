/**
 * /api/verify.js  —  Siterifty Ownership Screenshot Verifier
 *
 * Receives a multipart POST with:
 *   file    — screenshot image (jpg/png/webp) or PDF
 *   type    — "domain" | "hosting"
 *   domain  — the domain the seller entered in the form   e.g. "myapp.com"
 *   email   — the email the seller entered in the form    e.g. "jane@example.com"
 *
 * Uses GROQ's vision model to read the screenshot and:
 *   - For "domain" : verify the domain AND account email in the screenshot match
 *   - For "hosting": verify the domain AND account email in the screenshot match
 *
 * Returns JSON:  { approved: boolean, reason: string }
 *
 * Required env variable:
 *   GROQ_API_KEY  —  your Groq API key (set in Vercel project settings)
 *
 * Deployment: place this file at  /api/verify.js  in your Next.js / Vercel project root.
 */

import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Vercel / Next.js: disable default body parser so formidable can parse multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Best vision-capable model on Groq (fast + accurate, supports images)
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse multipart form from the request using formidable.
 * Returns { fields, files }
 */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/**
 * Normalise domain: strip protocol, www, trailing slash, path.
 * e.g.  "https://www.myapp.com/dashboard" → "myapp.com"
 */
function normaliseDomain(raw) {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0];
}

/**
 * Normalise email: lowercase and trim.
 */
function normaliseEmail(raw) {
  if (!raw) return '';
  return raw.trim().toLowerCase();
}

/**
 * Read a file from disk and convert to base64.
 */
function fileToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('base64');
}

/**
 * Call the GROQ vision API with an image and a prompt.
 * Returns the raw text response from the model.
 */
async function callGroqVision(base64Image, mimeType, systemPrompt, userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }

  const body = {
    model: GROQ_MODEL,
    max_tokens: 512,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      },
    ],
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GROQ API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

/**
 * Parse the structured JSON block the model returns.
 * Expected shape: { "approved": true|false, "reason": "..." }
 */
function parseModelResponse(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json[\s\S]*?```/gi, (m) =>
    m.replace(/```json\n?/gi, '').replace(/\n?```/gi, '')
  ).replace(/```[\s\S]*?```/gi, (m) =>
    m.replace(/```\n?/gi, '')
  );

  // Extract first JSON object
  const match = cleaned.match(/\{[\s\S]*?\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ─── Verification Logic ────────────────────────────────────────────────────────

/**
 * Build prompts for DOMAIN screenshot verification.
 * The screenshot should show a domain registrar dashboard/receipt/WHOIS.
 */
function buildDomainPrompts(domain, email) {
  const systemPrompt = `You are a strict ownership verification AI for Siterifty, a website marketplace.
Your job is to examine a screenshot of a domain registrar account or WHOIS record
and confirm two things:
1. The domain shown matches the one the seller claimed.
2. The account email shown matches what the seller provided.

You MUST respond with ONLY a JSON object — no explanation, no markdown, no extra text:
{"approved": true, "reason": "Domain and email verified"}
or
{"approved": false, "reason": "Brief explanation of what is wrong or missing"}

Be strict: if you cannot clearly read the domain or email, or they do not match, set approved to false.
A partial domain match (e.g. subdomain shown) counts as a match if the root domain matches.
The browser URL bar of the registrar site in the screenshot helps confirm authenticity but is optional — focus on the account content.`;

  const userPrompt = `The seller claims to own the domain: "${domain}"
The seller's account email is: "${email}"

Please examine this screenshot and check:
- Does the domain "${domain}" appear in this screenshot (in the registrar dashboard, WHOIS output, DNS panel, or receipt)?
- Does the email "${email}" appear as the account/owner email in this screenshot?

If BOTH match → {"approved": true, "reason": "Domain and email verified"}
If the domain matches but email is missing or doesn't match → {"approved": false, "reason": "Email does not match — found [email you saw] but expected ${email}"}
If the domain doesn't match → {"approved": false, "reason": "Domain does not match — found [domain you saw] but expected ${domain}"}
If the screenshot is not a registrar/WHOIS screenshot → {"approved": false, "reason": "Screenshot does not appear to be a domain registrar or WHOIS record"}

Respond with JSON only.`;

  return { systemPrompt, userPrompt };
}

/**
 * Build prompts for HOSTING screenshot verification.
 * The screenshot should show a hosting provider dashboard (Vercel, Netlify, etc.).
 */
function buildHostingPrompts(domain, email) {
  const systemPrompt = `You are a strict ownership verification AI for Siterifty, a website marketplace.
Your job is to examine a screenshot of a hosting provider dashboard (Vercel, Netlify, AWS, DigitalOcean, Heroku, Cloudflare Pages, GoDaddy Hosting, Bluehost, SiteGround, Render, Railway, etc.)
and confirm two things:
1. The domain or project/deployment shown matches the seller's claimed domain.
2. The account email shown matches what the seller provided.

You MUST respond with ONLY a JSON object — no explanation, no markdown, no extra text:
{"approved": true, "reason": "Domain and email verified"}
or
{"approved": false, "reason": "Brief explanation of what is wrong or missing"}

Be strict but reasonable. A Vercel project URL (e.g. myapp.vercel.app) connected to the custom domain, or a deployment listed for the domain, counts as a match.
The browser URL bar of the hosting provider in the screenshot helps confirm authenticity but is optional.`;

  const userPrompt = `The seller claims to own the domain: "${domain}"
The seller's hosting account email is: "${email}"

Please examine this hosting dashboard screenshot and check:
- Does the domain "${domain}" or a project/deployment clearly associated with "${domain}" appear?
- Does the email "${email}" appear as the logged-in account email?

If BOTH match → {"approved": true, "reason": "Domain and email verified in hosting dashboard"}
If domain matches but email is missing/wrong → {"approved": false, "reason": "Email does not match — found [email you saw] but expected ${email}"}
If domain doesn't appear → {"approved": false, "reason": "Domain not found — expected ${domain} but saw [what you saw]"}
If not a hosting dashboard → {"approved": false, "reason": "Screenshot does not appear to be a hosting provider dashboard"}

Respond with JSON only.`;

  return { systemPrompt, userPrompt };
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ approved: false, reason: 'Method not allowed' });
  }

  let tempFilePath = null;

  try {
    // ── 1. Parse the multipart form ──────────────────────────────────────────
    const { fields, files } = await parseForm(req);

    const type   = Array.isArray(fields.type)   ? fields.type[0]   : fields.type   || 'domain';
    const domain = normaliseDomain(Array.isArray(fields.domain) ? fields.domain[0] : fields.domain || '');
    const email  = normaliseEmail(Array.isArray(fields.email)   ? fields.email[0]  : fields.email  || '');

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    // ── 2. Validate inputs ───────────────────────────────────────────────────
    if (!uploadedFile) {
      return res.status(400).json({ approved: false, reason: 'No file uploaded.' });
    }

    if (!domain) {
      return res.status(400).json({ approved: false, reason: 'Domain is required.' });
    }

    if (!email) {
      return res.status(400).json({ approved: false, reason: 'Email is required.' });
    }

    const mimeType = uploadedFile.mimetype || uploadedFile.type || '';
    tempFilePath   = uploadedFile.filepath || uploadedFile.path;

    // ── 3. Validate file type ────────────────────────────────────────────────
    if (!ALLOWED_TYPES.includes(mimeType)) {
      // PDF support note: GROQ vision doesn't natively support PDFs.
      // If you want PDF support, convert to PNG first using e.g. pdf-to-img or
      // a serverless conversion. For now we reject PDFs and ask for an image.
      return res.status(400).json({
        approved: false,
        reason: `Unsupported file type "${mimeType}". Please upload a JPG, PNG, or WebP screenshot.`,
      });
    }

    // ── 4. Convert to base64 ────────────────────────────────────────────────
    const base64Image = fileToBase64(tempFilePath);

    // ── 5. Build prompts based on verification type ──────────────────────────
    const { systemPrompt, userPrompt } =
      type === 'hosting'
        ? buildHostingPrompts(domain, email)
        : buildDomainPrompts(domain, email);

    // ── 6. Call GROQ vision model ────────────────────────────────────────────
    const rawResponse = await callGroqVision(base64Image, mimeType, systemPrompt, userPrompt);

    // ── 7. Parse model response ──────────────────────────────────────────────
    const parsed = parseModelResponse(rawResponse);

    if (!parsed || typeof parsed.approved !== 'boolean') {
      // Model returned something unexpected — fail safe
      console.error('[verify] Unexpected model response:', rawResponse);
      return res.status(200).json({
        approved: false,
        reason: 'Could not read the screenshot clearly. Please upload a clearer image.',
      });
    }

    return res.status(200).json({
      approved: parsed.approved,
      reason:   parsed.reason || (parsed.approved ? 'Verified' : 'Could not verify ownership'),
    });

  } catch (err) {
    console.error('[verify] Error:', err);
    return res.status(500).json({
      approved: false,
      reason: 'Verification service error. Please try again or contact support.',
    });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  }
}
