'use client';

import useRevealSection from '@/lib/useRevealSection';
import useMarketStats from '@/lib/useMarketStats';
import useBtcPrice from '@/lib/useBtcPrice';
import { SITES, TYPE_ICONS, STATUSES } from './tickerData';

function TickerCard({ site, idx }) {
  const icon = TYPE_ICONS[site.type] || TYPE_ICONS.saas;
  const status = STATUSES[idx % STATUSES.length];
  const isSold = status === 'Sold';
  const isOffer = status === 'Under offer';
  const tagClass = isSold ? ' sold' : isOffer ? ' offer' : '';
  const barPct = isSold
    ? Math.floor(55 + ((idx * 7) % 45))
    : isOffer
      ? Math.floor(30 + ((idx * 11) % 30))
      : Math.floor(10 + ((idx * 5) % 20));
  const amtClass = isSold ? ' sold' : '';

  return (
    <div className="ticker-card">
      <div className="ticker-card-icon" style={{ background: icon.bg, border: `1px solid ${icon.border}` }}>
        {icon.svg}
      </div>
      <div className="ticker-card-body">
        <div className="ticker-card-name">{site.name}</div>
        <div className="ticker-card-meta">{site.niche} &middot; {site.rev}/mo</div>
        <div className="ticker-card-bar">
          <div className="ticker-card-bar-fill" style={{ width: `${barPct}%` }} />
        </div>
      </div>
      <div className="ticker-card-price">
        <div className={`ticker-card-amount${amtClass}`}>{site.price}</div>
        <div className={`ticker-card-tag${tagClass}`}>{status}</div>
      </div>
    </div>
  );
}

export default function Ticker() {
  const { ref, isVisible } = useRevealSection();
  const stats = useMarketStats();
  const { price: btcPrice, change: btcChange } = useBtcPrice();

  const half = Math.ceil(SITES.length / 2);
  const row1Sites = SITES.slice(0, half);
  const row2Sites = SITES.slice(half);
  // Doubled for seamless CSS marquee loop, matches original buildTicker()
  const row1Cards = [...row1Sites, ...row1Sites];
  const row2Cards = [...row2Sites, ...row2Sites];

  const buyersText = stats ? `${stats.a}k+` : '8k+';

  return (
    <div
      ref={ref}
      className={`ticker-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="tickerSection"
    >
      <div className="ticker-header">
        <div className="ticker-live-dot">Live market</div>
        <p className="ticker-label reveal-fade" style={{ '--reveal-delay': '0ms' }}>Recent activity</p>
        <h2 className="ticker-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>Sites changing hands right now</h2>
        <p className="ticker-sub reveal-fade" style={{ '--reveal-delay': '160ms' }}>
          Every deal is verified, escrowed, and completed on-platform. Watch the marketplace move in real time.
        </p>
      </div>

      {/* Row 1 */}
      <div className="ticker-track-wrap">
        <div className="ticker-track" id="tickerRow1">
          {row1Cards.map((s, i) => (
            <TickerCard key={i} site={s} idx={i} />
          ))}
        </div>
      </div>
      {/* Row 2 */}
      <div className="ticker-track-wrap" style={{ marginTop: '12px' }}>
        <div className="ticker-track ticker-track-2" id="tickerRow2">
          {row2Cards.map((s, i) => (
            <TickerCard key={i} site={s} idx={i + 3} />
          ))}
        </div>
      </div>

      {/* Market signal bar — data dashboard row */}
      <div className="ticker-signal-bar reveal-fade" style={{ '--reveal-delay': '300ms' }} id="tickerSignals">
        <div className="ticker-signal-item">
          <svg className="ticker-signal-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth="1.2" />
            <path d="M7 3.5v3.5l2 2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="ticker-signal-lbl">Avg close</span>
          <span className="ticker-signal-val">7–14d</span>
          <span className="ticker-signal-change up">↓ 2d</span>
        </div>
        <div className="ticker-signal-item">
          <svg className="ticker-signal-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="7" width="2.5" height="6" rx=".8" fill="#fff" />
            <rect x="5.5" y="4.5" width="2.5" height="8.5" rx=".8" fill="#fff" />
            <rect x="10" y="2" width="2.5" height="11" rx=".8" fill="#fff" />
          </svg>
          <span className="ticker-signal-lbl">Avg multiple</span>
          <span className="ticker-signal-val">2.4×</span>
          <span className="ticker-signal-change up">▲ 0.2</span>
        </div>
        <div className="ticker-signal-item">
          <svg className="ticker-signal-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#fff" strokeWidth="1.2" />
            <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="#fff" strokeWidth="1" />
            <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="#fff" strokeWidth="1" />
          </svg>
          <span className="ticker-signal-lbl">Active buyers</span>
          <span className="ticker-signal-val" id="tickerBuyers">{buyersText}</span>
          <span className="ticker-signal-change up">↑ Live</span>
        </div>
        <div className="ticker-signal-item">
          <svg className="ticker-signal-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5 8.4 4.4l3.1.45-2.25 2.19.53 3.1L7 8.62l-2.78 1.46.53-3.1L2.5 4.84l3.1-.45Z" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          <span className="ticker-signal-lbl">Seller rating</span>
          <span className="ticker-signal-val">4.9</span>
          <span className="ticker-signal-change up">+0.1</span>
        </div>
        <div className="ticker-signal-item">
          <svg className="ticker-signal-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10 L5 6 L8 8 L12 3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="ticker-signal-lbl">BTC signal</span>
          <span className="ticker-signal-val" id="btcPrice">{btcPrice}</span>
          <span className={`ticker-signal-change${btcChange ? (btcChange.up ? ' up' : ' dn') : ''}`} id="btcChange">
            {btcChange ? btcChange.text : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
