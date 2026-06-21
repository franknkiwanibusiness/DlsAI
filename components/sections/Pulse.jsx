'use client';

import useRevealSection from '@/lib/useRevealSection';
import useMarketStats from '@/lib/useMarketStats';

export default function Pulse() {
  const { ref, isVisible } = useRevealSection();
  const stats = useMarketStats();

  const sellersText = stats ? `${stats.a}k` : '—';
  const countriesText = stats ? `${stats.c}+` : '—';

  return (
    <div
      ref={ref}
      className={`pulse-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="pulseSection"
    >
      <p className="pulse-label reveal-fade" style={{ '--reveal-delay': '0ms' }}>
        Live marketplace
      </p>
      <h2 className="pulse-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>
        A market that never sleeps
      </h2>
      <p className="pulse-sub reveal-fade" style={{ '--reveal-delay': '140ms' }}>
        Real-time signals from every active listing, offer, and deal across the platform.
      </p>

      <div className="pulse-wrap reveal-scale" style={{ '--reveal-delay': '200ms' }}>
        {/* Radar sweep */}
        <div className="pulse-radar-sweep" />
        {/* Pulsing rings */}
        <div className="pulse-ring pulse-ring-1" />
        <div className="pulse-ring pulse-ring-2" />
        <div className="pulse-ring pulse-ring-3" />
        {/* Static guide rings */}
        <div className="pulse-guide pulse-guide-1" />
        <div className="pulse-guide pulse-guide-2" />

        {/* Animated connector lines SVG */}
        <svg className="pulse-svg" viewBox="0 0 340 340" fill="none">
          <line x1="170" y1="170" x2="170" y2="28" stroke="rgba(129,140,248,0.2)" strokeWidth="1" strokeDasharray="4 5" className="pulse-line-animated" />
          <line x1="170" y1="170" x2="312" y2="170" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="4 5" className="pulse-line-animated" style={{ animationDelay: '.3s' }} />
          <line x1="170" y1="170" x2="170" y2="312" stroke="rgba(52,211,153,0.2)" strokeWidth="1" strokeDasharray="4 5" className="pulse-line-animated" style={{ animationDelay: '.6s' }} />
          <line x1="170" y1="170" x2="28" y2="170" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="4 5" className="pulse-line-animated" style={{ animationDelay: '.9s' }} />
        </svg>

        {/* Centre hub */}
        <div className="pulse-hub">
          <span className="pulse-hub-live">LIVE</span>
          <svg className="pulse-hub-icon" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="13" width="4" height="7" rx="1" fill="url(#ph1)" />
            <rect x="9" y="8" width="4" height="12" rx="1" fill="url(#ph1)" />
            <rect x="16" y="4" width="4" height="16" rx="1" fill="url(#ph1)" />
            <defs>
              <linearGradient id="ph1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <span className="pulse-hub-text">Live</span>
        </div>

        {/* 4 stat nodes N/E/S/W */}
        <div className="pulse-node" style={{ top: '28px', left: '50%' }}>
          <svg className="pulse-node-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="2.5" stroke="#a855f7" strokeWidth="1.3" />
            <path d="M2 13c0-2.761 2.686-4.5 6-4.5s6 1.739 6 4.5" stroke="#a855f7" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className={`pulse-node-val${stats ? '' : ' skel'}`} id="pulseSellers">{sellersText}</span>
          <span className="pulse-node-lbl">Sellers</span>
          <span className="pulse-node-trend">▲ 12%</span>
        </div>

        <div className="pulse-node" style={{ top: '50%', left: '312px' }}>
          <svg className="pulse-node-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#818cf8" strokeWidth="1.3" />
            <path d="M8 4v8M6 5.5C6 4.67 6.895 4 8 4h.5C9.605 4 10.5 4.672 10.5 5.5s-.895 1.5-2 1.5h-.5c-1.105 0-2 .672-2 1.5s.895 1.5 2 1.5H9c1.105 0 2-.672 2-1.5" stroke="#818cf8" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span className="pulse-node-val">$2.1M</span>
          <span className="pulse-node-lbl">Volume</span>
          <span className="pulse-node-trend">▲ 8%</span>
        </div>

        <div className="pulse-node" style={{ top: '312px', left: '50%' }}>
          <svg className="pulse-node-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5l1.91 3.87L14 6.09l-3 2.92.71 4.12L8 11.17l-3.71 1.96.71-4.12L2 6.09l4.09-.72Z" stroke="#38bdf8" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="pulse-node-val">4.9</span>
          <span className="pulse-node-lbl">Rating</span>
          <span className="pulse-node-trend">▲ 0.1</span>
        </div>

        <div className="pulse-node" style={{ top: '50%', left: '28px' }}>
          <svg className="pulse-node-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#34d399" strokeWidth="1.3" />
            <ellipse cx="8" cy="8" rx="2.8" ry="6.5" stroke="#34d399" strokeWidth="1.1" />
            <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#34d399" strokeWidth="1.1" />
          </svg>
          <span className={`pulse-node-val${stats ? '' : ' skel'}`} id="pulseCountries">{countriesText}</span>
          <span className="pulse-node-lbl">Countries</span>
          <span className="pulse-node-trend">↑ Live</span>
        </div>
      </div>

      {/* KPI row below radar */}
      <div className="pulse-kpi-row reveal-fade" style={{ '--reveal-delay': '380ms' }}>
        <div className="pulse-kpi-card">
          <div className="pulse-kpi-val">7–14d</div>
          <div className="pulse-kpi-lbl">Avg close time</div>
        </div>
        <div className="pulse-kpi-card">
          <div className="pulse-kpi-val">5%</div>
          <div className="pulse-kpi-lbl">Min platform fee</div>
        </div>
        <div className="pulse-kpi-card">
          <div className="pulse-kpi-val">10k+</div>
          <div className="pulse-kpi-lbl">Verified buyers</div>
        </div>
      </div>
    </div>
  );
}
