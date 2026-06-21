'use client';

import useRevealSection from '@/lib/useRevealSection';

export default function Orbit() {
  const { ref, isVisible } = useRevealSection();

  return (
    <div
      ref={ref}
      className={`orbit-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="orbitSection"
    >
      <p className="orbit-label reveal-fade" style={{ '--reveal-delay': '0ms' }}>
        Platform ecosystem
      </p>
      <h2 className="orbit-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>
        Everything orbits around your deal
      </h2>
      <p className="orbit-sub reveal-fade" style={{ '--reveal-delay': '140ms' }}>
        Buyers, sellers, escrow, and hosting — all connected through one unified platform.
      </p>

      <div className="orbit-wrap reveal-scale" style={{ '--reveal-delay': '200ms' }}>
        {/* Rings with sweep arcs */}
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-arc-1" />
        <div className="orbit-arc-2" />

        {/* Centre hub */}
        <div className="orbit-hub">
          <div className="orbit-hub-pulse" />
          <svg className="orbit-hub-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="url(#oh1)" strokeWidth="1.4" />
            <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="url(#oh1)" strokeWidth="1.2" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="url(#oh1)" strokeWidth="1.2" />
            <defs>
              <linearGradient id="oh1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
          <span className="orbit-hub-text">Siterifty</span>
        </div>

        {/* Inner arm — Seller + Buyer */}
        <div className="orbit-arm-1">
          <div className="orbit-node orbit-node-t">
            <svg className="orbit-node-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2h6l8 8-6 6-8-8V2Z" stroke="#a855f7" strokeWidth="1.3" strokeLinejoin="round" />
              <circle cx="5.5" cy="5.5" r="1.2" fill="#a855f7" />
            </svg>
            <span className="orbit-node-stat">1.2k</span>
            <span className="orbit-node-label">Sellers</span>
          </div>
          <div className="orbit-node orbit-node-b">
            <svg className="orbit-node-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6.5" r="3" stroke="#818cf8" strokeWidth="1.3" />
              <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="orbit-node-stat">9.4k</span>
            <span className="orbit-node-label">Buyers</span>
          </div>
        </div>

        {/* Outer arm — Escrow + Hosting */}
        <div className="orbit-arm-2">
          <div className="orbit-node orbit-node-t">
            <svg className="orbit-node-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="8" width="12" height="9" rx="2" stroke="#38bdf8" strokeWidth="1.3" />
              <path d="M6 8V5.5a3 3 0 1 1 6 0V8" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="9" cy="12.5" r="1.2" fill="#38bdf8" />
            </svg>
            <span className="orbit-node-stat">$2.1M</span>
            <span className="orbit-node-label">Escrow</span>
          </div>
          <div className="orbit-node orbit-node-b">
            <svg className="orbit-node-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="5" rx="1.5" stroke="#34d399" strokeWidth="1.3" />
              <rect x="2" y="10" width="14" height="5" rx="1.5" stroke="#34d399" strokeWidth="1.3" />
              <circle cx="4.5" cy="5.5" r="1" fill="#34d399" />
              <circle cx="4.5" cy="12.5" r="1" fill="#34d399" />
            </svg>
            <span className="orbit-node-stat">99.9%</span>
            <span className="orbit-node-label">Uptime</span>
          </div>
        </div>
      </div>

      {/* Data strip below diagram */}
      <div className="orbit-data-strip reveal-fade" style={{ '--reveal-delay': '380ms' }}>
        <div className="orbit-data-cell">
          <span className="orbit-data-val">2.4×</span>
          <span className="orbit-data-lbl">Avg multiple</span>
          <span className="orbit-data-badge">▲ 0.2</span>
        </div>
        <div className="orbit-data-cell">
          <span className="orbit-data-val">11d</span>
          <span className="orbit-data-lbl">Avg close</span>
          <span className="orbit-data-badge">▼ 2d</span>
        </div>
        <div className="orbit-data-cell">
          <span className="orbit-data-val">97%</span>
          <span className="orbit-data-lbl">Deal rate</span>
          <span className="orbit-data-badge">▲ 3%</span>
        </div>
        <div className="orbit-data-cell">
          <span className="orbit-data-val">43</span>
          <span className="orbit-data-lbl">Countries</span>
          <span className="orbit-data-badge">↑ Live</span>
        </div>
      </div>
    </div>
  );
}
