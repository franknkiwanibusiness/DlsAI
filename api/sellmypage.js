/**
 * /api/sellmypage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Vercel serverless API for Siterifty's "Sell My Site" page.
 *
 * Required environment variables (set in Vercel dashboard → Settings → Env):
 *   IMGUR_CLIENT_ID     – Imgur OAuth2 client ID (no secret needed for uploads)
 *   GROQ_API_KEY        – Groq Cloud API key  (https://console.groq.com)
 *
 * ─── ACTIONS ──────────────────────────────────────────────────────────────────
 *
 *  GET  /api/sellmypage?action=imgur_token
 *       → { clientId: "…" }
 *       Exposes the Imgur client ID to the browser so it can upload directly.
 *       Never exposes the Groq key.
 *
 *  POST /api/sellmypage   body: { action: "review_listing", listing: { … } }
 *       → { status, reason, aiReviewStatus, aiReviewReason, suggestedPrice, priceReason }
 *       Full AI review: validates URL reachability, flags adult/illegal content,
 *       calculates a fair asking-price range, and returns a structured decision.
 *
 *  POST /api/sellmypage   body: { action: "review_ad", listing: { … } }
 *       → { review_status, review_reason, admin_note, cpm, cpm_reason }
 *       CPM pricing + ad eligibility check for the Promote modal.
 *
 *  POST /api/sellmypage   body: { action: "validate_url", url: "…" }
 *       → { ok: bool, reachable: bool, isAdult: bool, reason: "…" }
 *       Attempts a HEAD request to the URL and returns reachability + a quick
 *       heuristic adult-content check (keyword scan on the final URL path/domain).
 *
 * ─── CORS ─────────────────────────────────────────────────────────────────────
 * Allows requests from any origin (tighten to your domain in production).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Helper: CORS headers ────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Helper: JSON response ───────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ─── Helper: error response ──────────────────────────────────────────────────
function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// ─── Adult-content keyword heuristic ─────────────────────────────────────────
// A lightweight domain/path scan. This is NOT a substitute for a full content
// classifier — it is a fast first gate before the AI call.
const ADULT_KEYWORDS = [
  "porn", "xxx", "adult", "sex", "nude", "nsfw", "escort",
  "onlyfans", "hentai", "erotic", "fetish", "milf", "cam4",
  "stripper", "webcam-sex", "18plus", "18+",
];

function quickAdultCheck(url = "") {
  const lower = url.toLowerCase();
  return ADULT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Helper: call Groq API ───────────────────────────────────────────────────
async function callGroq(systemPrompt, userContent, maxTokens = 400) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",          // fast + cheap; swap to mixtral-8x7b if preferred
      temperature: 0.15,                 // low temp → more deterministic JSON
      max_tokens: maxTokens,
      response_format: { type: "json_object" }, // Groq enforces valid JSON output
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userContent  },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data?.choices?.[0]?.message?.content || "{}";

  // Strip any accidental markdown fences (model occasionally adds them)
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}


// ─── ACTION: upload_image ─────────────────────────────────────────────────────
// Receives a base64-encoded image from the browser, uploads to Imgur server-side,
// and returns the public URL. Keeps IMGUR_CLIENT_ID out of the browser entirely.
async function handleUploadImage(body) {
  const { image, type } = body;
  if (!image || typeof image !== "string") return err("image (base64) is required");

  const clientId = process.env.IMGUR_CLIENT_ID;
  if (!clientId) return err("IMGUR_CLIENT_ID not configured", 500);

  // Validate it's actually an image type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (type && !allowedTypes.includes(type.toLowerCase())) {
    return err("Only JPEG, PNG, GIF, and WebP images are accepted.");
  }

  // Size guard — base64 is ~133% of original; 10MB original ≈ 13.3MB base64
  if (image.length > 14_000_000) return err("Image exceeds 10MB limit.");

  const formData = new FormData();
  // Imgur accepts raw base64 directly in the 'image' field
  formData.append("image", image);
  formData.append("type",  "base64");

  const res = await fetch("https://api.imgur.com/3/image", {
    method:  "POST",
    headers: { Authorization: "Client-ID " + clientId },
    body:    formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Imgur " + res.status + ": " + txt.slice(0, 100));
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.data?.error || "Imgur upload failed");

  return json({ url: data.data.link, deleteHash: data.data.deletehash });
}

// ─── ACTION: imgur_token ─────────────────────────────────────────────────────
function handleImgurToken() {
  const clientId = process.env.IMGUR_CLIENT_ID;
  if (!clientId) return err("IMGUR_CLIENT_ID not configured", 500);
  return json({ clientId });
}

// ─── ACTION: validate_url ────────────────────────────────────────────────────
async function handleValidateUrl(body) {
  const { url } = body;
  if (!url || typeof url !== "string") return err("url is required");

  // Normalise
  let href = url.trim();
  if (!/^https?:\/\//i.test(href)) href = "https://" + href;

  // Quick heuristic adult check before any network call
  if (quickAdultCheck(href)) {
    return json({
      ok: false, reachable: false, isAdult: true,
      reason: "URL contains adult-content keywords and cannot be listed.",
    });
  }

  // Attempt HEAD request (5-second timeout)
  let reachable = false;
  let finalUrl  = href;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const headRes = await fetch(href, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Siterifty-Bot/1.0 (+https://siterifty.com)" },
    });
    clearTimeout(timer);
    reachable = headRes.ok || headRes.status < 400;
    finalUrl  = headRes.url || href;
  } catch (_) {
    reachable = false;
  }

  // Second adult check on resolved URL (handles redirect chains)
  if (quickAdultCheck(finalUrl)) {
    return json({
      ok: false, reachable, isAdult: true,
      reason: "The resolved URL contains adult-content indicators.",
    });
  }

  if (!reachable) {
    return json({
      ok: false, reachable: false, isAdult: false,
      reason: "The URL could not be reached. Make sure the site is live and publicly accessible.",
    });
  }

  return json({ ok: true, reachable: true, isAdult: false, reason: "URL is live and accessible." });
}

// ─── ACTION: review_listing ───────────────────────────────────────────────────
async function handleReviewListing(body) {
  const { listing } = body;
  if (!listing || typeof listing !== "object") return err("listing object is required");

  const {
    title = "", url = "", description = "", price,
    category = "", age = "", revenue, traffic, expenses,
  } = listing;

  // Fast heuristic checks before the AI call
  if (quickAdultCheck(url) || quickAdultCheck(title) || quickAdultCheck(description)) {
    return json({
      status: "rejected",
      reason: "Listing contains adult content and cannot be published.",
      aiReviewStatus: "rejected",
      aiReviewReason: "Adult or explicit content detected.",
      suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null,
      priceReason: null,
    });
  }

  const systemPrompt = `You are the listing-review AI for Siterifty, a legitimate website marketplace.
Your job is to:
1. Screen listings for prohibited content.
2. Calculate a fair market price range.
3. Return ONLY a valid JSON object — no markdown, no commentary.

Output schema (all fields required):
{
  "status": "approved" | "pending_admin" | "rejected",
  "reason": "<one concise sentence>",
  "suggestedPrice": <number | null>,
  "suggestedPriceMin": <number | null>,
  "suggestedPriceMax": <number | null>,
  "priceReason": "<one sentence explaining price logic>"
}

Content rules:
- rejected: adult/explicit/porn, gambling, illegal drugs/weapons/services, obvious scams, hate speech, dark-web services.
- pending_admin: suspiciously vague description, price is more than 20x annual revenue, brand new site with very high valuation, anything borderline.
- approved: everything else that is a legitimate website or online business.

Price guidance (standard multiples used by website brokers):
- Revenue-generating sites: 2-4x annual net profit (revenue minus expenses).
- Traffic-based (no revenue): $0.50-$3 per monthly unique visitor depending on niche.
- SaaS tools: 3-5x ARR.
- Newsletters: 24-36x monthly revenue.
- Blogs/content: 30-40x monthly revenue.
- If no financials given, estimate conservatively based on category and site age.
- Always return suggestedPriceMin and suggestedPriceMax as a realistic range.
- If you cannot price it (e.g. rejected), return null for all price fields.`;

  const userContent = JSON.stringify({
    title, url, description, category, age,
    askingPrice:     price    ?? null,
    monthlyRevenue:  revenue  ?? null,
    monthlyTraffic:  traffic  ?? null,
    monthlyExpenses: expenses ?? null,
  });

  let parsed;
  try {
    parsed = await callGroq(systemPrompt, userContent, 400);
  } catch (aiErr) {
    return json({
      status: "pending_admin",
      reason: "AI review temporarily unavailable — sent to admin.",
      aiReviewStatus: "pending_admin",
      aiReviewReason: "Groq API error: " + aiErr.message,
      suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null,
      priceReason: "AI unavailable",
    });
  }

  return json({
    status:            parsed.status             || "pending_admin",
    reason:            parsed.reason             || "",
    aiReviewStatus:    parsed.status             || "pending_admin",
    aiReviewReason:    parsed.reason             || "",
    suggestedPrice:    parsed.suggestedPrice     ?? null,
    suggestedPriceMin: parsed.suggestedPriceMin  ?? null,
    suggestedPriceMax: parsed.suggestedPriceMax  ?? null,
    priceReason:       parsed.priceReason        || "",
  });
}

// ─── ACTION: review_ad ───────────────────────────────────────────────────────
async function handleReviewAd(body) {
  const { listing } = body;
  if (!listing || typeof listing !== "object") return err("listing object is required");

  const { title = "", url = "", category = "", price = "" } = listing;

  // Fast heuristic
  if (quickAdultCheck(url) || quickAdultCheck(title)) {
    return json({
      review_status: "rejected",
      review_reason: "Adult content detected — ads not permitted.",
      admin_note:    "",
      cpm:           null,
      cpm_reason:    "Ad rejected due to policy violation.",
    });
  }

  const systemPrompt = `You are the ad-platform AI for Siterifty, a website marketplace.
Analyse the listing and return ONLY valid JSON with this exact schema:
{
  "review_status": "approved" | "warning" | "rejected",
  "review_reason": "<one sentence>",
  "admin_note":    "<if warning, describe the issue; otherwise empty string>",
  "cpm":           <number, 2 decimal places, between 0.80 and 8.00>,
  "cpm_reason":    "<one sentence explaining the CPM>"
}

Rules:
- rejected: adult, gambling, illegal, scam-like, harmful content.
- warning:  vague title, suspiciously low/high price vs category, borderline content.
- approved: everything else.

CPM pricing guide (cost per 1,000 impressions in USD):
- SaaS / Tool:       $3.00 - $8.00
- E-commerce:        $2.50 - $5.00
- Newsletter:        $2.50 - $5.00
- Blog / Content:    $1.50 - $4.00
- Directory:         $1.50 - $3.50
- Community / Forum: $1.20 - $3.00
- Other:             $0.80 - $3.00
Increase CPM toward the upper end for higher asking price and well-known categories.`;

  const userContent = JSON.stringify({ title, url, category, askingPrice: price });

  let parsed;
  try {
    parsed = await callGroq(systemPrompt, userContent, 250);
  } catch (aiErr) {
    return json({
      review_status: "approved",
      review_reason: "AI pricing unavailable — standard rate applied.",
      admin_note:    "",
      cpm:           2.50,
      cpm_reason:    "Default CPM (Groq API error: " + aiErr.message + ")",
    });
  }

  return json({
    review_status: parsed.review_status || "approved",
    review_reason: parsed.review_reason || "",
    admin_note:    parsed.admin_note    || "",
    cpm:           parseFloat(parsed.cpm) || 2.50,
    cpm_reason:    parsed.cpm_reason    || "",
  });
}

// ─── MAIN HANDLER (Vercel Edge / Node.js) ────────────────────────────────────
export default async function handler(req) {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ── GET requests ──
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url, "http://localhost");
    const action = searchParams.get("action");
    if (action === "imgur_token") return handleImgurToken();
    return err("Unknown GET action. Use ?action=imgur_token", 400);
  }

  // ── POST requests ──
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body");
    }

    const { action } = body;

    switch (action) {
      case "review_listing": return handleReviewListing(body);
      case "review_ad":      return handleReviewAd(body);
      case "validate_url":   return handleValidateUrl(body);
      default:
        return err(`Unknown action "${action}". Valid: review_listing | review_ad | validate_url`);
    }
  }

  return err("Method not allowed", 405);
}

// ─── Vercel config ────────────────────────────────────────────────────────────
export const config = {
  runtime: "edge", // Vercel Edge Runtime — fast cold starts, global CDN
};
