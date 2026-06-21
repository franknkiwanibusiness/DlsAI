'use client';

import useHeroTicker from '@/lib/useHeroTicker';
import useBgSkeleton from '@/lib/useBgSkeleton';

// These are defined globally on window by firebase.js (auth-gated CTA logic
// that redirects to /browse or /sell-my-site once signed in, or opens the
// auth modal otherwise). They stay as a window bridge for now since the
// underlying auth state hasn't been migrated to a React context yet —
// see the Next.js migration notes for that follow-up.
function handleBrowseCta(e) {
  if (typeof window !== 'undefined' && window.handleBrowseCta) {
    window.handleBrowseCta(e);
  }
}
function handleSellCta(e) {
  if (typeof window !== 'undefined' && window.handleSellCta) {
    window.handleSellCta(e);
  }
}

const AS_SEEN_ON = [
  { name: 'TechCrunch', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 5,8 7.5,8 5.5,15 12,7 9,7 11,1" fill="#a855f7" /></svg>
    ) },
  { name: 'Forbes', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.4)" strokeWidth="1" /><text x="4" y="12" fontFamily="Georgia,serif" fontSize="10" fontWeight="900" fontStyle="italic" fill="rgba(129,140,248,0.9)">F</text></svg>
    ) },
  { name: 'Entrepreneur', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#38bdf8" strokeWidth="1.3" fill="none" /><circle cx="8" cy="8" r="2.5" fill="#38bdf8" /></svg>
    ) },
  { name: 'Fast Company', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="5" x2="14" y2="5" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" /><line x1="4" y1="8.5" x2="14" y2="8.5" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" /><line x1="6" y1="12" x2="14" y2="12" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" /></svg>
    ) },
  { name: 'The Verge', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3 L8 13 L13 3" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
    ) },
  { name: 'Hacker News', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" fill="#a855f7" /><text x="4.5" y="12" fontFamily="Arial,sans-serif" fontSize="10" fontWeight="900" fill="white">Y</text></svg>
    ) },
  { name: 'Indie Hackers', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="#38bdf8" opacity="0.9" /><rect x="9" y="2" width="5" height="5" rx="1" fill="#38bdf8" opacity="0.5" /><rect x="2" y="9" width="5" height="5" rx="1" fill="#38bdf8" opacity="0.5" /><rect x="9" y="9" width="5" height="5" rx="1" fill="#38bdf8" opacity="0.9" /></svg>
    ) },
  { name: 'Product Hunt', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="rgba(129,140,248,0.5)" strokeWidth="1.2" fill="rgba(129,140,248,0.08)" /><path d="M5 5 L5 11 M5 5 L9 5 Q11 5 11 7.5 Q11 10 9 10 L5 10" stroke="rgba(129,140,248,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
    ) },
];

// Rendered twice in the track for a seamless CSS marquee loop, same as the original.
function AsSeenOnTrack() {
  return (
    <div className="aso-track" id="asoTrack">
      {[...AS_SEEN_ON, ...AS_SEEN_ON].map((item, i) => (
        <div className="aso-item" key={i}>
          {item.icon}
          <span className="aso-chip-name">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

const CREDITS = [
  'Escrow Protected',
  'Only 5% Platform Fee',
  'Fast & Easy Listing',
  '10,000+ Buyers',
  'Vetted Listings',
  'Secure Wallet',
];

export default function Hero() {
  const { text: tickerText, phase } = useHeroTicker();
  const { imgRef, loaded } = useBgSkeleton();

  return (
    <section className="hero">
      {/* Background image — 1:1 square anchored top-right, fades toward content */}
      <div className="hero-bg-img" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          id="srHeroBgImg"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10"
          alt="Siterifty marketplace — buy and sell websites, web templates and online businesses"
          loading="eager"
          fetchPriority="high"
          width="900"
          height="900"
        />
        <div className={`bg-img-skeleton${loaded ? ' is-loaded' : ''}`} id="srHeroBgSkeleton" />
      </div>

      {/* Ambient background elements */}
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-scan" aria-hidden="true" />

      {/* Text + CTA */}
      <div className="hero-content">
        <div className="hero-ticker" id="heroTicker">
          <span className="ticker-dot" />
          <div className="ticker-slot">
            <span className={`ticker-word ${phase}`} id="tickerWord">
              {tickerText}
            </span>
          </div>
        </div>

        <h1 className="hero-title">
          Buy &amp; sell websites<br />
          <span className="grad">&amp; web templates.</span>
          <span className="hero-title-line2">The marketplace built for indie hackers.</span>
        </h1>

        <p className="hero-sub">
          Where indie hackers, entrepreneurs, and investors trade websites. Vetted listings, secure escrow, lowest fees.
        </p>

        <div className="cta-row-wrap">
          <div className="cta-row">
            <a href="#" className="btn-primary" onClick={handleBrowseCta}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.8" cy="6.8" r="5" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                Browse Listings
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </a>
            <a href="#" className="btn-ghost" onClick={handleSellCta}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M7.5 10.5v-5M5 7.5l2.5-2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Sell My Website
              </span>
            </a>
          </div>

          {/* Decorative animation — fills empty space opposite CTAs */}
          <div className="hero-cta-deco" aria-hidden="true">
            <div className="credits-scroll">
              <div className="credits-track">
                {[...CREDITS, ...CREDITS].map((c, i) => (
                  <div className="credits-item" key={i}>{c}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AS SEEN ON (inline in hero) */}
        <div className="aso-section" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginTop: '8px', marginBottom: 0 }}>
          <p className="aso-label">Trusted by builders across</p>
          <div className="aso-track-wrap">
            <AsSeenOnTrack />
          </div>
        </div>
      </div>
    </section>
  );
}
