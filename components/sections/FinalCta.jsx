'use client';

import useRevealSection from '@/lib/useRevealSection';
import useCtaParticles from '@/lib/useCtaParticles';
import mergeRefs from '@/lib/mergeRefs';

function handleSellCta(e) {
  if (typeof window !== 'undefined' && window.handleSellCta) {
    window.handleSellCta(e);
  }
}
function handleBrowseCta(e) {
  if (typeof window !== 'undefined' && window.handleBrowseCta) {
    window.handleBrowseCta(e);
  }
}

export default function FinalCta() {
  const { ref: revealRef, isVisible } = useRevealSection();
  const { canvasRef, sectionRef: particleSectionRef } = useCtaParticles();

  return (
    <div
      ref={mergeRefs(revealRef, particleSectionRef)}
      className={`final-cta-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="finalCtaSection"
    >
      <canvas id="ctaParticles" ref={canvasRef} />
      <div className="final-cta-inner">
        <div className="final-cta-badge reveal-fade" style={{ '--reveal-delay': '0ms' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.03 2.09L9.5 3.5 7.75 5.21l.43 2.54L6 6.56l-2.18 1.19.43-2.54L2.5 3.5l2.47-.41Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          Start free · no credit card
        </div>

        <h2 className="final-cta-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>
          Your next deal is<br /><span className="grad">one listing away</span>
        </h2>

        <p className="final-cta-body reveal-fade" style={{ '--reveal-delay': '160ms' }}>
          Thousands of builders, indie hackers, and investors are already buying and selling on Siterifty. List your first site in under 3 minutes — free to start, no commitment.
        </p>

        <div className="final-cta-btns reveal-fade" style={{ '--reveal-delay': '240ms' }}>
          <a href="#" className="final-cta-btn-primary" onClick={handleSellCta}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="#fff" strokeWidth="1.3" />
              <path d="M4 5.5h6M4 8h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            List Your Site
          </a>
          <a href="#" className="final-cta-btn-ghost" onClick={handleBrowseCta}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Browse Listings
          </a>
        </div>

        <div className="final-cta-trust reveal-fade" style={{ '--reveal-delay': '320ms' }}>
          <div className="final-cta-trust-item">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5 8 4.7l3.5.51-2.5 2.44.59 3.44L6.5 9.4l-3.09 1.69.59-3.44L1.5 5.21l3.5-.51Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
            4.9 avg. seller rating
          </div>
          <div className="final-cta-trust-item">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="2" y="4" width="9" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
              <path d="M4.5 4V3a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            Escrow-protected deals
          </div>
          <div className="final-cta-trust-item">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
              <ellipse cx="6.5" cy="6.5" rx="2.2" ry="5.5" stroke="currentColor" strokeWidth="1" />
              <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1" />
            </svg>
            Sellers in 40+ countries
          </div>
          <div className="final-cta-trust-item">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v4l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            Avg. 7–14 days to close
          </div>
        </div>
      </div>
    </div>
  );
}
