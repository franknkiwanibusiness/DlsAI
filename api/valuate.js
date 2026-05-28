// api/valuate.js — Siterifty AI Site Valuation
// Accepts { url?, revenue?, traffic?, desc? }
// If url is provided, this function fetches the page server-side,
// strips it to clean text, and injects it into the AI prompt.
// GROQ_API_KEY never leaves the server.

export const config = { runtime: 'edge', maxDuration: 25 };

export default async function handler(req) {
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return json({ error: 'Service not configured' }, 503);

    let body;
    try { body = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

    const { url, revenue, traffic, desc } = body || {};

    // ── Require at least one input ────────────────────────────────────────────
    if (!url && !revenue && !desc) {
        return json({ result: 'Please provide a site URL, revenue, or description.' });
    }

    // ── Optionally scrape the URL server-side ─────────────────────────────────
    let siteContent = '';
    let urlFetched  = false;

    if (url) {
        try {
            // Validate + normalise
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Bad protocol');

            // Fetch with a real browser UA and a 8s timeout
            const ctrl    = new AbortController();
            const timer   = setTimeout(() => ctrl.abort(), 8000);
            const siteRes = await fetch(parsed.href, {
                signal: ctrl.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Siterifty/1.0; +https://siterifty.com)',
                    'Accept': 'text/html,application/xhtml+xml'
                },
                redirect: 'follow'
            });
            clearTimeout(timer);

            if (siteRes.ok) {
                const html = await siteRes.text();

                // Strip to readable text: remove scripts, styles, SVG, nav, footer
                const cleaned = html
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
                    .replace(/<!--[\s\S]*?-->/g, '')
                    .replace(/<(nav|footer|header|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim()
                    .slice(0, 3000); // cap at 3k chars to stay within token budget

                if (cleaned.length > 80) {
                    siteContent = cleaned;
                    urlFetched  = true;
                }
            }
        } catch (_) {
            // Fetch failed (timeout, CORS, paywalled, etc.) — continue without it
        }
    }

    // ── Build prompt ──────────────────────────────────────────────────────────
    const siteBlock = siteContent
        ? `\nSite content extracted from ${url}:\n"""\n${siteContent}\n"""\n`
        : (url ? `\nSite URL: ${url} (content could not be fetched)\n` : '');

    const prompt = `You are a senior digital business broker with 10+ years of experience valuing websites, SaaS products, newsletters, and online businesses.

A seller has submitted their site for valuation.${siteBlock}
Seller-provided details:
- Monthly Revenue: ${revenue || 'Not provided'}
- Monthly Traffic: ${traffic || 'Not provided'}
- Additional context: ${desc || 'None'}

${siteContent ? 'Use the extracted site content to enrich your analysis — identify the product category, monetisation model, audience, and any signals of quality or risk visible on the page.' : ''}

Provide a concise, professional valuation with:
1. **Estimated price range** — use 24–36× monthly revenue multiples for revenue-generating sites; traffic-based or asset-based valuation if no revenue
2. **2–3 key strengths** that increase buyer interest and sale price
3. **1–2 risk factors** that could lower the final price
4. **One-line recommendation** for listing on Siterifty

Keep the total response under 220 words. Be specific and actionable. Start with the price range in bold on the first line.`;

    // ── Call GROQ ─────────────────────────────────────────────────────────────
    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 380,
                temperature: 0.65
            })
        });

        if (!groqRes.ok) {
            console.error('[valuate] GROQ', groqRes.status, await groqRes.text());
            return json({ result: 'Valuation service temporarily unavailable. Please try again shortly.', urlFetched });
        }

        const data   = await groqRes.json();
        const result = data.choices?.[0]?.message?.content || 'Unable to generate valuation.';
        return json({ result, urlFetched });

    } catch (e) {
        console.error('[valuate] Exception:', e);
        return json({ result: 'Valuation service temporarily unavailable. Please try again.', urlFetched });
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
