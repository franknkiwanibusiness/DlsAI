'use client';

import { Fragment } from 'react';
import useRevealSection from '@/lib/useRevealSection';

const STEPS = [
  {
    delay: '160ms',
    badgeBg: 'linear-gradient(135deg,#a855f7,#818cf8)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="12" rx="2" stroke="#fff" strokeWidth="1.3" />
        <path d="M4 6h8M4 9h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Seller lists the site',
    time: 'Day 1',
    desc: 'Set price, attach metrics, traffic data, and revenue proofs. Goes live to thousands of buyers instantly.',
    barWidth: '100%',
    barGradient: 'linear-gradient(90deg,#a855f7,#818cf8)',
    pipe: 'flow-pipe-1',
  },
  {
    delay: '240ms',
    badgeBg: 'linear-gradient(135deg,#818cf8,#a855f7)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="#fff" strokeWidth="1.3" />
        <path d="M2 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Buyer places offer',
    time: 'Day 1–3',
    desc: 'Funds locked in secure escrow — neither side can access them until the deal confirms.',
    barWidth: '80%',
    barGradient: 'linear-gradient(90deg,#818cf8,#a855f7)',
    pipe: 'flow-pipe-2',
  },
  {
    delay: '320ms',
    badgeBg: 'linear-gradient(135deg,#38bdf8,#818cf8)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 8h12M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Transfer & verification',
    time: 'Day 3–7',
    desc: 'Domain, codebase, and assets move to buyer. Both parties confirm delivery on-platform.',
    barWidth: '60%',
    barGradient: 'linear-gradient(90deg,#38bdf8,#818cf8)',
    pipe: 'flow-pipe-3',
  },
  {
    delay: '400ms',
    badgeBg: 'linear-gradient(135deg,#34d399,#38bdf8)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#fff" strokeWidth="1.3" />
        <path d="M8 4.5v7M5.5 6.5c0-1.1.9-2 2-2h1.5a2 2 0 0 1 0 4H7a2 2 0 0 0 0 4H9a2 2 0 0 0 2-2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Payout hits your wallet',
    time: 'Day 7–14',
    desc: 'Escrow releases to your Siterifty wallet instantly. Withdraw or reinvest in your next deal.',
    barWidth: '40%',
    barGradient: 'linear-gradient(90deg,#34d399,#38bdf8)',
    pipe: 'flow-pipe-4',
  },
  {
    delay: '480ms',
    badgeBg: 'linear-gradient(135deg,#fbbf24,#34d399)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="4.5" rx="1.5" stroke="#fff" strokeWidth="1.3" />
        <rect x="1" y="9" width="14" height="4.5" rx="1.5" stroke="#fff" strokeWidth="1.3" />
        <circle cx="3.5" cy="5.25" r=".9" fill="#fff" />
        <circle cx="3.5" cy="11.25" r=".9" fill="#fff" />
      </svg>
    ),
    title: 'Buyer activates hosting',
    time: 'Optional',
    desc: '$49.99/mo managed hosting stack — database, serverless, admin panel. Zero DevOps required.',
    barWidth: '20%',
    barGradient: 'linear-gradient(90deg,#fbbf24,#34d399)',
    pipe: null, // last step, no connecting pipe after it
  },
];

export default function Flow() {
  const { ref, isVisible } = useRevealSection();

  return (
    <div
      ref={ref}
      className={`flow-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="flowSection"
    >
      <p className="flow-label reveal-fade" style={{ '--reveal-delay': '0ms' }}>Deal pipeline</p>
      <h2 className="flow-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>From listing to payout</h2>
      <p className="flow-sub reveal-fade" style={{ '--reveal-delay': '140ms' }}>
        Five steps. Zero friction. Every deal tracked end-to-end on-platform.
      </p>

      <div className="flow-track">
        {STEPS.map((step, i) => (
          <Fragment key={i}>
            <div className="flow-step reveal-step" style={{ '--reveal-delay': step.delay }}>
              <div className="flow-timeline-col">
                <div className="flow-badge" style={{ background: step.badgeBg }}>
                  <div className="flow-badge-ring" />
                  {step.icon}
                </div>
              </div>
              <div className="flow-card">
                <div className="flow-card-head">
                  <div className="flow-card-title">{step.title}</div>
                  <span className="flow-card-time">{step.time}</span>
                </div>
                <div className="flow-card-desc">{step.desc}</div>
                <div className="flow-card-bar">
                  <div className="flow-card-bar-fill" style={{ width: step.barWidth, background: step.barGradient }} />
                </div>
              </div>
            </div>
            {step.pipe && <div className={`flow-pipe ${step.pipe}`} />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
