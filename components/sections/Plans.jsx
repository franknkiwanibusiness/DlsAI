'use client';

import { useState } from 'react';
import PlanCheckIcon from './PlanCheckIcon';
import { PLANS } from './planData';

// Auth-gated, calls into the not-yet-ported modal system
// (openPlansPickerModal / openUpgradeModal / openAuthModal), defined on
// window by script.js/firebase.js. Bridged for now — same pattern as
// Hero's handleBrowseCta/handleSellCta.
function handlePlanClick(planId) {
  if (typeof window !== 'undefined' && window.handlePlanClick) {
    window.handlePlanClick(planId);
  }
}

function Benefit({ item, icons }) {
  return (
    <div className="pc-benefit">
      <PlanCheckIcon stroke={icons.stroke} checkStroke={icons.check} />
      <span>
        {typeof item === 'string' ? item : (
          <>
            <strong>{item.strong}</strong>{item.rest}
          </>
        )}
      </span>
    </div>
  );
}

export default function Plans() {
  const [activeTab, setActiveTab] = useState('free');

  return (
    <div className="plans-section">
      <p className="plans-label">Seller Plans</p>
      <h2 className="plans-title">List sites. Earn more.</h2>

      {/* Mobile tab switcher */}
      <div className="plans-tabs-new" id="plansTabsNew">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            className={`plan-tab pt-${plan.id}${activeTab === plan.id ? ' active' : ''}`}
            data-plan={plan.id}
            onClick={() => setActiveTab(plan.id)}
          >
            {plan.name}
          </button>
        ))}
      </div>

      {/* Always-visible 4-col grid */}
      <div className="plans-grid-new" id="plansGridNew">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card-new ${plan.className}${activeTab === plan.id ? ' pc-tab-active' : ''}`}
            data-plan={plan.id}
          >
            {plan.badge && <span className={plan.badge.className}>{plan.badge.text}</span>}
            <p className="pc-name" style={plan.nameStyle || undefined}>{plan.name}</p>
            <div className="pc-price-row">
              <span className="pc-price-sup">$</span>
              <span className="pc-price">{plan.price}</span>
            </div>
            <p className="pc-per">{plan.per}</p>
            <div className="pc-divider" />
            <div className="pc-benefits">
              {plan.benefits.map((b, i) => (
                <Benefit key={i} item={b} icons={plan.icons} />
              ))}
            </div>
            <button className={plan.btnClassName} onClick={() => handlePlanClick(plan.id)}>
              {plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Hosting add-on */}
      <div className="hosting-card">
        <div className="hosting-card-icon">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <rect x="1.5" y="3.5" width="15" height="5" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
            <rect x="1.5" y="10.5" width="15" height="5" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
            <circle cx="4.5" cy="6" r="1" fill="rgba(255,255,255,0.5)" />
            <circle cx="4.5" cy="13" r="1" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
        <div>
          <div className="hosting-card-title">Managed hosting for your buyers</div>
          <div className="hosting-card-desc">
            When a buyer purchases your site, they can subscribe to our hosting plan at{' '}
            <strong style={{ color: 'rgba(255,255,255,0.75)' }}>$49.99/month</strong> — giving them database, serverless functions, and an admin dashboard to run their new site. You close the deal, they grow.
          </div>
        </div>
      </div>
    </div>
  );
}
