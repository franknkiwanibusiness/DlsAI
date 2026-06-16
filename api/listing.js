/**
 * /api/listing.js  —  Siterifty Listing Services
 *
 * Single endpoint handling all listing-related operations, routed by `action`:
 *
 *   action: "verify-meta"  — checks the seller's site for the Siterifty meta verification tag
 *   action: "verify"       — AI vision verification of domain/hosting ownership screenshots
 *   action: "autofill-meta"    — fetches a URL and extracts meta tags
 *   action: "autofill-enhance" — takes raw meta and returns AI-written listing copy
 *
 * Required env variables:
 *   GROQ_API_KEY  —  Groq API key (set in Vercel project settings)
 */

import { IncomingForm } from 'formidable';
import fs               from 'fs';

// ─── Vercel config ────────────────────────────────────────────────────────────
// bodyParser must be off so formidable can handle multipart (verify action).
// For JSON-only actions (verify-meta, autofill-*) we manually parse req.body below.

export const config = {
    api: {
        bodyParser: false,
        responseLimit: '2mb',
    },
};

// ─── Shared constants ─────────────────────────────────────────────────────────

const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const FETCH_TIMEOUT  = 10_000;
const MAX_BODY_CHARS = 60_000;
const MAX_FILE_SIZE  = 10 * 1024 * 1024;
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Detect multipart (verify/screenshot upload) vs JSON
    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body = {};
    let files = {};

    if (isMultipart) {
        const parsed = await parseForm(req);
        // Flatten formidable field arrays
        for (const [k, v] of Object.entries(parsed.fields)) {
            body[k] = Array.isArray(v) ? v[0] : v;
        }
        files = parsed.files;
    } else {
        body = await parseJson(req);
    }

    const { action } = body;

    switch (action) {
        case 'verify-meta':      return handleVerifyMeta(req, res, body);
        case 'verify':           return handleVerify(req, res, body, files);
        case 'autofill-meta':    return handleAutofillMeta(req, res, body);
        case 'autofill-enhance': return handleAutofillEnhance(req, res, body);
        default:
            return res.status(400).json({
                error: 'Invalid action. Use "verify-meta", "verify", "autofill-meta", or "autofill-enhance".',
            });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: verify-meta
// Body (JSON): { action, url, token }
// Fetches the seller's site and checks for the Siterifty meta verification tag.
// ─────────────────────────────────────────────────────────────────────────────

async function handleVerifyMeta(req, res, body) {
    const { url, token } = body;

    if (!url || !token) {
        return res.status(400).json({ verified: false, error: 'Missing url or token.' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('bad protocol');
    } catch {
        return res.status(400).json({ verified: false, error: 'Invalid URL.' });
    }

    const hostname = parsedUrl.hostname;
    const blocked  = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blocked.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
        return res.status(400).json({ verified: false, error: 'URL must be a publicly accessible site.' });
    }

    try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(parsedUrl.href, {
            signal:   controller.signal,
            headers:  {
                'User-Agent': 'Siterifty-Verifier/1.0 (+https://siterifty.com)',
                'Accept':     'text/html',
            },
            redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(200).json({
                verified: false,
                error: `Site returned HTTP ${response.status}. Make sure it's publicly accessible.`,
            });
        }

        // Read only the first 20 KB — the <head> is always near the top
        const reader = response.body.getReader();
        let html = '', bytesRead = 0;
        while (bytesRead < 20_000) {
            const { done, value } = await reader.read();
            if (done) break;
            html      += new TextDecoder().decode(value);
            bytesRead += value.length;
            if (html.toLowerCase().includes('</head>')) break;
        }
        reader.cancel();

        const metaPattern = new RegExp(
            `<meta[^>]+name=["']siterifty-site-verification["'][^>]+content=["']${escapeRegex(token)}["'][^>]*>` +
            `|<meta[^>]+content=["']${escapeRegex(token)}["'][^>]+name=["']siterifty-site-verification["'][^>]*>`,
            'i'
        );

        return res.status(200).json({ verified: metaPattern.test(html) });

    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(200).json({ verified: false, error: 'Request timed out. Make sure your site is live.' });
        }
        console.error('[listing/verify-meta]', err.message);
        return res.status(200).json({ verified: false, error: 'Could not reach your site. Please check the URL.' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: verify
// Multipart body: { action, type, domain, email, file }
// AI vision check of a domain registrar or hosting dashboard screenshot.
// ─────────────────────────────────────────────────────────────────────────────

async function handleVerify(req, res, body, files) {
    const type   = body.type   || 'domain';
    const domain = normaliseDomain(body.domain || '');
    const email  = normaliseEmail(body.email   || '');

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    let tempFilePath   = uploadedFile?.filepath || uploadedFile?.path || null;

    try {
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
        if (!ALLOWED_TYPES.includes(mimeType)) {
            return res.status(400).json({
                approved: false,
                reason: `Unsupported file type "${mimeType}". Please upload a JPG, PNG, or WebP screenshot.`,
            });
        }

        const base64Image = fs.readFileSync(tempFilePath).toString('base64');

        const { systemPrompt, userPrompt } =
            type === 'hosting'
                ? buildHostingPrompts(domain, email)
                : buildDomainPrompts(domain, email);

        const rawResponse = await callGroqVision(base64Image, mimeType, systemPrompt, userPrompt);
        const parsed      = parseModelJson(rawResponse);

        if (!parsed || typeof parsed.approved !== 'boolean') {
            console.error('[listing/verify] Unexpected model response:', rawResponse);
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
        console.error('[listing/verify]', err);
        return res.status(500).json({ approved: false, reason: 'Verification service error. Please try again.' });
    } finally {
        if (tempFilePath) {
            try { fs.unlinkSync(tempFilePath); } catch (_) {}
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: autofill-meta
// Body (JSON): { action, url }
// Fetches the URL and extracts all useful meta signals.
// ─────────────────────────────────────────────────────────────────────────────

async function handleAutofillMeta(req, res, body) {
    const { url } = body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url is required' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    const host = parsedUrl.hostname;
    if (/^(localhost|127\.|192\.168\.|10\.|0\.0\.0\.0)/.test(host)) {
        return res.status(400).json({ error: 'Private URLs are not allowed' });
    }

    let html;
    try {
        html = await fetchHtml(parsedUrl.href);
    } catch (err) {
        return res.status(400).json({ error: `Could not reach that URL: ${err.message}` });
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

    return res.status(200).json({ meta });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: autofill-enhance
// Body (JSON): { action, url, meta }
// Sends raw meta to GROQ and returns polished listing title + description.
// ─────────────────────────────────────────────────────────────────────────────

async function handleAutofillEnhance(req, res, body) {
    const { url, meta } = body;

    if (!meta) return res.status(400).json({ error: 'No meta data provided.' });

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
        rawResponse = await callGroqChat(systemPrompt, userMessage);
    } catch (err) {
        return res.status(500).json({ error: `AI error: ${err.message}` });
    }

    const parsed = parseModelJson(rawResponse);
    if (!parsed || !parsed.title || !parsed.description) {
        console.warn('[listing/autofill-enhance] Could not parse AI JSON:', rawResponse.slice(0, 300));
        return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    return res.status(200).json({
        title:       parsed.title.slice(0, 80).trim(),
        description: parsed.description.slice(0, 500).trim(),
    });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseForm(req) {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm({ maxFileSize: MAX_FILE_SIZE, keepExtensions: true });
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

function parseJson(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end',  () => {
            try { resolve(JSON.parse(raw || '{}')); }
            catch { resolve({}); }
        });
        req.on('error', reject);
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normaliseDomain(raw) {
    if (!raw) return '';
    return raw.trim().toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0].split('?')[0].split('#')[0];
}

function normaliseEmail(raw) {
    return raw ? raw.trim().toLowerCase() : '';
}

async function fetchHtml(url) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
        const res = await fetch(url, {
            signal:   controller.signal,
            headers:  {
                'User-Agent': 'Mozilla/5.0 (compatible; SiteriftyBot/1.0; +https://siterifty.com)',
                'Accept':     'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
        });
        if (!res.ok) throw new Error(`Site returned HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('html')) throw new Error(`URL does not return HTML (got: ${ct})`);
        const text = await res.text();
        return text.slice(0, MAX_BODY_CHARS);
    } finally {
        clearTimeout(timer);
    }
}

function decodeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g,  '&').replace(/&lt;/g,   '<').replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g,  "'").replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
        .trim();
}

function getMeta(html, nameOrProp) {
    const re = new RegExp(
        `<meta[^>]+(?:name|property)=['"]${nameOrProp}['"][^>]+content=['"]([^'"]*)['"']` +
        `|<meta[^>]+content=['"]([^'"]*)['"'][^>]+(?:name|property)=['"]${nameOrProp}['"]`,
        'i'
    );
    const m = html.match(re);
    return m ? decodeHtml(m[1] || m[2] || '') : '';
}

function getTitle(html) {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return m ? decodeHtml(m[1]) : '';
}

function getH1(html) {
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!m) return '';
    return decodeHtml(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function parseModelJson(raw) {
    const clean = raw
        .replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const match = clean.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
}

async function callGroqVision(base64Image, mimeType, systemPrompt, userPrompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set.');

    const res = await fetch(GROQ_API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model:       'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens:  512,
            temperature: 0,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                        { type: 'text',      text: userPrompt },
                    ],
                },
            ],
        }),
    });
    if (!res.ok) throw new Error(`GROQ API error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
}

async function callGroqChat(systemPrompt, userMessage) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured.');

    const res = await fetch(GROQ_API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model:       'llama-3.1-8b-instant',
            max_tokens:  700,
            temperature: 0.72,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userMessage  },
            ],
        }),
    });
    if (!res.ok) throw new Error(`GROQ API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Verify prompts ───────────────────────────────────────────────────────────

function buildDomainPrompts(domain, email) {
    const systemPrompt = `You are a strict ownership verification AI for Siterifty, a website marketplace.
Examine a screenshot of a domain registrar account or WHOIS record and confirm:
1. The domain shown matches the seller's claimed domain.
2. The account email shown matches what the seller provided.
Respond ONLY with JSON: {"approved": true|false, "reason": "..."}`;

    const userPrompt = `Seller claims to own: "${domain}" with account email: "${email}"
Check if BOTH appear in this screenshot.
If both match → {"approved": true, "reason": "Domain and email verified"}
If email wrong → {"approved": false, "reason": "Email does not match — found [X] but expected ${email}"}
If domain wrong → {"approved": false, "reason": "Domain does not match — found [X] but expected ${domain}"}
If wrong screenshot type → {"approved": false, "reason": "Screenshot does not appear to be a domain registrar or WHOIS record"}
Respond with JSON only.`;

    return { systemPrompt, userPrompt };
}

function buildHostingPrompts(domain, email) {
    const systemPrompt = `You are a strict ownership verification AI for Siterifty, a website marketplace.
Examine a screenshot of a hosting provider dashboard (Vercel, Netlify, AWS, DigitalOcean, Cloudflare Pages, etc.) and confirm:
1. The domain or project shown matches the seller's claimed domain.
2. The account email shown matches what the seller provided.
Respond ONLY with JSON: {"approved": true|false, "reason": "..."}`;

    const userPrompt = `Seller claims to own: "${domain}" with hosting account email: "${email}"
Check if BOTH appear in this hosting dashboard screenshot.
If both match → {"approved": true, "reason": "Domain and email verified in hosting dashboard"}
If email wrong → {"approved": false, "reason": "Email does not match — found [X] but expected ${email}"}
If domain missing → {"approved": false, "reason": "Domain not found — expected ${domain} but saw [X]"}
If wrong screenshot type → {"approved": false, "reason": "Screenshot does not appear to be a hosting provider dashboard"}
Respond with JSON only.`;

    return { systemPrompt, userPrompt };
}