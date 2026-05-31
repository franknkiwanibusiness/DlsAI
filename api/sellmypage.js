/**
 * /api/sellmypage.js  —  Siterifty "Sell My Site" unified API
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY ARCHITECTURE  (AI is the LAST resort, not the first line of defence)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  LAYER 1 — Input sanitation & hard limits (always runs, zero deps)
 *  LAYER 2 — URL / domain heuristic blocklist (always runs, zero deps)
 *  LAYER 3 — Disposable-domain & known-scam-TLD rejection (always runs)
 *  LAYER 4 — Live URL reachability + DNS/HTTP fingerprint check
 *  LAYER 5 — Structural ownership signal cross-check
 *            (live <title>/<meta> vs. submitted title/description)
 *  LAYER 6 — Financial sanity gates (price-to-revenue multiple caps)
 *  LAYER 7 — Rate-limiting per IP (in-memory, resets on cold start)
 *  LAYER 8 — AI content review via Groq  ← only reached after all above pass
 *
 *  At every layer a hard REJECT or forced PENDING_ADMIN can be emitted WITHOUT
 *  the AI being available.  If Groq is down the system keeps working safely.
 *
 * ─── Required env vars (Vercel → Settings → Environment Variables) ───────────
 *   GROQ_API_KEY          Groq Cloud key  https://console.groq.com
 *   ALLOWED_ORIGINS       Comma-separated list of allowed origins
 *                         e.g. "https://siterifty.com,https://www.siterifty.com"
 *                         Defaults to "*" for dev — TIGHTEN IN PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── CORS ────────────────────────────────────────────────────────────────────
function buildCors(req) {
  const allowedRaw = process.env.ALLOWED_ORIGINS || "*";
  const allowed    = allowedRaw.split(",").map(s => s.trim());
  const origin     = req?.headers?.get?.("origin") ?? "";

  const acao = allowed.includes("*")
    ? "*"
    : allowed.includes(origin)
    ? origin
    : allowed[0]; // fallback to first allowed origin (will mismatch — browser will block)

  return {
    "Access-Control-Allow-Origin":  acao,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
function err(msg, status = 400, cors = {}) {
  return json({ error: msg }, status, cors);
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 7 — In-memory rate limiter
//  Limits: 10 req/IP/minute across all actions, 3 listing-reviews/IP/hour
// ══════════════════════════════════════════════════════════════════════════════
const _rl = new Map(); // ip → { minCount, minReset, hrCount, hrReset }

function rateLimitCheck(ip, action) {
  const now  = Date.now();
  const rec  = _rl.get(ip) || { minCount: 0, minReset: now + 60_000, hrCount: 0, hrReset: now + 3_600_000 };

  if (now > rec.minReset) { rec.minCount = 0; rec.minReset = now + 60_000; }
  if (now > rec.hrReset)  { rec.hrCount  = 0; rec.hrReset  = now + 3_600_000; }

  rec.minCount++;
  if (action === "review_listing") rec.hrCount++;

  _rl.set(ip, rec);

  if (rec.minCount > 10)  return "Too many requests — please slow down (60 s window).";
  if (action === "review_listing" && rec.hrCount > 3)
                          return "Too many listing submissions — maximum 3 per hour.";
  return null; // ok
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 1 — Input sanitation helpers
// ══════════════════════════════════════════════════════════════════════════════

/** Strip HTML, control characters, and normalise whitespace */
function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")        // strip tags
    .replace(/[<>"'`]/g, "")        // strip remaining dangerous chars
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLen);
}

function validateUrl(raw) {
  if (typeof raw !== "string" || raw.length > 2000) return null;
  let href = raw.trim();
  if (!/^https?:\/\//i.test(href)) href = "https://" + href;
  try {
    const u = new URL(href);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (!u.hostname.includes("."))                 return null;
    if (u.hostname.length > 253)                   return null;
    return u.href;
  } catch { return null; }
}

function normalizeHostname(href) {
  try { return new URL(href).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 2 — URL / keyword heuristic blocklist
// ══════════════════════════════════════════════════════════════════════════════

// Adult / explicit
const ADULT_KW = [
  "porn","xxx","adult","sex","nude","nsfw","escort","onlyfans","hentai",
  "erotic","fetish","milf","cam4","stripper","webcam-sex","18plus","18+",
  "xvideos","redtube","xhamster","youporn","pornhub","brazzers",
];

// Gambling
const GAMBLING_KW = [
  "casino","poker","slots","betting","sportsbet","betway","bet365",
  "gambling","wagering","roulette","blackjack","sportsbetting",
];

// Illegal / high-risk
const ILLEGAL_KW = [
  "darkweb","dark-web","tor2web","onion","carding","cvv-shop","drug-market",
  "guns4sale","illegal-weapons","fake-id","counterfeit","hitman","hackerforhire",
  "stolen-data","ransomware","phishing-kit","scam-page",
];

// Known scam / phishing phrases
const SCAM_KW = [
  "get-rich-quick","make-money-fast","guaranteed-income","binary-options",
  "crypto-doubler","bitcoin-multiplier","free-money","work-from-home-scam",
  "ponzi","pyramid-scheme","mlm-income",
];

function kwCheck(text, list) {
  const lower = text.toLowerCase();
  return list.find(kw => lower.includes(kw)) || null;
}

function contentPolicyCheck(url = "", title = "", description = "") {
  const combined = [url, title, description].join(" ");
  let hit;
  if ((hit = kwCheck(combined, ADULT_KW)))    return { policy: "adult",    kw: hit };
  if ((hit = kwCheck(combined, GAMBLING_KW))) return { policy: "gambling", kw: hit };
  if ((hit = kwCheck(combined, ILLEGAL_KW)))  return { policy: "illegal",  kw: hit };
  if ((hit = kwCheck(combined, SCAM_KW)))     return { policy: "scam",     kw: hit };
  return null;
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 3 — Disposable / high-abuse TLD & private-IP block
// ══════════════════════════════════════════════════════════════════════════════

const BLOCKED_TLDS = new Set([
  // free/disposable hosting often used for scam pages
  ".tk",".ml",".ga",".cf",".gq",
  // high-abuse ccTLDs (not blocked outright — flagged for pending_admin)
]);

// TLDs that are legitimate but frequently abused — force pending_admin
const HIGH_RISK_TLDS = new Set([".xyz",".top",".click",".loan",".win",".work",".buzz"]);

const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|::1)/;

function domainRiskLevel(hostname) {
  // Strip port
  const host = hostname.split(":")[0];

  if (PRIVATE_IP_RE.test(host))
    return { level: "blocked", reason: "Private/loopback addresses cannot be listed." };

  // Match TLD (handles multi-part like .co.uk via last two parts)
  const tld1 = host.slice(host.lastIndexOf("."));   // e.g. ".xyz"
  if (BLOCKED_TLDS.has(tld1))
    return { level: "blocked", reason: `Sites on .${tld1.slice(1)} TLDs are not permitted.` };
  if (HIGH_RISK_TLDS.has(tld1))
    return { level: "high_risk", reason: `Sites on .${tld1.slice(1)} TLDs require manual admin review.` };

  // Very short hostnames (e.g. "ab.cd") — probably test data
  if (host.replace(/\./g, "").length < 5)
    return { level: "blocked", reason: "Domain name is too short to be a real site." };

  return { level: "ok", reason: "" };
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 4 — Live reachability + redirect-loop guard
// ══════════════════════════════════════════════════════════════════════════════

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function checkReachability(href) {
  // HEAD first (cheaper)
  try {
    const res = await fetchWithTimeout(href, {
      method:   "HEAD",
      redirect: "follow",
      headers:  { "User-Agent": "Siterifty-Verify/2.0 (+https://siterifty.com/bot)" },
    }, 5000);
    return {
      reachable: res.ok || res.status < 400,
      status:    res.status,
      finalUrl:  res.url,
    };
  } catch { /* fall through to GET */ }

  // Some servers reject HEAD — try GET with partial read
  try {
    const res = await fetchWithTimeout(href, {
      method:   "GET",
      redirect: "follow",
      headers:  {
        "User-Agent": "Siterifty-Verify/2.0 (+https://siterifty.com/bot)",
        "Accept":     "text/html",
        "Range":      "bytes=0-512",
      },
    }, 6000);
    return {
      reachable: res.ok || res.status === 206 || res.status < 400,
      status:    res.status,
      finalUrl:  res.url,
    };
  } catch (e) {
    return { reachable: false, status: 0, finalUrl: href, error: e.message };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 5 — Live page meta scrape (title + description)
// ══════════════════════════════════════════════════════════════════════════════

async function scrapeSiteMeta(href) {
  try {
    const res = await fetchWithTimeout(href, {
      method:   "GET",
      redirect: "follow",
      headers:  {
        "User-Agent": "Siterifty-Verify/2.0 (+https://siterifty.com/bot)",
        "Accept":     "text/html",
      },
    }, 7000);

    if (!res.ok && res.status >= 400) {
      return { title: null, description: null, h1: null, fetchedAt: null, error: `HTTP ${res.status}` };
    }

    // Read up to 30 KB — enough for <head> on any real site
    const reader  = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let html = "";
    while (html.length < 30_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    const get = (re) => {
      const m = html.match(re);
      return m?.[1]?.trim() || null;
    };

    const title = get(/<title[^>]*>([^<]{1,250})<\/title>/i)
               || get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,250})["']/i)
               || get(/<meta[^>]+content=["']([^"']{1,250})["'][^>]+property=["']og:title["']/i);

    const description =
         get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)
      || get(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i)
      || get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i)
      || get(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:description["']/i);

    const h1 = get(/<h1[^>]*>([^<]{1,200})<\/h1>/i);

    // Extra: canonical URL — catch redirect spoofing
    const canonical =
         get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']{1,300})["']/i)
      || get(/<link[^>]+href=["']([^"']{1,300})["'][^>]+rel=["']canonical["']/i);

    return { title, description, h1, canonical, fetchedAt: Date.now() };
  } catch (e) {
    return { title: null, description: null, h1: null, fetchedAt: null, error: e.message };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 5b — Ownership signal cross-check (NO AI required)
//  Returns { score: 0-100, flags: string[] }
// ══════════════════════════════════════════════════════════════════════════════

function tokenize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function jaccardSimilarity(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (!A.size && !B.size) return 1;
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter(x => B.has(x)).length;
  const union  = new Set([...A, ...B]).size;
  return inter / union;
}

/**
 * Cross-check submitted listing data vs live site meta.
 * Returns ownership confidence 0–100 and an array of human-readable flags.
 *
 * Rules (AI-free):
 *  +40  live title closely matches submitted title    (Jaccard ≥ 0.35)
 *  +30  live description closely matches submitted    (Jaccard ≥ 0.2)
 *  +20  declared domain appears in live canonical URL
 *  +10  live H1 shares tokens with submitted title
 *  −30  live title clearly belongs to a different site (similarity < 0.05 AND non-empty)
 *  −20  canonical points to a completely different domain
 */
function ownershipCrossCheck(submitted, liveMeta) {
  const flags  = [];
  let   score  = 0;

  if (!liveMeta || (!liveMeta.title && !liveMeta.description)) {
    flags.push("live_meta_unavailable");
    return { score: 0, flags };
  }

  const titleSim = jaccardSimilarity(submitted.title, liveMeta.title);
  const descSim  = jaccardSimilarity(submitted.description, liveMeta.description);
  const submittedDomain = normalizeHostname("https://" + submitted.url);

  // Title check
  if (liveMeta.title) {
    if (titleSim >= 0.35) {
      score += 40;
      flags.push("title_match");
    } else if (titleSim < 0.05) {
      score -= 30;
      flags.push("title_mismatch");
    } else {
      flags.push("title_partial");
      score += 10;
    }
  }

  // Description check
  if (liveMeta.description) {
    if (descSim >= 0.2) {
      score += 30;
      flags.push("desc_match");
    } else if (descSim < 0.04) {
      flags.push("desc_mismatch");
      score -= 10;
    } else {
      flags.push("desc_partial");
      score += 10;
    }
  }

  // Canonical domain check
  if (liveMeta.canonical) {
    const canonicalDomain = normalizeHostname(liveMeta.canonical);
    if (canonicalDomain && submittedDomain) {
      if (canonicalDomain === submittedDomain || canonicalDomain.endsWith("." + submittedDomain)) {
        score += 20;
        flags.push("canonical_match");
      } else {
        score -= 20;
        flags.push("canonical_mismatch");
      }
    }
  }

  // H1 bonus
  if (liveMeta.h1) {
    const h1Sim = jaccardSimilarity(submitted.title, liveMeta.h1);
    if (h1Sim >= 0.3) {
      score += 10;
      flags.push("h1_match");
    }
  }

  return { score: Math.max(0, Math.min(100, score)), flags };
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 6 — Financial sanity gates
// ══════════════════════════════════════════════════════════════════════════════

function financialSanityCheck(price, revenue, expenses) {
  const flags = [];

  if (price > 0 && revenue > 0) {
    const netMonthly = Math.max(0, revenue - (expenses || 0));
    const annualNet  = netMonthly * 12;

    if (annualNet > 0) {
      const multiple = price / annualNet;
      if (multiple > 50) {
        flags.push(`price_multiple_extreme:${multiple.toFixed(1)}x_annual_net`);
      } else if (multiple > 20) {
        flags.push(`price_multiple_high:${multiple.toFixed(1)}x_annual_net`);
      }
    }

    // Revenue oddity: expenses > revenue
    if (expenses > revenue * 2) {
      flags.push("expenses_exceed_revenue_2x");
    }
  }

  // Price with zero revenue claiming huge valuation
  if (price > 50_000 && (!revenue || revenue === 0)) {
    flags.push("high_price_no_revenue");
  }

  return flags;
}


// ══════════════════════════════════════════════════════════════════════════════
//  LAYER 8 — Groq AI review (last resort — only called after all layers pass)
// ══════════════════════════════════════════════════════════════════════════════

async function callGroq(systemPrompt, userContent, maxTokens = 500) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:           "llama3-70b-8192",
        temperature:     0.10,
        max_tokens:      maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userContent  },
        ],
      }),
    },
    10_000,
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data?.choices?.[0]?.message?.content ?? "{}";
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}


// ══════════════════════════════════════════════════════════════════════════════
//  WHOIS LOOKUP — multi-source fallback
//  Sources tried in order:
//    1. rdap.org  (free, no key, JSON)
//    2. who-dat.as93.net (free, no key, JSON)
//    3. Graceful degradation — returns what we know from DNS
//
//  Returns: { registered, registrar, registrarUrl, createdDate, expiryDate,
//             domainAgeDays, updatedDate, nameservers, raw }
// ══════════════════════════════════════════════════════════════════════════════

async function lookupWhois(domain) {
  // Strip any path / port, just bare hostname
  const bare = domain.split("/")[0].split(":")[0].toLowerCase().replace(/^www\./, "");

  // ── Source 1: rdap.org ───────────────────────────────────────────────────
  try {
    const res = await fetchWithTimeout(
      `https://rdap.org/domain/${encodeURIComponent(bare)}`,
      { headers: { "Accept": "application/json", "User-Agent": "Siterifty-Verify/2.0" } },
      6000
    );
    if (res.ok) {
      const data = await res.json();

      // Extract registrar from entities
      let registrar = null, registrarUrl = null;
      if (Array.isArray(data.entities)) {
        for (const e of data.entities) {
          if (Array.isArray(e.roles) && e.roles.includes("registrar")) {
            // publicIds often has the registrar name
            if (Array.isArray(e.publicIds) && e.publicIds[0]?.identifier) {
              registrar = e.publicIds[0].identifier;
            }
            // vcardArray has fn (full name)
            const vcard = e.vcardArray?.[1];
            if (Array.isArray(vcard)) {
              for (const field of vcard) {
                if (field[0] === "fn") { registrar = registrar || field[3]; }
                if (field[0] === "url") { registrarUrl = field[3]; }
              }
            }
            if (!registrar && e.handle) registrar = e.handle;
            break;
          }
        }
      }

      // Extract dates from events
      let createdDate = null, expiryDate = null, updatedDate = null;
      if (Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (ev.eventAction === "registration")  createdDate  = ev.eventDate;
          if (ev.eventAction === "expiration")    expiryDate   = ev.eventDate;
          if (ev.eventAction === "last changed")  updatedDate  = ev.eventDate;
        }
      }

      // Nameservers
      const nameservers = Array.isArray(data.nameservers)
        ? data.nameservers.map(ns => (ns.ldhName || "").toLowerCase()).filter(Boolean)
        : [];

      // Domain age in days
      let domainAgeDays = null;
      if (createdDate) {
        domainAgeDays = Math.floor((Date.now() - new Date(createdDate).getTime()) / 86_400_000);
      }

      return {
        registered:   true,
        registrar:    _cleanRegistrar(registrar),
        registrarUrl: registrarUrl || null,
        createdDate:  createdDate  || null,
        expiryDate:   expiryDate   || null,
        updatedDate:  updatedDate  || null,
        domainAgeDays,
        nameservers,
        source:       "rdap.org",
      };
    }
  } catch (_) { /* fall through */ }

  // ── Source 2: who-dat (plain JSON WHOIS fallback) ─────────────────────────
  try {
    const res = await fetchWithTimeout(
      `https://who-dat.as93.net/${encodeURIComponent(bare)}`,
      { headers: { "Accept": "application/json", "User-Agent": "Siterifty-Verify/2.0" } },
      6000
    );
    if (res.ok) {
      const data = await res.json();
      const w = data?.WhoisRecord || data?.whois_record || data || {};

      const registrar   = _cleanRegistrar(w.registrarName || w.Registrar || w.registrar || null);
      const createdDate = w.createdDate || w.CreatedDate || w.creation_date || null;
      const expiryDate  = w.expiresDate || w.ExpiresDate || w.expiration_date || null;
      const updatedDate = w.updatedDate || w.UpdatedDate || null;

      let domainAgeDays = null;
      if (createdDate) {
        domainAgeDays = Math.floor((Date.now() - new Date(createdDate).getTime()) / 86_400_000);
      }

      return {
        registered:   true,
        registrar,
        registrarUrl: null,
        createdDate,
        expiryDate,
        updatedDate,
        domainAgeDays,
        nameservers:  [],
        source:       "who-dat",
      };
    }
  } catch (_) { /* fall through */ }

  // ── Graceful degradation — domain exists (caller already validated URL) ────
  return {
    registered:   null, // unknown
    registrar:    null,
    registrarUrl: null,
    createdDate:  null,
    expiryDate:   null,
    updatedDate:  null,
    domainAgeDays: null,
    nameservers:  [],
    source:       "unavailable",
  };
}

/** Normalise messy registrar strings from RDAP/WHOIS */
function _cleanRegistrar(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // Some RDAP sources give IANA IDs like "1068" — not useful
  if (/^\d+$/.test(s)) return null;
  // Trim trailing ", LLC" duplicates, etc.
  s = s.replace(/,?\s*(LLC|Inc\.?|Ltd\.?|Corp\.?)$/i, "").trim();
  // Known display names
  const MAP = {
    "namecheap":      "Namecheap",
    "godaddy":        "GoDaddy",
    "go daddy":       "GoDaddy",
    "cloudflare":     "Cloudflare",
    "google":         "Google Domains",
    "porkbun":        "Porkbun",
    "hover":          "Hover",
    "name.com":       "Name.com",
    "namesilo":       "NameSilo",
    "dynadot":        "Dynadot",
    "ionos":          "IONOS",
    "1&1":            "IONOS",
    "network solutions": "Network Solutions",
    "tucows":         "Tucows / Hover",
    "enom":           "eNom",
    "fastly":         "Fastly",
    "squarespace":    "Squarespace",
    "wix":            "Wix",
  };
  const lower = s.toLowerCase();
  for (const [key, display] of Object.entries(MAP)) {
    if (lower.includes(key)) return display;
  }
  // Title-case fallback (max 40 chars)
  return s.slice(0, 40).replace(/\b\w/g, c => c.toUpperCase());
}


// ══════════════════════════════════════════════════════════════════════════════
//  ACTION HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

// ─── whois_check ─────────────────────────────────────────────────────────────
async function handleWhoisCheck(body, cors) {
  const rawDomain = typeof body.domain === "string" ? body.domain.trim() : "";
  if (!rawDomain) return err("Missing domain", 400, cors);

  // Normalise — strip protocol, www, path
  const domain = rawDomain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();

  if (!domain.includes(".") || domain.length < 4)
    return err("Invalid domain", 400, cors);

  // Block private IPs
  if (PRIVATE_IP_RE.test(domain))
    return json({ registered: false, reason: "Private/loopback address." }, 200, cors);

  // Domain risk check first
  const risk = domainRiskLevel(domain);
  if (risk.level === "blocked")
    return json({ registered: false, reason: risk.reason }, 200, cors);

  const result = await lookupWhois(domain);

  // Attach risk level for frontend
  result.riskLevel = risk.level;      // "ok" | "high_risk"
  result.riskReason = risk.reason || null;

  // Flag too-new domains (< 90 days)
  if (result.domainAgeDays !== null && result.domainAgeDays < 90) {
    result.tooNew = true;
    result.tooNewReason = `Domain registered only ${result.domainAgeDays} days ago — listings require domains at least 90 days old.`;
  } else {
    result.tooNew = false;
    result.tooNewReason = null;
  }

  return json(result, 200, cors);
}


// ─── fetch_site_meta ─────────────────────────────────────────────────────────
async function handleFetchSiteMeta(body, cors) {
  const href = validateUrl(body.url);
  if (!href) return err("Invalid or missing url", 400, cors);

  const hostname = normalizeHostname(href);
  const domainRisk = domainRiskLevel(hostname);
  if (domainRisk.level === "blocked")
    return json({ title: null, description: null, fetchedAt: null, error: domainRisk.reason }, 200, cors);

  const meta = await scrapeSiteMeta(href);
  return json(meta, 200, cors);
}


// ─── validate_url ─────────────────────────────────────────────────────────────
async function handleValidateUrl(body, cors) {
  const href = validateUrl(body.url);
  if (!href) return err("Invalid or missing url", 400, cors);

  const hostname   = normalizeHostname(href);
  const domainRisk = domainRiskLevel(hostname);

  if (domainRisk.level === "blocked") {
    return json({ ok: false, reachable: false, isAdult: false, reason: domainRisk.reason }, 200, cors);
  }

  // Content policy check on the URL itself
  const policy = contentPolicyCheck(href, "", "");
  if (policy) {
    return json({
      ok: false, reachable: false,
      isAdult: policy.policy === "adult",
      reason: `URL contains prohibited content (${policy.policy}).`,
    }, 200, cors);
  }

  const reach = await checkReachability(href);

  if (!reach.reachable) {
    return json({
      ok: false, reachable: false, isAdult: false,
      reason: "The URL could not be reached. Make sure the site is live and publicly accessible.",
    }, 200, cors);
  }

  // Check the final (post-redirect) URL for policy violations
  if (reach.finalUrl && reach.finalUrl !== href) {
    const redirectPolicy = contentPolicyCheck(reach.finalUrl, "", "");
    if (redirectPolicy) {
      return json({
        ok: false, reachable: true,
        isAdult: redirectPolicy.policy === "adult",
        reason: `Redirected URL contains prohibited content (${redirectPolicy.policy}).`,
      }, 200, cors);
    }
    // Check redirected domain risk
    const redirectDomainRisk = domainRiskLevel(normalizeHostname(reach.finalUrl));
    if (redirectDomainRisk.level === "blocked") {
      return json({ ok: false, reachable: true, isAdult: false, reason: redirectDomainRisk.reason }, 200, cors);
    }
  }

  return json({
    ok: true, reachable: true, isAdult: false,
    reason: "URL is live and accessible.",
    httpStatus: reach.status,
    ...(domainRisk.level === "high_risk" && { warning: domainRisk.reason }),
  }, 200, cors);
}


// ─── review_listing ───────────────────────────────────────────────────────────
async function handleReviewListing(body, cors) {
  const {
    listing,
    codeFiles    = [],
    liveSiteMeta = null,
  } = body;

  if (!listing || typeof listing !== "object")
    return err("listing object is required", 400, cors);

  const title       = sanitize(listing.title       || "", 120);
  const url         = sanitize(listing.url         || "", 300);
  const description = sanitize(listing.description || "", 600);
  const category    = sanitize(listing.category    || "", 80);
  const age         = sanitize(listing.age         || "", 50);
  const price       = parseFloat(listing.price)    || 0;
  const revenue     = listing.revenue  != null ? parseFloat(listing.revenue)  : null;
  const expenses    = listing.expenses != null ? parseFloat(listing.expenses) : null;
  const traffic     = listing.traffic  != null ? parseInt(listing.traffic, 10) : null;

  const href = validateUrl(url);

  // ── LAYER 1: basic completeness ──────────────────────────────────────────
  if (!title || title.length < 5)
    return json({ status: "rejected", reason: "Title is missing or too short.", suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null }, 200, cors);

  if (!href)
    return json({ status: "rejected", reason: "URL is invalid.", suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null }, 200, cors);

  if (!description || description.length < 30)
    return json({ status: "rejected", reason: "Description is too short (minimum 30 characters).", suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null }, 200, cors);

  if (price < 1)
    return json({ status: "rejected", reason: "Asking price must be at least $1.", suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null }, 200, cors);

  // ── LAYER 2: content policy keyword check ────────────────────────────────
  const policy = contentPolicyCheck(href, title, description);
  if (policy) {
    const policyMessages = {
      adult:    "Listing contains adult or explicit content and cannot be published.",
      gambling: "Gambling-related listings are not permitted on Siterifty.",
      illegal:  "Listing appears to involve illegal services or products.",
      scam:     "Listing contains language associated with fraudulent schemes.",
    };
    return json({
      status:            "rejected",
      reason:            policyMessages[policy.policy] || "Listing violates content policy.",
      aiReviewStatus:    "rejected",
      aiReviewReason:    policyMessages[policy.policy],
      suggestedPrice:    null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null,
    }, 200, cors);
  }

  // ── LAYER 3: domain risk ──────────────────────────────────────────────────
  const hostname   = normalizeHostname(href);
  const domainRisk = domainRiskLevel(hostname);

  if (domainRisk.level === "blocked") {
    return json({
      status: "rejected", reason: domainRisk.reason,
      aiReviewStatus: "rejected", aiReviewReason: domainRisk.reason,
      suggestedPrice: null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null,
    }, 200, cors);
  }

  // ── LAYER 6: financial sanity ─────────────────────────────────────────────
  const finFlags = financialSanityCheck(price, revenue ?? 0, expenses ?? 0);
  const hasExtremeMultiple = finFlags.some(f => f.startsWith("price_multiple_extreme"));

  // ── LAYER 4 + 5: live site meta (already scraped by client OR rescrape here)
  // If the client passed liveSiteMeta, trust it; otherwise scrape now.
  let meta = liveSiteMeta;
  let metaFromServer = false;

  if (!meta || (!meta.title && !meta.description)) {
    try {
      meta = await scrapeSiteMeta(href);
      metaFromServer = true;
    } catch { meta = null; }
  }

  const ownership = ownershipCrossCheck(
    { title, description, url: hostname },
    meta,
  );

  // Collect all flags for the decision engine
  const allFlags = [
    ...ownership.flags,
    ...finFlags,
    ...(domainRisk.level === "high_risk" ? ["high_risk_tld"] : []),
  ];

  // ── DECISION ENGINE (AI-free baseline) ───────────────────────────────────
  //
  //  HARD REJECT (no AI needed):
  //   • title_mismatch + canonical_mismatch  → obvious wrong site
  //   • extreme price multiple               → fraud signal
  //
  //  FORCE PENDING_ADMIN (no AI needed):
  //   • live_meta_unavailable                → can't verify
  //   • ownership score < 30                 → weak match
  //   • high_risk_tld                        → elevated fraud domain
  //   • high price multiple (> 20x)          → unusual valuation
  //
  //  AI REVIEW eligible:
  //   • ownership score ≥ 30 AND no hard-block flags
  //
  let deterministicStatus = null;
  let deterministicReason = "";

  if (allFlags.includes("title_mismatch") && allFlags.includes("canonical_mismatch")) {
    deterministicStatus = "rejected";
    deterministicReason = "The submitted title and URL do not match the live website. Please verify you are listing the correct site.";
  } else if (hasExtremeMultiple) {
    deterministicStatus = "pending_admin";
    deterministicReason = "Asking price is more than 50× annual net profit — requires manual admin review.";
  } else if (allFlags.includes("live_meta_unavailable")) {
    deterministicStatus = "pending_admin";
    deterministicReason = "Could not fetch the live site to verify ownership. A Siterifty admin will review your listing.";
  } else if (ownership.score < 30) {
    deterministicStatus = "pending_admin";
    deterministicReason = "Ownership signals are weak — a Siterifty admin will cross-check your listing before it goes live.";
  } else if (allFlags.includes("high_risk_tld")) {
    deterministicStatus = "pending_admin";
    deterministicReason = "Listings on this TLD require manual admin verification.";
  }

  // Estimate price range (AI-free, deterministic)
  const priceEstimate = estimatePrice(price, revenue, expenses, traffic, category, age);

  // If we already have a hard deterministic decision, skip AI
  if (deterministicStatus === "rejected") {
    return json({
      status:            "rejected",
      reason:            deterministicReason,
      aiReviewStatus:    "rejected",
      aiReviewReason:    deterministicReason,
      ownershipScore:    ownership.score,
      ownershipFlags:    allFlags,
      suggestedPrice:    priceEstimate.mid,
      suggestedPriceMin: priceEstimate.min,
      suggestedPriceMax: priceEstimate.max,
      priceReason:       priceEstimate.reason,
    }, 200, cors);
  }

  if (deterministicStatus === "pending_admin") {
    // Still try AI in background for additional signals, but it cannot upgrade
    // a pending_admin to approved — safety first.
    let aiNote = "";
    try {
      const aiResult = await callGroq(AI_REVIEW_SYSTEM_PROMPT, buildAiUserContent({
        title, url: hostname, description, category, age, price, revenue, traffic, expenses,
        liveMeta: meta, ownershipFlags: allFlags,
      }), 500);
      // AI can only confirm pending_admin or upgrade to rejected — NEVER to approved
      if (aiResult.status === "rejected") {
        return json({
          status:            "rejected",
          reason:            aiResult.reason || deterministicReason,
          aiReviewStatus:    "rejected",
          aiReviewReason:    aiResult.reason,
          ownershipScore:    ownership.score,
          ownershipFlags:    allFlags,
          suggestedPrice:    null, suggestedPriceMin: null, suggestedPriceMax: null, priceReason: null,
        }, 200, cors);
      }
      aiNote = aiResult.reason || "";
    } catch (_) { /* AI unavailable — proceed with deterministic result */ }

    return json({
      status:            "pending_admin",
      reason:            deterministicReason + (aiNote ? ` (AI note: ${aiNote})` : ""),
      aiReviewStatus:    "pending_admin",
      aiReviewReason:    deterministicReason,
      ownershipScore:    ownership.score,
      ownershipFlags:    allFlags,
      suggestedPrice:    priceEstimate.mid,
      suggestedPriceMin: priceEstimate.min,
      suggestedPriceMax: priceEstimate.max,
      priceReason:       priceEstimate.reason,
    }, 200, cors);
  }

  // ── LAYER 8: Meta tag check (always deterministic, no AI, no tokens) ────────
  // Run this first regardless of AI availability. Find the first HTML file in
  // codeFiles and compare its <title> / meta description against the live site.
  // This is the primary ownership signal for the code-files proof path.
  const htmlFile = Array.isArray(codeFiles)
    ? codeFiles.find(f => {
        const name = (f.filename || "").toLowerCase();
        const snippet = String(f.content || "").slice(0, 500);
        return name.endsWith(".html") || name.endsWith(".htm")
            || /<html[\s>]/i.test(snippet)
            || /<title[\s>]/i.test(snippet);
      })
    : null;

  const metaCheck = htmlFile && meta
    ? metaTagOwnershipCheck(String(htmlFile.content || ""), meta)
    : null;

  // If meta tags match strongly enough, approve without any AI call.
  if (metaCheck?.approved && ownership.score >= 60) {
    return json({
      status:            "approved",
      reason:            `Ownership verified via meta tag match: ${metaCheck.reason}`,
      aiReviewStatus:    "approved",
      aiReviewReason:    metaCheck.reason,
      ownershipScore:    ownership.score,
      ownershipFlags:    allFlags,
      suggestedPrice:    priceEstimate.mid,
      suggestedPriceMin: priceEstimate.min,
      suggestedPriceMax: priceEstimate.max,
      priceReason:       priceEstimate.reason,
    }, 200, cors);
  }

  // ── LAYER 9: AI review — only called when meta tags couldn't decide ─────────
  // AI gets only lean listing metadata (title, url, description, category, price,
  // live site meta, ownership flags). Code files are NEVER sent to AI — they are
  // too large and will exhaust free-tier token budgets.
  let aiStatus = "pending_admin";
  let aiReason = metaCheck
    ? (metaCheck.approved
        ? `Meta tags matched but ownership score (${ownership.score}) too low for auto-approval — manual review required.`
        : `Meta tag mismatch: ${metaCheck.reason}`)
    : "No HTML file uploaded — AI review required for ownership verification.";
  let aiPriceMin = priceEstimate.min, aiPriceMax = priceEstimate.max, aiPriceReason = priceEstimate.reason;

  try {
    const aiResult = await callGroq(AI_REVIEW_SYSTEM_PROMPT, buildAiUserContent({
      title, url: hostname, description, category, age, price, revenue, traffic, expenses,
      liveMeta: meta, ownershipFlags: allFlags,
    }), 500);

    aiStatus = aiResult.status || "pending_admin";
    aiReason = aiResult.reason || "";

    // AI cannot auto-approve when ownership score < 60
    if (aiStatus === "approved" && ownership.score < 60) {
      aiStatus = "pending_admin";
      aiReason = "Ownership match score too low for auto-approval.";
    }

    if (aiResult.suggestedPriceMin) aiPriceMin = aiResult.suggestedPriceMin;
    if (aiResult.suggestedPriceMax) aiPriceMax = aiResult.suggestedPriceMax;
    if (aiResult.priceReason)       aiPriceReason = aiResult.priceReason;
  } catch (_) {
    // AI is down — stay with pending_admin (meta tags didn't match, nothing else to try)
    aiStatus = "pending_admin";
    aiReason = aiReason || "AI reviewer unavailable — sent to manual review (2–24 hrs).";
  }

  return json({
    status:            aiStatus,
    reason:            aiReason,
    aiReviewStatus:    aiStatus,
    aiReviewReason:    aiReason,
    ownershipScore:    ownership.score,
    ownershipFlags:    allFlags,
    suggestedPrice:    aiPriceMin && aiPriceMax ? Math.round((aiPriceMin + aiPriceMax) / 2) : priceEstimate.mid,
    suggestedPriceMin: aiPriceMin,
    suggestedPriceMax: aiPriceMax,
    priceReason:       aiPriceReason,
  }, 200, cors);
}


// ─── review_ad ───────────────────────────────────────────────────────────────
async function handleReviewAd(body, cors) {
  const { listing } = body;
  if (!listing || typeof listing !== "object")
    return err("listing object is required", 400, cors);

  const title    = sanitize(listing.title    || "", 120);
  const url      = sanitize(listing.url      || "", 300);
  const category = sanitize(listing.category || "", 80);
  const price    = parseFloat(listing.price) || 0;

  // Content policy — deterministic, no AI needed
  const policy = contentPolicyCheck(url, title, "");
  if (policy) {
    return json({
      review_status: "rejected",
      review_reason: `Ad rejected: ${policy.policy} content detected.`,
      admin_note:    "",
      cpm:           null,
      cpm_reason:    "Ad rejected due to policy violation.",
    }, 200, cors);
  }

  // Domain risk
  const href = validateUrl(url);
  if (!href) {
    return json({
      review_status: "rejected",
      review_reason: "Invalid URL.",
      admin_note: "", cpm: null, cpm_reason: "Invalid URL.",
    }, 200, cors);
  }
  const domainRisk = domainRiskLevel(normalizeHostname(href));
  if (domainRisk.level === "blocked") {
    return json({
      review_status: "rejected",
      review_reason: domainRisk.reason,
      admin_note: "", cpm: null, cpm_reason: "Blocked domain.",
    }, 200, cors);
  }

  // Deterministic CPM estimate (AI-free)
  const cpm = estimateCpm(category, price);

  // Try AI for enriched review
  const systemPrompt = `You are the ad-platform AI for Siterifty, a legitimate website marketplace.
Analyse the listing and return ONLY valid JSON:
{ "review_status": "approved"|"warning"|"rejected", "review_reason": "<one sentence>",
  "admin_note": "<empty unless warning>", "cpm": <float 0.80-8.00>, "cpm_reason": "<one sentence>" }
Rules: rejected=adult/gambling/illegal/scam; warning=vague/suspicious; approved=everything else.
CPM guide: SaaS $3-8, E-commerce $2.5-5, Blog $1.5-4, Directory $1.5-3.5, Other $0.8-3.`;

  let parsed;
  try {
    parsed = await callGroq(systemPrompt, JSON.stringify({ title, url, category, askingPrice: price }), 250);
    // Safety: AI cannot override a clean deterministic pass to rejected unless it has reason
    if (parsed.review_status === "rejected" && !policy) {
      // Keep AI rejection but flag it
    }
  } catch (_) {
    parsed = null;
  }

  return json({
    review_status: parsed?.review_status || "approved",
    review_reason: parsed?.review_reason || "Passed automated checks.",
    admin_note:    parsed?.admin_note    || (domainRisk.level === "high_risk" ? domainRisk.reason : ""),
    cpm:           parseFloat(parsed?.cpm) || cpm,
    cpm_reason:    parsed?.cpm_reason    || `Standard ${category || "Other"} rate.`,
  }, 200, cors);
}


// ══════════════════════════════════════════════════════════════════════════════
//  DETERMINISTIC PRICE ESTIMATOR (AI-free)
// ══════════════════════════════════════════════════════════════════════════════

function estimatePrice(askingPrice, revenue, expenses, traffic, category, age) {
  const catLower = (category || "").toLowerCase();
  let min = 0, max = 0, reason = "";

  const netMonthly = revenue > 0 ? Math.max(0, revenue - (expenses || 0)) : 0;
  const annualNet  = netMonthly * 12;

  if (annualNet > 0) {
    // Revenue-generating — use standard multiples
    let loMult = 2, hiMult = 4;
    if (catLower.includes("saas") || catLower.includes("tool"))   { loMult = 3; hiMult = 6; }
    if (catLower.includes("newsletter"))                           { loMult = 2; hiMult = 3; }
    if (catLower.includes("blog") || catLower.includes("content")) { loMult = 2.5; hiMult = 4; }
    if (catLower.includes("ecommerce") || catLower.includes("store")) { loMult = 2; hiMult = 4; }

    min = Math.round(annualNet * loMult);
    max = Math.round(annualNet * hiMult);
    reason = `Based on $${netMonthly.toFixed(0)}/mo net profit × ${loMult}–${hiMult}× annual multiple.`;
  } else if (traffic > 0) {
    // Traffic-only valuation
    const ppu = catLower.includes("saas") ? 2.5 : catLower.includes("blog") ? 1.5 : 1;
    min = Math.round(traffic * ppu * 0.7);
    max = Math.round(traffic * ppu * 1.5);
    reason = `Traffic-based estimate: $${(ppu * 0.7).toFixed(2)}–$${(ppu * 1.5).toFixed(2)} per monthly visitor.`;
  } else {
    // No financials — estimate conservatively
    const ageYears = parseAgeYears(age);
    const base = ageYears >= 3 ? 2000 : ageYears >= 1 ? 800 : 300;
    min = Math.round(base * 0.5);
    max = Math.round(base * 2.5);
    reason = "Conservative estimate — no revenue/traffic data provided.";
  }

  return {
    min,
    max,
    mid: Math.round((min + max) / 2),
    reason,
  };
}

function estimateCpm(category, price) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("saas") || cat.includes("tool"))  return price > 5000 ? 6.50 : 4.00;
  if (cat.includes("ecommerce") || cat.includes("store")) return price > 5000 ? 4.50 : 3.00;
  if (cat.includes("newsletter"))                    return 3.50;
  if (cat.includes("blog") || cat.includes("content")) return price > 3000 ? 3.00 : 2.00;
  if (cat.includes("directory"))                     return 2.50;
  if (cat.includes("community") || cat.includes("forum")) return 2.00;
  return 1.80;
}

function parseAgeYears(ageStr) {
  if (!ageStr) return 0;
  const s = ageStr.toLowerCase();
  if (s.includes("5") || s.includes("five") || s.includes(">4")) return 5;
  if (s.includes("3") || s.includes("three"))  return 3;
  if (s.includes("2") || s.includes("two"))    return 2;
  if (s.includes("1") || s.includes("one"))    return 1;
  return 0;
}


// ══════════════════════════════════════════════════════════════════════════════
//  META TAG EXTRACTOR — parse <title> and <meta name="description"> from HTML string
//  Used as the AI-free fallback for code-file ownership verification.
//  Only HTML files are useful here; CSS/JS have no meta tags.
// ══════════════════════════════════════════════════════════════════════════════

function extractMetaFromHtml(html) {
  if (typeof html !== "string" || !html.trim()) return { title: null, description: null };

  const get = (re) => {
    const m = html.match(re);
    return m?.[1]?.trim() || null;
  };

  const title =
       get(/<title[^>]*>([^<]{1,250})<\/title>/i)
    || get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,250})["']/i)
    || get(/<meta[^>]+content=["']([^"']{1,250})["'][^>]+property=["']og:title["']/i);

  const description =
       get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)
    || get(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i)
    || get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i)
    || get(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:description["']/i);

  return { title, description };
}

/**
 * AI-free ownership check via meta tag comparison.
 * Extracts <title> + <meta description> from the uploaded HTML file and
 * compares them to the scraped live site using Jaccard similarity.
 *
 * Returns { approved: bool, reason: string }
 */
function metaTagOwnershipCheck(uploadedHtml, liveMeta) {
  if (!liveMeta || (!liveMeta.title && !liveMeta.description)) {
    return { approved: false, reason: "Could not fetch live site meta tags for comparison." };
  }

  const fileMeta = extractMetaFromHtml(uploadedHtml);

  if (!fileMeta.title && !fileMeta.description) {
    return { approved: false, reason: "Uploaded HTML file contains no <title> or meta description tags — cannot verify ownership without AI." };
  }

  const titleSim = fileMeta.title && liveMeta.title
    ? jaccardSimilarity(fileMeta.title, liveMeta.title)
    : null;
  const descSim  = fileMeta.description && liveMeta.description
    ? jaccardSimilarity(fileMeta.description, liveMeta.description)
    : null;

  // Need at least one strong match (≥ 0.35 title OR ≥ 0.25 description)
  const titleMatch = titleSim !== null && titleSim >= 0.35;
  const descMatch  = descSim  !== null && descSim  >= 0.25;

  if (titleMatch || descMatch) {
    return {
      approved: true,
      reason: titleMatch
        ? `HTML title tag matches live site (similarity ${(titleSim * 100).toFixed(0)}%).`
        : `HTML meta description matches live site (similarity ${(descSim * 100).toFixed(0)}%).`,
    };
  }

  return {
    approved: false,
    reason: "Meta tags in uploaded HTML do not closely match the live site. Manual review required.",
  };
}


// ══════════════════════════════════════════════════════════════════════════════
//  AI PROMPT CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const AI_REVIEW_SYSTEM_PROMPT = `You are the listing-review AI for Siterifty, a legitimate website marketplace.
You are the LAST line of defence — deterministic security layers have already run.
Your job is ONLY to catch nuanced content policy violations and refine the price estimate.

IMPORTANT CONSTRAINTS:
- You may ONLY return "approved" if ownership_score >= 60 AND no mismatch flags are present.
- You may return "pending_admin" for borderline content or weak signals.
- You may return "rejected" for clear policy violations (adult, gambling, illegal, scam).
- When in doubt → return "pending_admin". NEVER approve a listing you are unsure about.
- The system has already blocked adult/gambling/illegal keywords. Focus on nuance.

Return ONLY valid JSON — no markdown, no commentary:
{
  "status": "approved"|"pending_admin"|"rejected",
  "reason": "<one concise sentence>",
  "suggestedPriceMin": <number|null>,
  "suggestedPriceMax": <number|null>,
  "priceReason": "<one sentence>"
}

Price guidance:
- Revenue-generating: 2–5× annual net (revenue minus expenses).
- SaaS/tool: 3–6× ARR.
- Traffic-only: $0.50–$3 per monthly unique visitor.
- Newsletters: 24–36× monthly revenue.
- Blogs/content: 30–40× monthly revenue.
- If rejected, return null for all price fields.`;

// codeFiles intentionally excluded — code files are huge and blow token budgets
// on free-tier Groq. Meta tag matching runs deterministically before AI is called,
// so AI never needs to see the uploaded files at all.
function buildAiUserContent({ title, url, description, category, age, price, revenue, traffic, expenses, liveMeta, ownershipFlags }) {
  const metaContext = liveMeta?.title || liveMeta?.description
    ? `Live title: "${liveMeta.title || "n/a"}"\nLive description: "${liveMeta.description || "n/a"}"`
    : "Live site meta unavailable.";

  return JSON.stringify({
    listing:        { title, url, description, category, age, askingPrice: price, monthlyRevenue: revenue, monthlyTraffic: traffic, monthlyExpenses: expenses },
    liveSiteMeta:   metaContext,
    ownershipFlags,
  });
}


// ══════════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════

export default async function handler(req) {
  const cors = buildCors(req);

  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });

  if (req.method !== "POST")
    return err("Method not allowed", 405, cors);

  // ── Rate limit ──────────────────────────────────────────────────────────
  const ip = req.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim()
          || req.headers?.get?.("x-real-ip")
          || "unknown";

  let body;
  try { body = await req.json(); }
  catch { return err("Invalid JSON body", 400, cors); }

  const action = typeof body?.action === "string" ? body.action : "";

  const rlErr = rateLimitCheck(ip, action);
  if (rlErr) return err(rlErr, 429, cors);

  // ── Route ───────────────────────────────────────────────────────────────
  try {
    switch (action) {
      case "review_listing":  return await handleReviewListing(body, cors);
      case "review_ad":       return await handleReviewAd(body, cors);
      case "validate_url":    return await handleValidateUrl(body, cors);
      case "fetch_site_meta": return await handleFetchSiteMeta(body, cors);
      case "whois_check":     return await handleWhoisCheck(body, cors);
      default:
        return err(`Unknown action "${action}". Valid: review_listing | review_ad | validate_url | fetch_site_meta | whois_check`, 400, cors);
    }
  } catch (e) {
    console.error("[sellmypage] Unhandled error:", e);
    return json({ error: "Internal server error." }, 500, cors);
  }
}

export const config = { runtime: "edge" };
