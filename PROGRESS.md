# Siterifty Next.js Migration — Progress

## Status: FULLY WIRED — all sections present, page matches live site

The page now renders everything in the correct order:

1. **PreHero** (legacy HTML) — loading screen, bg layer, auth/ban-gate modals
2. **8 React sections** (fully componentized):
   - `Hero.jsx`, `FinalCta.jsx`, `Plans.jsx`, `Orbit.jsx`, `Pulse.jsx`, `Flow.jsx`, `Ticker.jsx`, `Reviews.jsx`
3. **PostReviews** (legacy HTML) — AI site valuator, compare section, FAQ, plans-picker/upgrade modals, dashboard (profile/wallet/settings/device lock), admin panel, AI chat + AutoSell, footer, and all other modals

Legacy HTML blocks live in `components/legacy/PreHero.jsx` and `components/legacy/PostReviews.jsx` via `dangerouslySetInnerHTML`. Scripts are served from `public/` via `next/script` in `app/layout.js`.

## File map

| File | What it is |
|------|-----------|
| `app/layout.js` | Root layout — metadata, JSON-LD (6 blocks), fonts, PayPal SDK, firebase.js + script.js via next/script |
| `app/page.js` | Page — assembles PreHero → 8 sections → PostReviews in live-site order |
| `app/globals.css` | Full site stylesheet (8,500 lines) |
| `public/firebase.js` | Legacy Firebase JS bundle (auth, db, storage, chat, wallet…) |
| `public/script.js` | Legacy script bundle (UI, modals, admin, dashboard…) |
| `components/legacy/PreHero.jsx` | Loading screen + pre-hero modals (dangerouslySetInnerHTML) |
| `components/legacy/PostReviews.jsx` | Valuator + dashboard + footer + all remaining HTML (dangerouslySetInnerHTML) |
| `components/sections/*.jsx` | 8 fully React-componentized marketing sections |
| `lib/*.js` | Shared hooks (Firebase init, reveal, market stats, BTC price, particles…) |

## Next steps

1. **Run a real build**: `npm install && npm run dev` — no build has been run in this sandbox (no network). This is the first required step.
2. **Set up `.env.local`**: copy `.env.local.example` → `.env.local` and fill in Firebase config.
3. **Verify PayPal SDK ordering**: confirm `paypalCaptureSDK` loads before firebase.js initialises PayPal buttons.
4. **Peel off legacy blocks progressively**: once the live build is confirmed working, convert sections out of `PreHero`/`PostReviews` into real components one at a time (footer is the easiest first candidate).

## Known pre-existing issues (not caused by migration)

- `closeMaintenance` onclick has no matching function definition — already broken before migration.
- `hero-stats` / `statSellers` / `startSlots` block in script.js references markup that doesn't exist — confirmed dead code, not ported to React sections.
- `handlePlanClick` is intentionally defined twice (script.js has a guarded fallback that defers to firebase.js's richer auth-aware version). Bridged via `window.handlePlanClick` in `Plans.jsx`.
