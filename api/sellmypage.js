/**
 * /api/sellmypage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Vercel serverless API for Siterifty's "Sell My Site" page.
 *
 * Required environment variables (set in Vercel dashboard → Settings → Env):
 *   GROQ_API_KEY        – Groq Cloud API key  (https://console.groq.com)
 *
 * ─── ACTIONS ──────────────────────────────────────────────────────────────────
 *
 *  GET  /api/sellmypage?action=imgur_token
 *       → { clientId: "…" }
 *
 *  POST /api/sellmypage   body: { action: "upload_image", image: "<base64>", type: "image/jpeg" }
 *       → { url, deleteHash }
 *
 *  POST /api/sellmypage   body: { action: "fetch_site_meta", url: "…" }
 *       → { title, description, fetchedAt }
 *
 *  POST /api/sellmypage   body: { action: "review_listing", listing: { … }, codeFiles: […], liveSiteMeta: {…}, reviewInstructions: "…" }
 *       → { status, reason, aiReviewStatus, aiReviewReason, suggestedPrice, priceReason }
 *
 *  POST /api/sellmypage   body: { action: "review_ad", listing: { … } }
 *       → { review_status, review_reason, admin_note, cpm, cpm_reason }
 *
 *  POST /api/sellmypage   body: { action: "validate_url", url: "…" }
 *       → { ok, reachable, isAdult, reason }
 *
 * ─── CORS ─────────────────────────────────────────────────────────────────────
 * Allows requests from any origin (tighten to your domain in production).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Imgur credentials (hardcoded) ───────────────────────────────────────────
const IMGUR_CLIENT_ID     = "891e5bb4aa94282";
const IMGUR_CLIENT_SECRET = "6d052dffa6fa44db03230e593a576e325f31351e";

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
      model: "llama3-70b-8192",
      temperature: 0.15,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
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
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}


// ─── ACTION: imgur_token ─────────────────────────────────────────────────────
function handleImgurToken() {
  return json({ clientId: IMGUR_CLIENT_ID });
}


// ─── ACTION: upload_image ─────────────────────────────────────────────────────
async function handleUploadImage(body) {
  const { image, type } = body;
  if (!image || typeof image !== "string") return err("image (base64) is required");

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (type && !allowedTypes.includes(type.toLowerCase())) {
    return err("Only JPEG, PNG, GIF, and WebP images are accepted.");
  }

  // base64 is ~133% of original; 10MB original ≈ 13.3MB base64
  if (image.length > 14_000_000) return err("Image exceeds 10MB limit.");

  const formData = new FormData();
  formData.append("image", image);
  formData.append("type",  "base64");

  const res = await fetch("https://api.imgur.com/3/image", {
    method:  "POST",
    headers: { Authorization: "Client-ID " + IMGUR_CLIENT_ID },
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


// ─── ACTION: fetch_site_meta ──────────────────────────────────────────────────
async function handleFetchSiteMeta(body) {
  const { url } = body;
  if (!url || typeof url !== "string") return err("url is required");

  let href = url.trim();
  if (!/^https?:\/\//i.test(href)) href = "https://" + href;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(href, {
      redirect: "follow",
      signal:   controller.signal,
      headers: {
        "User-Agent": "Siterifty-Bot/1.0 (+https://siterifty.com)",
        "Accept":     "text/html",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return json({
        title: null, description: null, fetchedAt: null,
        error: `Site returned HTTP ${res.status}`,
      });
    }

    const reader   = res.body.getReader();
    const decoder  = new TextDecoder("utf-8");
    let   html     = "";
    const MAX_BYTES = 20_000;

    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);

    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']description["']/i);

    const ogTitleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+property=["']og:title["']/i);

    const ogDescMatch =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,400})["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+property=["']og:description["']/i);

    const title       = titleMatch?.[1]?.trim()   || ogTitleMatch?.[1]?.trim() || null;
    const description = descMatch?.[1]?.trim()    || ogDescMatch?.[1]?.trim()  || null;

    return json({ title, description, fetchedAt: Date.now() });

  } catch (e) {
    return json({ title: null, description: null, fetchedAt: null, error: e.message });
  }
}


// ─── ACTION: validate_url ────────────────────────────────────────────────────
async function handleValidateUrl(body) {
  const { url } = body;
  if (!url || typeof url !== "string") return err("url is required");

  let href = url.trim();
  if (!/^https?:\/\//i.test(href)) href = "https://" + href;

  if (quickAdultCheck(href)) {
    return json({
      ok: false, reachable: false, isAdult: true,
      reason: "URL contains adult-content keywords and cannot be listed.",
    });
  }

  let reachable = false;
  let finalUrl  = href;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const headRes = await fetch(href, {
      method:   "HEAD",
      redirect: "follow",
      signal:   controller.signal,
      headers:  { "User-Agent": "Siterifty-Bot/1.0 (+https://siterifty.com)" },
    });
    clearTimeout(timer);
    reachable = headRes.ok || headRes.status < 400;
    finalUrl  = headRes.url || href;
  } catch (_) {
    reachable = false;
  }

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
  const {
    listing,
    codeFiles        = [],
    liveSiteMeta     = null,
    reviewInstructions = "",
  } = body;

  if (!listing || typeof listing !== "object") return err("listing object is required");

  const {
    title = "", url = "", description = "", price,
    category = "", age = "", revenue, traffic, expenses,
  } = listing;

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

  const codeContext = codeFiles.length
    ? codeFiles
        .slice(0, 3)
        .map(f => `\n\n--- ${f.filename} ---\n${String(f.content).slice(0, 3000)}`)
        .join("")
    : "No code files provided.";

  const liveContext = liveSiteMeta?.title || liveSiteMeta?.description
    ? `Live site <title>: "${liveSiteMeta.title || "not found"}"\nLive meta description: "${liveSiteMeta.description || "not found"}"`
    : "Live site meta could not be fetched.";

  const liveFetched = !!(liveSiteMeta?.title || liveSiteMeta?.description);

  const systemPrompt = `You are the listing-review AI for Siterifty, a legitimate website marketplace.

Your job is to:
1. Verify the seller actually owns the site they are listing, by cross-checking:
   - The uploaded source code files (do they match the declared URL / site identity?)
   - The live site's <title> and meta description (do they match what the seller entered?)
2. Screen for prohibited content.
3. Calculate a fair market price range.
4. Return ONLY a valid JSON object — no markdown, no commentary.

Output schema (all fields required):
{
  "status": "approved" | "pending_admin" | "rejected",
  "reason": "<one concise sentence>",
  "suggestedPrice": <number | null>,
  "suggestedPriceMin": <number | null>,
  "suggestedPriceMax": <number | null>,
  "priceReason": "<one sentence explaining price logic>"
}

Ownership verification rules:
- You may only return "approved" when ALL of the following are true:
    (a) Live site meta was successfully fetched (not null).
    (b) The seller's entered title is reasonably consistent with the live site <title>.
    (c) The seller's entered description is reasonably consistent with the live meta description OR the uploaded code clearly belongs to the declared site.
- If live site meta is null/missing → return "pending_admin". Never auto-approve without live verification.
- If the entered title/description clearly does not match the live site → return "pending_admin" or "rejected" depending on severity.
- If the uploaded code files are present but belong to a different site → return "pending_admin".

Content rules:
- rejected:       adult/explicit/porn, gambling, illegal drugs/weapons/services, obvious scams, hate speech, dark-web services.
- pending_admin:  live site meta unavailable, title/description mismatch, suspiciously vague description, price >20x annual revenue, brand-new site with very high valuation, borderline content.
- approved:       legitimate website/online business where ownership is verified and content is clean.

Price guidance (standard multiples used by website brokers):
- Revenue-generating sites: 2–4× annual net profit (revenue minus expenses).
- Traffic-based (no revenue): $0.50–$3 per monthly unique visitor depending on niche.
- SaaS tools: 3–5× ARR.
- Newsletters: 24–36× monthly revenue.
- Blogs/content: 30–40× monthly revenue.
- If no financials given, estimate conservatively based on category and site age.
- Always return suggestedPriceMin and suggestedPriceMax as a realistic range.
- If rejected, return null for all price fields.`;

  const userContent = JSON.stringify({
    listingEnteredBySeller: {
      title,
      url,
      description,
      category,
      age,
      askingPrice:     price    ?? null,
      monthlyRevenue:  revenue  ?? null,
      monthlyTraffic:  traffic  ?? null,
      monthlyExpenses: expenses ?? null,
    },
    liveSiteMetaFetched:   liveContext,
    uploadedCodeSnippets:  codeContext,
    reviewInstructions:    reviewInstructions || (
      liveFetched
        ? "Auto-approve ONLY if the entered title/description match the live site AND the uploaded code clearly belongs to this site. Otherwise return pending_admin."
        : "Live site meta could not be fetched. You MUST return pending_admin — do not auto-approve without live site verification."
    ),
  });

  let parsed;
  try {
    parsed = await callGroq(systemPrompt, userContent, 500);
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

    try {
      switch (action) {
        case "review_listing":  return await handleReviewListing(body);
        case "review_ad":       return await handleReviewAd(body);
        case "validate_url":    return await handleValidateUrl(body);
        case "upload_image":    return await handleUploadImage(body);
        case "fetch_site_meta": return await handleFetchSiteMeta(body);
        default:
          return err(`Unknown action "${action}". Valid: review_listing | review_ad | validate_url | upload_image | fetch_site_meta`);
      }
    } catch (e) {
      console.error("[sellmypage] Unhandled error:", e);
      return json({ error: "Internal server error: " + e.message }, 500);
    }
  }

  return err("Method not allowed", 405);
}

// ─── Vercel config ────────────────────────────────────────────────────────────
export const config = {
  runtime: "edge",
};
