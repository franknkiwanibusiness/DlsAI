// api/stats.js — Siterifty Live Stats (zero Firebase reads from clients)
//
// Returns today's stats as { a, b, c } where:
//   a = sellers in thousands (e.g. 8.4 → displayed as "8.4k+")
//   b = sites listed in thousands
//   c = countries (whole number)
//
// Stats grow each day deterministically from a fixed baseline.
// The growth math, the baseline, and the increments all stay here —
// the browser only ever sees the final three numbers, with opaque keys.
//
// Sellers grow by 50–120/day (seeded from date, consistent within a day).
// Sites listed grow by 2× the sellers added that day.
// Countries stay fixed at a realistic but non-hardcoded value.
//
// No database. No state. Edge-compatible pure math.
// sessionStorage on the client means at most one hit per tab per calendar day.

export const config = { runtime: 'edge' };

// ── Baseline — what the counters started at on DAY_ZERO ──────────────────────
// DAY_ZERO = 2024-01-15 (arbitrary past date, internal only)
const DAY_ZERO_MS   = new Date('2024-01-15T00:00:00Z').getTime();
const BASE_SELLERS  = 5200;   // sellers on day zero
const BASE_SITES    = 7800;   // sites listed on day zero
const BASE_COUNTRIES = 142;   // countries on day zero (grows slowly)

// ── Seeded PRNG — mulberry32, deterministic from a seed ──────────────────────
function seeded(seed) {
    // Returns a function that produces floats in [0,1)
    let s = seed >>> 0;
    return function() {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export default async function handler(req) {
    if (req.method !== 'GET') {
        return resp({ error: 'Method not allowed' }, 405);
    }

    // ── How many days since DAY_ZERO? ────────────────────────────────────────
    const nowMs   = Date.now();
    const dayNum  = Math.floor((nowMs - DAY_ZERO_MS) / 86400000);

    // ── Accumulate growth day by day using a per-day seed ────────────────────
    // Each day adds between 50–120 sellers (random but seeded → same answer all day).
    // Sites listed adds 2× that day's seller gain.
    // Countries gains 0 or 1 every ~14 days.

    let sellers  = BASE_SELLERS;
    let sites    = BASE_SITES;
    let countries = BASE_COUNTRIES;

    for (let d = 0; d < dayNum; d++) {
        const rng        = seeded(d * 0xDEADBEEF + 0xC0FFEE);
        // sellers added today: 50–120, always a whole number
        const sellersGain = Math.floor(rng() * 71) + 50;   // [50, 120]
        const sitesGain   = sellersGain * 2;
        // countries: gain 1 every ~14 days (seeded so it doesn't jump erratically)
        const countryGain = rng() < (1 / 14) ? 1 : 0;

        sellers  += sellersGain;
        sites    += sitesGain;
        countries += countryGain;
    }

    // ── Format for display ───────────────────────────────────────────────────
    // a: sellers in k, 1 decimal  → e.g. 8412 → 8.4
    // b: sites in k, 1 decimal    → e.g. 12340 → 12.3
    // c: countries, whole number  → e.g. 178
    const a = Math.round(sellers  / 100) / 10;  // nearest 0.1k
    const b = Math.round(sites    / 100) / 10;
    const c = countries;

    return resp({ a, b, c }, 200, {
        // Cache for the rest of this UTC day on the CDN so repeated hits cost nothing
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    });
}

function resp(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...extraHeaders }
    });
}
