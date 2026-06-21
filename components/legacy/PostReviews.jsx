// Post-reviews legacy block: AI valuator, compare section, FAQ, plans modals,
// dashboard, admin panel, chat, footer, and all other modals.
// Sourced from index-remaining.html lines 604-5852.
// Rendered server-side; scripts run via layout.js's next/script tags.
export default function PostReviews() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `

    <!--  AI SITE VALUATOR — powered by GROQ  -->
    <div style="position:relative;z-index:1;padding:56px 20px;max-width:720px;margin:0 auto;border-top:1px solid var(--border);" class="reveal-section" id="valuatorSection">
        <p style="text-align:center;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;" class="reveal-fade" style="--reveal-delay:0ms">AI-powered</p>
        <h2 style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-.04em;color:var(--text);text-align:center;margin-bottom:8px;" class="reveal-fade" style="--reveal-delay:80ms">Get an instant site valuation</h2>
        <p style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:32px;line-height:1.65;" class="reveal-fade" style="--reveal-delay:130ms">Paste your site URL and our AI reads it automatically — or fill in the fields manually for a quick estimate.</p>
        <div style="background:linear-gradient(145deg,rgba(168,85,247,0.08),rgba(129,140,248,0.05));border:1px solid rgba(168,85,247,0.18);border-top:1px solid rgba(168,85,247,0.26);border-radius:20px;padding:28px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.15);" class="reveal-fade" style="--reveal-delay:180ms">
            <div style="display:flex;flex-direction:column;gap:14px;">
                <!-- URL field -->
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px;margin-bottom:8px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M11 6a5 5 0 01-5 5m0-10a5 5 0 015 5" stroke="rgba(168,85,247,0.6)" stroke-width="1.1" stroke-linecap="round"/></svg>Site URL <span style="color:rgba(168,85,247,0.6);font-size:9px;font-weight:500;letter-spacing:.04em;">· optional</span></label>
                    <div style="position:relative;">
                        <input id="valUrl" type="url" placeholder="https://example.com" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:11px 12px;font-size:13px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;::placeholder { color: rgba(255,255,255,0.15); }" onfocus="this.style.borderColor='rgba(168,85,247,0.35)';this.style.background='rgba(255,255,255,0.06)'" onblur="this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.04)'">
                        <div id="valUrlStatus" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);display:none;"></div>
                    </div>
                    <div id="valUrlNote" style="display:none;font-size:10px;color:#34d399;margin-top:6px;display:flex;align-items:center;gap:4px;">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#34d399" stroke-width="1"/><path d="M3 5l1.5 1.5L7 3.5" stroke="#34d399" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Site content fetched
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.15);font-size:10px;font-weight:600;letter-spacing:.04em;"><div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>OR ENTER MANUALLY<div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px;margin-bottom:8px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1v10" stroke="rgba(56,189,248,0.6)" stroke-width="1.1" stroke-linecap="round"/></svg>Monthly Revenue</label>
                        <input id="valRevenue" type="text" placeholder="$500" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:11px 12px;font-size:13px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;" onfocus="this.style.borderColor='rgba(168,85,247,0.35)';this.style.background='rgba(255,255,255,0.06)'" onblur="this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.04)'">
                    </div>
                    <div>
                        <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px;margin-bottom:8px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2h10v7H1z" stroke="rgba(52,211,153,0.6)" stroke-width="1.1"/><path d="M3 9h6" stroke="rgba(52,211,153,0.6)" stroke-width="1.1" stroke-linecap="round"/></svg>Monthly Traffic</label>
                        <input id="valTraffic" type="text" placeholder="12,000" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:11px 12px;font-size:13px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;" onfocus="this.style.borderColor='rgba(168,85,247,0.35)';this.style.background='rgba(255,255,255,0.06)'" onblur="this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.04)'">
                    </div>
                </div>
                <div>
                    <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px;margin-bottom:8px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10v6H1z" stroke="rgba(251,191,36,0.6)" stroke-width="1.1" stroke-linecap="round"/><circle cx="6" cy="6" r="1.5" stroke="rgba(251,191,36,0.6)" stroke-width="1"/></svg>Additional Context <span style="font-weight:400;color:rgba(139,138,168,0.6);font-size:9px;">optional</span></label>
                    <textarea id="valDesc" placeholder="e.g. SaaS, 2 years old, niche: project management..." rows="3" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:11px 12px;font-size:13px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;resize:none;line-height:1.55;transition:all .2s;" onfocus="this.style.borderColor='rgba(168,85,247,0.35)';this.style.background='rgba(255,255,255,0.06)'" onblur="this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.04)'"></textarea>
                </div>
                <button id="valBtn" onclick="runValuation()" style="width:100%;padding:14px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#818cf8);color:#fff;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;box-shadow:0 4px 16px rgba(168,85,247,0.25);" onmouseover="this.style.opacity='.88';this.style.boxShadow='0 6px 20px rgba(168,85,247,0.35)'" onmouseout="this.style.opacity='1';this.style.boxShadow='0 4px 16px rgba(168,85,247,0.25)'">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 1.62.88 3.03 2.18 3.79L5 13h6l-.68-3.21A4.5 4.5 0 0 0 12.5 6C12.5 3.51 10.49 1.5 8 1.5Z" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 13h4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>
                    Estimate Site Value
                </button>
            </div>
            <!-- Result box -->
            <div id="valResult" style="display:none;margin-top:18px;padding:16px;background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(56,189,248,0.06));border:1px solid rgba(52,211,153,0.25);border-radius:14px;">
                <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(52,211,153,0.7);margin-bottom:8px;display:flex;align-items:center;gap:5px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#34d399" stroke-width="1.2"/><path d="M3 6l2 2 4-4" stroke="#34d399" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Valuation Estimate</div>
                <div id="valResultText" style="font-size:13px;color:var(--text);line-height:1.7;font-weight:600;"></div>
            </div>
        </div>
    </div>

    <!--  WHY SITERIFTY — 3-col layout  -->
    <div style="position:relative;z-index:1;padding:52px 20px 56px;border-top:1px solid var(--border);" class="reveal-section" id="featuresSection">

        <!-- Centered header -->
        <p style="text-align:center;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;" class="reveal-fade">Why Siterifty</p>
        <h2 style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-.04em;color:var(--text);text-align:center;margin-bottom:6px;" class="reveal-fade">Built for serious digital dealmakers</h2>
        <p style="text-align:center;font-size:13px;color:var(--muted);max-width:480px;margin:0 auto 32px;line-height:1.65;" class="reveal-fade">Everything you need to buy, sell, and run websites — in one place. No middlemen. No fluff.</p>

        <!-- 3-column body -->
        <div class="wsf-outer reveal-fade">

            <!-- LEFT subsection -->
            <div class="wsf-side wsf-side-left">
                <div class="wsf-side-label" id="wsf-left-label">Trust &amp; Safety</div>
                <div class="wsf-side-anim" id="wsf-left-anim">
                    <span class="wsf-anim-item wsf-anim-active" id="wsf-la-0">Secure Escrow</span>
                    <span class="wsf-anim-item" id="wsf-la-1">Vetted Listings</span>
                    <span class="wsf-anim-item" id="wsf-la-2">Managed Hosting</span>
                    <span class="wsf-anim-item" id="wsf-la-3">Buyer Protection</span>
                </div>
                <p class="wsf-side-desc" id="wsf-left-desc">Funds held until both parties confirm. Every listing reviewed. Hosting included post-sale.</p>
            </div>

            <!-- CENTER 3×3 grid -->
            <div class="wsf-grid-wrap">
                <div class="wsf-grid" id="wsfGrid">
                    <!-- Cells populated by JS -->
                </div>
            </div>

            <!-- RIGHT subsection -->
            <div class="wsf-side wsf-side-right">
                <div class="wsf-side-label" id="wsf-right-label">Growth &amp; Speed</div>
                <div class="wsf-side-anim" id="wsf-right-anim">
                    <span class="wsf-anim-item wsf-anim-active" id="wsf-ra-0">Lowest Fees</span>
                    <span class="wsf-anim-item" id="wsf-ra-1">Fast Closings</span>
                    <span class="wsf-anim-item" id="wsf-ra-2">AI Support</span>
                    <span class="wsf-anim-item" id="wsf-ra-3">Global Reach</span>
                </div>
                <p class="wsf-side-desc" id="wsf-right-desc">5% on Pro. Deals in 14 days. Instant AI answers on listings and billing.</p>
            </div>

        </div><!-- /wsf-outer -->
    </div>

    

    

    <!--  LIVE ACTIVITY FEED — Firebase realtime  -->
    <div style="position:relative;z-index:1;" class="reveal-section" id="activitySection">
        <p style="text-align:center;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;" class="reveal-fade">Live marketplace</p>
        <h2 style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-.04em;color:var(--text);text-align:center;margin-bottom:6px;" class="reveal-fade">Real activity, right now</h2>
        <p style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:28px;" class="reveal-fade">Live feed of listings and deals happening on Siterifty.</p>
        <div id="activityFeed" style="max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:8px;" class="reveal-fade">
            <!-- Populated by Firebase -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
                <div style="width:8px;height:8px;border-radius:999px;background:#34d399;flex-shrink:0;"></div>
                <div style="flex:1;min-width:0;"><div style="font-size:13px;color:var(--text);">Loading live activity...</div></div>
            </div>
        </div>
        <div style="text-align:center;margin-top:16px;">
            <div id="activityCount" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:5px 14px;">
                <div style="width:6px;height:6px;border-radius:999px;background:#34d399;animation:typingPulse 1.4s ease-in-out infinite;"></div>
                Connecting to live feed...
            </div>
        </div>
    </div>

    <!--  FAQ  -->
    <!--  COMPARISON TABLE  -->
    <div class="compare-section reveal-section" id="compareSection">
        <div class="compare-header">
            <p class="compare-label reveal-fade" style="--reveal-delay:0ms">Why Siterifty</p>
            <h2 class="compare-title reveal-fade" style="--reveal-delay:80ms">The clear choice for serious sellers</h2>
            <p class="compare-sub reveal-fade" style="--reveal-delay:160ms">We built what the others won't — lower fees, faster deals, and hosting built in.</p>
        </div>
        <div class="compare-wrap reveal-fade" style="--reveal-delay:200ms">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th></th>
                        <th class="compare-col-us">Siterifty</th>
                        <th class="compare-col-other">Flippa</th>
                        <th class="compare-col-other">Empire Flippers</th>
                        <th class="compare-col-other">Motion Invest</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="compare-row">
                        <td>Platform fee</td>
                        <td class="us-col"><strong style="color:#34d399;">5–30%</strong></td>
                        <td>10–15% + listing fee</td>
                        <td>15–30%</td>
                        <td>15–35%</td>
                    </tr>
                    <tr class="compare-row">
                        <td>Listing fee</td>
                        <td class="us-col"><strong style="color:#34d399;">Free</strong></td>
                        <td>$29–$299</td>
                        <td class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg> Required</td>
                        <td>Free</td>
                    </tr>
                    <tr class="compare-row">
                        <td>Managed hosting for buyers</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                    </tr>
                    <tr class="compare-row">
                        <td>Secure escrow built-in</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-partial"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                    </tr>
                    <tr class="compare-row">
                        <td>Admin dashboard for buyers</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                    </tr>
                    <tr class="compare-row">
                        <td>Free to list</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                    </tr>
                    <tr class="compare-row">
                        <td>Avg. time to sell</td>
                        <td class="us-col"><strong style="color:#34d399;">7–14 days</strong></td>
                        <td>30–90 days</td>
                        <td>60–120 days</td>
                        <td>14–45 days</td>
                    </tr>
                    <tr class="compare-row">
                        <td>AI-assisted listing</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-partial"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                    </tr>
                    <tr class="compare-row">
                        <td>Wallet &amp; instant payout</td>
                        <td class="us-col"><span class="cmp-yes"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                        <td><span class="cmp-no"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>


    <div class="faq-section reveal-section" id="faqSection">
        <p class="faq-label reveal-fade" style="--reveal-delay:0ms">Got questions?</p>
        <h2 class="faq-title reveal-fade" style="--reveal-delay:80ms">Frequently asked</h2>

        <div class="faq-item reveal-fade" style="--reveal-delay:120ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                How does the escrow process work?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">When a buyer makes an offer, their funds are held securely in Siterifty escrow. Once you transfer the domain, codebase, and assets and the buyer confirms receipt, the funds are released to your wallet instantly. Neither party can access the funds during the transfer window.</div>
        </div>

        <div class="faq-item reveal-fade" style="--reveal-delay:150ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                What are the platform fees?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">Free plan: 30% fee. Starter ($20/mo): 15%. Growth ($40/mo): 10%. Pro ($50/mo): only 5%. Upgrading to Pro on even a single $500 sale saves you $125 in fees — more than covering your subscription cost.</div>
        </div>

        <div class="faq-item reveal-fade" style="--reveal-delay:180ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                What kinds of sites can I list?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">SaaS, content sites, newsletters, e-commerce, directories, tools, Chrome extensions, mobile apps, and more. If it generates revenue or has clear buyer value, it belongs on Siterifty. Listings go through a brief review to confirm the metrics are accurate.</div>
        </div>

        <div class="faq-item reveal-fade" style="--reveal-delay:210ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                How long does it take to close a deal?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">Most deals close within 7–14 days from first offer. Simple sites with clear metrics close faster. Complex technical transfers may take a few days longer. Our on-platform verification flow keeps both parties aligned throughout.</div>
        </div>

        <div class="faq-item reveal-fade" style="--reveal-delay:240ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                Can I buy a site without managing hosting myself?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">Yes. After purchase, you can subscribe to Siterifty Managed Hosting at $49.99/month. This gives you a fully managed stack — database, serverless functions, and an admin dashboard — with zero DevOps required. Pay from your wallet balance.</div>
        </div>

        <div class="faq-item reveal-fade" style="--reveal-delay:270ms">
            <button class="faq-q" onclick="toggleFaqMain(this)">
                Is my payment information secure?
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="faq-a">All transactions are processed by PayPal with 256-bit SSL encryption. Siterifty never stores your card details. Wallet top-ups are one-time payments with no recurring charges, and balances never expire.</div>
        </div>
    </div>


    <!--  FOOTER  -->
    <footer class="site-footer" role="contentinfo" aria-label="Site footer">
        <div class="footer-inner">

            <!--  TOP ROW: Brand + Newsletter  -->
            <div class="footer-top">

                <!-- Brand side -->
                <div>
                    <div style="display:flex;align-items:center;gap:9px;">
                        <div class="logo-icon-wrap" style="width:22px;height:22px;">
                            <div class="logo-icon-inner">
                                <svg width="22" height="22" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                                    <circle class="logo-spin-ring" cx="15" cy="15" r="12.5" fill="none" stroke="url(#hsg-foot)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="56 22"/>
                                    <text x="15" y="15" text-anchor="middle" dominant-baseline="central" font-family="'Syne', sans-serif" font-weight="800" font-size="13" fill="#fff">S</text>
                                    <defs><linearGradient id="hsg-foot" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>
                                </svg>
                            </div>
                        </div>
                        <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.05rem;letter-spacing:-.05em;color:var(--text);">Siterifty<span style="background:linear-gradient(135deg,#a855f7,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:400;">.com</span></span>
                    </div>
                    <p class="footer-brand-tagline">The premium marketplace to buy &amp; sell digital assets — websites, SaaS, apps, newsletters, and more. Secure escrow, verified metrics, and fair fees.</p>

                    <!-- Social Icons -->
                    <div class="footer-social-row" role="list" aria-label="Follow us on social media">
                        <!-- X / Twitter -->
                        <a href="https://x.com/siterifty" target="_blank" rel="noopener noreferrer" class="footer-social-btn" role="listitem" aria-label="Follow Siterifty on X (Twitter)" title="X / Twitter">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629Zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#8b8aa8"/></svg>
                        </a>
                        <!-- Facebook -->
                        <a href="https://facebook.com/siterifty" target="_blank" rel="noopener noreferrer" class="footer-social-btn" role="listitem" aria-label="Follow Siterifty on Facebook" title="Facebook">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#8b8aa8"/></svg>
                        </a>
                        <!-- Instagram -->
                        <a href="https://instagram.com/siterifty" target="_blank" rel="noopener noreferrer" class="footer-social-btn" role="listitem" aria-label="Follow Siterifty on Instagram" title="Instagram">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="#8b8aa8"/></svg>
                        </a>
                        <!-- Email -->
                        <a href="mailto:hello@siterifty.com" class="footer-social-btn" role="listitem" aria-label="Email Siterifty" title="Email us">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#8b8aa8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" stroke="#8b8aa8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </a>
                    </div>
                </div>

                <!-- Newsletter side -->
                <div>
                    <div class="footer-newsletter-label">Stay in the loop</div>
                    <p class="footer-newsletter-sub">Get weekly deal flow, platform updates, and exclusive marketplace insights straight to your inbox. No spam, ever.</p>
                    <div class="footer-newsletter-form" role="form" aria-label="Email newsletter signup">
                        <label for="footerEmailInput" style="position:absolute;clip:rect(0,0,0,0);pointer-events:none;">Email address</label>
                        <input
                            id="footerEmailInput"
                            type="email"
                            class="footer-newsletter-input"
                            placeholder="your@email.com"
                            autocomplete="email"
                            inputmode="email"
                            aria-label="Email address for newsletter"
                        >
                        <button class="footer-newsletter-btn" onclick="handleFooterSubscribe(event)" type="button" aria-label="Subscribe to newsletter">
                            Subscribe
                        </button>
                    </div>
                    <div class="footer-newsletter-success" id="footerSubSuccess" aria-live="polite" role="status">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="6.5" stroke="#34d399" stroke-width="1.2"/><path d="M4 7l2 2 4-4" stroke="#34d399" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        You're subscribed! Check your inbox.
                    </div>
                    <p class="footer-newsletter-note">By subscribing you agree to our <a href="https://siterifty.com/privacy" target="_blank" rel="noopener" style="color:rgba(139,138,168,0.65);text-decoration:underline;">Privacy Policy</a>. Unsubscribe at any time.</p>
                </div>

            </div><!-- /footer-top -->

            <!--  LINK COLUMNS  -->
            <nav class="footer-links-grid" aria-label="Footer navigation">

                <div class="footer-col">
                    <div class="footer-col-title">Marketplace</div>
                    <a href="#" onclick="handleBrowseCta(event)">Browse Listings</a>
                    <a href="#" onclick="handleSellCta(event)">List Your Site</a>
                    <a href="#" onclick="openAuthModal && openAuthModal()">Sign Up Free</a>
                    <a href="#" onclick="handleBrowseCta(event)">Verified Listings</a>
                    <a href="#" onclick="handleSellCta(event)">Seller Dashboard</a>
                </div>

                <div class="footer-col">
                    <div class="footer-col-title">Company</div>
                    <a href="https://siterifty.com/about" target="_blank" rel="noopener">About Us</a>
                    <a href="https://siterifty.com/blog" target="_blank" rel="noopener">Blog</a>
                    <a href="https://siterifty.com/careers" target="_blank" rel="noopener">Careers</a>
                    <a href="https://siterifty.com/press" target="_blank" rel="noopener">Press Kit</a>
                    <a href="mailto:partners@siterifty.com">Partnerships</a>
                </div>

                <div class="footer-col">
                    <div class="footer-col-title">Support</div>
                    <a href="https://siterifty.com/help">Help Center</a>
                    <a href="#" onclick="(function(){if(window._fbAuth&&window._fbAuth.currentUser){if(typeof openDash==='function'){openDash();setTimeout(function(){if(typeof switchTab==='function')switchTab('address');},120);}}else{if(typeof openAuthModal==='function')openAuthModal();}return false;})()" style="cursor:pointer;">Contact Support</a>
                    <a href="https://siterifty.com/how-it-works" target="_blank" rel="noopener">How It Works</a>
                    <a href="https://siterifty.com/escrow" target="_blank" rel="noopener">Escrow Process</a>
                    <a href="https://status.siterifty.com" target="_blank" rel="noopener">System Status</a>
                </div>

                <div class="footer-col">
                    <div class="footer-col-title">Legal</div>
                    <a href="https://siterifty.com/terms" target="_blank" rel="noopener">Terms of Service</a>
                    <a href="https://siterifty.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>
                    <a href="https://siterifty.com/cookies" target="_blank" rel="noopener">Cookie Policy</a>
                    <a href="https://siterifty.com/aup" target="_blank" rel="noopener">Acceptable Use</a>
                    <a href="https://siterifty.com/refunds" target="_blank" rel="noopener">Refund Policy</a>
                </div>

            </nav><!-- /footer-links-grid -->

            <!--  TRUST TICKER STRIP  -->
            <div class="footer-trust-strip" aria-hidden="true">
                <div class="footer-trust-track">
                    <!-- Set 1 -->
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2.5 3.5v4C2.5 10.1 4.4 12.1 7 13c2.6-.9 4.5-2.9 4.5-5.5v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
                        256-bit SSL Encrypted
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="4" width="11" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="8.25" r="1.2" fill="currentColor"/></svg>
                        Secure Escrow
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5C2 3.4 2.9 2.5 4 2.5h6c1.1 0 2 .9 2 2v.5H2v-.5z" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="5" width="10" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M5 8.5h4M5 10h2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        PayPal Payments
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        GDPR Compliant
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2.5 3.5v4C2.5 10.1 4.4 12.1 7 13c2.6-.9 4.5-2.9 4.5-5.5v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        CCPA Compliant
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L1.5 4v4.5C1.5 11 4 13 7 13.5 10 13 12.5 11 12.5 8.5V4L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 7h4M7 5v4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
                        No Hidden Fees
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3.5l2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Instant Escrow Release
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1 0 10 0A5 5 0 0 0 2 7z" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.5v3l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M9.5 2.5l1 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        24/7 Dispute Support
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3.5" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M2 6h10" stroke="currentColor" stroke-width="1.2"/><path d="M5 9h1.5M9 9H7.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        Verified Sellers
                    </span>
                    <span class="footer-trust-dot"></span>
                    <!-- Set 2 (duplicate for seamless loop) -->
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2.5 3.5v4C2.5 10.1 4.4 12.1 7 13c2.6-.9 4.5-2.9 4.5-5.5v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
                        256-bit SSL Encrypted
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="4" width="11" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="8.25" r="1.2" fill="currentColor"/></svg>
                        Secure Escrow
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5C2 3.4 2.9 2.5 4 2.5h6c1.1 0 2 .9 2 2v.5H2v-.5z" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="5" width="10" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M5 8.5h4M5 10h2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        PayPal Payments
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        GDPR Compliant
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2.5 3.5v4C2.5 10.1 4.4 12.1 7 13c2.6-.9 4.5-2.9 4.5-5.5v-4L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        CCPA Compliant
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L1.5 4v4.5C1.5 11 4 13 7 13.5 10 13 12.5 11 12.5 8.5V4L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 7h4M7 5v4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
                        No Hidden Fees
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3.5l2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Instant Escrow Release
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1 0 10 0A5 5 0 0 0 2 7z" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.5v3l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M9.5 2.5l1 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        24/7 Dispute Support
                    </span>
                    <span class="footer-trust-dot"></span>
                    <span class="footer-trust-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3.5" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M2 6h10" stroke="currentColor" stroke-width="1.2"/><path d="M5 9h1.5M9 9H7.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        Verified Sellers
                    </span>
                    <span class="footer-trust-dot"></span>
                </div>
            </div>

            <!--  BOTTOM BAR  -->
            <div class="footer-bottom">
                <p class="footer-copy-text">
                    &copy; 2026 Siterifty.com, Inc. All rights reserved. Siterifty operates a curated marketplace for buying and selling digital assets and online businesses. All transactions are facilitated through our secure escrow service. Users are responsible for conducting their own due diligence before completing any transaction.
                </p>
                <nav class="footer-bottom-links" aria-label="Legal links">
                    <a href="https://siterifty.com/terms" target="_blank" rel="noopener">Terms</a>
                    <a href="https://siterifty.com/privacy" target="_blank" rel="noopener">Privacy</a>
                    <a href="https://siterifty.com/cookies" target="_blank" rel="noopener">Cookies</a>
                    <a href="https://siterifty.com/aup" target="_blank" rel="noopener">Acceptable Use</a>
                    <a href="https://siterifty.com/refunds" target="_blank" rel="noopener">Refunds</a>
                    <a href="mailto:legal@siterifty.com">Legal</a>
                </nav>
            </div>

        </div><!-- /footer-inner -->
    </footer>

    



    

    
<!--  MESSAGES FAB — bottom left  -->
    <div class="msgs-fab" id="msgsFab" onclick="openMessagesModal()" title="Messages">
        <div class="msgs-fab-icon">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12v7.5a1.5 1.5 0 0 1-1.5 1.5H5.5L2 15.5V3.5Z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>
            <span class="msgs-fab-badge" id="msgsFabBadge"></span>
        </div>
        <div class="msgs-fab-text">
            <div class="msgs-fab-label">Messages</div>
            <div class="msgs-fab-sub" id="msgsFabSub">Buyer inquiries &amp; deals</div>
        </div>
    </div>

    <!--  MESSAGES MODAL (Inbox + Chat)  -->
    <div id="messagesOverlay">

        <div id="messagesModal">
            <input type="file" id="photoInput" accept="image/*" class="imsg-hidden" onchange="processFileSelection(this, 'image')">
            <input type="file" id="genericFileInput" accept="application/pdf, text/html" class="imsg-hidden" onchange="processFileSelection(this, 'document')">

            <!-- ── Inbox view ── -->
            <div id="imsgInboxView">
                <div id="imsgInboxBg"></div>
                <div class="imsg-inbox-header" style="position:relative;z-index:1;">
                    <div class="imsg-inbox-header-overlay"></div>
                    <div class="imsg-inbox-header-content">
                        <div class="imsg-row-between">
                            <div class="imsg-user-block">
                                <div class="imsg-avatar-ring">
                                    <div class="imsg-avatar-ring-inner" id="imsgMyAvatar">U</div>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:5px;">
                                    <div class="imsg-name-row">
                                        <span class="imsg-name" id="imsgMyUsername">@user</span>
                                        <span id="userTierBadge" class="imsg-tier-badge">Free Plan</span>
                                    </div>
                                    <button id="imsgUpgradeBtn" class="imsg-upgrade-btn" onclick="closeMessagesModal();openPlansPickerModal();" style="display:none;align-self:flex-start;">
                                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M3.5 6.5 7 3l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                        Upgrade
                                    </button>
                                </div>
                            </div>
                            <div class="imsg-close-btn" onclick="closeMessagesModal()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                            </div>
                        </div>

                        <div class="imsg-quota-card">
                            <div class="imsg-quota-row">
                                <span class="imsg-sim-label">Daily Message Quota</span>
                                <span style="color:#fff;"><span id="msgCounterDisplay" style="color:#58f278;">32</span> / <span id="msgLimitDisplay">50</span></span>
                            </div>
                            <div class="imsg-quota-track"><div id="msgProgressBar" class="imsg-quota-fill" style="width:64%;"></div></div>

                            <!-- View plan limits toggle -->
                            <div class="imsg-plans-toggle" onclick="(function(){var p=document.getElementById('imsgPlansPanel');var c=document.getElementById('imsgPlansChevron');p.classList.toggle('open');c.classList.toggle('open');})()">
                                <span class="imsg-plans-toggle-label">View plan limits</span>
                                <svg id="imsgPlansChevron" class="imsg-plans-toggle-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </div>

                            <div class="imsg-plans-panel" id="imsgPlansPanel">
                                <div class="imsg-plans-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;">

                                    <!-- Free -->
                                    <div class="imsg-plan-col">
                                        <div class="imsg-plan-col-name">Free</div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Messages</div>
                                            <div class="imsg-plan-stat-val">50/day</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:1%;background:linear-gradient(90deg,#10b981,#a3e635);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Images</div>
                                            <div class="imsg-plan-stat-val">3/hr</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:10%;background:linear-gradient(90deg,#38bdf8,#818cf8);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">File size</div>
                                            <div class="imsg-plan-stat-val">1 MB</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:33%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
                                        </div>
                                    </div>

                                    <!-- Starter -->
                                    <div class="imsg-plan-col">
                                        <div class="imsg-plan-col-name">Starter</div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Messages</div>
                                            <div class="imsg-plan-stat-val">500/day</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:10%;background:linear-gradient(90deg,#10b981,#a3e635);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Images</div>
                                            <div class="imsg-plan-stat-val">10/hr</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:33%;background:linear-gradient(90deg,#38bdf8,#818cf8);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">File size</div>
                                            <div class="imsg-plan-stat-val">3 MB</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
                                        </div>
                                    </div>

                                    <!-- Growth (highlighted) -->
                                    <div class="imsg-plan-col highlight">
                                        <div class="imsg-plan-col-name">Growth</div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Messages</div>
                                            <div class="imsg-plan-stat-val">1,500/day</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:60%;background:linear-gradient(90deg,#10b981,#a3e635);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Images</div>
                                            <div class="imsg-plan-stat-val">20/hr</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:66%;background:linear-gradient(90deg,#38bdf8,#818cf8);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">File size</div>
                                            <div class="imsg-plan-stat-val">3 MB</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
                                        </div>
                                    </div>

                                    <!-- Pro -->
                                    <div class="imsg-plan-col">
                                        <div class="imsg-plan-col-name">Pro</div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Messages</div>
                                            <div class="imsg-plan-stat-val">5,000/day</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:100%;background:linear-gradient(90deg,#10b981,#a3e635);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">Images</div>
                                            <div class="imsg-plan-stat-val">30/hr</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:100%;background:linear-gradient(90deg,#38bdf8,#818cf8);"></div></div>
                                        </div>
                                        <div class="imsg-plan-stat">
                                            <div class="imsg-plan-stat-label">File size</div>
                                            <div class="imsg-plan-stat-val">3 MB</div>
                                            <div class="imsg-plan-stat-bar-wrap"><div class="imsg-plan-stat-bar" style="width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="imsg-thread-list" id="imsgThreadList">
                    <div class="imsg-thread-row imsg-thread-row-pinned" id="imsgGroupChatRow" onclick="openGroupsPicker()" style="border-color:rgba(168,85,247,0.25);background:rgba(168,85,247,0.05);">
                        <div class="imsg-thread-avatar-wrap">
                            <div class="imsg-thread-avatar" style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#38bdf8);flex-shrink:0;">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                        </div>
                        <div class="imsg-thread-body">
                            <div class="imsg-thread-top">
                                <h4 class="imsg-thread-name" style="display:flex;align-items:center;gap:5px;">
                                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;opacity:0.6;"><path d="M8 1.5 9.3 4.4l3.2.46-2.3 2.24.54 3.18L8 8.74l-2.84 1.54.54-3.18L3.4 4.86l3.2-.46Z" fill="rgba(168,85,247,0.8)"/></svg>
                                    SITERIFTY GROUPS
                                </h4>
                                <span class="imsg-thread-time" id="imsgGroupChatTime"></span>
                            </div>
                            <p class="imsg-thread-preview" id="imsgGroupChatPreview">Tap to browse groups — say hi 👋</p>
                        </div>
                    </div>
                    <div class="imsg-thread-empty" id="imsgThreadEmpty" style="display:none;padding:32px 0;text-align:center;color:var(--muted,#6b6890);font-size:13px;">No messages yet.</div>
                </div>
            </div>

            <!-- ── Siterifty Groups picker sheet ── -->
            <div id="groupsPickerOverlay" onclick="if(event.target===this) closeGroupsPicker()">
                <div class="gp-sheet">
                    <div class="gp-sheet-header">
                        <div class="gp-sheet-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            SITERIFTY GROUPS
                        </div>
                        <button class="gp-sheet-close" onclick="closeGroupsPicker()">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div class="gp-sheet-body" id="groupsPickerBody">
                        <!-- Populated by renderGroupsPicker() -->
                    </div>
                </div>
            </div>

            <!-- ── Chat view ── -->
            <div id="imsgChatView">
                <div class="imsg-chat-header">

                    <div class="imsg-chat-header-img" aria-hidden="true">
                        <img id="imsgChatHeaderImg" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10" alt="" loading="lazy">
                        <div class="bg-img-skeleton" id="imsgChatHeaderSkeleton"></div>
                    </div>
                    <div class="imsg-chat-header-overlay"></div>
                    <div class="imsg-chat-header-content">
                        <div class="imsg-row-between" style="margin-bottom:0;">
                            <div class="imsg-chat-target">
                                <button onclick="closeChat()" class="imsg-chat-back">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                                </button>
                                <img id="chatAvatar" class="imsg-chat-avatar" src="" alt="">
                                <div>
                                    <div class="imsg-chat-name-row">
                                        <h4 id="chatTargetName" class="imsg-chat-name"></h4>
                                        <div class="imsg-chat-online-dot"></div>
                                    </div>
                                    <span id="chatTargetStatus" class="imsg-chat-status"></span>
                                </div>
                            </div>
                            <button onclick="openDonateModal(_currentChatUid, _currentChatName, _currentChatPhoto)" class="imsg-donate-btn" id="imsgDonateBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:3px;vertical-align:-1px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v13.5m0-13.5a2.25 2.25 0 1 0-2.25-2.25v.75M12 8.25a2.25 2.25 0 1 0 2.25-2.25v.75M5.106 8.25H18.894a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5H5.106a1.5 1.5 0 0 1-1.5-1.5v-1.5a1.5 1.5 0 0 1 1.5-1.5Zm.394 4.5h12v8.25a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V12.75Z"/></svg> DONATE</button>
                        </div>
                        <div class="imsg-merchant-row" id="imsgMerchantRow">
                            <span class="imsg-merchant-label">Verified Marketplace Merchant</span>
                            <span class="as-chat-badge" id="asChatBadge"><svg width="9" height="9" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> AI Active</span>
                            <button onclick="viewChatSeller()" class="imsg-view-seller-btn">VIEW SELLER</button>
                        </div>
                    </div>
                </div>

                <div id="dealStickyBanner" class="imsg-deal-sticky">
                    <span class="imsg-deal-sticky-icon" id="dealStickyIcon"></span>
                    <div class="imsg-deal-sticky-text">
                        <div id="dealStickyMain"><strong>Deal pending</strong></div>
                        <div class="imsg-deal-sticky-sub" id="dealStickySub"></div>
                    </div>
                    <span id="dealStickyCountdown" class="imsg-deal-sticky-countdown" style="display:none;"></span>
                    <button id="dealStickyViewBtn" onclick="viewDealStickyPlaceholder()" class="imsg-deal-sticky-view" style="display:none;">View</button>
                </div>

                <div id="imsgChatBg" style="position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>
                <div id="chatMessagesContent" style="position:relative;z-index:1;">
                    <!-- messages loaded dynamically from Firebase inbox -->
                </div>

                <div class="imsg-action-bar" id="imsgActionBar">
                    <button onclick="openDealSelectionModal('send')" class="imsg-action-btn send-deal"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:4px;vertical-align:-1px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.1a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-4.1M16 6.5l-4-4-4 4m4-4v12.5"/></svg>SEND A DEAL</button>
                    <button onclick="openDealSelectionModal('request')" class="imsg-action-btn request-deal"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:4px;vertical-align:-1px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 17.5v-12.5l4 4 4-4v12.5M4 19.5h16"/></svg>REQUEST DEAL</button>
                </div>

                <div id="dropUpMenu" class="imsg-dropup-menu">
                    <button onclick="triggerInput('photoInput')" class="imsg-dropup-item">
                        <span>UPLOAD PHOTO</span>
                        <span class="imsg-dropup-item-sub">Images Stream Tracker</span>
                    </button>
                    <button onclick="openModernLinkModal()" class="imsg-dropup-item">
                        <span>SHARE LINK PREVIEW</span>
                        <span class="imsg-dropup-item-sub">Live Hyperlink Embed</span>
                    </button>
                    <button onclick="triggerInput('genericFileInput')" class="imsg-dropup-item">
                        <span>UPLOAD DOCUMENT / PAGE</span>
                        <span class="imsg-dropup-item-sub">PDF or .HTML Files</span>
                    </button>
                    <button onclick="document.getElementById('dropUpMenu').classList.remove('open');openAutoSellModal();" class="imsg-dropup-item" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;padding-top:14px;">
                        <span style="display:flex;align-items:center;gap:7px;"><svg width="11" height="11" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#30d158" stroke-width="1.8"/><path d="M7 10l2 2 4-4" stroke="#30d158" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>AUTOSELL SETTINGS</span>
                        <span class="imsg-dropup-item-sub">GitHub repo + AI auto-replies</span>
                    </button>
                </div>

                <div id="msgReportMenu" class="imsg-msg-report-menu">
                    <button onclick="reportCurrentMessage()" class="imsg-msg-report-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 4.5c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                        Report message
                    </button>
                </div>

                <div class="imsg-composer" id="imsgComposer">
                    <button onclick="toggleDropUp()" class="imsg-plus-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    </button>
                    <input type="text" id="chatTextMessageInput" placeholder="Type a message secure..." class="imsg-text-input">
                    <button onclick="sendStandardTextMessage()" class="imsg-send-btn" id="imsgSendBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/></svg>
                    </button>
                </div>
                <div class="imsg-composer" id="imsgComposerMediaOnly" style="display:none;justify-content:center;">
                    <button onclick="toggleDropUp()" class="gp-media-only-btn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Attach a photo, file, or link
                    </button>
                </div>
            </div>

            <!-- ── Deal selection sheet ── -->
            <div id="listingSelectionModal" class="imsg-sheet-overlay">
                <div class="imsg-sheet">
                    <div class="imsg-sheet-head">
                        <div>
                            <h3 id="dealModalTitle" class="imsg-sheet-title">Select Deal Item</h3>
                            <p class="imsg-sheet-sub">Choose an active asset marketplace listing</p>
                        </div>
                        <button onclick="closeDealSelectionModal()" class="imsg-sheet-close">Close</button>
                    </div>
                    <div class="imsg-sheet-list" id="mockListingsContainer"></div>
                </div>
            </div>

            <!-- ── Payment confirm modal ── -->
            <!-- ── iOS Deal Approval Popup ── -->
            <div id="paymentProcessingModal" class="imsg-center-modal" onclick="if(event.target===this)closePaymentModal()" style="background:rgba(0,0,0,0.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:none;position:fixed;inset:0;z-index:9999;justify-content:center;align-items:center;padding:20px;">
                <div style="background:rgba(28,28,30,0.92);border:1px solid rgba(255,255,255,0.1);width:100%;max-width:440px;max-height:85vh;border-radius:22px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);position:relative;scrollbar-width:none;">

                    <!-- Sticky header -->
                    <div style="position:sticky;top:0;z-index:10;background:rgba(20,20,25,0.96);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:0.5px solid rgba(255,255,255,0.12);padding:14px 16px 14px;display:flex;align-items:center;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">
                        <!-- pill handle centered above header -->
                        <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);width:36px;height:4px;background:rgba(255,255,255,0.25);border-radius:2px;"></div>
                        <!-- left spacer to balance close btn -->
                        <div style="width:32px;"></div>
                        <!-- title -->
                        <div style="display:flex;align-items:center;gap:7px;margin-top:4px;">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="#30d158" stroke-width="1.4"/><path d="M5.3 8.2l1.8 1.8 3.6-4" stroke="#30d158" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <span style="color:#fff;font-size:1rem;font-weight:600;letter-spacing:-0.2px;">Deal Approved</span>
                        </div>
                        <!-- close button -->
                        <button onclick="closePaymentModal()" title="Close" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;margin-top:4px;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.18)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
                        </button>
                    </div>

                    <!-- Listing image -->
                    <div style="position:relative;width:100%;padding-top:56.25%;background:#1c1c1e;">
                        <img id="dealApprovalImg" src="" alt="Listing" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">
                    </div>

                    <!-- Body -->
                    <div style="padding:24px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">
                        <h2 id="dealApprovalTitle" style="font-size:1.4rem;font-weight:700;color:#fff;letter-spacing:-0.4px;margin-bottom:8px;"></h2>
                        <p id="dealApprovalDesc" style="font-size:0.925rem;color:#8e8e93;line-height:1.45;margin-bottom:20px;max-width:95%;"></p>

                        <button onclick="closePaymentModal()" style="background:rgba(255,255,255,0.1);color:#0a84ff;border:none;padding:10px 20px;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:inherit;">View Listing</button>

                        <hr style="width:100%;border:0;border-top:0.5px solid rgba(255,255,255,0.15);margin:20px 0;">

                        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#8e8e93;margin-bottom:14px;font-weight:500;">Financial Breakdown</div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;">
                            <div style="background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 6px;display:flex;flex-direction:column;gap:6px;">
                                <span style="font-size:0.725rem;color:#aeaeac;font-weight:500;">Mo. Revenue</span>
                                <span id="dealApprovalRevenue" style="font-size:1rem;font-weight:600;letter-spacing:-0.2px;color:#fff;"></span>
                            </div>
                            <div style="background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 6px;display:flex;flex-direction:column;gap:6px;">
                                <span style="font-size:0.725rem;color:#aeaeac;font-weight:500;">Mo. Expenses</span>
                                <span id="dealApprovalExpenses" style="font-size:1rem;font-weight:600;letter-spacing:-0.2px;color:#ff453a;"></span>
                            </div>
                            <div style="background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 6px;display:flex;flex-direction:column;gap:6px;">
                                <span style="font-size:0.725rem;color:#aeaeac;font-weight:500;">Mo. Profit</span>
                                <span id="dealApprovalProfit" style="font-size:1rem;font-weight:600;letter-spacing:-0.2px;color:#30d158;"></span>
                            </div>
                        </div>

                        <hr style="width:100%;border:0;border-top:0.5px solid rgba(255,255,255,0.15);margin:20px 0;">

                        <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
                            <span style="font-size:0.85rem;color:#8e8e93;font-weight:500;margin-bottom:4px;">Asking Price</span>
                            <div id="dealApprovalPrice" style="font-size:2.1rem;font-weight:700;color:#fff;letter-spacing:-0.5px;margin-bottom:24px;"></div>

                            <div style="background:rgba(255,214,10,0.12);border:0.5px solid rgba(255,214,10,0.3);border-radius:12px;padding:12px 14px;margin-bottom:16px;width:100%;display:flex;align-items:flex-start;gap:10px;text-align:left;">
                                <span style="flex-shrink:0;margin-top:1px;display:inline-flex;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2v3.8c0 3.4-2.3 5.6-5.5 6.7-3.2-1.1-5.5-3.3-5.5-6.7V3.5L8 1.5z" stroke="#ffd60a" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.6 8.1l1.7 1.7 3.1-3.6" stroke="#ffd60a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                                <span style="color:#ffd60a;font-size:0.825rem;line-height:1.4;font-weight:400;">To prevent fraud, funds are safely held in escrow and will not be transferred to the seller until the deal is fully finalized.</span>
                            </div>

                            <button onclick="executeWalletDeduction()" style="background:linear-gradient(135deg,rgba(10,132,255,0.8),rgba(0,112,227,0.4));color:#fff;border:1px solid rgba(255,255,255,0.25);padding:14px 24px;border-radius:14px;font-size:1rem;font-weight:600;width:100%;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 24px 0 rgba(10,132,255,0.3),inset 0 1px 1px rgba(255,255,255,0.3);transition:all .2s ease;font-family:inherit;" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 30px 0 rgba(10,132,255,0.45),inset 0 1px 1px rgba(255,255,255,0.4)';" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 24px 0 rgba(10,132,255,0.3),inset 0 1px 1px rgba(255,255,255,0.3)';" onmousedown="this.style.transform='translateY(1px) scale(0.99)';" onmouseup="this.style.transform='';">Pay Now</button>
                        </div>
                    </div>

                </div>
                <!-- hidden legacy ids so existing JS still finds them -->
                <span id="paymentValueDisplay" style="display:none;"></span>
                <span id="paymentDescription" style="display:none;"></span>
            </div>

            <!-- ── Link embed sheet ── -->
            <div id="modernLinkModal" class="imsg-sheet-overlay">
                <div class="imsg-sheet" style="max-height:none;">
                    <div class="imsg-sheet-head">
                        <h3 class="imsg-sheet-title">Embed Link Card</h3>
                        <button onclick="closeModernLinkModal()" class="imsg-sheet-close">CANCEL</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <input type="text" id="modalLinkTitle" placeholder="Link Title (e.g., Siterifty)" class="imsg-link-input">
                        <input type="text" id="modalLinkUrl" oninput="updateLiveLinkPreview()" placeholder="Target URL" class="imsg-link-input">
                    </div>
                    <div class="imsg-link-preview-wrap">
                        <span class="imsg-link-preview-label">Live Dynamic Preview</span>
                        <div class="imsg-link-preview-card">
                            <div style="min-width:0;flex:1;">
                                <h5 id="previewTitle" style="font-size:12px;font-weight:700;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Link Attachment Title</h5>
                                <p id="previewUrl" style="font-size:10px;font-weight:500;color:#58f278;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">https://yoururl.com</p>
                            </div>
                            <div class="imsg-link-preview-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>
                            </div>
                        </div>
                    </div>
                    <button onclick="sendEmbeddedLinkMessage()" class="imsg-send-link-btn">SEND EMBEDDED LINK</button>
                </div>
            </div>

            <!-- ── Fullscreen image viewer ── -->
            <div id="fullscreenImageModal" class="imsg-center-modal" style="background:rgba(0,0,0,0.95);">
                <button onclick="closeFullscreenImage()" class="imsg-img-popup-close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                </button>
                <div class="imsg-img-popup-card">
                    <div class="imsg-img-popup-frame"><img id="popupTargetImage" src="" alt="Fullscreen view"></div>
                    <div class="imsg-img-popup-meta">
                        <p id="popupImageName" class="imsg-img-popup-name"></p>
                        <span class="imsg-img-popup-tag">Secure Blob Runtime Sandbox View</span>
                    </div>
                </div>
            </div>

            <!-- ── Alert modal ── -->
            <!-- iOS Alert Modal -->
            <div id="alertModal" onclick="if(event.target===this)closeAlert()" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.6);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);">
                <div style="width:100%;max-width:320px;border-radius:20px;overflow:hidden;background:rgba(28,28,30,0.97);border:1px solid rgba(255,255,255,0.1);box-shadow:0 32px 64px rgba(0,0,0,0.7),inset 0 0 0 0.5px rgba(255,255,255,0.06);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">
                    <div id="alertAccentBar" style="height:3px;width:100%;background:linear-gradient(90deg,#ff453a,#ff6b6b);"></div>
                    <div style="padding:28px 24px 0;display:flex;flex-direction:column;align-items:center;text-align:center;">
                        <div id="alertIconRing" style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);flex-shrink:0;transition:background .2s,border-color .2s;">
                            <svg id="alertIconSvg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                        </div>
                        <div id="alertTitleEl" style="font-size:1rem;font-weight:700;color:#fff;letter-spacing:-0.2px;margin-bottom:8px;">Notice</div>
                        <p id="alertMessage" style="font-size:0.875rem;color:rgba(255,255,255,0.52);line-height:1.55;margin:0 0 24px;font-weight:400;"></p>
                    </div>
                    <div style="height:0.5px;background:rgba(255,255,255,0.1);"></div>
                    <button onclick="closeAlert()" style="width:100%;padding:15px 24px;background:transparent;border:none;font-size:0.975rem;font-weight:600;color:#0a84ff;cursor:pointer;font-family:inherit;letter-spacing:-0.1px;transition:background .12s;display:block;" onmouseover="this.style.background='rgba(10,132,255,0.08)'" onmouseout="this.style.background='transparent'" onmousedown="this.style.background='rgba(10,132,255,0.15)'" onmouseup="this.style.background='rgba(10,132,255,0.08)'">OK</button>
                </div>
            </div>

        </div>
    </div>

<!--  EMOJI PICKER MODAL (group chat reactions)  -->
    <div id="gcEmojiPickerOverlay" onclick="if(event.target===this)window._gcCloseEmojiPicker()">
        <div id="gcEmojiPicker">
            <div class="gc-ep-title">React to message</div>
            <div class="gc-ep-grid" id="gcEmojiPickerGrid"></div>
            <button class="gc-ep-cancel" onclick="window._gcCloseEmojiPicker()">Cancel</button>
        </div>
    </div>

<!--  CHAT BUBBLE (AI bot)  -->
    <div class="chat-bubble" id="chatBubble" onclick="toggleChat()" title="Chat with our AI assistant" aria-label="Open AI assistant">
        <!-- bot icon (shown when closed) -->
        <svg id="chatIconOpen" width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v3" stroke="#a855f7" stroke-width="1.7" stroke-linecap="round"/>
            <circle cx="12" cy="3.6" r="1.3" fill="#a855f7"/>
            <rect x="4" y="6.5" width="16" height="13" rx="5" fill="#a855f7"/>
            <circle cx="9" cy="13" r="1.6" fill="#fff"/>
            <circle cx="15" cy="13" r="1.6" fill="#fff"/>
            <path d="M9.5 16.6c.8.55 1.7.55 2.5.55s1.7 0 2.5-.55" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M1.5 12.5h2M20.5 12.5h2" stroke="#a855f7" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        <!-- close icon (shown when open) — keeps a small backdrop so the X stays legible -->
        <div class="chat-bubble-close-bg"></div>
        <svg id="chatIconClose" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:none;position:relative;z-index:1;">
            <path d="M2 2l12 12M14 2L2 14" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>

    <!-- One-time greeting tooltip, points users at the chat bubble on first visit -->
    <div class="chat-bubble-greet" id="chatBubbleGreet" onclick="window.toggleChat();_dismissChatGreet()">
        👋 Need help? Chat with our AI assistant
        <div class="chat-bubble-greet-close" onclick="event.stopPropagation();_dismissChatGreet()">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="rgba(139,138,168,0.8)" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
    </div>

    <!--  CHAT PANEL  -->
    <div id="chatPanel" style="display:none;position:fixed;bottom:84px;right:16px;width:calc(100vw - 32px);max-width:380px;height:520px;max-height:calc(100svh - 120px);z-index:199;border-radius:20px;background:linear-gradient(160deg,#14142a 0%,#0d0d1c 100%);border:1px solid rgba(255,255,255,0.1);border-top:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(168,85,247,0.08);display:none;flex-direction:column;overflow:hidden;transform:translateY(12px) scale(0.97);opacity:0;transition:transform 0.22s cubic-bezier(0.32,0.72,0,1),opacity 0.2s ease;">

        <!-- Header -->
        <div style="flex-shrink:0;height:54px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,0.13);background:linear-gradient(180deg,rgba(18,18,32,0.98),rgba(14,14,24,0.92));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
            <div style="width:32px;height:32px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#818cf8);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v3" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
                    <circle cx="12" cy="3.6" r="1.3" fill="#fff"/>
                    <rect x="4" y="6.5" width="16" height="13" rx="5" fill="#fff"/>
                    <circle cx="9" cy="13" r="1.6" fill="#a855f7"/>
                    <circle cx="15" cy="13" r="1.6" fill="#a855f7"/>
                    <path d="M9.5 16.6c.8.55 1.7.55 2.5.55s1.7 0 2.5-.55" stroke="#a855f7" stroke-width="1.3" stroke-linecap="round"/>
                    <path d="M1.5 12.5h2M20.5 12.5h2" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
                </svg>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#f1f0ff;letter-spacing:-.01em;">Siterifty AI Assistant</div>
                <div style="font-size:11px;color:#34d399;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:999px;background:#34d399;display:inline-block;"></span>Online · replies instantly</div>
            </div>
            <button onclick="toggleChat()" style="width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(139,138,168,0.7);flex-shrink:0;transition:background .15s;">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
        </div>

        <!-- Hourly usage progress bar — always visible, hidden only for Pro via JS -->
        <div id="chatRatebar" style="flex-shrink:0;padding:8px 14px 7px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(10,10,16,0.4);display:flex;flex-direction:column;gap:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;gap:8px;">
                <span style="font-size:10px;color:var(--muted);font-weight:500;letter-spacing:.03em;white-space:nowrap;">Messages this hour</span>
                <div style="display:flex;align-items:center;gap:7px;flex-shrink:0;">
                    <button id="chatRateUpgradeBtn" onclick="toggleChat();openPlansPickerModal()" style="display:none;align-items:center;gap:4px;font-size:9.5px;font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.04em;color:#818cf8;background:rgba(129,140,248,0.12);border:1px solid rgba(129,140,248,0.3);border-radius:999px;padding:2px 8px;cursor:pointer;touch-action:manipulation;white-space:nowrap;transition:background .15s;" onmouseover="this.style.background='rgba(129,140,248,0.22)'" onmouseout="this.style.background='rgba(129,140,248,0.12)'"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Upgrade</button>
                    <span id="chatRateLabel" style="font-size:10px;font-weight:700;color:var(--muted);font-family:'Syne',sans-serif;white-space:nowrap;"></span>
                </div>
            </div>
            <div style="height:3px;border-radius:999px;background:rgba(255,255,255,0.07);overflow:hidden;">
                <div id="chatRateFill" style="height:100%;border-radius:999px;background:linear-gradient(90deg,#a855f7,#818cf8);transition:width .4s cubic-bezier(.4,0,.2,1),background .4s;width:0%;"></div>
            </div>
            <div id="chatResetNote" style="font-size:9.5px;color:rgba(139,138,168,0.45);margin-top:4px;display:none;"></div>
        </div>

        <!-- Messages -->
        <div id="chatMessages" style="flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none;">
            <!-- Greeting message injected by JS -->
        </div>

        <!-- Typing indicator (hidden by default) -->
        <div id="chatTyping" style="display:none;padding:0 16px 6px;flex-shrink:0;">
            <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);border-radius:12px 12px 12px 4px;padding:8px 12px;">
                <span class="typing-dot" style="width:6px;height:6px;border-radius:999px;background:var(--muted);animation:typingPulse 1.2s ease-in-out infinite;"></span>
                <span class="typing-dot" style="width:6px;height:6px;border-radius:999px;background:var(--muted);animation:typingPulse 1.2s ease-in-out 0.2s infinite;"></span>
                <span class="typing-dot" style="width:6px;height:6px;border-radius:999px;background:var(--muted);animation:typingPulse 1.2s ease-in-out 0.4s infinite;"></span>
            </div>
        </div>

        <!-- Input -->
        <div style="flex-shrink:0;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom,10px));border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;align-items:flex-end;background:rgba(10,10,16,0.6);">
            <textarea id="chatInput" placeholder="Ask anything…" rows="1" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:9px 12px;font-size:14px;color:#f1f0ff;font-family:'DM Sans',sans-serif;resize:none;min-height:38px;max-height:96px;overflow-y:auto;line-height:1.45;outline:none;-webkit-appearance:none;appearance:none;user-select:text;-webkit-user-select:text;" onkeydown="chatInputKeydown(event)" oninput="chatInputGrow(this)"></textarea>
            <button id="chatSendBtn" onclick="sendChatMessage()" style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#818cf8);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:opacity .15s,transform .1s;touch-action:manipulation;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5h11M8.5 3l4.5 4.5L8.5 12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        </div>
    </div>

    <!--  WALLET MODAL  -->
    <div id="walletOverlay" onclick="if(event.target===this)closeWalletModal()" class="popup-overlay">
        <div id="walletModal" class="wm2-card">
            <div id="walletBg" style="position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>

            <!-- Header banner with GIF backdrop -->
            <div class="wm2-banner">
                <div class="wm2-banner-overlay"></div>
                <div class="wm2-banner-content">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
                        <div style="display:flex;align-items:center;gap:11px;">
                            <div class="wm2-avatar" id="wmAvatar">U</div>
                            <div style="display:flex;flex-direction:column;">
                                <span style="font-size:12px;font-weight:500;color:rgba(168,255,107,0.6);letter-spacing:-0.01em;line-height:1;">Welcome back</span>
                                <span id="wmUsername" style="font-size:15px;font-weight:700;color:#fff;letter-spacing:-0.01em;margin-top:3px;">@user</span>
                            </div>
                        </div>
                        <div class="wm-close" onclick="closeWalletModal()">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </div>
                    </div>
                    <div style="text-align:center;margin-bottom:20px;">
                        <p style="font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(168,255,107,0.55);margin-bottom:6px;">Wallet Balance</p>
                        <div id="wmSpinner" style="display:flex;align-items:center;justify-content:center;height:44px;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="animation:spin 0.8s linear infinite;">
                                <circle cx="12" cy="12" r="9" stroke="rgba(168,255,107,0.2)" stroke-width="2.5"/>
                                <path d="M12 3a9 9 0 0 1 9 9" stroke="#a8ff6b" stroke-width="2.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3 id="wmBalanceAmount" class="wm-balance-amount" style="display:none;font-size:2.4rem;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1;">$0</h3>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <button class="wm-topup-btn wm2-btn-primary" onclick="openTopUpModal()">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            Add Money
                        </button>
                        <button class="wm-transfer-btn wm2-btn-ghost" id="wmTransferBtn" onclick="openTransferModal()" style="display:flex;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                            Send
                        </button>
                    </div>
                    <p class="wm-login-note" id="wmLoginNote" style="display:none;margin-top:10px;">
                        <a href="#" onclick="closeWalletModal();openAuthModal();return false;">Sign in</a> to view your balance
                    </p>
                </div>
            </div>

            <div class="wm2-divider"></div>

            <!-- Scrollable body -->
            <div class="popup-card-body wm2-body">
                <p style="font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(168,255,107,0.4);text-align:center;margin-bottom:18px;">Use Your Balance To</p>

                <div class="wm2-use-row">
                    <div class="wm2-use-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 18c-1.197 0-2.218-.324-3-1.696M12 3c1.197 0 2.218.324 3 1.696M12 3a9.004 9.004 0 0 1 8.716 6.747M12 3a9.004 9.004 0 0 0-8.716 6.747M21 12c0 .248-.01.494-.03.737M3 12c0 .248.01.494.03.737M21 12c0-.248-.01-.494-.03-.737M3 12c0-.248.01-.494.03-.737"/></svg>
                    </div>
                    <h4 class="wm2-use-title">Pay For Website</h4>
                    <p class="wm2-use-desc">Instantly settle renewal dues or acquire assets seamlessly.</p>
                </div>
                <div class="wm2-use-row">
                    <div class="wm2-use-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.493V21a1.5 1.5 0 01-1.5 1.5H5.25A1.5 1.5 0 014 21V4.257c0-.795.532-1.474 1.314-1.567l13.419-1.596a1.5 1.5 0 011.667 1.485z"/></svg>
                    </div>
                    <h4 class="wm2-use-title">Pay Fees</h4>
                    <p class="wm2-use-desc">Cover listing charges and processing rates securely.</p>
                </div>
                <div class="wm2-use-row" style="margin-bottom:0;">
                    <div class="wm2-use-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                    </div>
                    <h4 class="wm2-use-title">Promote Listing</h4>
                    <p class="wm2-use-desc">Boost visibility to instantly push your offers to the top tier.</p>
                </div>
            </div><!-- end wm2-body -->
        </div>
    </div>

    <!--  TOP-UP MODAL  -->
    <div id="topupOverlay" onclick="if(event.target===this)closeTopUpModal()">
        <div id="topupModal">
          <div id="topupCard">
            <div id="topupBg" style="position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>

            <!-- Decorative glow -->
            <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:260px;height:160px;background:radial-gradient(ellipse,rgba(52,211,153,0.12) 0%,transparent 70%);pointer-events:none;z-index:0;"></div>

            <!-- Header -->
            <div style="position:relative;z-index:2;padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;">
              <div style="display:flex;align-items:center;gap:11px;">
                <div style="width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,rgba(52,211,153,0.18),rgba(56,189,248,0.1));border:1px solid rgba(52,211,153,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#34d399" stroke-width="1.8" stroke-linecap="round"/></svg>
                </div>
                <div>
                  <div style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.1;">Top Up Wallet</div>
                  <div style="font-size:10px;color:rgba(52,211,153,0.65);margin-top:3px;font-weight:600;letter-spacing:.02em;">ADD FUNDS VIA PAYPAL</div>
                </div>
              </div>
              <button class="tu-close" onclick="closeTopUpModal()" title="Close" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.45);transition:background .15s;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.11)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </button>
            </div>

            <!-- Scrollable body -->
            <div class="tu-scroll-body"><div class="tu-body">

                <!-- Big amount -->
                <div class="tu-amount-hero">
                    <div class="tu-section-label">Add to wallet</div>
                    <div class="tu-amount-display" onclick="document.getElementById('tuHiddenInput').focus()">
                        <span class="tu-dollar">$</span>
                        <span class="tu-num" id="tuAmountDisplay">10</span>
                        <input id="tuHiddenInput" class="tu-amount-input-hidden" type="number" min="10" step="1" value="10" oninput="onTuInput(this.value)" inputmode="numeric">
                    </div>
                    <div class="tu-min-note">Tap to edit · Min <span>$10</span></div>
                </div>

                <!-- Amount pills -->
                <div class="tu-section-label">Quick select</div>
                <div class="tu-pills">
                    <div class="tu-pill active" onclick="setAmount(10,this)">$10</div>
                    <div class="tu-pill" onclick="setAmount(25,this)">$25</div>
                    <div class="tu-pill" onclick="setAmount(50,this)">$50</div>
                    <div class="tu-pill" onclick="setAmount(100,this)">$100</div>
                    <div class="tu-pill" onclick="setAmount(200,this)">$200</div>
                </div>

                <!-- Custom amount -->
                <div class="tu-custom-row">
                    <span class="tu-custom-prefix">$</span>
                    <input class="tu-custom-input" type="number" min="10" step="1" placeholder="Custom amount…" oninput="onTuInput(this.value)" inputmode="numeric">
                </div>

                <!-- Fee breakdown -->
                <div class="tu-fee-box">
                    <div class="tu-fee-row">
                        <span>Wallet credit</span>
                        <span id="tuFeeCredit">$10.00</span>
                    </div>
                    <div class="tu-fee-row">
                        <span>PayPal fee <em style="font-style:normal;font-size:10px;color:rgba(255,255,255,0.25)">(3.49% + $0.49)</em></span>
                        <span id="tuFeeAmount">$0.84</span>
                    </div>
                    <div class="tu-fee-row total">
                        <span>Total charged today</span>
                        <span class="tu-fee-val" id="tuFeeTotal">$10.84</span>
                    </div>
                </div>

                <!-- PayPal -->
                <div class="tu-paypal-wrap">
                    <div class="tu-paypal-label">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Secure payment via PayPal
                    </div>
                    <div id="paypal-button-container">
                        <div class="pp-loading-placeholder" id="ppLoadingPlaceholder">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/><path d="M9 3v4.5l2.5 2.5" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Loading PayPal…
                        </div>
                    </div>
                </div>

                <p class="tu-min-text">One-time payment · funds added instantly · balance never expires</p>

            </div></div><!-- /body -->

          </div><!-- /topupCard -->
        </div>
    </div>

    <!--  TOP-UP RESULT  -->
    <div id="topupResult">
        <div class="tr-card" id="trCard">
            <div class="tr-coins" id="trCoins"></div>
            <!-- Hero -->
            <div class="tr-hero">
                <div class="tr-icon-wrap" id="trEmoji">
                    <svg width="44" height="44" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.4)" stroke-width="1.5"/><path d="M20 32l10 10 14-16" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="tr-title" id="trTitle">Balance Added!</div>
                <div class="tr-sub" id="trSub">Your wallet has been topped up. Happy selling on Siterifty!</div>
                <div class="tr-amount-badge success" id="trBadge"></div>
            </div>
            <!-- Divider -->
            <div class="tr-divider"></div>
            <!-- CTAs -->
            <div class="tr-footer">
                <button class="tr-cta success-cta" id="trCta" onclick="closeResult()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Go to Marketplace
                </button>
                <button class="tr-cta-ghost" id="trCta2" style="display:none" onclick="closeResult();openTopUpModal()">Try Again</button>
            </div>
        </div>
    </div>

    <!--  AUTH MODAL  -->
    <div id="authModal" style="display:none; position:fixed; inset:0; z-index:1000; overflow:hidden;">
        <!-- Galaxy background layers -->
        <div style="position:absolute;inset:0;background:#000000;"></div>
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, rgba(45,15,80,0.5), transparent 40%),radial-gradient(circle at 70% 60%, rgba(15,40,80,0.45), transparent 50%),radial-gradient(circle at 60% 20%, rgba(80,20,40,0.35), transparent 40%);"></div>
        <div id="authModalStars" style="position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 20px 30px,#fff,transparent),radial-gradient(2px 2px at 80px 70px,#ffe6e6,transparent),radial-gradient(1px 1px at 150px 160px,#fff,transparent),radial-gradient(2px 2px at 290px 40px,#e6f7ff,transparent),radial-gradient(1.5px 1.5px at 330px 180px,#fff,transparent),radial-gradient(2px 2px at 210px 250px,#fff0e6,transparent),radial-gradient(1px 1px at 400px 90px,#fff,transparent),radial-gradient(1.5px 1.5px at 100px 320px,#fff,transparent);background-repeat:repeat;background-size:450px 450px;animation:authTwinkle 3s ease-in-out infinite alternate;"></div>
        <div id="authModalStars2" style="position:absolute;inset:0;background-image:radial-gradient(2px 2px at 50px 100px,#fff,transparent),radial-gradient(1.5px 1.5px at 180px 40px,#fff,transparent),radial-gradient(2.5px 2.5px at 250px 200px,#e6ebff,transparent),radial-gradient(1px 1px at 350px 300px,#fff,transparent);background-repeat:repeat;background-size:350px 350px;animation:authTwinkle 4s ease-in-out infinite alternate-reverse;opacity:0.7;"></div>

        

        <div class="auth-wrap">
            <div class="auth-box-glow">
            <div class="auth-box">
                <div class="auth-close" onclick="closeAuthModal()"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>

                <!-- Logo row -->
                <div class="auth-logo">
                    <div class="logo-icon-wrap" style="width:20px;height:20px;">
                        <div class="logo-icon-inner">
                            <svg width="20" height="20" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                                <circle class="logo-spin-ring" cx="15" cy="15" r="12.5" fill="none" stroke="url(#hsg-auth)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="56 22"/>
                                <text x="15" y="15" text-anchor="middle" dominant-baseline="central" font-family="'Syne', sans-serif" font-weight="800" font-size="13" fill="#fff">S</text>
                                <defs><linearGradient id="hsg-auth" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>
                            </svg>
                        </div>
                    </div>
                    <span>Siterifty<em>.com</em></span>
                </div>

                <div class="auth-segment" id="authSegment">
                    <button type="button" id="segSignup" onclick="showPanel('signup')">Sign Up</button>
                    <button type="button" id="segLogin" onclick="showPanel('login')">Log In</button>
                </div>

                <!--  SIGN UP PANEL  -->
                <div id="panelSignup">
                    <div class="auth-header">
                        <span class="auth-header-text">Join the Galaxy</span>
                        <span class="auth-header-icon">🚀</span>
                    </div>
                    <div class="auth-sub">Start listing your websites and digital assets. Free plan to start.</div>
                    <div id="errSignup" class="auth-err"></div>
                    <div id="okSignup" class="auth-ok"></div>

                    <!-- Google sign-up -->
                    <button class="auth-google-btn" id="btnGoogleSignup" onclick="doGoogleAuth()">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                        Continue with Google
                    </button>

                    <!-- GitHub sign-up -->
                    <button class="auth-google-btn" id="btnGithubSignup" onclick="doGithubAuth()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        Continue with GitHub
                    </button>

                    <div class="auth-divider">or sign up with email</div>

                    <label class="auth-label">Email</label>
                    <input id="suEmail" class="auth-input" type="email" placeholder="you@example.com" autocomplete="email">
                    <label class="auth-label">Password</label>
                    <input id="suPassword" class="auth-input" type="password" placeholder="Min. 6 characters" autocomplete="new-password">
                    <button class="auth-btn" id="btnSignup" onclick="doSignup()">Create Account</button>
                </div>

                <!--  LOGIN PANEL  -->
                <div id="panelLogin" style="display:none">
                    <div class="auth-header">
                        <span class="auth-header-text">Welcome</span>
                        <span class="auth-header-icon">🤝</span>
                    </div>
                    <div class="auth-sub">Sign in to manage your listings and plan.</div>
                    <div id="errLogin" class="auth-err"></div>
                    <div id="okLogin" class="auth-ok"></div>

                    <!-- Google sign-in -->
                    <button class="auth-google-btn" id="btnGoogleLogin" onclick="doGoogleAuth()">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                        Continue with Google
                    </button>

                    <!-- GitHub sign-in -->
                    <button class="auth-google-btn" id="btnGithubLogin" onclick="doGithubAuth()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        Continue with GitHub
                    </button>

                    <div class="auth-divider">or sign in with email</div>

                    <label class="auth-label">Email</label>
                    <input id="liEmail" class="auth-input" type="email" placeholder="you@example.com" autocomplete="email">
                    <label class="auth-label">Password</label>
                    <input id="liPassword" class="auth-input" type="password" placeholder="Your password" autocomplete="current-password">
                    <button class="auth-btn" id="btnLogin" onclick="doLogin()">Sign In</button>
                    <div class="auth-switch"><a onclick="showPanel('forgot')">Forgot password?</a></div>
                </div>

                <!--  FORGOT PASSWORD PANEL  -->
                <div id="panelForgot" style="display:none">
                    <div class="auth-header">
                        <span class="auth-header-text">Reset Password</span>
                        <span class="auth-header-icon">🔑</span>
                    </div>
                    <div class="auth-sub">Enter your email and we'll send a reset link right away.</div>
                    <div id="errForgot" class="auth-err"></div>
                    <div id="okForgot" class="auth-ok"></div>
                    <label class="auth-label">Email</label>
                    <input id="fpEmail" class="auth-input" type="email" placeholder="you@example.com" autocomplete="email">
                    <button class="auth-btn" id="btnForgot" onclick="doForgot()">Send Reset Link</button>
                    <div class="auth-switch"><a onclick="showPanel('login')">← Back to sign in</a></div>
                </div>
            </div>
            </div>
        </div>
    </div>



    <!--  DASHBOARD MODAL — Page 1: Profile (glassy green design)  -->
    <div id="dashModal">
    

  <div id="dashModal-bg-img" aria-hidden="true">
      <img id="dashModalBgImg" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10" alt="" loading="lazy">
      <div class="bg-img-skeleton" id="dashModalBgSkeleton"></div>
  </div>
  <div class="dm-shell">

    <!-- ════════ HEADER (persistent across all pages) ════════ -->
    <div class="dm-header">
      <div class="dm-avatar" id="dashAvatarLg">?</div>
      <div class="dm-header-greeting">
        <div class="dm-greeting-label" id="dashGreetingLabel">Good morning</div>
        <div class="dm-greeting-name" id="dashGreeting">Hey there</div>
      </div>
      <div class="dm-header-right">
        <button class="dm-icon-btn" title="Notifications" onclick="openNotifPanel()" id="dmBellBtn" style="position:relative;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span id="dmBellDot" style="display:none;position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#f87171;border:1.5px solid var(--surface,#12121c);"></span>
        </button>
        <button class="dm-icon-btn" onclick="closeDash()" title="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
        </button>
      </div>
    </div>

    <!-- ════════ NAV SWITCH (directly under header) ════════ -->
    <div class="dm-navswitch">
      <div class="dm-navswitch-item active" id="dmNav-profile" onclick="showPage('profile')">Profile</div>
      <div class="dm-navswitch-item" id="dmNav-accounts" onclick="showPage('accounts')">Accounts</div>
      <div class="dm-navswitch-item" id="dmNav-settings" onclick="showPage('settings')">Settings</div>
      <div class="dm-navswitch-item" id="dmNav-support" onclick="showPage('support')">Support</div>
    </div>

    <!-- ════════ QUICK ACTIONS + STATS — fixed above scroll ════════ -->
    <div class="dm-balance">
      <!-- Hidden helper spans still needed for JS -->
      <span id="acWalletBal" style="display:none;"></span>
      <div id="dashEmailLine" style="display:none;"></div>
      <span id="msgNavBadge" style="display:none;"></span>
      <div class="dm-balance-stats" style="margin-top:14px;">
        <div class="dm-balance-stat">
          <div class="dm-balance-stat-val" id="acStatListings">—</div>
          <div class="dm-balance-stat-label">Listings</div>
        </div>
        <div class="dm-balance-stat">
          <div class="dm-balance-stat-val" id="acStatSold">—</div>
          <div class="dm-balance-stat-label">Sold</div>
        </div>
        <div class="dm-balance-stat">
          <div class="dm-balance-stat-val" id="currentPlanBadge">Free</div>
          <div class="dm-balance-stat-label">Plan</div>
        </div>
      </div>
      <div class="dm-quick-row">
        <div class="dm-quick primary" onclick="openTopUpModal()">
          <div class="dm-quick-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></div>
          <div class="dm-quick-label">Top Up</div>
        </div>
        <div class="dm-quick" onclick="openWithdrawModal()">
          <div class="dm-quick-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7 7 7-7"/></svg></div>
          <div class="dm-quick-label">Withdraw</div>
        </div>
        <div class="dm-quick" onclick="showPage('accounts')">
          <div class="dm-quick-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
          <div class="dm-quick-label">My Sites</div>
        </div>
        <div class="dm-quick" onclick="showPage('support')">
          <div class="dm-quick-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 0-18 0v4a2 2 0 0 0 2 2h1v-7H4M21 16v-4h-2v7h1a2 2 0 0 0 2-2Z"/></svg></div>
          <div class="dm-quick-label">Support</div>
        </div>
      </div>
    </div>

    <!-- ════════ SCROLLABLE PAGE CONTENT ════════ -->
    <div class="dm-scroll">

      <!-- ── PAGE 1 — PROFILE ─────────────────────────── -->
      <div class="dm-page" id="dmPage-profile">

        <!-- Wallet Balance — scrolls with content, hides on scroll down -->
        <div class="dm-card" style="text-align:center; padding:20px 18px 18px; margin:0;">
          <div class="dm-balance-label">Wallet Balance</div>
          <div class="dm-balance-amount" id="acStatBalance">$0.00</div>
        </div>

        <!-- Profile hero -->
        <div class="dm-card dm-profile-hero">
          <div class="dm-avatar-wrap">
            <div class="dm-avatar-lg" id="profileAvatarCircle" onclick="handleAvatarClick()">?</div>
            <div class="dm-avatar-edit" title="Change photo" onclick="handleAvatarClick()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg>
            </div>
            <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" onchange="uploadAvatarToImgur(this)">
          </div>
          <div class="dm-profile-name" id="profileDisplayName">—</div>
          <div class="dm-profile-email" id="profileEmailDisplay">
            <span id="profileEmailText">—</span>
            <span class="dm-verified" id="profileEmailVerified">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Verified
            </span>
          </div>
          <span class="dm-plan-chip" id="profilePlanBadgeHero">Free</span>

          <div class="dm-profile-stats">
            <div class="dm-pstat">
              <div class="dm-pstat-val" id="statsListingsCount">—</div>
              <div class="dm-pstat-label">Listings</div>
            </div>
            <div class="dm-pstat">
              <div class="dm-pstat-val" id="statsMemberSince">—</div>
              <div class="dm-pstat-label">Member since</div>
            </div>
            <div class="dm-pstat">
              <div class="dm-pstat-val" id="statsLastSeen">—</div>
              <div class="dm-pstat-label">Last seen</div>
            </div>
          </div>
        </div>

        <!-- Subscription -->
        <div class="dm-card dm-accordion open" id="accCard-sub">
          <div class="dm-accordion-head" onclick="toggleAccCard('sub')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Subscription</div>
                <div class="dm-card-sub">Your current plan and billing</div>
              </div>
              <span class="dm-status-chip" id="acPlanBadge">ACTIVE</span>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">
              <div class="dm-plan-row">
                <div>
                  <div class="dm-plan-name" id="acPlanName">Free</div>
                  <div class="dm-plan-price" id="acPlanPrice">$0 / month</div>
                </div>
                <button class="dm-btn dm-btn-ghost dm-btn-sm" onclick="event.stopPropagation();openPlansPickerModal()">Manage plan</button>
              </div>
              <div class="dm-billing-row" id="acBillingRow" style="display:none;">
                <span>Next billing date</span>
                <b id="acNextBill">—</b>
              </div>

              <!-- Plan picker — hidden for now, full styling comes with the Settings/Plans step -->
              <div id="acPlanPicker" style="display:none;">
                <div id="acPlanRows" class="dm-plan-grid"></div>
                <div id="acPlanWarn">
                  <div id="acPlanWarnText"></div>
                  <button id="acPlanWarnConfirm" onclick="confirmPlanSwitch()"></button>
                </div>
                <div id="acCurrentPlanChip" style="display:none;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile names -->
        <div class="dm-card dm-accordion" id="accCard-profile">
          <div class="dm-accordion-head" onclick="toggleAccCard('profile')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Profile details</div>
                <div class="dm-card-sub">Your public name, handle and bio</div>
              </div>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">
              <div class="dm-field">
                <label class="dm-label" for="accUsername">Display name</label>
                <input id="accUsername" class="dm-input" type="text" placeholder="e.g. Alex Rivera" autocomplete="name">
              </div>

              <div class="dm-field">
                <label class="dm-label" for="accBio">Bio</label>
                <textarea id="accBio" class="dm-textarea" maxlength="160" placeholder="Tell people a little about yourself or your sites…"></textarea>
                <div class="dm-char-count"><span id="accBioCount">0</span>/160</div>
              </div>

              <div class="dm-field">
                <label class="dm-label" for="accEmail">Email</label>
                <input id="accEmail" class="dm-input" type="email" disabled>
              </div>

              <div class="dm-alert dm-alert-err" id="accErr"></div>
              <div class="dm-alert dm-alert-ok" id="accOk"></div>
              <button class="dm-btn dm-btn-primary" id="btnSaveAccount" onclick="saveAccount()">Save changes</button>
            </div>
          </div>
        </div>

        <!-- Password -->
        <div class="dm-card dm-accordion" id="accCard-pw">
          <div class="dm-accordion-head" onclick="toggleAccCard('pw')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Password</div>
                <div class="dm-card-sub">Change your login password</div>
              </div>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">
              <div class="dm-field">
                <label class="dm-label" for="accPassword">New password</label>
                <div class="dm-input-row">
                  <input id="accPassword" class="dm-input" type="password" placeholder="Min. 6 characters" autocomplete="new-password">
                  <button class="dm-input-icon-btn" onclick="togglePw('accPassword')" tabindex="-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <div class="dm-field">
                <label class="dm-label" for="accPasswordConfirm">Confirm password</label>
                <div class="dm-input-row">
                  <input id="accPasswordConfirm" class="dm-input" type="password" placeholder="Repeat password" autocomplete="new-password">
                  <button class="dm-input-icon-btn" onclick="togglePw('accPasswordConfirm')" tabindex="-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div class="dm-hint" id="pwMatchHint"></div>
              </div>

              <div class="dm-alert dm-alert-err" id="pwErr"></div>
              <div class="dm-alert dm-alert-ok" id="pwOk"></div>
              <button class="dm-btn dm-btn-ghost" id="btnSavePw" onclick="savePassword()">Update password</button>
            </div>
          </div>
        </div>

        <!-- Login & security -->
        <div class="dm-card dm-accordion" id="accCard-security">
          <div class="dm-accordion-head" onclick="toggleAccCard('security')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Login &amp; security</div>
                <div class="dm-card-sub">Two-factor authentication and active devices</div>
              </div>
              <span class="dm-accordion-badge dm-accordion-badge-off" id="secTwoFaBadge">LOCK OFF</span>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">

              <div class="dm-field" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
                <div style="flex:1;min-width:0;">
                  <div class="dm-label" style="margin-bottom:3px;">Device lock</div>
                  <div class="dm-hint" style="margin-top:0;min-height:0;">Restrict this account to this device only. Anyone who logs in from another device will be blocked until you disable this here.</div>
                </div>
                <label class="dm-switch" onclick="event.stopPropagation()">
                  <input type="checkbox" id="sec2faToggle" onchange="toggleDeviceLock(this.checked)">
                  <span class="dm-switch-track"></span>
                  <span class="dm-switch-thumb"></span>
                </label>
              </div>

              <div class="dm-alert dm-alert-err" id="dmSecErr"></div>
              <div class="dm-alert dm-alert-ok" id="dmSecOk"></div>

              <div style="border-top:1px solid var(--border);margin:4px 0 12px;padding-top:14px;">
                <div class="dm-label" style="margin-bottom:6px;">Trusted device</div>
                <div id="secDeviceList"><div class="dm-team-empty">No trusted device registered.</div></div>
              </div>

            </div>
          </div>
        </div>

        <!-- Team access -->
        <div class="dm-card dm-accordion" id="accCard-team">
          <div class="dm-accordion-head" onclick="toggleAccCard('team')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Team access</div>
                <div class="dm-card-sub">Invite others to manage this account</div>
              </div>
              <span class="dm-accordion-badge" id="teamCountBadge">0 members</span>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">

              <div class="dm-field">
                <label class="dm-label" for="teamInviteEmail">Invite by email</label>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <input id="teamInviteEmail" class="dm-input" type="email" placeholder="teammate@email.com" autocomplete="off" style="flex:1;min-width:160px;">
                  <select id="teamInviteRole" class="dm-input" style="width:110px;flex-shrink:0;">
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button class="dm-btn dm-btn-ghost dm-btn-sm" style="margin-top:0;color:var(--lime);" onclick="inviteTeamMember()">Invite</button>
                </div>
                <div class="dm-hint" style="margin-top:6px;">Viewer can browse only. Editor can manage listings and messages.</div>
              </div>

              <div class="dm-alert dm-alert-err" id="teamErr"></div>
              <div class="dm-alert dm-alert-ok" id="teamOk"></div>


              <div style="border-top:1px solid var(--border);margin:14px 0 0;padding-top:14px;">
                <div class="dm-label" style="margin-bottom:6px;">Members</div>
                <div id="teamMemberList"><div class="dm-team-empty">Just you for now.</div></div>
              </div>

            </div>
          </div>
        </div>


        <!-- Earnings summary -->
        <div class="dm-card dm-accordion" id="accCard-earnings">
          <div class="dm-accordion-head" onclick="toggleAccCard('earnings')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Earnings summary</div>
                <div class="dm-card-sub">Lifetime revenue from site sales</div>
              </div>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:13px;">
                  <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Total earned</div>
                  <div id="earningsTotalEl" style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--lime);letter-spacing:-0.03em;">$0.00</div>
                </div>
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:13px;">
                  <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Sites sold</div>
                  <div id="earningsSalesEl" style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--text);letter-spacing:-0.03em;">0</div>
                </div>
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:13px;">
                  <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Fees paid</div>
                  <div id="earningsFeesEl" style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#f87171;letter-spacing:-0.03em;">$0.00</div>
                </div>
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:13px;">
                  <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Net payout</div>
                  <div id="earningsNetEl" style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#5fe0a0;letter-spacing:-0.03em;">$0.00</div>
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-faint);text-align:center;">Based on completed escrow transfers</div>
            </div>
          </div>
        </div>
        

        <!-- Referral -->
        <div class="dm-card dm-accordion" id="accCard-referral">
          <div class="dm-accordion-head" onclick="toggleAccCard('referral')">
            <div class="dm-card-head">
              <div>
                <div class="dm-card-title">Refer &amp; earn</div>
                <div class="dm-card-sub">Earn 5% of each referred user's first sale</div>
              </div>
              <span class="dm-accordion-badge" id="referralCountBadge" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);color:var(--lime);">0 referrals</span>
            </div>
            <div class="dm-accordion-chevron">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="dm-accordion-body">
            <div class="dm-accordion-body-inner">
              <div style="background:rgba(168,255,107,0.06);border:1px solid rgba(168,255,107,0.15);border-radius:12px;padding:14px;margin-bottom:14px;">
                <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Your referral link</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <div id="referralLinkDisplay" style="flex:1;font-size:11.5px;color:var(--text-dim);background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Loading…</div>
                  <button onclick="copyReferralLink()" style="flex-shrink:0;padding:9px 13px;background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.25);border-radius:8px;color:var(--lime);font-size:11px;font-weight:700;cursor:pointer;" id="referralCopyBtn">Copy</button>
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px;">
                <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                  <div id="referralCountDisplay" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--text);">0</div>
                  <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Referred</div>
                </div>
                <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                  <div id="referralEarnedDisplay" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--lime);">$0.00</div>
                  <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Earned</div>
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-faint);line-height:1.6;">Share your link. When someone signs up and completes their first sale, you earn 5% of the sale amount, credited to your wallet automatically.</div>
            </div>
          </div>
        </div>
        

        <!-- Active listings -->
        <div class="dm-card dm-accordion" id="accCard-mylistings">
          <div class="dm-accordion-head" onclick="toggleAccCard('mylistings')">
            <div class="dm-card-head">
              <div><div class="dm-card-title">My listings</div><div class="dm-card-sub">Your active &amp; pending site listings</div></div>
              <span class="dm-accordion-badge" id="myListingsBadge" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);color:var(--lime);">0 active</span>
            </div>
            <div class="dm-accordion-chevron"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="dm-accordion-body"><div class="dm-accordion-body-inner">
            <div id="myListingsList" style="display:flex;flex-direction:column;gap:8px;">
              <div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Loading…</div>
            </div>
            <button onclick="window.open('/sell-my-site','_blank')" class="dm-btn dm-btn-ghost" style="width:100%;margin-top:10px;font-size:12px;">+ List a new site</button>
          </div></div>
        </div>
        

        <!-- Active deals / escrow -->
        <div class="dm-card dm-accordion" id="accCard-deals">
          <div class="dm-accordion-head" onclick="toggleAccCard('deals')">
            <div class="dm-card-head">
              <div><div class="dm-card-title">Active deals</div><div class="dm-card-sub">Escrow &amp; in-progress transactions</div></div>
              <span class="dm-accordion-badge" id="dealsBadge" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.2);color:#38bdf8;">0 deals</span>
            </div>
            <div class="dm-accordion-chevron"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="dm-accordion-body"><div class="dm-accordion-body-inner">
            <div id="activeDealsList" style="display:flex;flex-direction:column;gap:8px;">
              <div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Loading…</div>
            </div>
          </div></div>
        </div>
        

        <!-- Saved / watchlist -->
        <div class="dm-card dm-accordion" id="accCard-watchlist">
          <div class="dm-accordion-head" onclick="toggleAccCard('watchlist')">
            <div class="dm-card-head">
              <div><div class="dm-card-title">Watchlist</div><div class="dm-card-sub">Sites you're tracking</div></div>
              <span class="dm-accordion-badge" id="watchlistBadge">0 saved</span>
            </div>
            <div class="dm-accordion-chevron"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="dm-accordion-body"><div class="dm-accordion-body-inner">
            <div id="watchlistItems" style="display:flex;flex-direction:column;gap:8px;">
              <div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Loading…</div>
            </div>
            <button onclick="window.open('/browse','_blank')" class="dm-btn dm-btn-ghost" style="width:100%;margin-top:10px;font-size:12px;">Browse listings</button>
          </div></div>
        </div>
        

        <!-- Seller performance score -->
        <div class="dm-card dm-accordion" id="accCard-repScore">
          <div class="dm-accordion-head" onclick="toggleAccCard('repScore')">
            <div class="dm-card-head">
              <div><div class="dm-card-title">Seller reputation</div><div class="dm-card-sub">Your trust score &amp; buyer ratings</div></div>
              <span class="dm-accordion-badge" id="repScoreBadge" style="background:rgba(240,192,64,.1);border-color:rgba(240,192,64,.2);color:#f0c040;">—</span>
            </div>
            <div class="dm-accordion-chevron"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="dm-accordion-body"><div class="dm-accordion-body-inner">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
              <div style="position:relative;width:68px;height:68px;flex-shrink:0;">
                <svg viewBox="0 0 36 36" style="width:68px;height:68px;transform:rotate(-90deg);">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" stroke-width="2.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0c040" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="100 100" id="repScoreArc" style="transition:stroke-dasharray .6s ease;"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);" id="repScoreNum">—</div>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;color:var(--text);" id="repScoreLabel">No ratings yet</div>
                <div style="font-size:11px;color:var(--text-faint);margin-top:3px;" id="repScoreDesc">Complete sales to build your reputation score</div>
                <div style="display:flex;gap:4px;margin-top:8px;" id="repStarRow"></div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text);" id="repSalesCount">0</div>
                <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Sales</div>
              </div>
              <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text);" id="repRatingAvg">—</div>
                <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Avg Rating</div>
              </div>
              <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--lime);" id="repDispRate">100%</div>
                <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Dispute-free</div>
              </div>
            </div>
          </div></div>
        </div>
        

      </div>

      <!-- ── PAGE 2 — ACCOUNTS ─────────────────────────────── -->
      <div class="dm-page hidden" id="dmPage-accounts">

        <!-- Identity hero -->
        <div class="dm-acct-hero">
          <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(168,255,107,0.07) 1px,transparent 1px);background-size:22px 22px;pointer-events:none;border-radius:16px;"></div>
          <div style="position:relative;display:flex;align-items:center;gap:14px;">
            <div id="settingsAvatarHero" class="dm-avatar" style="width:56px;height:56px;font-size:20px;">?</div>
            <div style="flex:1;min-width:0;">
              <div id="settingsHeroName" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);letter-spacing:-0.03em;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">—</div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span id="settingsEmail" style="font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">—</span>
                <span id="settingsPlanBadge" style="flex-shrink:0;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--text);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.13);border-radius:999px;padding:3px 10px;">FREE</span>
              </div>
            </div>
            <button onclick="openSettingsPanel('profile')" style="flex-shrink:0;width:32px;height:32px;border-radius:10px;background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.22);display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2.5L10.5 4 4.5 10H3V8.5L9 2.5Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div style="position:relative;display:flex;align-items:center;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
            <div style="width:7px;height:7px;border-radius:999px;background:var(--lime);flex-shrink:0;"></div>
            <span style="font-size:11px;color:var(--text-dim);">Account active</span>
            <div style="flex:1;"></div>
            <span style="font-size:10px;color:var(--text-faint);">Siterifty member</span>
          </div>
        </div>

        <!-- Quick tiles -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <button onclick="openSettingsPanel('profile')" class="dm-acct-tile">
            <div class="dm-acct-tile-icon" style="background:rgba(168,255,107,0.1);border-color:rgba(168,255,107,0.2);">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="#A8FF6B" stroke-width="1.2"/><path d="M1.5 12c0-3 2.462-4 5.5-4s5.5 1 5.5 4" stroke="#A8FF6B" stroke-width="1.2" stroke-linecap="round"/></svg>
            </div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">Edit profile</div>
              <div style="font-size:10px;color:var(--text-dim);">Name &amp; password</div>
            </div>
          </button>
          <button onclick="openSettingsPanel('billing')" class="dm-acct-tile">
            <div class="dm-acct-tile-icon" style="background:rgba(95,224,160,0.1);border-color:rgba(95,224,160,0.2);">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3.5" width="12" height="8" rx="2" stroke="#5fe0a0" stroke-width="1.2"/><path d="M1 6.5h12" stroke="#5fe0a0" stroke-width="1.2"/><circle cx="11" cy="9.5" r=".9" fill="#5fe0a0"/></svg>
            </div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">Billing</div>
              <div style="font-size:10px;color:var(--text-dim);">Plan &amp; wallet</div>
            </div>
          </button>
        </div>

        <!-- Upgrade prompt -->
        <div id="settingsUpgradeCard" class="dm-upgrade-card">
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Want more Siterifty?</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">Upgrade for more listings and lower fees.</div>
          </div>
          <button onclick="openPlansPickerModal()" class="dm-upgrade-btn">Upgrade</button>
        </div>

        <!-- Activity stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="dm-stat-tile" style="border-color:rgba(168,255,107,0.16);">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="2" stroke="#A8FF6B" stroke-width="1.3"/><path d="M2 7.5h14" stroke="#A8FF6B" stroke-width="1.2"/><path d="M6 2v2.5M12 2v2.5" stroke="#A8FF6B" stroke-width="1.2" stroke-linecap="round"/></svg>
            <div id="acctStatsListingsCount" style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text);letter-spacing:-0.03em;">—</div>
            <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Listings</div>
          </div>
          <div class="dm-stat-tile" style="border-color:rgba(95,224,160,0.16);">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#5fe0a0" stroke-width="1.3"/><path d="M9 5v4l3 2" stroke="#5fe0a0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div id="acctStatsMemberSince" style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);letter-spacing:-0.02em;">—</div>
            <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Member since</div>
          </div>
          <div class="dm-stat-tile" style="border-color:rgba(168,255,107,0.16);">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#A8FF6B" stroke-width="1.3"/><path d="M5.5 9l2 2 5-5" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div id="acctStatsLastSeen" style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);letter-spacing:-0.02em;">—</div>
            <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Last active</div>
          </div>
        </div>

        <!-- Payout settings — dark theme matching the rest of the modal -->
        
        <div class="pc-card" id="acctPayoutCard">

          <div class="pc-form" id="acctPayoutForm">
            <div>
              <div class="pc-title">PayPal payout</div>
              <div class="pc-subtitle">Where we send your earnings</div>
            </div>

            <div class="pc-group">
              <label class="pc-label" for="acctPayoutPaypalEmail">PayPal Email</label>
              <input id="acctPayoutPaypalEmail" type="email" placeholder="your@paypal.com" autocomplete="off">
            </div>

            <div class="pc-group">
              <label class="pc-label" for="acctPayoutCurrency">Default Currency</label>
              <select id="acctPayoutCurrency">
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="JPY">JPY — Japanese Yen</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="BRL">BRL — Brazilian Real</option>
              </select>
            </div>

            <div class="pc-group">
              <label class="pc-label" for="acctAutoWithdraw">Auto Withdraw</label>
              <select id="acctAutoWithdraw" onchange="awToggleMinRow('acct')">
                <option value="off">Off — manual only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div class="pc-group" id="acctAutoWithdrawMinRow" style="display:none;">
              <label class="pc-label" for="acctAutoWithdrawMin">Minimum Balance</label>
              <div class="pc-wrap pc-has-symbol">
                <span class="pc-symbol">$</span>
                <input id="acctAutoWithdrawMin" type="number" min="50" max="999" step="1" placeholder="50" oninput="awValidateMin('acct')">
              </div>
              <div id="acctAutoWithdrawMinErr" class="pc-min-err"></div>
              <div class="pc-min-note">We'll auto-withdraw once your balance reaches this amount (min $50, max $999). Your plan's platform fee still applies at payout time.</div>
            </div>

            <button class="pc-save-btn" onclick="savePayoutSettings('acct')">Save Settings</button>
          </div>

          <div class="pc-summary" id="acctPayoutSummary">
            <div class="pc-summary-info">
              <div class="pc-summary-title">PayPal Payout</div>
              <div class="pc-summary-value" id="acctPayoutSummaryEmail">Not set</div>
              <div class="pc-summary-meta" id="acctPayoutSummaryMeta">Off — manual only</div>
            </div>
            <button class="pc-edit-btn" onclick="document.getElementById('acctPayoutCard').classList.remove('pc-collapsed')">
              <svg width="16" height="16" viewBox="0 0 13 13" fill="none"><path d="M9 2.5L10.5 4 4.5 10H3V8.5L9 2.5Z" stroke="#A8FF6B" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>

        </div>

        <!-- Reset password -->
        <div class="dm-settings-label">Security</div>
        <div class="dm-settings-group" style="padding:14px 15px;">
          <div class="dm-card-head" style="margin-bottom:10px;">
            <div>
              <div class="dm-card-title">Reset password by email</div>
              <div class="dm-card-sub">We'll send a secure link to your inbox</div>
            </div>
          </div>
          <div id="acctResetOk" class="alert-ok"></div>
          <div id="acctResetErr" class="alert-err"></div>
          <button class="save-btn" onclick="sendResetFromSettings()" id="btnResetPwdAcct" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:var(--text);width:100%;margin-bottom:0;">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10v7a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-7ZM1.5 3.5l5 4 5-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Send reset link to my email
          </button>
        </div>

        <!-- Connected accounts -->
        <div class="dm-settings-label">Connected accounts</div>
        <div class="dm-settings-group" id="socialAccountsGroup">
          <!-- GitHub -->
          <div class="dm-settings-row" id="socialRow-github">
            <div class="dm-settings-icon" style="background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(220,220,220,0.85)"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label">GitHub</div>
              <div class="dm-settings-row-sub" id="socialSub-github">Not connected</div>
            </div>
            <button id="socialBtn-github" onclick="openGithubConnectFromSettings()" style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:var(--lime);background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.2);border-radius:7px;padding:5px 11px;cursor:pointer;flex-shrink:0;">Connect</button>
          </div>
          <div class="dm-settings-divider"></div>
          <!-- Facebook -->
          <div class="dm-settings-row" id="socialRow-facebook">
            <div class="dm-settings-icon" style="background:rgba(0,124,238,0.1);border-color:rgba(0,124,238,0.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5Z" stroke="#007CEE" stroke-width="1.3"/><path d="M10.5 5.5H9a1.5 1.5 0 0 0-1.5 1.5v1H10l-.5 2H7.5V13h-2v-3H4V8h1.5V7A3 3 0 0 1 8.5 4h2v1.5Z" fill="#007CEE"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label">Facebook</div>
              <div class="dm-settings-row-sub" id="socialSub-facebook">Not connected</div>
            </div>
            <button id="socialBtn-facebook" onclick="openSocialConnectModal('facebook')" style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:var(--lime);background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.2);border-radius:7px;padding:5px 11px;cursor:pointer;flex-shrink:0;">Connect</button>
          </div>
          <div class="dm-settings-divider"></div>
          <!-- X / Twitter -->
          <div class="dm-settings-row" id="socialRow-twitter">
            <div class="dm-settings-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 2.5h3.4l2.5 3.5 3-3.5H13L9.5 7l4 6.5h-3.4L7.5 9.5 4.2 13.5H2.5l3.8-4.6L2.5 2.5Z" fill="rgba(220,220,220,.85)"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label">X / Twitter</div>
              <div class="dm-settings-row-sub" id="socialSub-twitter">Not connected</div>
            </div>
            <button id="socialBtn-twitter" onclick="openSocialConnectModal('twitter')" style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:var(--lime);background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.2);border-radius:7px;padding:5px 11px;cursor:pointer;flex-shrink:0;">Connect</button>
          </div>
          <div class="dm-settings-divider"></div>
          <!-- LinkedIn -->
          <div class="dm-settings-row" id="socialRow-linkedin">
            <div class="dm-settings-icon" style="background:rgba(51,117,187,0.1);border-color:rgba(51,117,187,0.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5v7A2.5 2.5 0 0 1 11.5 14h-7A2.5 2.5 0 0 1 2 11.5v-7Z" stroke="#3375BB" stroke-width="1.2"/><circle cx="5.5" cy="5.5" r=".75" fill="#3375BB"/><path d="M5.5 7.5V11M8 7.5V11M8 9a2.5 2.5 0 0 1 5 0v2" stroke="#3375BB" stroke-width="1.2" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label">LinkedIn</div>
              <div class="dm-settings-row-sub" id="socialSub-linkedin">Not connected</div>
            </div>
            <button id="socialBtn-linkedin" onclick="openSocialConnectModal('linkedin')" style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:var(--lime);background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.2);border-radius:7px;padding:5px 11px;cursor:pointer;flex-shrink:0;">Connect</button>
          </div>
        </div>

        <!-- ── Social Connect Modal ─────────────────────────────── -->
        <div id="socialConnectModal" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:16px;">
          <!-- Backdrop -->
          <div onclick="closeSocialConnectModal()" style="position:absolute;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);"></div>
          <!-- Sheet -->
          <div id="socialConnectSheet" style="position:relative;width:100%;max-width:380px;border-radius:20px;padding:28px 24px 24px;font-family:'Syne',sans-serif;box-shadow:0 32px 80px rgba(0,0,0,0.6);animation:scmSlideUp .22s cubic-bezier(.34,1.4,.64,1) both;">
            <!-- Close -->
            <button onclick="closeSocialConnectModal()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.07);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
            <!-- Icon + title -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
              <div id="scmIconWrap" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"></div>
              <div>
                <div id="scmTitle" style="font-size:16px;font-weight:800;color:#fff;line-height:1.2;"></div>
                <div id="scmSubtitle" style="font-size:12px;font-weight:500;margin-top:2px;"></div>
              </div>
            </div>
            <!-- Input -->
            <div id="scmInputWrap" style="display:flex;flex-direction:column;gap:8px;">
              <label id="scmLabel" style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Profile URL</label>
              <div style="position:relative;">
                <input id="scmInput" type="url" placeholder="" autocomplete="off" spellcheck="false"
                  style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:11px;padding:12px 14px;font-family:'Syne',sans-serif;font-size:14px;font-weight:500;color:#fff;outline:none;transition:border-color .2s;"
                  onfocus="this.style.borderColor=window._scmAccent||'rgba(168,255,107,0.5)'"
                  onblur="this.style.borderColor='rgba(255,255,255,0.1)'"
                  onkeydown="if(event.key==='Enter')doSocialConnect()">
              </div>
              <div id="scmError" style="font-size:11px;font-weight:600;color:#ff6b6b;display:none;margin-top:2px;"></div>
            </div>
            <!-- Actions -->
            <div id="scmConnectedState" style="display:none;flex-direction:column;gap:10px;margin-top:4px;">
              <div id="scmConnectedUrl" style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);word-break:break-all;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:9px;"></div>
              <button onclick="doSocialDisconnect()" id="scmDisconnectBtn"
                style="width:100%;padding:13px;border:1.5px solid rgba(255,80,80,0.35);border-radius:11px;background:rgba(255,80,80,0.08);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#ff6b6b;cursor:pointer;transition:background .18s;"
                onmouseover="this.style.background='rgba(255,80,80,0.16)'" onmouseout="this.style.background='rgba(255,80,80,0.08)'">
                Disconnect
              </button>
            </div>
            <button id="scmConnectBtn" onclick="doSocialConnect()"
              style="width:100%;margin-top:14px;padding:13px;border:none;border-radius:11px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .18s;">
              Connect account
            </button>
          </div>
        </div>

        

        

        <!-- Wallet mini-activity -->
        <div class="dm-settings-label">Wallet</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 15px 10px;">
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Balance</div>
              <div style="font-size:11px;color:var(--text-dim);margin-top:1px;">Available to withdraw or spend</div>
            </div>
            <div id="acctWalletBalanceMini" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--lime);letter-spacing:-0.03em;">$0.00</div>
          </div>
          <div style="border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;">
            <button onclick="if(window.openTopUpModal)openTopUpModal();" style="padding:11px;font-size:11.5px;font-weight:700;color:var(--lime);background:transparent;border:none;border-right:1px solid var(--border);cursor:pointer;font-family:'Syne',sans-serif;">+ Top Up</button>
            <button onclick="if(window.openWithdrawModal)openWithdrawModal();" style="padding:11px;font-size:11.5px;font-weight:700;color:var(--text-dim);background:transparent;border:none;cursor:pointer;font-family:'Syne',sans-serif;">Withdraw</button>
          </div>
        </div>
        

        <!-- Recent transactions mini -->
        <div class="dm-settings-label">Recent Transactions</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;" id="acctMiniTxnWrap">
          <div id="acctMiniTxnList" style="display:flex;flex-direction:column;">
            <div style="padding:16px;text-align:center;font-size:12px;color:var(--text-faint);">Loading…</div>
          </div>
          <div style="border-top:1px solid var(--border);">
            <button onclick="openSettingsPanel('txnHistory')" style="width:100%;padding:11px;font-size:11.5px;font-weight:700;color:var(--text-dim);background:transparent;border:none;cursor:pointer;">View all transactions →</button>
          </div>
        </div>
        

        <!-- Notifications -->
        <div class="dm-settings-label">Notifications</div>
        <div class="dm-settings-group" style="margin-bottom:14px;">
          <div class="dm-settings-row" onclick="openSettingsPanel('notifications')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 0 0-5 5v2.5L1.5 11h13L13 9.5V7a5 5 0 0 0-5-5Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="#A8FF6B" stroke-width="1.3"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Notification settings</div><div class="dm-settings-row-sub">Email &amp; push preferences</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Offers inbox -->
        <div class="dm-settings-label">Offers Inbox</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <div id="offersInboxList" style="display:flex;flex-direction:column;">
            <div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Loading…</div>
          </div>
          <div style="border-top:1px solid var(--border);">
            <button onclick="if(window.openMessagesModal)openMessagesModal();" style="width:100%;padding:11px;font-size:11.5px;font-weight:700;color:var(--text-dim);background:transparent;border:none;cursor:pointer;">Open messages →</button>
          </div>
        </div>
        

        <!-- Listing performance analytics -->
        <div class="dm-settings-label">Listing Performance</div>
        <div class="dm-card" style="padding:16px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Views &amp; clicks (7 days)</div>
            <span id="listingPerfTotalViews" style="font-size:12px;font-weight:700;color:var(--lime);">0 views</span>
          </div>
          <div style="display:flex;align-items:flex-end;gap:5px;height:60px;margin-bottom:12px;" id="viewsBarChart">
            <!-- bars rendered by JS -->
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);" id="lpTotalViews">0</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Views</div></div>
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#38bdf8;" id="lpTotalClicks">0</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Clicks</div></div>
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#a855f7;" id="lpConvRate">0%</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">CTR</div></div>
          </div>
        </div>
        

        <!-- Payout history -->
        <div class="dm-settings-label">Payout History</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <div id="payoutHistoryList" style="display:flex;flex-direction:column;">
            <div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Loading…</div>
          </div>
        </div>
        

      </div>

      <!-- ── PAGE 3 — SETTINGS ─────────────────────────── -->
      <div class="dm-page hidden" id="dmPage-settings">

        <!-- Account group -->
        <div class="dm-settings-label">Account</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row" onclick="openSettingsPanel('profile')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="#A8FF6B" stroke-width="1.3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Profile</div><div class="dm-settings-row-sub">Name, email &amp; bio</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('billing')">
            <div class="dm-settings-icon" style="background:rgba(95,224,160,.1);border-color:rgba(95,224,160,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#5fe0a0" stroke-width="1.3"/><path d="M1 7.5h14" stroke="#5fe0a0" stroke-width="1.3"/><circle cx="12.5" cy="10.5" r="1" fill="#5fe0a0"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Billing</div><div class="dm-settings-row-sub">Plan, invoices &amp; wallet</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('txnHistory')">
            <div class="dm-settings-icon" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="#38bdf8" stroke-width="1.3"/><path d="M1.5 6h13" stroke="#38bdf8" stroke-width="1.2"/><path d="M4.5 9.5h3M4.5 11.5h5" stroke="#38bdf8" stroke-width="1.1" stroke-linecap="round"/><circle cx="12" cy="10.5" r="1.2" fill="#38bdf8"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Transaction history</div><div class="dm-settings-row-sub">Donations, deals, withdrawals &amp; transfers</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Preferences group -->
        <div class="dm-settings-label">Preferences</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row" onclick="openSettingsPanel('appearance')">
            <div class="dm-settings-icon" style="background:rgba(240,192,64,.1);border-color:rgba(240,192,64,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#f0c040" stroke-width="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="#f0c040" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Color mode</div><div class="dm-settings-row-sub">Dark, purple, or dev theme</div></div>
            <span class="dm-settings-value" id="settingsColorModeVal">Green</span>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('design')">
            <div class="dm-settings-icon" style="background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="8" rx="1.2" stroke="#a855f7" stroke-width="1.3"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="#a855f7" stroke-width="1.3"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="#a855f7" stroke-width="1.3"/><rect x="1.5" y="11.5" width="5.5" height="3" rx="1.2" stroke="#a855f7" stroke-width="1.3"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Design</div><div class="dm-settings-row-sub">Background image &amp; visual style</div></div>
            <span class="dm-settings-value" id="settingsDesignVal">Default</span>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('notifications')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 0 0-5 5v2.5L1.5 11h13L13 9.5V7a5 5 0 0 0-5-5Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="#A8FF6B" stroke-width="1.3"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Notifications</div><div class="dm-settings-row-sub">Email &amp; push alerts</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Privacy & Security group -->
        <div class="dm-settings-label">Privacy &amp; Security</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row" onclick="openSettingsPanel('security')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="2" stroke="#A8FF6B" stroke-width="1.3"/><path d="M5 7V5.5a3 3 0 0 1 6 0V7" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11" r="1.2" fill="#A8FF6B"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Password &amp; login</div><div class="dm-settings-row-sub">Change password, reset link</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('sessions')">
            <div class="dm-settings-icon" style="background:rgba(95,224,160,.1);border-color:rgba(95,224,160,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="2" stroke="#5fe0a0" stroke-width="1.3"/><path d="M5 12.5v1M8 12.5v1M11 12.5v1" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/><circle cx="5.5" cy="7.5" r="1" fill="#5fe0a0"/><path d="M8.5 6.5h3M8.5 8.5h2" stroke="#5fe0a0" stroke-width="1.1" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Active sessions</div><div class="dm-settings-row-sub">Devices signed in to your account</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('privacy')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4.5v4c0 3.5 2.5 5.5 6 6.5 3.5-1 6-3 6-6.5v-4L8 1.5Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 8l1.8 1.8 3.2-3.6" stroke="#A8FF6B" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Privacy controls</div><div class="dm-settings-row-sub">Profile visibility &amp; data settings</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Activity group -->
        <div class="dm-settings-label">Activity</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row" onclick="openSettingsPanel('activity')">
            <div class="dm-settings-icon" style="background:rgba(240,192,64,.1);border-color:rgba(240,192,64,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 11.5l3.5-4 3 3 3-5 3 3" stroke="#f0c040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Listing history</div><div class="dm-settings-row-sub">Sites you've listed &amp; sold</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('saved')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h8a1 1 0 0 1 1 1v11l-5-3-5 3V3a1 1 0 0 1 1-1Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linejoin="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Saved listings</div><div class="dm-settings-row-sub">Your watchlist &amp; saved searches</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('offers')">
            <div class="dm-settings-icon" style="background:rgba(95,224,160,.1);border-color:rgba(95,224,160,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/><path d="M1 9h14v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V9Z" stroke="#5fe0a0" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 9V7.5M10 9V7.5" stroke="#5fe0a0" stroke-width="1.2" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Offers &amp; deals</div><div class="dm-settings-row-sub">Offers made &amp; received</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Support group -->
        <div class="dm-settings-label">Support</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row" onclick="openSettingsPanel('contact')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C4.41 1.5 1.5 4.19 1.5 7.56c0 1.87.84 3.55 2.16 4.77L2.9 14.5l2.96-1.25c.67.21 1.38.31 2.14.31C11.59 13.56 14.5 10.87 14.5 7.5S11.59 1.5 8 1.5Z" stroke="#A8FF6B" stroke-width="1.3" stroke-linejoin="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Contact us</div><div class="dm-settings-row-sub">Send a message to our team</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="openSettingsPanel('about')">
            <div class="dm-settings-icon" style="background:rgba(95,224,160,.1);border-color:rgba(95,224,160,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#5fe0a0" stroke-width="1.3"/><path d="M8 7v5" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="4.5" r=".8" fill="#5fe0a0"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">About Siterifty</div><div class="dm-settings-row-sub">Version, legal &amp; credits</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <a href="https://siterifty.com/privacy" target="_blank" rel="noopener" style="text-decoration:none;">
            <div class="dm-settings-row">
              <div class="dm-settings-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
              </div>
              <div class="dm-settings-body"><div class="dm-settings-row-label">Privacy policy</div><div class="dm-settings-row-sub">How we handle your data</div></div>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="color:var(--text-faint);flex-shrink:0;"><path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>
          <div class="dm-settings-divider"></div>
          <a href="https://siterifty.com/terms" target="_blank" rel="noopener" style="text-decoration:none;">
            <div class="dm-settings-row">
              <div class="dm-settings-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </div>
              <div class="dm-settings-body"><div class="dm-settings-row-label">Terms of service</div><div class="dm-settings-row-sub">Platform rules &amp; agreements</div></div>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="color:var(--text-faint);flex-shrink:0;"><path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>
        </div>

        <!-- Referrals -->
        <div class="dm-settings-label">Referrals</div>
        <div class="dm-settings-group" style="overflow:hidden;">
          <div style="padding:14px 15px;background:linear-gradient(135deg,rgba(168,255,107,0.06),rgba(95,224,160,0.04));display:flex;align-items:center;gap:12px;">
            <div style="width:34px;height:34px;border-radius:10px;background:rgba(168,255,107,0.12);border:1px solid rgba(168,255,107,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="#A8FF6B" stroke-width="1.3"/><circle cx="11.5" cy="5" r="2.5" stroke="#5fe0a0" stroke-width="1.3"/><path d="M1 13c0-2 2-3.5 4.5-3.5" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round"/><path d="M8.5 10.5C9.5 9.5 11 9 11.5 9c2.5 0 4.5 1.5 4.5 4" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">Invite &amp; earn</div>
              <div style="font-size:10px;color:var(--text-dim);margin-top:1px;">Earn credit when friends sign up</div>
            </div>
            <button onclick="openSettingsPanel('referral')" style="flex-shrink:0;padding:6px 12px;border-radius:8px;background:rgba(168,255,107,0.14);border:1px solid rgba(168,255,107,0.28);color:var(--lime);font-family:'Syne',sans-serif;font-size:10px;font-weight:700;cursor:pointer;letter-spacing:0.04em;">View</button>
          </div>
        </div>

        <!-- Referrals -->
        <div class="dm-settings-label">Referrals</div>
        <div class="dm-settings-group" style="overflow:hidden;">
          <div style="padding:14px 15px;background:linear-gradient(135deg,rgba(168,255,107,0.06),rgba(95,224,160,0.04));display:flex;align-items:center;gap:12px;">
            <div style="width:34px;height:34px;border-radius:10px;background:rgba(168,255,107,0.12);border:1px solid rgba(168,255,107,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="#A8FF6B" stroke-width="1.3"/><circle cx="11.5" cy="5" r="2.5" stroke="#5fe0a0" stroke-width="1.3"/><path d="M1 13c0-2 2-3.5 4.5-3.5" stroke="#A8FF6B" stroke-width="1.3" stroke-linecap="round"/><path d="M8.5 10.5C9.5 9.5 11 9 11.5 9c2.5 0 4.5 1.5 4.5 4" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">Invite &amp; earn</div>
              <div style="font-size:10px;color:var(--text-dim);margin-top:1px;">Earn credit when friends sign up</div>
            </div>
            <button onclick="openSettingsPanel('referral')" style="flex-shrink:0;padding:6px 12px;border-radius:8px;background:rgba(168,255,107,0.14);border:1px solid rgba(168,255,107,0.28);color:var(--lime);font-family:'Syne',sans-serif;font-size:10px;font-weight:700;cursor:pointer;letter-spacing:0.04em;">View</button>
          </div>
        </div>

        <!-- Quick notification toggles -->
        <div class="dm-settings-label">Notification Toggles</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <div id="notifToggleList" style="display:flex;flex-direction:column;"></div>
        </div>
        

        <!-- Fee calculator -->
        <div class="dm-settings-label">Platform Fee Calculator</div>
        <div class="dm-card" style="padding:16px;margin-bottom:14px;">
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:12px;">See how much you keep after fees based on your plan</div>
          <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;">
            <div style="flex:1;position:relative;">
              <span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-dim);font-weight:700;font-size:13px;">$</span>
              <input id="feeCalcInput" type="number" min="1" placeholder="1000" oninput="calcFeePreview()" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px 10px 26px;color:var(--text);font-size:13px;font-weight:600;outline:none;" onfocus="this.style.borderColor='rgba(168,255,107,0.5)'" onblur="this.style.borderColor='var(--border)'">
            </div>
            <select id="feeCalcPlan" onchange="calcFeePreview()" style="width:110px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 10px;color:var(--text);font-size:12px;font-weight:600;outline:none;cursor:pointer;">
              <option value="0.30">Free (30%)</option>
              <option value="0.15">Starter (15%)</option>
              <option value="0.10">Growth (10%)</option>
              <option value="0.05">Pro (5%)</option>
            </select>
          </div>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:9px;" id="feeCalcResult">
            <div style="display:flex;justify-content:space-between;"><span style="font-size:11.5px;color:var(--text-dim);">Sale price</span><span style="font-size:12px;font-weight:700;color:var(--text);" id="fcSalePrice">$1,000</span></div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;justify-content:space-between;"><span style="font-size:11.5px;color:var(--text-dim);">Platform fee</span><span style="font-size:12px;font-weight:700;color:#f87171;" id="fcFee">-$300</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="font-size:11.5px;color:var(--text-dim);">PayPal fee (~3.5%)</span><span style="font-size:12px;font-weight:700;color:#f87171;" id="fcPaypal">-$24.50</span></div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;justify-content:space-between;"><span style="font-size:12px;font-weight:800;color:var(--text);">You receive</span><span style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--lime);" id="fcNet">$675.50</span></div>
          </div>
        </div>
        

        <!-- Listing preferences -->
        <div class="dm-settings-label">Listing Preferences</div>
        <div class="dm-card" style="padding:16px;margin-bottom:14px;">
          <div style="display:flex;flex-direction:column;gap:13px;">
            <div>
              <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:6px;">Default asking price multiplier</div>
              <div style="display:flex;gap:6px;">
                <button class="lp-mult-btn active" data-mult="2" onclick="setMultPref(2,this)" style="flex:1;padding:8px 4px;border-radius:8px;background:rgba(168,255,107,0.15);border:1px solid rgba(168,255,107,0.4);color:var(--lime);font-size:11px;font-weight:700;cursor:pointer;">2× MRR</button>
                <button class="lp-mult-btn" data-mult="3" onclick="setMultPref(3,this)" style="flex:1;padding:8px 4px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);font-size:11px;font-weight:700;cursor:pointer;">3× MRR</button>
                <button class="lp-mult-btn" data-mult="5" onclick="setMultPref(5,this)" style="flex:1;padding:8px 4px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);font-size:11px;font-weight:700;cursor:pointer;">5× MRR</button>
                <button class="lp-mult-btn" data-mult="12" onclick="setMultPref(12,this)" style="flex:1;padding:8px 4px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);font-size:11px;font-weight:700;cursor:pointer;">12× MRR</button>
              </div>
              <div style="font-size:10px;color:var(--text-faint);margin-top:6px;">Used as the default multiple when creating a new listing</div>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:12.5px;font-weight:600;color:var(--text);">Allow direct offers</div>
                <div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">Let buyers message you with offers below asking price</div>
              </div>
              <label class="dm-switch" onclick="event.stopPropagation()" style="flex-shrink:0;">
                <input type="checkbox" id="lpAllowOffers" checked onchange="saveListingPref('allowOffers',this.checked)">
                <span class="dm-switch-track"></span><span class="dm-switch-thumb"></span>
              </label>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:12.5px;font-weight:600;color:var(--text);">Auto-relist on expiry</div>
                <div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">Automatically re-publish listings after 30 days if unsold</div>
              </div>
              <label class="dm-switch" onclick="event.stopPropagation()" style="flex-shrink:0;">
                <input type="checkbox" id="lpAutoRelist" onchange="saveListingPref('autoRelist',this.checked)">
                <span class="dm-switch-track"></span><span class="dm-switch-thumb"></span>
              </label>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:12.5px;font-weight:600;color:var(--text);">Show revenue publicly</div>
                <div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">Display MRR/ARR on your listing cards</div>
              </div>
              <label class="dm-switch" onclick="event.stopPropagation()" style="flex-shrink:0;">
                <input type="checkbox" id="lpShowRevenue" checked onchange="saveListingPref('showRevenue',this.checked)">
                <span class="dm-switch-track"></span><span class="dm-switch-thumb"></span>
              </label>
            </div>
          </div>
        </div>
        
        

        <!-- Account Actions / Danger zone -->
        <div class="dm-settings-label" style="color:rgba(255,144,144,0.5);">Account Actions</div>
        <div class="dm-settings-group" style="margin-bottom:32px;">
          <div class="dm-settings-row dm-settings-row-danger" onclick="doSignOut()">
            <div class="dm-settings-icon dm-settings-icon-danger">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 8h8M11 5l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label dm-settings-label-danger">Sign out</div>
              <div class="dm-settings-row-sub" style="color:rgba(255,144,144,0.5);">End session on this device</div>
            </div>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row dm-settings-row-danger" onclick="openSettingsPanel('transferAccount')" style="cursor:pointer;">
            <div class="dm-settings-icon" style="background:rgba(240,192,64,0.08);border-color:rgba(240,192,64,0.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 4l4 4-4 4" stroke="#f0c040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" stroke="#f0c040" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label" style="color:#f0c040;">Transfer account</div>
              <div class="dm-settings-row-sub" style="color:rgba(240,192,64,0.5);">Hand ownership to another user</div>
            </div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none" style="color:rgba(240,192,64,0.35);"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row dm-settings-row-danger" onclick="openSettingsPanel('deleteAccount')">
            <div class="dm-settings-icon dm-settings-icon-danger">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M5 5V3.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V5M6 8v4M10 8v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 5l.667 8.5a1 1 0 0 0 .999.936h4.668a1 1 0 0 0 .999-.936L12 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body">
              <div class="dm-settings-row-label dm-settings-label-danger">Delete account</div>
              <div class="dm-settings-row-sub" style="color:rgba(255,144,144,0.4);">Permanently remove your data</div>
            </div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none" style="color:rgba(255,144,144,0.35);"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:4px 0 12px;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span style="font-size:11px;color:var(--text-faint);">Siterifty · v1.0.0</span>
          <span style="font-size:10px;color:rgba(98,117,106,0.5);">© 2025 Siterifty. All rights reserved.</span>
        </div>

      </div>

      <!-- ── PAGE 4 — SUPPORT (placeholder, built in a later step) ── -->
      <div class="dm-page hidden" id="dmPage-support">

        <!-- Support tier card -->
        <div class="dm-card" id="supportTierCard">
          <div class="dm-card-head">
            <div>
              <div class="dm-card-title">Your plan</div>
              <div class="dm-card-sub" style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span id="supportTierName" style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text);letter-spacing:-0.02em;">Free</span>
                <span id="supportTierBadge" style="font-size:9px;font-weight:700;letter-spacing:.07em;padding:3px 9px;border-radius:999px;border:1px solid;background:rgba(139,138,168,0.12);border-color:rgba(139,138,168,0.25);color:#8b8aa8;">FREE</span>
              </div>
            </div>
            <button class="dm-btn dm-btn-primary" id="supportUpgradeBtn" style="width:auto;padding:8px 16px;margin:0;font-size:12px;display:flex;align-items:center;gap:6px;" onclick="if(window.openPlansPickerModal){openPlansPickerModal();}else if(window.showPage){showPage('profile');document.getElementById('acPlanPicker').style.display='block';document.getElementById('acPlanPicker').scrollIntoView({behavior:'smooth'});}">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Upgrade
            </button>
          </div>

          <div class="dm-tier-labels">
            <span>Free</span><span>Starter</span><span>Growth</span><span>Pro</span>
          </div>
          <div class="dm-tier-track">
            <div class="dm-tier-seg" id="tierSeg0"><div class="dm-tier-fill" id="tierFill0"></div></div>
            <div class="dm-tier-seg" id="tierSeg1"><div class="dm-tier-fill" id="tierFill1"></div></div>
            <div class="dm-tier-seg" id="tierSeg2"><div class="dm-tier-fill" id="tierFill2"></div></div>
            <div class="dm-tier-seg" id="tierSeg3"><div class="dm-tier-fill" id="tierFill3"></div></div>
          </div>
          <div class="dm-card-sub" id="supportTierNext" style="margin-bottom:10px;">Next: Starter</div>

          <div id="supportTierPerks" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        </div>

        <!-- "We're here to help" banner -->
        <div class="dm-card" style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(168,255,107,0.08),rgba(95,224,160,0.03));border-color:rgba(168,255,107,0.18);">
          <div style="width:38px;height:38px;border-radius:11px;background:rgba(168,255,107,.12);border:1px solid rgba(168,255,107,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div>
            <div class="dm-card-title" style="font-size:13px;">We're here to help</div>
            <div class="dm-card-sub">Our team typically replies within 2–4 hours. Include your account email for faster help.</div>
          </div>
        </div>

        <!-- Response stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
          <div class="dm-stat-tile" style="border-color:rgba(168,255,107,0.16);">
            <span style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--lime);">~2h</span>
            <span style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;">Avg Reply</span>
          </div>
          <div class="dm-stat-tile" style="border-color:rgba(95,224,160,0.16);">
            <span style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#5fe0a0;">24/7</span>
            <span style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;">Available</span>
          </div>
          <div class="dm-stat-tile" style="border-color:rgba(168,255,107,0.16);">
            <span style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--lime);">100%</span>
            <span style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.05em;">Resolved</span>
          </div>
        </div>

        <!-- Contact form -->
        <div class="dm-card">
          <div class="dm-card-title" style="margin-bottom:14px;">Send us a message</div>

          <div class="dm-field">
            <label class="dm-label" for="supportName">Your name</label>
            <input id="supportName" class="dm-input" type="text" placeholder="Your display name" autocomplete="name">
          </div>
          <div class="dm-field">
            <label class="dm-label" for="supportEmail">Email address</label>
            <input id="supportEmail" class="dm-input" type="email" placeholder="Your email" autocomplete="email">
          </div>
          <div class="dm-field">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <label class="dm-label" for="supportMsg" style="margin-bottom:0;">Message</label>
              <span id="supportCharCount" style="font-size:10.5px;color:var(--text-faint);">0 / 1000</span>
            </div>
            <textarea id="supportMsg" class="dm-textarea" rows="5" maxlength="1000" placeholder="Tell us what's on your mind — we're here to help…" style="margin-top:7px;resize:vertical;" oninput="document.getElementById('supportCharCount').textContent = this.value.length + ' / 1000';"></textarea>
          </div>

          <div id="supportOk" class="dm-alert dm-alert-ok" style="display:none;align-items:center;gap:6px;">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink:0;"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Message sent! We'll be in touch soon.
          </div>
          <div id="supportErr" class="dm-alert dm-alert-err"></div>

          <button id="supportSendBtn" class="dm-btn dm-btn-primary" style="width:100%;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:7px;" onclick="sendSupportMessage()">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 5-10 5 2-5-2-5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Send message
          </button>
        </div>

        <!-- FAQ -->
        <div class="dm-settings-label">Common Questions</div>
        <div class="dm-settings-group">
          <div class="dm-settings-row faq-row" onclick="toggleFaq(this)">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 11v.01M8 8.5c0-1.2 1.5-1.2 1.5-2.5A1.5 1.5 0 0 0 8 4.5 1.5 1.5 0 0 0 6.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">How do I list a site for sale?</span>
              <svg class="dm-settings-chevron faq-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="faq-answer">Tap "List a Site" from the wallet quick actions on the Profile page, fill in your site's details (URL, revenue, traffic, asking price), and submit for review. Most listings go live within a few hours.</div>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row faq-row" onclick="toggleFaq(this)">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6.5h13" stroke="currentColor" stroke-width="1.3"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">What payment methods are accepted?</span>
              <svg class="dm-settings-chevron faq-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="faq-answer">Site purchases and subscription payments are processed securely through PayPal. Your wallet balance can also be used to pay for subscriptions, site purchases, and hosting.</div>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row faq-row" onclick="toggleFaq(this)">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.18 2.39L11.6 3.8l-2 1.94.47 2.74L8 7.2 5.53 8.5l.47-2.74L4 3.8l2.82-.43Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">What are the platform fees?</span>
              <svg class="dm-settings-chevron faq-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="faq-answer">Platform fees depend on your plan: Free is 30%, Starter is 15%, Growth is 10%, and Pro is just 5%. Upgrading your plan lowers the fee on every sale.</div>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row faq-row" onclick="toggleFaq(this)">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">Can I cancel my subscription?</span>
              <svg class="dm-settings-chevron faq-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="faq-answer">Yes — head to Profile → Subscription → Manage plan and switch to Free at any time. You'll keep your current plan's benefits until the end of the billing period.</div>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row faq-row" onclick="toggleFaq(this)">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 13h12M6 13v-2M10 13v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">How does wallet balance work?</span>
              <svg class="dm-settings-chevron faq-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="faq-answer">Your wallet holds funds from site sales, referral earnings, and top-ups. Use it to pay for subscriptions, site purchases, or withdraw to PayPal anytime from the Profile page.</div>
          </div>
        </div>

        <!-- Legal & Info -->
        <div class="dm-settings-label">Legal &amp; Info</div>
        <div class="dm-settings-group">
          <a class="dm-settings-row" href="/privacy" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5 2 3.5v4c0 3.5 2.5 5.8 6 7 3.5-1.2 6-3.5 6-7v-4L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">Privacy Policy</span>
              <svg class="dm-settings-chevron" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5 11L11 5M5 5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>
          <div class="dm-settings-divider"></div>
          <a class="dm-settings-row" href="/terms" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 5h5M5.5 8h5M5.5 11h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">Terms of Service</span>
              <svg class="dm-settings-chevron" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5 11L11 5M5 5h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>
          <div class="dm-settings-divider"></div>
          <a class="dm-settings-row" id="supportDirectEmailLink" href="mailto:support@siterifty.com" style="text-decoration:none;color:inherit;">
            <div class="dm-settings-icon"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 4l6 4.5L14 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="dm-settings-body">
              <span class="dm-settings-row-label">Email Us Directly</span>
              <span class="dm-settings-value" id="supportEmailDisplay">support@siterifty.com</span>
            </div>
          </a>
        </div>

        <!-- Platform status -->
        <div class="dm-settings-label">Platform Status</div>
        <div class="dm-card" style="padding:14px 15px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div id="statusDotMain" style="width:9px;height:9px;border-radius:999px;background:var(--lime);flex-shrink:0;box-shadow:0 0 8px rgba(168,255,107,0.6);"></div>
            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);" id="statusLabelMain">All systems operational</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11.5px;color:var(--text-dim);">Marketplace</span>
              <span style="font-size:11px;font-weight:600;color:var(--lime);">✓ Online</span>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11.5px;color:var(--text-dim);">Escrow &amp; payments</span>
              <span style="font-size:11px;font-weight:600;color:var(--lime);">✓ Online</span>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11.5px;color:var(--text-dim);">Chat &amp; messaging</span>
              <span style="font-size:11px;font-weight:600;color:var(--lime);">✓ Online</span>
            </div>
            <div style="height:1px;background:var(--border);"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11.5px;color:var(--text-dim);">Wallet &amp; withdrawals</span>
              <span style="font-size:11px;font-weight:600;color:var(--lime);">✓ Online</span>
            </div>
          </div>
        </div>

        <!-- Your support messages -->
        <div class="dm-settings-label">Your Messages</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <div id="mySupportMsgList" style="display:flex;flex-direction:column;">
            <div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Loading…</div>
          </div>
        </div>
        

        <!-- Quick links -->
        <div class="dm-settings-label">Quick Links</div>
        <div class="dm-settings-group" style="margin-bottom:14px;">
          <div class="dm-settings-row" onclick="window.open('https://siterifty.com/browse','_blank')">
            <div class="dm-settings-icon" style="background:rgba(168,255,107,.1);border-color:rgba(168,255,107,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="2" stroke="#A8FF6B" stroke-width="1.3"/><path d="M1.5 6.5h13" stroke="#A8FF6B" stroke-width="1.2"/><path d="M5 9.5h2M5 11.5h4" stroke="#A8FF6B" stroke-width="1.1" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Browse marketplace</div><div class="dm-settings-row-sub">Find sites for sale</div></div>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="color:var(--text-faint);flex-shrink:0;"><path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="window.open('https://siterifty.com/sell-my-site','_blank')">
            <div class="dm-settings-icon" style="background:rgba(95,224,160,.1);border-color:rgba(95,224,160,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#5fe0a0" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">List a site</div><div class="dm-settings-row-sub">Sell your website or project</div></div>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="color:var(--text-faint);flex-shrink:0;"><path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="dm-settings-divider"></div>
          <div class="dm-settings-row" onclick="if(window.openWithdrawModal)openWithdrawModal()">
            <div class="dm-settings-icon" style="background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.2);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="#a855f7" stroke-width="1.3"/><path d="M1.5 7h13" stroke="#a855f7" stroke-width="1.2"/><circle cx="11" cy="10" r="1.2" fill="#a855f7"/></svg>
            </div>
            <div class="dm-settings-body"><div class="dm-settings-row-label">Withdraw earnings</div><div class="dm-settings-row-sub">Transfer balance to PayPal</div></div>
            <svg class="dm-settings-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- ROI Calculator -->
        <div class="dm-settings-label">ROI Calculator</div>
        <div class="dm-card" style="padding:16px;margin-bottom:14px;">
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:12px;">Estimate your return on a site acquisition</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
            <div style="display:flex;gap:8px;align-items:center;">
              <label style="font-size:11px;color:var(--text-faint);font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:80px;flex-shrink:0;">Buy price</label>
              <div style="flex:1;position:relative;"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-dim);font-weight:700;font-size:13px;">$</span><input id="roiPrice" type="number" placeholder="5000" oninput="calcROI()" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:9px 10px 9px 24px;color:var(--text);font-size:13px;font-weight:600;outline:none;" onfocus="this.style.borderColor='rgba(168,255,107,.5)'" onblur="this.style.borderColor='var(--border)'"></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <label style="font-size:11px;color:var(--text-faint);font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:80px;flex-shrink:0;">Monthly rev</label>
              <div style="flex:1;position:relative;"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-dim);font-weight:700;font-size:13px;">$</span><input id="roiMRR" type="number" placeholder="500" oninput="calcROI()" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:9px 10px 9px 24px;color:var(--text);font-size:13px;font-weight:600;outline:none;" onfocus="this.style.borderColor='rgba(168,255,107,.5)'" onblur="this.style.borderColor='var(--border)'"></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <label style="font-size:11px;color:var(--text-faint);font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:80px;flex-shrink:0;">Monthly cost</label>
              <div style="flex:1;position:relative;"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-dim);font-weight:700;font-size:13px;">$</span><input id="roiCost" type="number" placeholder="50" oninput="calcROI()" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:9px 10px 9px 24px;color:var(--text);font-size:13px;font-weight:600;outline:none;" onfocus="this.style.borderColor='rgba(168,255,107,.5)'" onblur="this.style.borderColor='var(--border)'"></div>
            </div>
          </div>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="roiResult">
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--lime);" id="roiPayback">10mo</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Payback</div></div>
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#38bdf8;" id="roiAnnual">$5,400</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Annual profit</div></div>
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#a855f7;" id="roiROI">108%</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Year-1 ROI</div></div>
            <div style="text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#f0c040;" id="roiMultiple">10×</div><div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;">Revenue mult</div></div>
          </div>
        </div>
        

        <!-- Due diligence checklist -->
        <div class="dm-settings-label">Buyer Due Diligence</div>
        <div class="dm-card" style="padding:16px;margin-bottom:14px;">
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:12px;">Run through this before committing to a purchase</div>
          <div id="ddSupportChecklist" style="display:flex;flex-direction:column;gap:7px;"></div>
          <button onclick="resetDDChecklist()" style="margin-top:12px;padding:8px 14px;border-radius:8px;background:transparent;border:1px solid var(--border);color:var(--text-faint);font-size:11px;font-weight:600;cursor:pointer;">Reset checklist</button>
        </div>
        

        <!-- Seller tips -->
        <div class="dm-settings-label">Seller Tips</div>
        <div class="dm-card" style="padding:0;overflow:hidden;margin-bottom:24px;">
          <div style="display:flex;flex-direction:column;">
            <div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(168,255,107,0.1);border:1px solid rgba(168,255,107,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">💡</div>
              <div><div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;">Write a compelling description</div><div style="font-size:11px;color:var(--text-faint);line-height:1.5;">Listings with 200+ word descriptions get 3× more inquiries. Include traffic sources, revenue proof, and growth potential.</div></div>
            </div>
            <div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">📊</div>
              <div><div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;">Price at 10–20× monthly profit</div><div style="font-size:11px;color:var(--text-faint);line-height:1.5;">Most indie sites sell between 10–24× MRR. Priced too high = no offers. Priced at 12–16× = fast sale.</div></div>
            </div>
            <div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">🔗</div>
              <div><div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;">Verify your domain upfront</div><div style="font-size:11px;color:var(--text-faint);line-height:1.5;">Listings with verified domains get a trust badge and rank higher in search. Upload a screenshot to verify.</div></div>
            </div>
            <div style="padding:13px 15px;display:flex;gap:10px;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(240,192,64,0.1);border:1px solid rgba(240,192,64,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">⚡</div>
              <div><div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;">Respond to offers within 24h</div><div style="font-size:11px;color:var(--text-faint);line-height:1.5;">Sellers who reply fast close 2× more deals. Enable push notifications so you never miss a buyer message.</div></div>
            </div>
          </div>
        </div>

      </div>


    </div><!-- dm-scroll -->


    <!-- ── Preserved settings sub-panels (drill-down screens), styled via
         legacy-class CSS aliased to the new lime palette above ── -->

                        <!-- Profile edit sub-panel -->
                        <div class="settings-sub-panel" id="subProfile">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subProfile')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Edit Profile</span>
                            </div>
                            <div class="settings-sub-body">

                                <!-- Avatar -->
                                <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 0 8px;">
                                    <div style="position:relative;display:inline-flex;">
                                        <div class="dm-avatar-lg" id="subProfileAvatar" onclick="handleAvatarClick()" style="cursor:pointer;width:72px;height:72px;font-size:28px;">?</div>
                                        <div class="dm-avatar-edit" title="Change photo" onclick="handleAvatarClick()" style="cursor:pointer;">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg>
                                        </div>
                                    </div>
                                    <div style="font-family:'Syne',sans-serif;font-size:11px;font-weight:600;color:var(--text-dim);">Tap photo to change</div>
                                </div>

                                <!-- Display name -->
                                <div class="dm-field" style="margin-bottom:12px;">
                                    <label class="dm-label" for="subProfileUsername">Display name</label>
                                    <input id="subProfileUsername" class="dm-input" type="text" placeholder="e.g. Alex Rivera" autocomplete="name">
                                </div>

                                <!-- Bio -->
                                <div class="dm-field" style="margin-bottom:4px;">
                                    <label class="dm-label" for="subProfileBio">Bio</label>
                                    <textarea id="subProfileBio" class="dm-textarea" maxlength="160" placeholder="Tell people a little about yourself…" oninput="document.getElementById('subProfileBioCount').textContent=this.value.length"></textarea>
                                    <div class="dm-char-count"><span id="subProfileBioCount">0</span>/160</div>
                                </div>

                                <!-- Email (read-only) -->
                                <div class="dm-field" style="margin-bottom:16px;">
                                    <label class="dm-label" for="subProfileEmail">Email</label>
                                    <input id="subProfileEmail" class="dm-input" type="email" disabled>
                                </div>

                                <div class="dm-alert dm-alert-err" id="subProfileErr" style="margin-bottom:8px;"></div>
                                <div class="dm-alert dm-alert-ok"  id="subProfileOk"  style="margin-bottom:8px;"></div>
                                <button class="dm-btn dm-btn-primary" style="width:100%;" onclick="window._subProfileSave()">Save changes</button>

                                <!-- Divider -->
                                <div style="height:1px;background:rgba(255,255,255,0.07);margin:22px 0 18px;"></div>
                                <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:var(--text);margin-bottom:14px;">Change Password</div>

                                <!-- New password -->
                                <div class="dm-field" style="margin-bottom:12px;">
                                    <label class="dm-label" for="subProfilePw">New password</label>
                                    <div class="dm-input-row">
                                        <input id="subProfilePw" class="dm-input" type="password" placeholder="Min. 6 characters" autocomplete="new-password">
                                        <button class="dm-input-icon-btn" onclick="togglePw('subProfilePw')" tabindex="-1">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- Confirm password -->
                                <div class="dm-field" style="margin-bottom:16px;">
                                    <label class="dm-label" for="subProfilePwConfirm">Confirm password</label>
                                    <div class="dm-input-row">
                                        <input id="subProfilePwConfirm" class="dm-input" type="password" placeholder="Repeat password" autocomplete="new-password">
                                        <button class="dm-input-icon-btn" onclick="togglePw('subProfilePwConfirm')" tabindex="-1">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                    </div>
                                    <div class="dm-hint" id="subProfilePwHint"></div>
                                </div>

                                <div class="dm-alert dm-alert-err" id="subProfilePwErr" style="margin-bottom:8px;"></div>
                                <div class="dm-alert dm-alert-ok"  id="subProfilePwOk"  style="margin-bottom:8px;"></div>
                                <button class="dm-btn dm-btn-ghost" style="width:100%;" onclick="window._subProfileSavePw()">Update password</button>

                            </div>
                        </div>

                        <div class="settings-sub-panel" id="subBilling">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subBilling')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Billing</span>
                            </div>
                            <div class="settings-sub-body" id="subBillingBody">
                                <!-- populated by populateAccountTab -->
                            </div>
                        </div>

                        <!-- Transaction History sub-panel -->
                        <div class="settings-sub-panel" id="subTxnHistory">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subTxnHistory')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Transaction History</span>
                            </div>
                            <div class="settings-sub-body" style="padding:0;">
                                <!-- Tab bar -->
                                <div id="txnTabBar" style="display:flex;gap:0;padding:12px 14px 0;border-bottom:1px solid rgba(255,255,255,0.07);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
                                    <button onclick="window._txnSwitchTab('all')" id="txnTab-all" style="flex-shrink:0;padding:7px 13px;border:none;background:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#38bdf8;border-bottom:2px solid #38bdf8;cursor:pointer;letter-spacing:.03em;transition:all .15s;">All</button>
                                    <button onclick="window._txnSwitchTab('donations')" id="txnTab-donations" style="flex-shrink:0;padding:7px 13px;border:none;background:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.03em;transition:all .15s;">Donations</button>
                                    <button onclick="window._txnSwitchTab('deals')" id="txnTab-deals" style="flex-shrink:0;padding:7px 13px;border:none;background:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.03em;transition:all .15s;">Deals</button>
                                    <button onclick="window._txnSwitchTab('withdrawals')" id="txnTab-withdrawals" style="flex-shrink:0;padding:7px 13px;border:none;background:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.03em;transition:all .15s;">Withdrawals</button>
                                    <button onclick="window._txnSwitchTab('transfers')" id="txnTab-transfers" style="flex-shrink:0;padding:7px 13px;border:none;background:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.03em;transition:all .15s;">Transfers</button>
                                </div>
                                <!-- Summary stats bar -->
                                <div id="txnStatsBar" style="display:flex;gap:0;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.07);">
                                    <div style="flex:1;text-align:center;">
                                        <div id="txnStatTotal" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);">—</div>
                                        <div style="font-size:9px;color:var(--muted);margin-top:2px;letter-spacing:.05em;text-transform:uppercase;">Total</div>
                                    </div>
                                    <div style="width:1px;background:rgba(255,255,255,0.07);flex-shrink:0;"></div>
                                    <div style="flex:1;text-align:center;">
                                        <div id="txnStatIn" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#34d399;">—</div>
                                        <div style="font-size:9px;color:var(--muted);margin-top:2px;letter-spacing:.05em;text-transform:uppercase;">Received</div>
                                    </div>
                                    <div style="width:1px;background:rgba(255,255,255,0.07);flex-shrink:0;"></div>
                                    <div style="flex:1;text-align:center;">
                                        <div id="txnStatOut" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#f87171;">—</div>
                                        <div style="font-size:9px;color:var(--muted);margin-top:2px;letter-spacing:.05em;text-transform:uppercase;">Sent</div>
                                    </div>
                                    <div style="width:1px;background:rgba(255,255,255,0.07);flex-shrink:0;"></div>
                                    <div style="flex:1;text-align:center;">
                                        <div id="txnStatCount" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--text);">—</div>
                                        <div style="font-size:9px;color:var(--muted);margin-top:2px;letter-spacing:.05em;text-transform:uppercase;">Count</div>
                                    </div>
                                </div>
                                <!-- List -->
                                <div id="txnList" style="padding:12px 14px 20px;overflow-y:auto;max-height:calc(100vh - 260px);">
                                    <div style="text-align:center;padding:40px 0 20px;color:var(--muted);font-size:12px;">Loading…</div>
                                </div>
                            </div>
                        </div>

                        <!-- Appearance sub-panel -->
                        <div class="settings-sub-panel" id="subAppearance">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subAppearance')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Color mode</span>
                            </div>
                            <div class="settings-sub-body">
                                <div class="settings-group" style="margin-top:0;">
                                    <div class="settings-row settings-row-selectable" id="themeRowGreen" onclick="setTheme('green');selectThemeRow('green')">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" fill="#060f08" stroke="#a8ff6b" stroke-width="1.3"/></svg></div>
                                        <span class="settings-row-label">Green</span>
                                        <svg class="settings-row-check hidden" id="themeCheckGreen" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="#00cfaa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div class="settings-row settings-row-selectable" id="themeRowNavy" onclick="setTheme('navy');selectThemeRow('navy')">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" fill="#070b14" stroke="#38bdf8" stroke-width="1.3"/></svg></div>
                                        <span class="settings-row-label">Navy</span>
                                        <svg class="settings-row-check hidden" id="themeCheckNavy" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="#00cfaa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div class="settings-row settings-row-selectable" id="themeRowSlate" onclick="setTheme('slate');selectThemeRow('slate')">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" fill="#0a0d12" stroke="#b8b7d4" stroke-width="1.3"/></svg></div>
                                        <span class="settings-row-label">Slate</span>
                                        <svg class="settings-row-check hidden" id="themeCheckSlate" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="#00cfaa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div class="settings-row settings-row-selectable" id="themeRowBlack" onclick="setTheme('black');selectThemeRow('black')">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" fill="#000000" stroke="#666" stroke-width="1.3"/></svg></div>
                                        <span class="settings-row-label">Black</span>
                                        <svg class="settings-row-check hidden" id="themeCheckBlack" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="#00cfaa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Design sub-panel -->
                        <div class="settings-sub-panel" id="subDesign">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subDesign')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Design</span>
                            </div>
                            <div class="settings-sub-body" style="padding-bottom:32px;">

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;">Background Image</div>
                                <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:16px;line-height:1.6;">
                                    Choose a background that appears on the home screen, login screen, and message panels.
                                </div>

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;margin-top:4px;">Minimal & Dark</div>
                                <div id="srBgPickerGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:20px;">

                                    <div class="sr-bg-option" id="srBgOpt0" data-bg="https://plus.unsplash.com/premium_photo-1710962184823-907ade6b3783?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Minimal" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1710962184823-907ade6b3783?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Minimal" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Minimal</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt1" data-bg="https://plus.unsplash.com/premium_photo-1711136314696-b27c2a148d55?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Noir" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1711136314696-b27c2a148d55?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Noir" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Noir</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt2" data-bg="https://plus.unsplash.com/premium_photo-1710962184909-f9f8dc2c9f5f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Shadow" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1710962184909-f9f8dc2c9f5f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Shadow" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Shadow</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt3" data-bg="https://plus.unsplash.com/premium_photo-1710030733204-6816ffb0a1b2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Dusk" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1710030733204-6816ffb0a1b2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Dusk" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Dusk</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt4" data-bg="https://plus.unsplash.com/premium_photo-1710965560034-778eedc929ff?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Slate" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1710965560034-778eedc929ff?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Slate" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Slate</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt5" data-bg="https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0" data-label="Smoke" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0" alt="Smoke" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Smoke</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                </div>

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Nature & Space</div>
                                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:20px;">

                                    <div class="sr-bg-option" id="srBgOpt6" data-bg="https://plus.unsplash.com/premium_photo-1673292293042-cafd9c8a3ab3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" data-label="Forest" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://plus.unsplash.com/premium_photo-1673292293042-cafd9c8a3ab3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" alt="Forest" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Forest</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt7" data-bg="https://images.unsplash.com/photo-1502318217862-aa4e294ba657?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" data-label="Nebula" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://images.unsplash.com/photo-1502318217862-aa4e294ba657?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" alt="Nebula" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Nebula</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt8" data-bg="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" data-label="Galaxy" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" alt="Galaxy" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Galaxy</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt9" data-bg="https://images.unsplash.com/photo-1725615357444-6123528686cf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" data-label="Aurora" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://images.unsplash.com/photo-1725615357444-6123528686cf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" alt="Aurora" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Aurora</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt10" data-bg="https://m.media-amazon.com/images/I/81SNLEuNQuL._UF1000,1000_QL80_.jpg" data-label="Anime" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://m.media-amazon.com/images/I/81SNLEuNQuL._UF1000,1000_QL80_.jpg" alt="Anime" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Anime</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                    <div class="sr-bg-option" id="srBgOpt11" data-bg="https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg" data-label="Default" onclick="srSelectBg(this)" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .18s,box-shadow .18s;aspect-ratio:9/16;">
                                        <img src="https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg" alt="Default" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">
                                        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%);pointer-events:none;"></div>
                                        <div style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;color:rgba(255,255,255,0.8);letter-spacing:.05em;text-transform:uppercase;">Default</div>
                                        <div class="sr-bg-check" style="display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                    </div>

                                </div>

                                <!-- None / reset option -->
                                <div onclick="srSelectBg(null)" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:background .15s;" id="srBgOptNone">
                                    <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="rgba(255,255,255,0.4)" stroke-width="1.4" stroke-linecap="round"/></svg>
                                    </div>
                                    <div>
                                        <div style="font-size:13px;font-weight:700;color:#fff;">No background</div>
                                        <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:1px;">Use solid color from your theme</div>
                                    </div>
                                    <div class="sr-bg-check" id="srBgNoneCheck" style="display:none;margin-left:auto;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);align-items:center;justify-content:center;">
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </div>
                                </div>

                                <div id="srBgSaveStatus" style="margin-top:14px;font-size:11px;color:rgba(255,255,255,0.3);text-align:center;min-height:16px;"></div>

                            </div>
                        </div>

                        <!-- Notifications sub-panel -->
                        <div class="settings-sub-panel" id="subNotifications">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subNotifications')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Notifications</span>
                            </div>
                            <div class="settings-sub-body">

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Email</div>
                                <div class="settings-group" style="margin-top:0;margin-bottom:18px;">
                                    <div class="settings-row settings-row-toggle">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M1 6.5l7 4 7-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
                                        <div style="flex:1;min-width:0;"><div class="settings-row-label">Sale alerts</div><div class="settings-row-sub">Email me when my site sells</div></div>
                                        <div class="notif-toggle" id="notifSales" data-key="sales" onclick="handleNotifToggle(this)" style="width:36px;height:20px;border-radius:999px;background:var(--accent);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;"><div style="width:16px;height:16px;border-radius:999px;background:#fff;position:absolute;top:2px;right:2px;transition:all .2s;"></div></div>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div class="settings-row settings-row-toggle">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10.5H2.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1ZM5 13h6M8 10.5V13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
                                        <div style="flex:1;min-width:0;"><div class="settings-row-label">Buyer messages</div><div class="settings-row-sub">Email when a buyer contacts me</div></div>
                                        <div class="notif-toggle" id="notifMessages" data-key="messages" onclick="handleNotifToggle(this)" style="width:36px;height:20px;border-radius:999px;background:var(--accent);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;"><div style="width:16px;height:16px;border-radius:999px;background:#fff;position:absolute;top:2px;right:2px;transition:all .2s;"></div></div>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div class="settings-row settings-row-toggle">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
                                        <div style="flex:1;min-width:0;"><div class="settings-row-label">Platform updates</div><div class="settings-row-sub">Monthly product news and tips</div></div>
                                        <div class="notif-toggle" id="notifUpdates" data-key="updates" onclick="handleNotifToggle(this)" style="width:36px;height:20px;border-radius:999px;background:rgba(255,255,255,0.15);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;"><div style="width:16px;height:16px;border-radius:999px;background:#fff;position:absolute;top:2px;left:2px;transition:all .2s;"></div></div>
                                    </div>
                                </div>

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Push</div>
                                <div class="settings-group" style="margin-top:0;margin-bottom:18px;">
                                    <div class="settings-row settings-row-toggle">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a5 5 0 0 1 5 5v2.5l1 2H2l1-2V6.5a5 5 0 0 1 5-5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
                                        <div style="flex:1;min-width:0;">
                                            <div class="settings-row-label">Push notifications</div>
                                            <div class="settings-row-sub" id="pushSubLabel">Real-time alerts on this device</div>
                                        </div>
                                        <div class="notif-toggle" id="notifPush" data-key="push" onclick="handlePushToggle(this)" style="width:36px;height:20px;border-radius:999px;background:rgba(255,255,255,0.15);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;"><div style="width:16px;height:16px;border-radius:999px;background:#fff;position:absolute;top:2px;left:2px;transition:all .2s;"></div></div>
                                    </div>
                                </div>

                                <div id="pushBlockedNote" style="display:none;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:12px;padding:12px 14px;font-size:12px;color:#f87171;line-height:1.6;">
                                    <strong style="display:block;margin-bottom:3px;">Notifications blocked</strong>
                                    Push notifications are blocked in your browser. To enable them, click the lock icon in your address bar and allow notifications for this site, then try again.
                                </div>

                                <div id="notifStatusMsg" style="display:none;margin-top:12px;font-size:12px;line-height:1.5;padding:10px 14px;border-radius:10px;"></div>

                            </div>
                        </div>

                        <!-- Contact sub-panel -->
                        <div class="settings-sub-panel" id="subContact">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subContact')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Contact us</span>
                            </div>
                            <div class="settings-sub-body">
                                <p style="font-size:12px;color:var(--muted);margin-bottom:18px;line-height:1.65;">Have a question, issue, or feedback? We'll get back to you within 24 hours.</p>
                                <div class="field-group">
                                    <label class="field-label">Subject</label>
                                    <input id="contactSubject" class="dash-input" type="text" placeholder="e.g. Issue with my listing">
                                </div>
                                <div class="field-group" style="margin-bottom:18px;">
                                    <label class="field-label">Message</label>
                                    <textarea id="contactMessage" class="dash-input" rows="4" placeholder="Describe your issue or question…" style="resize:vertical;min-height:90px;"></textarea>
                                </div>
                                <div id="contactOk" class="alert-ok"></div>
                                <div id="contactErr" class="alert-err"></div>
                                <button class="save-btn" onclick="sendContactMessage()">
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10v7a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-7ZM1.5 3.5l5 4 5-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Send message
                                </button>
                            </div>
                        </div>

                        <!-- About sub-panel -->
                        <div class="settings-sub-panel" id="subAbout">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subAbout')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">About Siterifty</span>
                            </div>
                            <div class="settings-sub-body">
                                <p style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:20px;">Siterifty.com is a premium marketplace to buy and sell websites and digital businesses. Sellers on paid plans unlock lower fees and powerful tools to scale.</p>
                                <div class="settings-group" style="margin-top:0;">
                                    <a href="#" class="settings-row" style="text-decoration:none;">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.3"/><path d="M5 7h6M5 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></div>
                                        <span class="settings-row-label">Terms of Service</span>
                                        <svg class="settings-row-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </a>
                                    <div class="settings-row-divider"></div>
                                    <a href="#" class="settings-row" style="text-decoration:none;">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Z" stroke="currentColor" stroke-width="1.3"/><path d="M8 7v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="4.5" r=".8" fill="currentColor"/></svg></div>
                                        <span class="settings-row-label">Privacy Policy</span>
                                        <svg class="settings-row-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </a>
                                    <div class="settings-row-divider"></div>
                                    <a href="#" class="settings-row" style="text-decoration:none;">
                                        <div class="settings-row-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 6.5C5.5 5.12 6.62 4 8 4s2.5 1.12 2.5 2.5c0 1.5-2.5 3-2.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".7" fill="currentColor"/></svg></div>
                                        <span class="settings-row-label">Help Center</span>
                                        <svg class="settings-row-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </a>
                                </div>
                                <div style="text-align:center;margin-top:24px;font-size:11px;color:rgba(139,138,168,0.4);letter-spacing:0.04em;">Version 1.0 · Siterifty.com</div>
                            </div>
                        </div>

                        <div style="height:8px;"></div>

                        <!--  NEW SUB-PANELS  -->

                        <!-- Security sub-panel -->
                        <div class="settings-sub-panel" id="subSecurity">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSecurity')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Password &amp; Login</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div id="secErr" class="alert-err"></div>
                                <div id="secOk" class="alert-ok"></div>

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Change Password</div>
                                <div class="settings-group" style="margin-bottom:16px;">
                                    <div style="padding:16px;">
                                        <div class="field-group" style="margin-bottom:12px;">
                                            <label class="field-label">Current password</label>
                                            <div class="field-wrap">
                                                <input id="secCurrentPw" class="dash-input" type="password" placeholder="Enter current password" autocomplete="current-password">
                                                <button class="pw-toggle" type="button" onclick="togglePw('secCurrentPw',this)" tabindex="-1"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S13 12 9 12M1 7.5C1 7.5 3.5 12 7.5 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg></button>
                                            </div>
                                        </div>
                                        <div class="field-group" style="margin-bottom:12px;">
                                            <label class="field-label">New password</label>
                                            <div class="field-wrap">
                                                <input id="secNewPw" class="dash-input" type="password" placeholder="Min. 6 characters" autocomplete="new-password">
                                                <button class="pw-toggle" type="button" onclick="togglePw('secNewPw',this)" tabindex="-1"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S13 12 9 12M1 7.5C1 7.5 3.5 12 7.5 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg></button>
                                            </div>
                                        </div>
                                        <div class="field-group">
                                            <label class="field-label">Confirm new password</label>
                                            <div class="field-wrap">
                                                <input id="secConfirmPw" class="dash-input" type="password" placeholder="Repeat new password" autocomplete="new-password">
                                                <button class="pw-toggle" type="button" onclick="togglePw('secConfirmPw',this)" tabindex="-1"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S13 12 9 12M1 7.5C1 7.5 3.5 12 7.5 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button class="save-btn" onclick="savePassword()" style="width:100%;margin-bottom:24px;background:linear-gradient(135deg,#38bdf8,#818cf8);">
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="5.5" width="9" height="6.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 5.5V4a2 2 0 1 1 4 0v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                                    Update password
                                </button>

                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Email Reset Link</div>
                                <div style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.6;">We'll send a secure reset link to your registered email address.</div>
                                <button class="save-btn" onclick="sendResetFromSettings()" style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:var(--text);">
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10v7a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-7ZM1.5 3.5l5 4 5-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Send reset link
                                </button>
                            </div>
                        </div>

                        <!-- Sessions sub-panel -->
                        <div class="settings-sub-panel" id="subSessions">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSessions')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Active Sessions</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Devices and browsers currently signed in to your Siterifty account.</p>
                                <div class="settings-group" style="margin-bottom:16px;">
                                    <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;">
                                        <div style="width:36px;height:36px;border-radius:10px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="2" stroke="#34d399" stroke-width="1.3"/><path d="M5 12.5h6" stroke="#34d399" stroke-width="1.3" stroke-linecap="round"/></svg>
                                        </div>
                                        <div style="flex:1;min-width:0;">
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">This device</div>
                                            <div style="font-size:10px;color:var(--muted);margin-top:1px;">Current session · Active now</div>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:4px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:999px;padding:2px 8px;">
                                            <div style="width:5px;height:5px;border-radius:999px;background:#34d399;"></div>
                                            <span style="font-size:9px;font-weight:700;color:#34d399;letter-spacing:0.05em;">CURRENT</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="font-size:11px;color:rgba(139,138,168,0.5);text-align:center;padding:8px 0 16px;">No other active sessions found.</div>
                                <button class="save-btn" onclick="doSignOut()" style="width:100%;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);color:#f87171;">
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 6.5h6M8.5 4l2.5 2.5-2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 2H2.5A1 1 0 0 0 1.5 3v7a1 1 0 0 0 1 1H6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                                    Sign out all sessions
                                </button>
                            </div>
                        </div>

                        <!-- Privacy sub-panel -->
                        <div class="settings-sub-panel" id="subPrivacy">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subPrivacy')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Privacy Controls</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Profile Visibility</div>
                                <div class="settings-group" style="margin-bottom:16px;">
                                    <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                        <div style="flex:1;min-width:0;">
                                            <div class="settings-row-label">Show profile publicly</div>
                                            <div class="settings-row-sub">Buyers can view your seller profile</div>
                                        </div>
                                        <label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;">
                                            <input type="checkbox" id="privacyPublicProfile" checked style="opacity:0;width:0;height:0;">
                                            <span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#00cfaa;border-radius:999px;transition:background .2s;"></span>
                                            <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span>
                                        </label>
                                    </div>
                                    <div class="settings-row-divider"></div>
                                    <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                        <div style="flex:1;min-width:0;">
                                            <div class="settings-row-label">Show listing count</div>
                                            <div class="settings-row-sub">Display total listings on your profile</div>
                                        </div>
                                        <label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;">
                                            <input type="checkbox" id="privacyShowCount" checked style="opacity:0;width:0;height:0;">
                                            <span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#00cfaa;border-radius:999px;transition:background .2s;"></span>
                                            <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span>
                                        </label>
                                    </div>
                                </div>
                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Data &amp; Communications</div>
                                <div class="settings-group" style="margin-bottom:20px;">
                                    <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                        <div style="flex:1;min-width:0;">
                                            <div class="settings-row-label">Marketing emails</div>
                                            <div class="settings-row-sub">Tips, news &amp; platform updates</div>
                                        </div>
                                        <label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;">
                                            <input type="checkbox" id="privacyMarketing" style="opacity:0;width:0;height:0;">
                                            <span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span>
                                            <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span>
                                        </label>
                                    </div>
                                </div>
                                <a href="https://siterifty.com/privacy" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--accent);text-decoration:none;">
                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Read our full Privacy Policy
                                </a>
                            </div>
                        </div>

                        <!-- Activity sub-panel -->
                        <div class="settings-sub-panel" id="subActivity">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subActivity')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Listing History</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">All websites you've listed on Siterifty, including past and sold listings.</p>
                                <div id="activityListings" style="display:flex;flex-direction:column;gap:8px;">
                                    <div style="text-align:center;padding:32px 0;font-size:12px;color:rgba(139,138,168,0.4);">
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="display:block;margin:0 auto 10px;opacity:0.3;"><rect x="4" y="5" width="24" height="22" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M4 12h24" stroke="currentColor" stroke-width="1.5"/><path d="M10 8v0M13 8v0M16 8v0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 17h12M10 21h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                        No listing history yet
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Saved sub-panel -->
                        <div class="settings-sub-panel" id="subSaved">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSaved')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Saved Listings</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Sites on your watchlist that you're considering buying.</p>
                                <div id="savedListings" style="display:flex;flex-direction:column;gap:8px;">
                                    <div style="text-align:center;padding:32px 0;font-size:12px;color:rgba(139,138,168,0.4);">
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="display:block;margin:0 auto 10px;opacity:0.3;"><path d="M7 4h18a2 2 0 0 1 2 2v22l-11-6-11 6V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                                        No saved listings yet
                                    </div>
                                </div>
                                <a href="/browse" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;padding:11px;border-radius:12px;background:rgba(0,207,170,0.08);border:1px solid rgba(0,207,170,0.18);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--accent);text-decoration:none;">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/><path d="M9 9l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                                    Browse listings
                                </a>
                            </div>
                        </div>

                        <!-- Offers sub-panel -->
                        <div class="settings-sub-panel" id="subOffers">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subOffers')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Offers &amp; Purchases</span>
                            </div>
                            <div class="settings-sub-body" style="padding:16px 16px 40px;">

                                <!-- ── Tab switcher ── -->
                                <div id="offersPanelTabs" style="display:flex;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:4px;margin-bottom:16px;">
                                    <button id="offersTabBtn" onclick="window._switchOffersTab('offers')"
                                        style="flex:1;padding:8px 0;border-radius:9px;border:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:background .18s,color .18s;background:rgba(0,207,170,0.18);border:1px solid rgba(0,207,170,0.32);color:#c084fc;">
                                        Offers
                                    </button>
                                    <button id="purchasesTabBtn" onclick="window._switchOffersTab('purchases')"
                                        style="flex:1;padding:8px 0;border-radius:9px;border:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:background .18s,color .18s;background:transparent;color:rgba(139,138,168,0.55);">
                                        Purchases
                                    </button>
                                </div>

                                <!-- ── Offers tab stats ── -->
                                <div id="offersTabStats" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(0,207,170,0.1),rgba(0,207,170,0.04));border:1px solid rgba(0,207,170,0.18);border-radius:13px;padding:14px;text-align:center;">
                                        <div id="offersReceivedCount" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);">0</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Received</div>
                                    </div>
                                    <div style="background:linear-gradient(145deg,rgba(129,140,248,0.1),rgba(129,140,248,0.04));border:1px solid rgba(129,140,248,0.18);border-radius:13px;padding:14px;text-align:center;">
                                        <div id="offersMadeCount" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);">0</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Sent</div>
                                    </div>
                                </div>

                                <!-- ── Purchases tab stats ── -->
                                <div id="purchasesTabStats" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(45,212,160,0.1),rgba(45,212,160,0.04));border:1px solid rgba(45,212,160,0.18);border-radius:13px;padding:14px;text-align:center;">
                                        <div id="purchasesActiveCount" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);">0</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">In Escrow</div>
                                    </div>
                                    <div style="background:linear-gradient(145deg,rgba(56,189,248,0.1),rgba(56,189,248,0.04));border:1px solid rgba(56,189,248,0.18);border-radius:13px;padding:14px;text-align:center;">
                                        <div id="purchasesCompletedCount" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);">0</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Completed</div>
                                    </div>
                                </div>

                                <!-- ── Card list (shared container, swapped by tab) ── -->
                                <div id="offersCardContainer">
                                    <div style="text-align:center;padding:20px 0;font-size:12px;color:rgba(139,138,168,0.4);">No active offers at the moment.</div>
                                </div>
                                <div id="purchasesCardContainer" style="display:none;">
                                    <div style="text-align:center;padding:20px 0;font-size:12px;color:rgba(139,138,168,0.4);">No purchases yet.</div>
                                </div>

                            </div>
                        </div>

                        <!-- Referral sub-panel -->
                        <div class="settings-sub-panel" id="subReferral">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subReferral')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Invite &amp; Earn</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="background:linear-gradient(135deg,rgba(0,207,170,0.1),rgba(129,140,248,0.07));border:1px solid rgba(0,207,170,0.2);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
                                    <div style="margin-bottom:8px;"><svg style="display:inline;vertical-align:-2px;" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9b5de5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
                                    <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--text);margin-bottom:6px;">Earn when your referrals upgrade</div>
                                    <div style="font-size:11px;color:var(--muted);line-height:1.65;">Share your referral link. When a friend signs up, <strong style="color:var(--text);">they get $1 welcome credit</strong>. You earn when they upgrade to a plan (10–30% commission) or post a listing (+$0.10 each).</div>
                                </div>
                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Your Referral Link</div>
                                <div style="display:flex;gap:8px;margin-bottom:20px;">
                                    <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="referralLinkDisplay">Loading…</div>
                                    <button onclick="copyReferralLink()" style="flex-shrink:0;padding:10px 14px;border-radius:10px;background:rgba(0,207,170,0.15);border:1px solid rgba(0,207,170,0.3);color:#00cfaa;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;" id="referralCopyBtn">Copy</button>
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px;text-align:center;">
                                        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);" id="referralCount">—</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Referred</div>
                                    </div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px;text-align:center;">
                                        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#34d399;" id="referralEarned">—</div>
                                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Earned</div>
                                    </div>
                                </div>
                                <!-- Commission breakdown -->
                                <div style="margin-top:16px;">
                                    <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">How you earn</div>
                                    <div style="display:flex;flex-direction:column;gap:6px;">
                                        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
                                            <div style="font-size:11px;color:var(--muted);">Friend upgrades to <strong style="color:#00cfaa;">Starter</strong> ($20/mo)</div>
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#34d399;">+$2.00</div>
                                        </div>
                                        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
                                            <div style="font-size:11px;color:var(--muted);">Friend upgrades to <strong style="color:#818cf8;">Growth</strong> ($40/mo)</div>
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#34d399;">+$8.00</div>
                                        </div>
                                        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
                                            <div style="font-size:11px;color:var(--muted);">Friend upgrades to <strong style="color:#38bdf8;">Pro</strong> ($50/mo)</div>
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#34d399;">+$15.00</div>
                                        </div>
                                        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
                                            <div style="font-size:11px;color:var(--muted);">Friend posts a new listing</div>
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#34d399;">+$0.10</div>
                                        </div>
                                        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(52,211,153,0.05);border:1px solid rgba(52,211,153,0.15);border-radius:10px;padding:10px 12px;">
                                            <div style="font-size:11px;color:var(--muted);">Friend signs up (they receive)</div>
                                            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:rgba(52,211,153,0.6);">$1.00 to them</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <!--  SELLER TOOL SUB-PANELS  -->

                        <!-- Listing Analytics sub-panel -->
                        <div class="settings-sub-panel" id="subSellerAnalytics">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSellerAnalytics')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Listing Analytics</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(52,211,153,0.1),rgba(52,211,153,0.04));border:1px solid rgba(52,211,153,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#34d399;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Total Views</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(0,207,170,0.1),rgba(0,207,170,0.04));border:1px solid rgba(0,207,170,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#00cfaa;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Saves</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(56,189,248,0.1),rgba(56,189,248,0.04));border:1px solid rgba(56,189,248,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#38bdf8;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Offers</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(251,191,36,0.1),rgba(251,191,36,0.04));border:1px solid rgba(251,191,36,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fbbf24;">—%</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Conv. Rate</div></div>
                                </div>
                                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;">Views last 7 days</div><div style="display:flex;align-items:flex-end;gap:4px;height:48px;"><div style="flex:1;background:rgba(52,211,153,0.15);border-radius:4px 4px 0 0;height:30%;"></div><div style="flex:1;background:rgba(52,211,153,0.2);border-radius:4px 4px 0 0;height:55%;"></div><div style="flex:1;background:rgba(52,211,153,0.25);border-radius:4px 4px 0 0;height:40%;"></div><div style="flex:1;background:rgba(52,211,153,0.3);border-radius:4px 4px 0 0;height:70%;"></div><div style="flex:1;background:rgba(52,211,153,0.35);border-radius:4px 4px 0 0;height:60%;"></div><div style="flex:1;background:rgba(52,211,153,0.4);border-radius:4px 4px 0 0;height:85%;"></div><div style="flex:1;background:rgba(52,211,153,0.5);border-radius:4px 4px 0 0;height:100%;"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;"><span style="font-size:9px;color:var(--muted);">Mon</span><span style="font-size:9px;color:var(--muted);">Sun</span></div></div>
                                <p style="font-size:11px;color:rgba(139,138,168,0.4);text-align:center;margin-top:16px;">Analytics populate once you have active listings.</p>
                            </div>
                        </div>

                        <!-- Valuation Calculator sub-panel -->
                        <div class="settings-sub-panel" id="subPricingCalc">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subPricingCalc')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Valuation Calculator</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Enter your site metrics and we estimate fair market value based on current Siterifty sale data.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Monthly Revenue (USD)</div><input class="dash-input" type="number" placeholder="e.g. 500" id="calcRevenue" oninput="calcValuation()" style="margin-bottom:0;"></div>
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Monthly Profit (USD)</div><input class="dash-input" type="number" placeholder="e.g. 300" id="calcProfit" oninput="calcValuation()" style="margin-bottom:0;"></div>
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Site Type</div><select class="dash-input" id="calcType" onchange="calcValuation()" style="margin-bottom:0;background:var(--surface2);color:var(--text);"><option value="content">Content / Blog</option><option value="saas">SaaS / App</option><option value="ecom">eCommerce</option><option value="affiliate">Affiliate</option><option value="newsletter">Newsletter</option><option value="tool">Tool / Template</option></select></div>
                                </div>
                                <div id="calcResult" style="display:none;background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(56,189,248,0.05));border:1px solid rgba(52,211,153,0.2);border-radius:14px;padding:18px;text-align:center;"><div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Estimated Value Range</div><div id="calcLow" style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#34d399;">—</div><div style="font-size:10px;color:var(--muted);margin-top:4px;" id="calcMultiple">Based on industry multiples</div></div>
                                
                            </div>
                        </div>

                        <!-- Offer Preferences sub-panel -->
                        <div class="settings-sub-panel" id="subOfferPrefs">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subOfferPrefs')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Offer Preferences</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:flex;flex-direction:column;gap:12px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px;">Minimum offer floor</div><div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.5;">Offers below this % of your asking price are auto-declined.</div><div style="display:flex;align-items:center;gap:8px;"><input class="dash-input" type="number" placeholder="e.g. 70" min="1" max="99" style="margin-bottom:0;flex:1;"><span style="font-size:12px;color:var(--muted);flex-shrink:0;">% of ask</span></div></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Auto-counter offers</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Auto counter at asking price</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Offer expiry (72h)</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Auto-decline offers after 72 hours</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <button class="save-btn" style="width:100%;margin-top:4px;">Save preferences</button>
                                </div>
                            </div>
                        </div>

                        <!-- Boost & Visibility sub-panel -->
                        <div class="settings-sub-panel" id="subListingBoost">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subListingBoost')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Boost &amp; Visibility</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="background:linear-gradient(135deg,rgba(129,140,248,0.1),rgba(0,207,170,0.07));border:1px solid rgba(129,140,248,0.2);border-radius:16px;padding:18px;margin-bottom:16px;text-align:center;"><div style="font-size:24px;margin-bottom:8px;">&#x1F680;</div><div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--text);margin-bottom:6px;">Feature your listing</div><div style="font-size:11px;color:var(--muted);line-height:1.65;">Boosted listings appear at the top of search results for 7 days &mdash; average 4&times; more views.</div></div>
                                <div style="display:flex;flex-direction:column;gap:8px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">7-Day Boost</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Top placement in search &amp; browse</div></div><div style="text-align:right;"><div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#818cf8;">$4.99</div><div style="font-size:9px;color:var(--muted);">per listing</div></div></div>
                                    <div style="background:linear-gradient(135deg,rgba(129,140,248,0.08),rgba(0,207,170,0.05));border:1px solid rgba(129,140,248,0.18);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);">30-Day Feature</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Homepage spotlight + newsletter</div></div><div style="text-align:right;"><div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#00cfaa;">$14.99</div><div style="font-size:9px;color:var(--muted);">per listing</div></div></div>
                                </div>
                                <p style="font-size:10px;color:rgba(139,138,168,0.4);text-align:center;margin-top:14px;">Requires Pro plan. Paid from wallet balance.</p>
                            </div>
                        </div>

                        <!-- Auto-relist sub-panel -->
                        <div class="settings-sub-panel" id="subAutoRelist">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subAutoRelist')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Auto-Relist</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:flex;flex-direction:column;gap:12px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Auto-relist expired listings</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Re-bump after 30 days if unsold</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#38bdf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Auto-reduce price on relist</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Lower ask by 5% each re-bump</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#38bdf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Notify me on relist</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Email confirmation each time</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" checked style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#38bdf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#38bdf8;border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <button class="save-btn" style="width:100%;margin-top:4px;background:linear-gradient(135deg,#38bdf8,#818cf8);">Save auto-relist settings</button>
                                </div>
                            </div>
                        </div>

                        <!-- Bulk Editor sub-panel -->
                        <div class="settings-sub-panel" id="subBulkEditor">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subBulkEditor')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Bulk Listing Editor</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Apply price changes, status updates, or edits across all your active listings at once.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Bulk price adjustment</div><div style="display:flex;gap:8px;align-items:center;"><select class="dash-input" style="flex:1;margin-bottom:0;background:var(--surface2);color:var(--text);"><option>Reduce all by %</option><option>Increase all by %</option><option>Set all to fixed price</option></select><input class="dash-input" type="number" placeholder="%" style="width:70px;margin-bottom:0;"></div></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Bulk status change</div><select class="dash-input" style="width:100%;margin-bottom:0;background:var(--surface2);color:var(--text);"><option>Pause all listings</option><option>Activate all listings</option><option>Mark all as negotiable</option></select></div>
                                </div>
                                <button class="save-btn" style="width:100%;background:linear-gradient(135deg,#818cf8,#00cfaa);">Apply to all listings</button>
                            </div>
                        </div>

                        <!-- Listing Templates sub-panel -->
                        <div class="settings-sub-panel" id="subListingTemplates">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subListingTemplates')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Listing Templates</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Save listing formats to post new sites faster. Great for template sellers, SaaS builders, or repeat listers.</p>
                                <div style="text-align:center;padding:28px 0 20px;"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="display:block;margin:0 auto 10px;opacity:0.25;"><rect x="4" y="5" width="28" height="26" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M4 13h28" stroke="currentColor" stroke-width="1.8"/><path d="M12 21h12M12 25h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div style="font-size:12px;color:rgba(139,138,168,0.4);">No templates saved yet</div></div>
                                <button class="save-btn" style="width:100%;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a0a0f;"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Create template from current listing</button>
                            </div>
                        </div>

                        <!-- NDA Manager sub-panel -->
                        <div class="settings-sub-panel" id="subNdaManager">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subNdaManager')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">NDA Manager</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="background:linear-gradient(135deg,rgba(248,113,113,0.08),rgba(0,207,170,0.05));border:1px solid rgba(248,113,113,0.2);border-radius:14px;padding:16px;margin-bottom:16px;"><div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px;">Protect your financials</div><div style="font-size:11px;color:var(--muted);line-height:1.65;">Require interested buyers to sign an NDA before they can view your revenue, traffic, or P&amp;L data. Siterifty handles signature collection automatically.</div></div>
                                <div style="display:flex;flex-direction:column;gap:10px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Require NDA on new listings</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Apply to all future listings by default</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#f87171':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px;">NDA template</div><div style="font-size:10px;color:var(--muted);margin-bottom:10px;">Use Siterifty's standard NDA or paste your own.</div><select class="dash-input" style="margin-bottom:0;background:var(--surface2);color:var(--text);"><option>Siterifty Standard NDA</option><option>Custom NDA (paste below)</option></select></div>
                                    <div style="background:var(--surface);border:1px solid rgba(248,113,113,0.15);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Signed NDAs (0)</div><div style="font-size:11px;color:rgba(139,138,168,0.4);text-align:center;padding:8px 0;">No signed NDAs yet</div></div>
                                    <button class="save-btn" style="width:100%;">Save NDA settings</button>
                                </div>
                            </div>
                        </div>

                        <!-- Buyer Insights sub-panel -->
                        <div class="settings-sub-panel" id="subBuyerInsights">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subBuyerInsights')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Buyer Insights</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">See who's interested in your listings — anonymous buyer profiles, repeat viewers, and intent signals.</p>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(0,207,170,0.1),rgba(0,207,170,0.04));border:1px solid rgba(0,207,170,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#00cfaa;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Unique Viewers</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(129,140,248,0.1),rgba(129,140,248,0.04));border:1px solid rgba(129,140,248,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#818cf8;">—</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Repeat Views</div></div>
                                </div>
                                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Top interested buyers</div><div style="font-size:11px;color:rgba(139,138,168,0.4);text-align:center;padding:8px 0;">No active listings with buyer data yet</div></div>
                            </div>
                        </div>

                        <!-- Sales History sub-panel -->
                        <div class="settings-sub-panel" id="subSalesHistory">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSalesHistory')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Sales History</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(52,211,153,0.1),rgba(52,211,153,0.04));border:1px solid rgba(52,211,153,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#34d399;">$0</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Total Earned</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(56,189,248,0.1),rgba(56,189,248,0.04));border:1px solid rgba(56,189,248,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#38bdf8;">0</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Sites Sold</div></div>
                                </div>
                                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Completed sales</div><div style="text-align:center;padding:28px 0;"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="display:block;margin:0 auto 10px;opacity:0.25;"><circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="1.8"/><path d="M16 10v7l4 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div style="font-size:12px;color:rgba(139,138,168,0.4);">No sales yet &mdash; keep listing!</div></div></div>
                
                            </div>
                        </div>

                        <!--  BUYER TOOL SUB-PANELS  -->

                        <!-- Price Alerts sub-panel -->
                        <div class="settings-sub-panel" id="subPriceAlerts">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subPriceAlerts')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Price Alerts</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Get notified when listings you're watching drop in price, or when new listings match your budget.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Watchlist price drops</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Alert when a saved listing price falls</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" checked style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#38bdf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#38bdf8;border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">New listings in budget</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Notify when new sites match my max budget</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#38bdf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:6px;">My max budget</div><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:13px;color:var(--muted);">$</span><input class="dash-input" type="number" placeholder="e.g. 2500" style="margin-bottom:0;flex:1;"></div></div>
                                </div>
                                <button class="save-btn" style="width:100%;background:linear-gradient(135deg,#38bdf8,#818cf8);">Save alert preferences</button>
                            </div>
                        </div>

                        <!-- Search Preferences sub-panel -->
                        <div class="settings-sub-panel" id="subBuyerFilters">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subBuyerFilters')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Search Preferences</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Set default search filters so browse always shows results in your sweet spot.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Price range</div><div style="display:flex;align-items:center;gap:8px;"><input class="dash-input" type="number" placeholder="Min $" style="margin-bottom:0;flex:1;"><span style="color:var(--muted);">&ndash;</span><input class="dash-input" type="number" placeholder="Max $" style="margin-bottom:0;flex:1;"></div></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Monthly revenue range</div><div style="display:flex;align-items:center;gap:8px;"><input class="dash-input" type="number" placeholder="Min $/mo" style="margin-bottom:0;flex:1;"><span style="color:var(--muted);">&ndash;</span><input class="dash-input" type="number" placeholder="Max $/mo" style="margin-bottom:0;flex:1;"></div></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Preferred categories</div><div style="display:flex;flex-wrap:wrap;gap:6px;" id="catTags"><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">SaaS</span><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">Blog</span><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">eCommerce</span><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">Affiliate</span><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">Newsletter</span><span onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'rgba(0,207,170,0.2)':'rgba(255,255,255,0.05)';this.style.borderColor=this.classList.contains('active')?'rgba(0,207,170,0.4)':'rgba(255,255,255,0.09)';" style="font-size:11px;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:4px 11px;cursor:pointer;transition:.15s;">Tool / App</span></div></div>
                                </div>
                                <button class="save-btn" style="width:100%;">Save search preferences</button>
                            </div>
                        </div>

                        <!-- Due Diligence sub-panel -->
                        <div class="settings-sub-panel" id="subDueDiligence">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subDueDiligence')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Due Diligence Checklist</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Before making an offer, work through this checklist. Tap each item to mark complete.</p>
                                <div id="ddChecklist" style="display:flex;flex-direction:column;gap:6px;"></div>
                                
                            </div>
                        </div>

                        <!-- Escrow Tracker sub-panel -->
                        <div class="settings-sub-panel" id="subEscrowStatus">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subEscrowStatus')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Escrow Tracker</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Track purchase deal status. Each step is time-stamped and both parties are notified automatically.</p>
                                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
                                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);border-radius:10px;"><div style="width:8px;height:8px;border-radius:999px;background:#34d399;flex-shrink:0;"></div><div style="font-size:11px;color:#34d399;font-weight:600;">1. Offer accepted</div><div style="margin-left:auto;font-size:9px;color:var(--muted);">Complete</div></div>
                                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.18);border-radius:10px;"><div style="width:8px;height:8px;border-radius:999px;background:#fbbf24;flex-shrink:0;"></div><div style="font-size:11px;color:#fbbf24;font-weight:600;">2. Funds in escrow</div><div style="margin-left:auto;font-size:9px;color:var(--muted);">In progress</div></div>
                                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.13);border-radius:10px;"><div style="width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,0.2);flex-shrink:0;"></div><div style="font-size:11px;color:var(--muted);font-weight:600;">3. Asset transfer</div><div style="margin-left:auto;font-size:9px;color:var(--muted);">Pending</div></div>
                                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.13);border-radius:10px;"><div style="width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,0.2);flex-shrink:0;"></div><div style="font-size:11px;color:var(--muted);font-weight:600;">4. Inspection period (7 days)</div><div style="margin-left:auto;font-size:9px;color:var(--muted);">Pending</div></div>
                                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.13);border-radius:10px;"><div style="width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,0.2);flex-shrink:0;"></div><div style="font-size:11px;color:var(--muted);font-weight:600;">5. Funds released to seller</div><div style="margin-left:auto;font-size:9px;color:var(--muted);">Pending</div></div>
                                </div>
                                <p style="font-size:11px;color:rgba(139,138,168,0.4);text-align:center;">No active escrow deals at this time.</p>
                            </div>
                        </div>

                        <!-- ROI Calculator sub-panel -->
                        <div class="settings-sub-panel" id="subRoiCalculator">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subRoiCalculator')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">ROI Calculator</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Enter listing price and monthly profit to see payback period, annual ROI, and 3-year projection.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Asking price (USD)</div><input class="dash-input" type="number" placeholder="e.g. 12000" id="vroiPrice" oninput="calcValuationROI()" style="margin-bottom:0;"></div>
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Monthly profit (USD)</div><input class="dash-input" type="number" placeholder="e.g. 400" id="vroiProfit" oninput="calcValuationROI()" style="margin-bottom:0;"></div>
                                    <div><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Expected monthly growth (%)</div><input class="dash-input" type="number" placeholder="e.g. 2" id="vroiGrowth" oninput="calcValuationROI()" style="margin-bottom:0;"></div>
                                </div>
                                <div id="vroiResult" style="display:none;background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(56,189,248,0.05));border:1px solid rgba(52,211,153,0.2);border-radius:14px;padding:16px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;"><div style="text-align:center;"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Payback Period</div><div id="vroiPayback" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#34d399;">—</div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Annual ROI</div><div id="vroiAnnual" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#38bdf8;">—</div></div></div><div style="text-align:center;"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">3-Year Net Profit</div><div id="vroi3yr" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#00cfaa;">—</div></div></div>
                                
                            </div>
                        </div>

                        <!-- Deal Comparison sub-panel -->
                        <div class="settings-sub-panel" id="subDealComparison">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subDealComparison')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Deal Comparison</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Save up to 4 listings to compare side-by-side on price, revenue, multiple, age, and category.</p>
                                <div style="text-align:center;padding:28px 0 20px;"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="display:block;margin:0 auto 10px;opacity:0.25;"><rect x="3" y="6" width="13" height="24" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="20" y="6" width="13" height="24" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 18h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div style="font-size:12px;color:rgba(139,138,168,0.4);">No listings added yet</div><div style="font-size:11px;color:rgba(139,138,168,0.3);margin-top:4px;">Tap &#x2295; on any listing to add it here</div></div>
                            </div>
                        </div>

                        <!-- Acquisition Log sub-panel -->
                        <div class="settings-sub-panel" id="subAcquisitionLog">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subAcquisitionLog')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Acquisition Log</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                                    <div style="background:linear-gradient(145deg,rgba(129,140,248,0.1),rgba(129,140,248,0.04));border:1px solid rgba(129,140,248,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#818cf8;">$0</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Total Invested</div></div>
                                    <div style="background:linear-gradient(145deg,rgba(52,211,153,0.1),rgba(52,211,153,0.04));border:1px solid rgba(52,211,153,0.18);border-radius:13px;padding:14px;text-align:center;"><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#34d399;">0</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Sites Owned</div></div>
                                </div>
                                <div style="text-align:center;padding:28px 0;font-size:12px;color:rgba(139,138,168,0.4);">No acquisitions yet. Buy your first site to start building your portfolio.</div>
                            </div>
                        </div>

                        <!-- Seller Reputation sub-panel -->
                        <div class="settings-sub-panel" id="subSellerRep">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subSellerRep')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Seller Reputation</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Look up any seller on Siterifty. See their verified sales history, response rate, and buyer reviews.</p>
                                <div style="display:flex;gap:8px;margin-bottom:16px;"><input id="sellerRepInput" class="dash-input" type="text" placeholder="Search seller username&hellip;" style="margin-bottom:0;flex:1;" oninput="sellerRepSearch(this.value)"><button class="save-btn" style="flex-shrink:0;padding:0 14px;margin-bottom:0;" onclick="sellerRepSearch(document.getElementById('sellerRepInput').value,true)">Search</button></div>
                                <div id="sellerRepResults" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:20px;text-align:center;"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="display:block;margin:0 auto 10px;opacity:0.25;"><circle cx="18" cy="12" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M5 32c0-7 5.8-12 13-12s13 5 13 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div style="font-size:12px;color:rgba(139,138,168,0.4);">Enter a username to look up their reputation score</div></div>
                            </div>
                        </div>

                        <!-- Watchlist Alerts sub-panel -->
                        <div class="settings-sub-panel" id="subWatchlistAlerts">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subWatchlistAlerts')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Watchlist Alerts</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <p style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:16px;">Choose which changes on saved listings trigger a notification.</p>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Price reduced</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Any price drop on a saved listing</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" checked style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#00cfaa;border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Listing updated</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">New screenshots, desc or financials added</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">About to sell</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Alert if a deal is in progress</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" checked style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#00cfaa;border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Listing removed</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Notify me if it's taken down</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#00cfaa':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                </div>
                                <button class="save-btn" style="width:100%;">Save alert settings</button>
                            </div>
                        </div>

                        <!--  DEAL SETTINGS SUB-PANELS  -->

                        <!-- Deal Preferences sub-panel -->
                        <div class="settings-sub-panel" id="subDealPrefs">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subDealPrefs')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Deal Preferences</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Default inspection period</div><select class="dash-input" style="margin-bottom:0;background:var(--surface2);color:var(--text);"><option>3 days</option><option selected>7 days</option><option>14 days</option><option>30 days</option></select></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Require NDA before deal</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Buyer signs before financials shared</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#818cf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">Include transition support</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">Offer 2-week seller onboarding</div></div><label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;"><input type="checkbox" checked style="opacity:0;width:0;height:0;"><span onclick="this.previousElementSibling.click();this.style.background=this.previousElementSibling.checked?'#818cf8':'rgba(255,255,255,0.12)';" style="position:absolute;cursor:pointer;inset:0;background:#818cf8;border-radius:999px;transition:background .2s;"></span><span style="position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;pointer-events:none;"></span></label></div>
                                </div>
                                <button class="save-btn" style="width:100%;background:linear-gradient(135deg,#818cf8,#00cfaa);">Save deal preferences</button>
                            </div>
                        </div>

                        <!-- Payout Settings sub-panel -->
                        <div class="settings-sub-panel" id="subPayoutSettings">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subPayoutSettings')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Payout Settings</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">PayPal payout email</div><input id="payoutPaypalEmail" class="dash-input" type="email" placeholder="your@paypal.com" autocomplete="off" style="margin-bottom:0;"></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Default payout currency</div><select id="payoutCurrency" class="dash-input" style="margin-bottom:0;background:var(--surface2);color:var(--text);"><option value="USD">USD &mdash; US Dollar</option><option value="EUR">EUR &mdash; Euro</option><option value="GBP">GBP &mdash; British Pound</option><option value="CAD">CAD &mdash; Canadian Dollar</option><option value="AUD">AUD &mdash; Australian Dollar</option><option value="JPY">JPY &mdash; Japanese Yen</option><option value="INR">INR &mdash; Indian Rupee</option><option value="BRL">BRL &mdash; Brazilian Real</option></select></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Auto Withdraw</div><select id="payoutAutoWithdraw" class="dash-input" style="margin-bottom:0;background:var(--surface2);color:var(--text);" onchange="awToggleMinRow('sub')"><option value="off">Off — manual only</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                                    <div id="payoutAutoWithdrawMinRow" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;">
                                        <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Minimum balance to trigger payout</div>
                                        <div style="display:flex;align-items:center;gap:0;">
                                            <span style="font-size:13px;font-weight:700;color:var(--muted);margin-right:6px;flex-shrink:0;">$</span>
                                            <input id="payoutAutoWithdrawMin" class="dash-input" type="number" min="50" max="999" step="1" placeholder="50" oninput="awValidateMin('sub')" style="margin-bottom:0;">
                                        </div>
                                        <div id="payoutAutoWithdrawMinErr" style="font-size:10.5px;color:#f87171;margin-top:6px;display:none;"></div>
                                        <div style="font-size:10px;color:var(--muted);margin-top:8px;line-height:1.55;">We'll auto-withdraw once your balance reaches this amount (min $50, max $999). Your plan's platform fee still applies at payout time.</div>
                                    </div>
                                </div>
                                <button class="save-btn" style="width:100%;background:linear-gradient(135deg,#34d399,#38bdf8);" onclick="savePayoutSettings('sub')">Save payout settings</button>
                            </div>
                        </div>

                        <!-- Tax & Compliance sub-panel -->
                        <div class="settings-sub-panel" id="subTaxInfo">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subTaxInfo')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title">Tax &amp; Compliance</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <div style="background:rgba(129,140,248,0.07);border:1px solid rgba(129,140,248,0.18);border-radius:14px;padding:14px 16px;margin-bottom:16px;"><div style="font-size:11px;color:rgba(129,140,248,0.9);line-height:1.65;">Tax forms are required for US sellers earning $600+/year and international sellers in applicable jurisdictions. Siterifty prompts you automatically when a form is needed.</div></div>
                                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">W-9 (US persons)</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">For US citizens &amp; residents</div></div><span style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:rgba(139,138,168,0.55);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:3px 9px;">Not required yet</span></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">W-8BEN (non-US)</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">For international sellers</div></div><span style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:rgba(139,138,168,0.55);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:3px 9px;">Not required yet</span></div>
                                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:11px;font-weight:700;color:var(--text);">VAT number</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">EU / UK sellers only</div></div><button style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:#818cf8;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:999px;padding:3px 9px;cursor:pointer;">Add</button></div>
                                </div>
                                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:12px;padding:13px 15px;"><div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Annual earnings summary</div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:var(--muted);">2025 (YTD)</span><span style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">$0</span></div><div style="margin-top:8px;font-size:10px;color:rgba(139,138,168,0.4);">Form 1099-K issued automatically when applicable.</div></div>
                            </div>
                        </div>

                        <!-- Transfer Account sub-panel -->
                        <div class="settings-sub-panel" id="subTransferAccount">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subTransferAccount')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title" style="color:#fbbf24;">Transfer Account</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 60px;">

                                <!-- Encrypted warning banner -->
                                <div style="background:linear-gradient(135deg,rgba(251,191,36,0.06),rgba(248,113,113,0.04));border:1px solid rgba(251,191,36,0.28);border-radius:16px;padding:18px 16px;margin-bottom:20px;position:relative;overflow:hidden;">
                                    <div style="position:absolute;top:-8px;right:-8px;width:80px;height:80px;background:rgba(251,191,36,0.04);border-radius:999px;pointer-events:none;"></div>
                                    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
                                        <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="8" width="12" height="8" rx="1.5" stroke="#fbbf24" stroke-width="1.3"/><path d="M6 8V6a3 3 0 0 1 6 0v2" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/><circle cx="9" cy="12" r="1" fill="#fbbf24"/></svg>
                                        </div>
                                        <div>
                                            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fbbf24;letter-spacing:-.01em;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="#fbbf24" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="#fbbf24"/></svg>THIS CANNOT BE REVERSED</div>
                                            <div style="font-size:11px;color:rgba(251,191,36,0.8);line-height:1.7;">Transferring your account permanently hands full ownership — including all listings, wallet balance, purchase history, and plan — to the recipient. <strong style="color:#fbbf24;">You will lose all access immediately.</strong> This action is encrypted, logged, and irreversible.</div>
                                        </div>
                                    </div>
                                    <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(251,191,36,0.15);border-radius:10px;padding:10px 13px;display:flex;align-items:center;gap:8px;">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="5.5" width="10" height="6" rx="1.2" stroke="rgba(251,191,36,0.6)" stroke-width="1.1"/><path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="rgba(251,191,36,0.6)" stroke-width="1.1" stroke-linecap="round"/></svg>
                                        <span style="font-family:monospace;font-size:9.5px;color:rgba(251,191,36,0.55);letter-spacing:.04em;">AES-256 · Transfer log encrypted · Immutable audit trail</span>
                                    </div>
                                </div>

                                <!-- Step 1: Recipient email -->
                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(251,191,36,0.6);margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                                    <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:999px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);font-size:9px;font-weight:800;color:#fbbf24;">1</span>
                                    Recipient Email
                                </div>
                                <div class="settings-group" style="border-color:rgba(251,191,36,0.12);margin-bottom:20px;">
                                    <div style="padding:14px 16px;">
                                        <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.55;">Enter the email address of the person you want to transfer this account to. They will receive a transfer notification email.</div>
                                        <input id="transferRecipientEmail" class="dash-input" type="email" placeholder="recipient@example.com" autocomplete="off" spellcheck="false" oninput="checkTransferReady()" style="border-color:rgba(251,191,36,0.2);">
                                    </div>
                                </div>

                                <!-- Step 2: Verification questions -->
                                <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(251,191,36,0.6);margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                                    <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:999px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);font-size:9px;font-weight:800;color:#fbbf24;">2</span>
                                    Identity Verification
                                </div>
                                <div class="settings-group" style="border-color:rgba(251,191,36,0.12);margin-bottom:20px;">
                                    <div style="padding:14px 16px 10px;">
                                        <div style="font-size:11px;color:var(--muted);margin-bottom:14px;line-height:1.55;">To confirm your identity, answer the questions below using your current account credentials.</div>

                                        <!-- Account creation year -->
                                        <div class="field-group" style="margin-bottom:12px;">
                                            <label class="field-label" style="color:rgba(251,191,36,0.7);">What year was your account created?</label>
                                            <input id="transferAccountYear" class="dash-input" type="number" placeholder="e.g. 2024" min="2020" max="2030" autocomplete="off" oninput="checkTransferReady()" style="border-color:rgba(251,191,36,0.15);">
                                        </div>

                                        <!-- Re-enter account email -->
                                        <div class="field-group" style="margin-bottom:12px;">
                                            <label class="field-label" style="color:rgba(251,191,36,0.7);">Your account email address</label>
                                            <input id="transferConfirmEmail" class="dash-input" type="email" placeholder="Your login email" autocomplete="off" oninput="checkTransferReady()" style="border-color:rgba(251,191,36,0.15);">
                                        </div>

                                        <!-- Current password -->
                                        <div class="field-group" style="margin-bottom:4px;">
                                            <label class="field-label" style="color:rgba(251,191,36,0.7);">Your current password</label>
                                            <div class="field-wrap">
                                                <input id="transferConfirmPassword" class="dash-input" type="password" placeholder="Current password" autocomplete="current-password" oninput="checkTransferReady()" style="border-color:rgba(251,191,36,0.15);">
                                                <button class="pw-toggle" type="button" onclick="togglePw('transferConfirmPassword',this)" tabindex="-1">
                                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3s6.5 4.5 6.5 4.5S13 12 9 12M1 7.5C1 7.5 3.5 12 7.5 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Error/status -->
                                <div id="transferErr" style="display:none;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:10px 13px;font-size:11.5px;color:#f87171;margin-bottom:14px;line-height:1.5;"></div>
                                <div id="transferOk" style="display:none;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:10px 13px;font-size:11.5px;color:#34d399;margin-bottom:14px;line-height:1.5;"></div>

                                <!-- Transfer button — disabled until all fields valid -->
                                <button id="transferSubmitBtn" onclick="doAccountTransfer()" disabled style="width:100%;padding:14px;border-radius:13px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:rgba(251,191,36,0.35);cursor:not-allowed;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:0.02em;">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Transfer Account
                                </button>
                                <div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(139,138,168,0.4);">Button activates when all fields are filled correctly</div>

                            </div>
                        </div>

                        <!-- Delete Account sub-panel -->
                        <div class="settings-sub-panel" id="subDeleteAccount">
                            <div class="settings-sub-header">
                                <button class="settings-back-btn" onclick="closeSettingsPanel('subDeleteAccount')">
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <span class="settings-sub-title" style="color:#f87171;">Delete Account</span>
                            </div>
                            <div class="settings-sub-body" style="padding:20px 16px 40px;">
                                <!-- Warning banner -->
                                <div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.18);border-radius:14px;padding:18px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink:0;margin-top:1px;"><path d="M10 2.5L2 17.5h16L10 2.5Z" stroke="#f87171" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 8v5" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/><circle cx="10" cy="14.5" r=".9" fill="#f87171"/></svg>
                                    <div>
                                        <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#f87171;margin-bottom:5px;">This is permanent</div>
                                        <div style="font-size:11px;color:rgba(248,113,113,0.75);line-height:1.65;">Deleting your account removes all your listings, messages, wallet balance, and transaction history. This cannot be undone.</div>
                                    </div>
                                </div>

                                <!-- What gets deleted list -->
                                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:12px;padding:16px;margin-bottom:20px;">
                                    <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;">What will be deleted</div>
                                    <div style="display:flex;flex-direction:column;gap:9px;">
                                        <div style="display:flex;align-items:center;gap:9px;font-size:12px;color:rgba(248,113,113,0.8);"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#f87171" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>All active and draft listings</div>
                                        <div style="display:flex;align-items:center;gap:9px;font-size:12px;color:rgba(248,113,113,0.8);"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#f87171" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>All messages and conversations</div>
                                        <div style="display:flex;align-items:center;gap:9px;font-size:12px;color:rgba(248,113,113,0.8);"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#f87171" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Wallet balance (non-refundable)</div>
                                        <div style="display:flex;align-items:center;gap:9px;font-size:12px;color:rgba(248,113,113,0.8);"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#f87171" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Transaction history and reviews</div>
                                        <div style="display:flex;align-items:center;gap:9px;font-size:12px;color:rgba(248,113,113,0.8);"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#f87171" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Profile, saved searches, and referrals</div>
                                    </div>
                                </div>

                                <!-- Verify identity form -->
                                <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:16px;">To confirm your identity, enter your account email and password, then confirm deletion. If your wallet balance is $0 and you have no orders in escrow, your account is deleted immediately — no email required.</div>

                                <div style="margin-bottom:12px;">
                                    <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px;">Your account email</label>
                                    <input id="deleteAccEmail" class="dash-input" type="email" placeholder="Enter your email address" oninput="checkDeleteReady()" style="width:100%;background:rgba(248,113,113,0.04);border-color:rgba(248,113,113,0.2);">
                                </div>
                                <div style="margin-bottom:18px;">
                                    <label style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px;">Your password</label>
                                    <input id="deleteAccPassword" class="dash-input" type="password" placeholder="Enter your password" oninput="checkDeleteReady()" style="width:100%;background:rgba(248,113,113,0.04);border-color:rgba(248,113,113,0.2);">
                                </div>

                                <div id="deleteAccErr" style="display:none;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:10px 12px;font-size:12px;color:#f87171;margin-bottom:14px;"></div>
                                <div id="deleteAccOk" style="display:none;background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:10px 12px;font-size:12px;color:#34d399;margin-bottom:14px;"></div>

                                <button id="deleteAccSendBtn" disabled onclick="startDeleteAccountFlow()" style="width:100%;padding:14px;border-radius:13px;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.15);font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:rgba(248,113,113,0.4);cursor:not-allowed;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:0.02em;">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V3.5ZM1.5 3.5l6 4.5 6-4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Continue
                                </button>
                                <div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(139,138,168,0.4);">You'll be asked to confirm one final time before anything is deleted</div>
                            </div>
                        </div>

                        <!--  DELETE CONFIRM FINAL POPUP  -->
                        <div id="deleteConfirmFinalModal" style="display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.88);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);align-items:center;justify-content:center;padding:20px 16px;">
                            <div style="background:linear-gradient(160deg,#1e0a0a 0%,#12050a 100%);border:1px solid rgba(248,113,113,0.25);border-top:1px solid rgba(248,113,113,0.45);border-radius:24px;width:100%;max-width:340px;padding:0;box-shadow:0 32px 80px rgba(0,0,0,0.9),0 0 60px rgba(248,113,113,0.08);overflow:hidden;animation:modalPop 0.28s cubic-bezier(0.34,1.2,0.64,1) both;">
                                <div style="position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(248,113,113,0.12),rgba(239,68,68,0.06));padding:28px 24px 20px;text-align:center;border-bottom:1px solid rgba(248,113,113,0.12);">
                                    <div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:160px;height:80px;background:radial-gradient(ellipse,rgba(248,113,113,0.25),transparent 70%);pointer-events:none;"></div>
                                    <div style="line-height:1;margin-bottom:10px;"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                                    <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#f87171;letter-spacing:-0.03em;margin-bottom:6px;">Final confirmation</div>
                                    <div style="font-size:12px;color:rgba(248,113,113,0.65);line-height:1.6;">All your data will be permanently removed. This cannot be undone.</div>
                                </div>
                                <div style="padding:22px 24px;">
                                    <div id="deleteFinalItemsList" style="background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.15);border-radius:12px;padding:14px;margin-bottom:18px;font-size:11px;color:rgba(248,113,113,0.75);line-height:1.9;">
                                        <svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> All listings deleted<br><svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> All messages deleted<br><svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Wallet balance forfeited<br><svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Account permanently closed
                                    </div>
                                    <button id="deleteFinalConfirmBtn" onclick="executeFinalDelete()" style="width:100%;padding:14px;border-radius:13px;background:linear-gradient(135deg,#f87171,#ef4444);border:none;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;cursor:pointer;margin-bottom:10px;letter-spacing:0.02em;">Yes, delete everything</button>
                                    <button onclick="document.getElementById('deleteConfirmFinalModal').style.display='none';unlockBodyScroll&&unlockBodyScroll();" style="width:100%;padding:13px;border-radius:13px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--muted);cursor:pointer;">Cancel — keep my account</button>
                                </div>
                            </div>
                        </div>

  </div><!-- dm-shell -->

  <!-- Floating Messages button — bottom-right of profile modal -->
  

  <div id="dmFloatMsg" title="Messages" onclick="window.closeDash&&window.closeDash();openMessagesModal();">
    <div class="dmfm-icon">
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <path d="M18 2H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4l3.5 3 3.5-3H18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="#a8ff6b" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M5.5 8h9M5.5 11h5.5" stroke="#a8ff6b" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <span class="dmfm-badge dmfm-badge-zero" id="dmFloatMsgBadge">0</span>
    </div>
    <span class="dmfm-label">Messages</span>
  </div>

</div><!-- dashModal -->

  



    <!--  FIREBASE + AUTH LOGIC  -->
    

    <!--  TRANSFER MODAL  -->
    <div id="transferOverlay" onclick="if(event.target===this)closeTransferModal()" class="popup-overlay">
        <div id="transferModal" class="popup-card" style="max-width:400px;">
            <div class="popup-card-header" style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:9px;">
                    <div style="width:32px;height:32px;border-radius:10px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.22);display:flex;align-items:center;justify-content:center;">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 4l4 4-4 4" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div>
                        <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#fff;">Transfer Balance</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:1px;" id="tfHeaderSub">Send funds to another account</div>
                    </div>
                </div>
                <div onclick="closeTransferModal()" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="rgba(185,183,220,0.6)" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
            </div>
            <div class="popup-card-body" style="padding:20px;">
                <!-- STEP 1 -->
                <div class="tf-step active" id="tfStep1">
                    <div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.6;">Enter the email address of the account you'd like to send funds to.</div>
                    <input class="tf-input" id="tfEmailInput" type="email" placeholder="recipient@email.com" autocomplete="off" autocapitalize="none" oninput="tfClearError()" onkeydown="if(event.key==='Enter')tfLookupEmail()">
                    <div class="tf-error-text" id="tfStep1Error"></div>
                    <button class="tf-confirm-btn" id="tfLookupBtn" onclick="tfLookupEmail()" style="margin-top:14px;">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                        Look Up Account
                    </button>
                </div>
                <!-- STEP 2 -->
                <div class="tf-step" id="tfStep2">
                    <div class="tf-recipient-card" id="tfRecipientCard">
                        <div class="tf-avatar" id="tfAvatarEl">?</div>
                        <div style="min-width:0;">
                            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;" id="tfRecipientName">—</div>
                            <div style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="tfRecipientEmail">—</div>
                        </div>
                        <div style="margin-left:auto;flex-shrink:0;">
                            <div style="font-size:10px;color:rgba(52,211,153,0.8);background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:6px;padding:3px 8px;font-weight:700;">Verified</div>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;margin-top:16px;">Transfer amount</div>
                    <div style="position:relative;">
                        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:15px;color:rgba(185,183,220,0.5);font-weight:600;pointer-events:none;">$</span>
                        <input class="tf-input" id="tfAmountInput" type="number" min="1" max="1000" step="0.01" placeholder="0.00" style="padding-left:28px;" oninput="tfUpdateFees()" onkeydown="if(event.key==='Enter')tfReview()">
                    </div>
                    <div style="font-size:11px;color:rgba(185,183,220,0.45);margin-top:6px;margin-bottom:16px;">Min $1.00 · Max $1,000.00 per transfer</div>
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px;margin-bottom:16px;" id="tfFeeBox">
                        <div class="tf-fee-row"><span>You send</span><span class="tf-fee-val" id="tfSendVal">—</span></div>
                        <div class="tf-fee-row"><span>Platform fee (3%)</span><span class="tf-fee-val red" id="tfFeeVal">—</span></div>
                        <div class="tf-fee-row" style="border-top:1px solid rgba(255,255,255,0.07);margin-top:6px;padding-top:10px;">
                            <span style="font-weight:700;color:rgba(255,255,255,0.8);">Total deducted</span>
                            <span class="tf-fee-val red" id="tfTotalVal" style="font-size:13px;">—</span>
                        </div>
                        <div class="tf-fee-row"><span style="color:rgba(52,211,153,0.8);">Recipient gets</span><span class="tf-fee-val green" id="tfCreditVal">—</span></div>
                        <div class="tf-fee-row"><span>Your new balance</span><span class="tf-fee-val" id="tfNewBalVal" style="color:rgba(185,183,220,0.8);">—</span></div>
                    </div>
                    <div class="tf-error-text" id="tfStep2Error"></div>
                    <div style="display:flex;gap:10px;margin-top:4px;">
                        <button onclick="tfBackToStep1()" style="flex:0 0 auto;padding:13px 16px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--muted);font-size:13px;cursor:pointer;">← Back</button>
                        <button class="tf-confirm-btn" id="tfReviewBtn" onclick="tfReview()" style="flex:1;">Review Transfer</button>
                    </div>
                </div>
                <!-- STEP 3 -->
                <div class="tf-step" id="tfStep3">
                    <div style="text-align:center;margin-bottom:20px;">
                        <div style="font-size:13px;color:var(--muted);margin-bottom:6px;">You are sending</div>
                        <div style="font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#fff;" id="tfConfirmAmount">$0</div>
                        <div style="font-size:12px;color:rgba(185,183,220,0.5);margin-top:4px;">to <span id="tfConfirmTo" style="color:rgba(185,183,220,0.8);">—</span></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
                        <div class="tf-fee-row"><span>Platform fee (3%)</span><span class="tf-fee-val red" id="tfConfirmFee">—</span></div>
                        <div class="tf-fee-row"><span>Total deducted from you</span><span class="tf-fee-val red" id="tfConfirmTotal">—</span></div>
                        <div class="tf-fee-row"><span>Recipient receives</span><span class="tf-fee-val green" id="tfConfirmCredit">—</span></div>
                    </div>
                    <div class="tf-warning-box" id="tfWarningBox"><svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <span id="tfWarningText"></span></div>
                    <div style="font-size:11px;color:rgba(185,183,220,0.4);text-align:center;margin:12px 0;line-height:1.6;">
                        This transfer is <strong style="color:rgba(185,183,220,0.6);">irreversible</strong>. Funds cannot be recalled once sent.
                    </div>
                    <div class="tf-error-text" id="tfStep3Error" style="text-align:center;margin-bottom:8px;"></div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="tfBackToStep2()" style="flex:0 0 auto;padding:13px 16px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--muted);font-size:13px;cursor:pointer;">← Back</button>
                        <button class="tf-confirm-btn" id="tfSendBtn" onclick="tfExecuteTransfer()" style="flex:1;background:linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.22));border-color:rgba(56,189,248,0.4);">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Confirm &amp; Send
                        </button>
                    </div>
                </div>
                <!-- STEP 4: Success -->
                <div class="tf-step" id="tfStep4" style="text-align:center;padding:8px 0 4px;">
                    <div class="tf-success-icon">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 13l6 6 10-10" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:8px;">Transfer Complete</div>
                    <div style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:20px;" id="tfSuccessMsg">—</div>
                    <div class="tf-warning-box show" id="tfSuccessWarning" style="display:none!important;text-align:left;margin-bottom:16px;"><svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <span id="tfSuccessWarningText"></span></div>
                    <div style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.18);border-radius:12px;padding:14px;margin-bottom:20px;">
                        <div class="tf-fee-row"><span>New wallet balance</span><span class="tf-fee-val green" id="tfSuccessBalance">—</span></div>
                    </div>
                    <button onclick="closeTransferModal()" class="tf-confirm-btn" style="background:rgba(52,211,153,0.1);border-color:rgba(52,211,153,0.3);color:#6ee7b7;">Done</button>
                </div>
            </div>
        </div>
    </div>

    
    <!--  PAYPAL SDK — supports both wallet top-up (capture) and subscriptions  -->
    <!-- We load two separate SDK instances: one for capture (top-up), one for subscriptions (plans) -->
    <script id="paypalCaptureSDK" src="https://www.paypal.com/sdk/js?client-id=AW7nmsZqdabjCrj62j0qekUqalJJ3T53ngjrime14foH5HMhNLmpUzULQV-OvV82KSuZQoBoEP4Rkwi4&currency=USD&intent=capture&components=buttons" data-namespace="paypalCapture" data-sdk-integration-source="button-factory"></script>

    <!--  TOP-UP LOGIC  -->
    


    <!--  UPGRADE PLAN MODAL  -->
    <div id="upgradeOverlay" onclick="if(event.target===this)closeUpgradeModal()" class="popup-overlay">
        <div id="upgradeModal" class="popup-card">
            <div id="upgradeBg" style="position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>
            <!-- Sticky Header -->
            <div class="popup-card-header" style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div id="upgradeModalIcon" style="width:38px;height:38px;border-radius:11px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l2 4 4.5.65-3.25 3.17.77 4.47L9 12.07l-4.02 2.22.77-4.47L2.5 6.65 7 6Z" stroke="#a855f7" stroke-width="1.4" stroke-linejoin="round"/></svg>
                    </div>
                    <div>
                        <div id="upgradeModalName" style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:-.03em;color:var(--text);">Upgrade Plan</div>
                        <div id="upgradeModalPrice" style="font-size:11px;color:var(--muted);">$0/month</div>
                    </div>
                </div>
                <div onclick="closeUpgradeModal()" style="width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted);transition:background .15s;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
            </div>
            <!-- Scrollable Body -->
            <div class="popup-card-body">
                <!-- Price display -->
                <div style="padding:22px 22px 0;text-align:center;">
                    <div id="upgradeModalBigPrice" style="font-family:'Syne',sans-serif;font-size:3rem;font-weight:800;letter-spacing:-.05em;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">$0</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:4px;">per month · cancel anytime</div>
                </div>
                <!-- Description -->
                <div id="upgradeModalDesc" style="padding:14px 22px 0;font-size:12px;color:var(--muted);line-height:1.7;text-align:center;"></div>
                <!-- Benefits list -->
                <div style="padding:18px 22px 0;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;">What you get</div>
                    <div id="upgradeBenefitsList" style="display:flex;flex-direction:column;gap:9px;"></div>
                </div>
                <!-- CTA — PayPal subscription buttons rendered here -->
                <div style="padding:20px 22px 24px;">
                    <!-- Loading state shown while PayPal SDK initialises -->
                    <div id="upgradePaypalLoading" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="animation:spin .8s linear infinite;flex-shrink:0;"><circle cx="12" cy="12" r="9" stroke="rgba(168,85,247,0.3)" stroke-width="2.5"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/></svg>
                        <span style="font-size:13px;color:var(--muted);">Loading payment…</span>
                    </div>
                    <!-- PayPal button injected by JS — one container per plan -->
                    <div id="upgradePaypalContainer" style="display:none;border-radius:11px;overflow:hidden;"></div>
                    <!-- Error fallback -->
                    <div id="upgradePaypalError" style="display:none;padding:12px;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);border-radius:10px;text-align:center;font-size:12px;color:#f87171;">
                        Could not load PayPal. Please <a id="ppErrMailLink" href="mailto:support@siterifty.com" style="color:#f87171;text-decoration:underline;">contact support</a>.
                    </div>
                    <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:12px;">Billed monthly via PayPal · cancel anytime · no hidden fees.</p>
                </div>
            </div><!-- end popup-card-body -->
        </div>
    </div>

    <!--  PLANS PICKER MODAL  -->
    <div id="plansPickerOverlay" onclick="if(event.target===this)closePlansPickerModal()" class="popup-overlay" style="z-index:9100;">
        <div id="plansPickerModal" class="psw-card" style="max-width:420px;max-height:calc(100svh - 40px);animation:modalPop 0.26s cubic-bezier(0.34,1.2,0.64,1) both;position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:24px;width:100%;border:1px solid rgba(255,255,255,0.08);background:rgba(20,28,35,0.55);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);box-shadow:0 30px 60px rgba(0,0,0,0.6);">
            <div class="psw-shimmer" id="ppShimmer"></div>
            <div id="plansBg" style="position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>
            <!-- Header -->
            <div class="psw-header">
                <div class="psw-profile-meta">
                    <div class="psw-avatar" id="ppAvatar">U</div>
                    <div class="psw-profile-text">
                        <div class="psw-username-row">
                            <span class="psw-username" id="ppUsername">@you</span>
                            <svg class="psw-verified" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        </div>
                        <span class="psw-plan-pill" id="ppCurrentPlanPill">Free Plan</span>
                    </div>
                </div>
                <button class="psw-close" onclick="closePlansPickerModal()" aria-label="Close">×</button>
            </div>
            <!-- Scrollable body -->
            <div class="psw-body">
                <div class="psw-title-area">
                    <div class="psw-title-area-img" aria-hidden="true">
                        <img id="pswTitleAreaImg" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10" alt="" loading="lazy">
                        <div class="bg-img-skeleton" id="pswTitleAreaSkeleton"></div>
                    </div>
                    <h3>Choose a plan</h3>
                    <p>Cancel anytime · billed monthly via PayPal</p>
                </div>
                <div class="psw-nav">
                    <div class="psw-slider" id="ppSlider"></div>
                    <button id="ppTab-starter" class="psw-switch-btn active" onclick="showPlanTab('starter')">Starter</button>
                    <button id="ppTab-growth" class="psw-switch-btn" onclick="showPlanTab('growth')">Growth</button>
                    <button id="ppTab-pro" class="psw-switch-btn" onclick="showPlanTab('pro')">Pro</button>
                </div>
                <div class="psw-dynamic" id="ppDynamic">
                    <div class="psw-price-row">
                        <div class="psw-icon-badge" id="ppIconBadge"></div>
                        <div class="psw-price" id="ppPrice"></div>
                    </div>
                    <p class="psw-desc" id="ppDesc"></p>
                    <ul class="psw-features" id="ppFeaturesVisible"></ul>
                    <div class="psw-hidden-features" id="ppHiddenContainer">
                        <ul class="psw-features" id="ppFeaturesHidden"></ul>
                    </div>
                    <button class="psw-toggle" id="ppToggleBtn" onclick="togglePlanFeatures()">
                        <span>Read More</span>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l4 4 4-4"/></svg>
                    </button>
                </div>
                <!-- PayPal CTA -->
                <div id="ppPaypalLoading" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="animation:spin .8s linear infinite;flex-shrink:0;"><circle cx="12" cy="12" r="9" stroke="rgba(168,85,247,0.3)" stroke-width="2.5"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/></svg>
                    <span style="font-size:13px;color:var(--muted);">Loading payment…</span>
                </div>
                <div id="ppPaypalContainer" style="display:none;border-radius:12px;overflow:hidden;"></div>
                <div id="ppPaypalError" class="psw-paypal-status" style="display:none;">
                    <span>Could not load PayPal. Please <a id="ppErrMailLink" href="mailto:support@siterifty.com">contact support</a>.</span>
                </div>
                <p style="text-align:center;font-size:10px;color:rgba(139,138,168,0.5);margin-top:10px;">Secure payment via PayPal · cancel anytime · no hidden fees</p>
            </div>
        </div>
    </div>


    <!--  CHAT WIDGET JS  -->
    
    <!--  LIVE STATS — cached in localStorage for 24 hours, one /api/stats call per day  -->
    


    <!--  TICKER + COMPARE + FINAL CTA JS  -->
    

    <!--  SCROLL REVEAL  -->
    

    <!--  IMGUR PROFILE PIC UPLOAD  -->
    

    <!--  AUTO-OPEN PLANS PICKER — triggered by ?upgrade=plans from sell page  -->
    

    




    <!--  REFERRAL WELCOME POPUP  -->
    <div id="referralWelcomeModal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);align-items:center;justify-content:center;padding:20px 16px;">
        <div style="background:linear-gradient(160deg,#16162a 0%,#0f0f1c 100%);border:1px solid rgba(168,85,247,0.25);border-top:1px solid rgba(168,85,247,0.4);border-radius:24px;width:100%;max-width:340px;padding:0;box-shadow:0 32px 80px rgba(0,0,0,0.9),0 0 60px rgba(168,85,247,0.12);overflow:hidden;animation:modalPop 0.28s cubic-bezier(0.34,1.2,0.64,1) both;">
            <!-- Glow header -->
            <div style="position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(129,140,248,0.1));padding:28px 24px 20px;text-align:center;border-bottom:1px solid rgba(168,85,247,0.12);">
                <div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:160px;height:80px;background:radial-gradient(ellipse,rgba(168,85,247,0.3),transparent 70%);pointer-events:none;"></div>
                <div style="line-height:1;margin-bottom:10px;"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9b5de5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
                <div style="font-family:'Syne',sans-serif;font-size:19px;font-weight:800;color:#f1f0ff;letter-spacing:-0.03em;margin-bottom:6px;">You got a referral bonus!</div>
                <div style="font-size:12px;color:rgba(139,138,168,0.8);line-height:1.6;">A friend invited you to Siterifty. You've been credited $1 as a welcome bonus.</div>
            </div>
            <!-- Credit amount -->
            <div style="padding:20px 24px;">
                <div style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(56,189,248,0.05));border:1px solid rgba(52,211,153,0.18);border-radius:14px;padding:16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                    <div>
                        <div style="font-size:11px;color:rgba(52,211,153,0.7);font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:3px;">Wallet credit added</div>
                        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.04em;background:linear-gradient(135deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">+$1.00</div>
                    </div>
                    <div style="width:44px;height:44px;border-radius:12px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.22);display:flex;align-items:center;justify-content:center;">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="#34d399" stroke-width="1.4"/><path d="M2 8.5h16" stroke="#34d399" stroke-width="1.3"/><circle cx="15" cy="12" r="1.2" fill="#34d399"/></svg>
                    </div>
                </div>
                <!-- Referred by row -->
                <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);border-radius:12px;margin-bottom:18px;">
                    <div style="width:32px;height:32px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#818cf8);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;" id="refByAvatar">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:11px;color:rgba(139,138,168,0.6);">Referred by</div>
                        <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="refByName">@—</div>
                    </div>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.4)"/><path d="M3 5.5l1.5 1.5 2.5-3" stroke="#34d399" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <button onclick="document.getElementById('referralWelcomeModal').style.display='none';unlockBodyScroll&&unlockBodyScroll();" style="width:100%;padding:14px;border-radius:13px;background:linear-gradient(135deg,#a855f7,#818cf8);border:none;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;cursor:pointer;letter-spacing:0.02em;">Awesome, let's go! →</button>
                <div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(139,138,168,0.35);">Credit added to your wallet instantly</div>
            </div>
        </div>
    </div>

    <!--  SIGN OUT CONFIRM MODAL — iOS-style alert  -->
    <div id="signOutConfirmModal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);align-items:center;justify-content:center;padding:20px;">
        
        <div class="so-card">
            <div class="so-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>
            <div class="so-title">Hold on — leaving already?</div>
            <div class="so-msg-wrap">
                <div class="so-msg" id="soMsg"></div>
            </div>
            <div class="so-actions">
                <button class="so-btn so-btn-cancel" onclick="cancelSignOut()">Stay signed in</button>
                <button class="so-btn so-btn-leave"  onclick="confirmSignOut()">Sign out</button>
            </div>
        </div>
    </div>
    
    

    

</div><!-- /kycGateOverlay -->

<!-- ═══════════════════════════════════════════════════
     WITHDRAWAL MODAL — redesigned modern (matches plans picker)
═══════════════════════════════════════════════════ -->


<div id="withdrawOverlay" onclick="if(event.target===this)closeWithdrawModal()" class="popup-overlay" style="z-index:9050;">
  <div id="withdrawCard" style="
    max-width:440px; width:calc(100% - 32px);
    background:linear-gradient(160deg,rgba(14,18,24,0.98),rgba(9,12,16,0.99));
    border:1px solid rgba(255,255,255,0.09);
    border-top-color:rgba(255,255,255,0.16);
    border-radius:24px;
    box-shadow:0 32px 80px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset;
    overflow:hidden;
    animation:modalPop .26s cubic-bezier(0.34,1.2,0.64,1) both;
    display:flex; flex-direction:column;
    max-height:calc(100svh - 40px);
    position:relative;
  ">

    <!-- ── Decorative glow ── -->
    <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:260px;height:160px;background:radial-gradient(ellipse,rgba(52,211,153,0.12) 0%,transparent 70%);pointer-events:none;z-index:0;"></div>

    <!-- ══ HEADER ══ -->
    <div style="position:relative;z-index:2;padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:11px;">
        <!-- icon badge -->
        <div style="width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,rgba(52,211,153,0.18),rgba(56,189,248,0.1));border:1px solid rgba(52,211,153,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2.2" stroke="#34d399" stroke-width="1.5"/><path d="M2 9h16" stroke="#34d399" stroke-width="1.3"/><circle cx="14.5" cy="12.5" r="1.4" fill="#34d399"/></svg>
        </div>
        <div>
          <div id="wdHeaderTitle" style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.1;">Withdraw Revenue</div>
          <div id="wdHeaderSub" style="font-size:10px;color:rgba(52,211,153,0.65);margin-top:3px;font-weight:600;letter-spacing:.02em;">STEP 1 OF 3 · AMOUNT</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <!-- step pills -->
        <div class="wd2-steps" id="wdStepDots">
          <div class="wd2-step-pill active" id="wdDot1" style="width:22px;"></div>
          <div class="wd2-step-pill" id="wdDot2" style="width:14px;"></div>
          <div class="wd2-step-pill" id="wdDot3" style="width:14px;"></div>
        </div>
        <!-- close -->
        <button onclick="closeWithdrawModal()" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.45);transition:background .15s;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.11)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- ══ BODY (scrollable) ══ -->
    <div style="overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;position:relative;z-index:2;">

      <!-- ╔═════════════════╗ -->
      <!-- ║  STEP 1: Amount ║ -->
      <!-- ╚═════════════════╝ -->
      <div id="wdStep1" style="padding:20px 20px 28px;">

        <!-- Balance hero — 3-column breakdown -->
        <div style="background:linear-gradient(160deg,rgba(52,211,153,0.07),rgba(56,189,248,0.04));border:1px solid rgba(52,211,153,0.14);border-radius:18px;margin-bottom:16px;overflow:hidden;position:relative;">
          <div style="position:absolute;inset:0;background:url('https://i.pinimg.com/originals/b9/de/c6/b9dec6676e8fa03674971f635b90498d.gif') center/cover;opacity:.04;pointer-events:none;"></div>
          <!-- Top: available balance (full width) -->
          <div style="position:relative;z-index:1;text-align:center;padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(52,211,153,0.6);margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:5px;">
              Available Balance
              <!-- Info tooltip -->
              <span style="position:relative;display:inline-flex;" class="wd-info-wrap">
                <svg id="wdInfoAvailable" onclick="wdToggleInfo('available')" width="13" height="13" viewBox="0 0 16 16" fill="none" style="cursor:pointer;opacity:.55;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.55'"><circle cx="8" cy="8" r="6.5" stroke="#34d399" stroke-width="1.3"/><path d="M8 7v4" stroke="#34d399" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".7" fill="#34d399"/></svg>
                <div id="wdTooltip-available" style="display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(14,18,24,0.98);border:1px solid rgba(52,211,153,0.25);border-radius:10px;padding:10px 12px;width:200px;font-size:10.5px;color:rgba(255,255,255,0.75);line-height:1.5;z-index:99;box-shadow:0 8px 30px rgba(0,0,0,0.6);font-weight:400;text-transform:none;letter-spacing:0;text-align:left;">
                  <strong style="color:#34d399;display:block;margin-bottom:4px;">Available Balance</strong>
                  Funds you can withdraw right now. Comes from completed sales where the buyer confirmed receipt and Siterifty released escrow.
                  <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:rgba(14,18,24,0.98);border-right:1px solid rgba(52,211,153,0.25);border-bottom:1px solid rgba(52,211,153,0.25);transform:translateX(-50%) rotate(45deg);"></div>
                </div>
              </span>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;gap:7px;">
              <div style="width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 8px rgba(52,211,153,0.7);flex-shrink:0;"></div>
              <span id="wdGrossAmount" style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-.04em;background:linear-gradient(135deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">$0</span>
            </div>
            <div style="font-size:10.5px;color:rgba(255,255,255,0.3);margin-top:4px;">Only money you can withdraw</div>
          </div>
          <!-- Bottom: Pending + Rejected -->
          <div style="position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;">
            <!-- Pending -->
            <div style="padding:12px 14px;border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(251,191,36,0.65);margin-bottom:5px;display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#fbbf24;display:inline-block;flex-shrink:0;"></span>
                Pending
                <span style="position:relative;display:inline-flex;" class="wd-info-wrap">
                  <svg onclick="wdToggleInfo('pending')" width="12" height="12" viewBox="0 0 16 16" fill="none" style="cursor:pointer;opacity:.55;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.55'"><circle cx="8" cy="8" r="6.5" stroke="#fbbf24" stroke-width="1.3"/><path d="M8 7v4" stroke="#fbbf24" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".7" fill="#fbbf24"/></svg>
                  <div id="wdTooltip-pending" style="display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(14,18,24,0.98);border:1px solid rgba(251,191,36,0.25);border-radius:10px;padding:10px 12px;width:200px;font-size:10.5px;color:rgba(255,255,255,0.75);line-height:1.5;z-index:99;box-shadow:0 8px 30px rgba(0,0,0,0.6);font-weight:400;text-transform:none;letter-spacing:0;text-align:left;">
                    <strong style="color:#fbbf24;display:block;margin-bottom:4px;">Pending Funds</strong>
                    Money on hold in escrow. The buyer has paid but the site transfer hasn't been confirmed yet. These funds unlock once the deal completes.
                    <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:rgba(14,18,24,0.98);border-right:1px solid rgba(251,191,36,0.25);border-bottom:1px solid rgba(251,191,36,0.25);transform:translateX(-50%) rotate(45deg);"></div>
                  </div>
                </span>
              </div>
              <div id="wdPendingAmount" style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:17px;font-weight:800;letter-spacing:-.03em;color:#fbbf24;">$0</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;">On hold</div>
            </div>
            <!-- Rejected -->
            <div style="padding:12px 14px;">
              <div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(248,113,113,0.65);margin-bottom:5px;display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#f87171;display:inline-block;flex-shrink:0;"></span>
                Rejected
                <span style="position:relative;display:inline-flex;" class="wd-info-wrap">
                  <svg onclick="wdToggleInfo('rejected')" width="12" height="12" viewBox="0 0 16 16" fill="none" style="cursor:pointer;opacity:.55;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.55'"><circle cx="8" cy="8" r="6.5" stroke="#f87171" stroke-width="1.3"/><path d="M8 7v4" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5.2" r=".7" fill="#f87171"/></svg>
                  <div id="wdTooltip-rejected" style="display:none;position:absolute;bottom:calc(100% + 8px);right:0;background:rgba(14,18,24,0.98);border:1px solid rgba(248,113,113,0.25);border-radius:10px;padding:10px 12px;width:200px;font-size:10.5px;color:rgba(255,255,255,0.75);line-height:1.5;z-index:99;box-shadow:0 8px 30px rgba(0,0,0,0.6);font-weight:400;text-transform:none;letter-spacing:0;text-align:left;">
                    <strong style="color:#f87171;display:block;margin-bottom:4px;">Rejected Funds</strong>
                    Funds Siterifty has seized due to a policy violation, dispute ruling, chargeback, or fraud. You no longer have access to withdraw these.
                    <div style="position:absolute;bottom:-5px;right:16px;width:8px;height:8px;background:rgba(14,18,24,0.98);border-right:1px solid rgba(248,113,113,0.25);border-bottom:1px solid rgba(248,113,113,0.25);transform:rotate(45deg);"></div>
                  </div>
                </span>
              </div>
              <div id="wdRejectedAmount" style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:17px;font-weight:800;letter-spacing:-.03em;color:#f87171;">$0</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;">No access</div>
            </div>
          </div>
        </div>

        <!-- Amount input -->
        <div class="wd2-amount-wrap" id="wdAmountWrap">
          <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.28);margin-bottom:10px;">Amount to withdraw</div>
          <div style="display:flex;align-items:center;gap:0;position:relative;">
            <span style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:26px;font-weight:800;color:rgba(255,255,255,0.22);margin-right:4px;flex-shrink:0;line-height:1;">$</span>
            <input id="wdAmountInput" type="number" min="50" step="0.01" placeholder="0.00"
              oninput="wdOnAmountInput()"
              onfocus="document.getElementById('wdAmountWrap').classList.add('focused')"
              onblur="document.getElementById('wdAmountWrap').classList.remove('focused')"
              style="flex:1;background:transparent;border:none;padding:2px 0;font-size:30px;font-family:'Plus Jakarta Sans','Syne',sans-serif;font-weight:800;color:#fff;outline:none;-moz-appearance:textfield;width:100%;min-width:0;">
            <button onclick="wdSetMaxAmount()" style="flex-shrink:0;font-size:10px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;color:rgba(52,211,153,0.85);background:rgba(52,211,153,0.09);border:1px solid rgba(52,211,153,0.25);border-radius:8px;padding:6px 13px;cursor:pointer;transition:opacity .15s;white-space:nowrap;" onmouseover="this.style.opacity='.65'" onmouseout="this.style.opacity='1'">MAX</button>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:10px;color:rgba(255,255,255,0.2);">Min $50 · Max $999</span>
            <span id="wdNetAmtQuick" style="font-size:11.5px;font-weight:800;color:rgba(52,211,153,0.75);font-family:'Plus Jakarta Sans',sans-serif;"></span>
          </div>
          <div id="wdAmountError" style="font-size:11px;color:#f87171;margin-top:8px;display:none;"></div>
        </div>

        <!-- Fee comparison -->
        <div style="margin-bottom:14px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,0.22);margin-bottom:8px;">Platform fee by plan</div>
          <div class="wd2-fee-grid">
            <!-- Headers -->
            <div style="padding:9px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;color:rgba(248,113,113,0.8);letter-spacing:.04em;">Free</div>
              <div style="font-size:8.5px;color:rgba(248,113,113,0.45);margin-top:1px;">30%</div>
            </div>
            <div style="padding:9px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;color:rgba(168,85,247,0.85);letter-spacing:.04em;">Starter</div>
              <div style="font-size:8.5px;color:rgba(168,85,247,0.45);margin-top:1px;">15%</div>
            </div>
            <div style="padding:9px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;color:rgba(129,140,248,0.85);letter-spacing:.04em;">Growth</div>
              <div style="font-size:8.5px;color:rgba(129,140,248,0.45);margin-top:1px;">10%</div>
            </div>
            <div style="padding:9px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:9px;font-weight:700;color:rgba(56,189,248,0.85);letter-spacing:.04em;">Pro</div>
              <div style="font-size:8.5px;color:rgba(56,189,248,0.45);margin-top:1px;">5%</div>
            </div>
            <!-- Net values -->
            <div id="wdCmpFree" class="wd2-fee-col">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:800;color:rgba(255,255,255,0.35);">—</div>
              <div id="wdCmpFeeAmt0" style="font-size:8.5px;color:rgba(248,113,113,0.4);margin-top:2px;"></div>
            </div>
            <div id="wdCmpStarter" class="wd2-fee-col">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:800;color:rgba(168,85,247,0.75);">—</div>
              <div id="wdCmpFeeAmt1" style="font-size:8.5px;color:rgba(168,85,247,0.4);margin-top:2px;"></div>
            </div>
            <div id="wdCmpGrowth" class="wd2-fee-col">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:800;color:rgba(129,140,248,0.75);">—</div>
              <div id="wdCmpFeeAmt2" style="font-size:8.5px;color:rgba(129,140,248,0.4);margin-top:2px;"></div>
            </div>
            <div id="wdCmpPro" class="wd2-fee-col">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:800;color:rgba(56,189,248,0.75);">—</div>
              <div id="wdCmpFeeAmt3" style="font-size:8.5px;color:rgba(56,189,248,0.4);margin-top:2px;"></div>
            </div>
            <!-- Footer row -->
            <div style="grid-column:1/-1;padding:8px 14px;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:6px;">
              <div id="wdYourPlanDot" style="width:5px;height:5px;border-radius:50%;flex-shrink:0;background:#34d399;"></div>
              <span style="font-size:10px;color:rgba(255,255,255,0.3);">Your plan: <span id="wdYourPlanLabel" style="font-weight:700;color:rgba(255,255,255,0.55);">Free</span></span>
              <span id="wdUpgradeLink" style="margin-left:auto;font-size:9.5px;font-weight:700;color:rgba(168,85,247,0.7);cursor:pointer;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:999px;padding:2px 9px;" onclick="closeWithdrawModal();openPlansPickerModal();">Upgrade ↗</span>
            </div>
          </div>
        </div>

        <!-- KYC banner -->
        <div id="wdKycBanner" style="display:none;margin-bottom:14px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><circle cx="7" cy="7" r="6" stroke="rgba(251,191,36,0.4)" stroke-width="1.1"/><path d="M7 4.5v3M7 9.5v.3" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span style="font-size:11px;color:rgba(255,255,255,0.5);">KYC required for $50+ withdrawals</span>
          </div>
          <button onclick="wdOpenKycPopup()" style="flex-shrink:0;font-size:9.5px;font-weight:800;color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.28);border-radius:7px;padding:5px 11px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">Verify →</button>
        </div>

        <button id="wdContinueBtn" onclick="wdGoToPayment()" class="wd2-btn-primary" style="background:linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05));border:1px solid rgba(255,255,255,0.14);border-top-color:rgba(255,255,255,0.22);color:rgba(255,255,255,0.9);box-shadow:0 4px 20px rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.07) inset;">
          Continue →
        </button>
        <p style="text-align:center;font-size:10px;color:rgba(255,255,255,0.18);margin-top:10px;">Funds arrive within 1–3 business days</p>
      </div>

      <!-- ╔══════════════════════╗ -->
      <!-- ║  STEP 2: Pay Method  ║ -->
      <!-- ╚══════════════════════╝ -->
      <div id="wdStep2" style="display:none;padding:20px 20px 28px;">

        <button onclick="wdGoBack()" class="wd2-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back
        </button>

        <!-- You receive chip -->
        <div style="background:linear-gradient(135deg,rgba(52,211,153,0.09),rgba(56,189,248,0.05));border:1px solid rgba(52,211,153,0.22);border-radius:16px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div>
            <div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(52,211,153,0.65);margin-bottom:4px;">You receive</div>
            <div style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.04em;background:linear-gradient(135deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;" id="wdStep2Net">$0</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9.5px;color:rgba(255,255,255,0.3);margin-bottom:3px;">Platform fee</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:800;color:#f87171;" id="wdStep2Fee">−$0</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.22);margin-top:2px;" id="wdStep2FeeLabel">30% · Free</div>
          </div>
        </div>

        <!-- Payout methods label -->
        <div style="font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:10px;">Select payout method</div>

        <!-- PayPal -->
        <div class="wd2-method selected" style="position:relative;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="width:38px;height:38px;border-radius:11px;background:#003087;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(0,48,135,0.4);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7.5 21.5H4.9l.4-2.5h2.5c3.3 0 5.3-1.4 6-4.1.6-2.2-.2-3.4-2.4-3.8l-.7-.1.6-3.5c2.3.1 3.9 1 4.6 2.8.3.8.4 1.7.2 2.7C15.4 16.9 13.2 19.5 10 21c-.8.4-1.6.5-2.5.5Z" fill="#009cde"/><path d="M9 2.5h4.5c3.3 0 5.1 1.4 5.5 3.8.2 1.1.1 2.1-.3 3-1 2.4-3.2 3.6-6.2 3.6H10l-.8 4.6H5.7L8 3.1C8.2 2.7 8.6 2.5 9 2.5Z" fill="#003087"/></svg>
            </div>
            <div style="flex:1;">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:800;color:#fff;">PayPal</div>
              <div style="font-size:10px;color:rgba(52,211,153,0.75);margin-top:2px;font-weight:600;display:flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Available now</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#818cf8);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <label style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,0.3);display:block;margin-bottom:7px;">PayPal email address</label>
          <input id="wdPaypalEmail" type="email" placeholder="you@example.com"
            style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:11px;padding:12px 14px;font-size:13px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s;"
            onfocus="this.style.borderColor='rgba(168,85,247,0.55)';this.style.boxShadow='0 0 0 3px rgba(168,85,247,0.09)'"
            onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
        </div>

        <!-- Coming soon methods -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
          <div class="wd2-method disabled" style="cursor:not-allowed;">
            <div style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,0.4);font-family:'Plus Jakarta Sans',sans-serif;">Bank Transfer</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:2px;">Coming soon</div>
          </div>
          <div class="wd2-method disabled" style="cursor:not-allowed;">
            <div style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,0.4);font-family:'Plus Jakarta Sans',sans-serif;">Wise / Crypto</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:2px;">Coming soon</div>
          </div>
        </div>

        <button onclick="wdGoToConvert()" class="wd2-btn-primary" style="background:linear-gradient(135deg,#a855f7,#818cf8);color:#fff;box-shadow:0 6px 24px rgba(168,85,247,0.28);">
          Review &amp; Confirm →
        </button>
      </div>

      <!-- ╔════════════════════════╗ -->
      <!-- ║  STEP 3: Confirm + FX ║ -->
      <!-- ╚════════════════════════╝ -->
      <div id="wdStep3" style="display:none;padding:20px 20px 28px;">

        <button onclick="wdGoToPayment()" class="wd2-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back
        </button>

        <!-- You receive hero -->
        <div style="text-align:center;padding:18px 0 12px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:16px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(52,211,153,0.6);margin-bottom:8px;">You receive</div>
          <div style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:44px;font-weight:800;letter-spacing:-.04em;color:#fff;line-height:1;" id="wdConfirmNet">$0</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.35);margin-top:6px;">via PayPal · <span id="wdConfirmEmail" style="color:rgba(168,85,247,0.75);font-weight:600;">—</span></div>
        </div>

        <!-- FX card -->
        <div class="wd2-glass" style="padding:14px 16px;margin-bottom:12px;border-color:rgba(56,189,248,0.18);border-top-color:rgba(56,189,248,0.32);background:rgba(56,189,248,0.03);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(56,189,248,0.7);">Local Currency</div>
            <div style="display:flex;align-items:center;gap:5px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:999px;padding:3px 10px;">
              <div id="wdTimerDot" style="width:5px;height:5px;border-radius:50%;background:#38bdf8;animation:wdPulse 1s infinite;flex-shrink:0;"></div>
              <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:700;color:#38bdf8;" id="wdTimerDisplay">0:15</span>
              <span style="font-size:8.5px;color:rgba(56,189,248,0.5);">refresh</span>
            </div>
          </div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;">
            <div>
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#fff;" id="wdLocalAmount">—</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.32);margin-top:3px;" id="wdLocalCurrLabel">Detecting…</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:9px;color:rgba(255,255,255,0.22);">Live rate</div>
              <div style="font-size:11.5px;font-weight:700;color:rgba(56,189,248,0.8);font-family:'Plus Jakarta Sans',sans-serif;" id="wdRateDisplay">—</div>
            </div>
          </div>
          <div style="margin-top:10px;height:3px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;">
            <div id="wdTimerBar" style="height:100%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#a855f7);width:100%;transition:width 1s linear;"></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="wd2-glass" style="padding:12px 16px;margin-bottom:14px;">
          <div class="wd2-row">
            <span class="wd2-row-label">Withdrawal amount</span>
            <span class="wd2-row-val" id="wdSummaryGross">$0</span>
          </div>
          <div class="wd2-row">
            <span class="wd2-row-label">Platform fee (<span id="wdSummaryFeeRate">30%</span>)</span>
            <span class="wd2-row-val" style="color:#f87171;" id="wdSummaryFeeAmt">−$0</span>
          </div>
          <div class="wd2-row">
            <span class="wd2-row-label">Net payout (USD)</span>
            <span class="wd2-row-val" style="background:linear-gradient(135deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:13px;" id="wdSummaryNet">$0</span>
          </div>
          <div class="wd2-row">
            <span class="wd2-row-label">To PayPal</span>
            <span class="wd2-row-val" style="color:rgba(168,85,247,0.85);" id="wdSummaryEmail">—</span>
          </div>
          <div class="wd2-row">
            <span class="wd2-row-label">Processing time</span>
            <span class="wd2-row-val" style="color:rgba(255,255,255,0.55);">1–3 business days</span>
          </div>
        </div>

        <div id="wdMinWarning" style="display:none;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.22);border-radius:11px;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#f87171;text-align:center;">
          Minimum withdrawal is <strong>$50.00</strong> · Maximum <strong>$999.00</strong> per transaction.
        </div>

        <button id="wdConfirmBtn" onclick="wdConfirm()" class="wd2-btn-primary" style="background:linear-gradient(135deg,#34d399,#38bdf8);color:#04100d;box-shadow:0 6px 24px rgba(52,211,153,0.25);">
          Approve &amp; Withdraw
        </button>
        <p style="text-align:center;font-size:10px;color:rgba(255,255,255,0.18);margin-top:9px;">Rate refreshes every <span id="wdTimerInline">15</span>s</p>
      </div>

      <!-- ╔════════════════╗ -->
      <!-- ║  STEP 4: Done  ║ -->
      <!-- ╚════════════════╝ -->
      <div id="wdStep4" style="display:none;padding:36px 22px 44px;text-align:center;">
        <!-- Success icon -->
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(52,211,153,0.18),rgba(56,189,248,0.1));border:1px solid rgba(52,211,153,0.35);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 0 48px rgba(52,211,153,0.18);">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M5.5 15.5l6.5 6.5 13-13" stroke="#34d399" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.03em;color:#fff;margin-bottom:7px;">Withdrawal Submitted</div>
        <div style="font-size:12.5px;color:rgba(255,255,255,0.4);line-height:1.65;margin-bottom:24px;max-width:280px;margin-left:auto;margin-right:auto;">Your payout is being processed. Funds typically arrive within 1–3 business days.</div>

        <!-- Receipt -->
        <div style="background:rgba(52,211,153,0.05);border:1px solid rgba(52,211,153,0.15);border-radius:16px;padding:16px 18px;margin-bottom:22px;text-align:left;">
          <div class="wd2-row"><span class="wd2-row-label">Amount</span><span class="wd2-row-val" style="color:#34d399;" id="wdSuccessAmt">—</span></div>
          <div class="wd2-row"><span class="wd2-row-label">PayPal</span><span class="wd2-row-val" id="wdSuccessEmail">—</span></div>
          <div class="wd2-row">
            <span class="wd2-row-label">Status</span>
            <span style="font-size:10.5px;font-weight:700;color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);border-radius:999px;padding:3px 11px;font-family:'Plus Jakarta Sans',sans-serif;">Pending</span>
          </div>
        </div>

        <button onclick="closeWithdrawModal();openWithdrawHistory()" class="wd2-btn-ghost" style="margin-bottom:10px;">View History</button>
        <button onclick="closeWithdrawModal()" class="wd2-btn-primary" style="background:linear-gradient(135deg,#a855f7,#818cf8);color:#fff;box-shadow:0 4px 18px rgba(168,85,247,0.28);">Done</button>
      </div>

    </div><!-- /scrollable body -->
  </div><!-- /withdrawCard -->
</div><!-- /withdrawOverlay -->

<!-- KYC popup -->
<div id="wdKycOverlay" onclick="if(event.target===this)wdCloseKycPopup()" style="display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.85);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);align-items:center;justify-content:center;padding:20px;">
    <div style="background:linear-gradient(160deg,rgba(22,16,42,0.99),rgba(10,10,20,0.99));border:1px solid rgba(251,191,36,0.22);border-top-color:rgba(251,191,36,0.4);border-radius:22px;width:100%;max-width:360px;box-shadow:0 1px 0 rgba(251,191,36,0.1) inset,0 40px 100px rgba(0,0,0,0.95);animation:modalPop .25s cubic-bezier(0.34,1.2,0.64,1) both;padding:28px 24px;">
        <!-- icon -->
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(248,113,113,0.08));border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 0 30px rgba(251,191,36,0.15);">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3" y="6" width="20" height="15" rx="2.5" stroke="#fbbf24" stroke-width="1.6"/><circle cx="9" cy="12" r="2.5" stroke="#fbbf24" stroke-width="1.4"/><path d="M14 11h5M14 13.5h3" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/><path d="M3 17l4-2 3 1.5" stroke="rgba(251,191,36,0.45)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="text-align:center;margin-bottom:18px;">
            <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;letter-spacing:-.03em;color:#fff;margin-bottom:6px;">Identity Verification</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">Withdrawals of <strong style="color:#fbbf24;">$50 or more</strong> require KYC verification to comply with anti-money laundering regulations.</div>
        </div>
        <!-- steps -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:14px;margin-bottom:18px;">
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
                <div style="width:22px;height:22px;border-radius:999px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:10px;font-weight:800;color:#fbbf24;">1</div>
                <div><div style="font-size:12px;font-weight:700;color:#fff;">Government-issued ID</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:1px;">Passport, driver's license, or national ID</div></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
                <div style="width:22px;height:22px;border-radius:999px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:10px;font-weight:800;color:#fbbf24;">2</div>
                <div><div style="font-size:12px;font-weight:700;color:#fff;">Selfie verification</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:1px;">Photo with ID for liveness check</div></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <div style="width:22px;height:22px;border-radius:999px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:10px;font-weight:800;color:#fbbf24;">3</div>
                <div><div style="font-size:12px;font-weight:700;color:#fff;">Review (up to 24h)</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:1px;">Once approved, withdrawals unlock permanently</div></div>
            </div>
        </div>
        <button onclick="wdCloseKycPopup();(typeof window.showCustomAlert==='function'?window.showCustomAlert:alert)('KYC flow would open here — integrate your KYC provider.')" style="width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,rgba(251,191,36,0.9),rgba(248,113,113,0.8));border:none;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#0a0a0f;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 18px rgba(251,191,36,0.25);transition:opacity .15s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            Start Verification →
        </button>
        <button onclick="wdCloseKycPopup()" style="width:100%;padding:11px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);cursor:pointer;transition:background .15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            Maybe later
        </button>
    </div>
</div>

<!-- 
     WITHDRAWAL HISTORY MODAL
 -->
<div id="wdHistoryOverlay" onclick="if(event.target===this)closeWithdrawHistory()" class="popup-overlay" style="z-index:99998;">
    <div class="popup-card" style="max-width:420px;">
        <!-- Sticky header -->
        <div class="popup-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(129,140,248,0.1));border:1px solid rgba(168,85,247,0.28);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg width="15" height="15" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#a855f7" stroke-width="1.1"/><path d="M4.5 6.5h4M6.5 4.5v4" stroke="#a855f7" stroke-width="1" stroke-linecap="round"/></svg>
                </div>
                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;letter-spacing:-.03em;color:var(--text);">Withdrawal History</div>
            </div>
            <div onclick="closeWithdrawHistory()" style="width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,0.16);flex-shrink:0;">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
        </div>
        <!-- Scrollable body -->
        <div class="popup-card-body" style="padding:18px 22px 28px;">
            <div id="wdHistoryList"></div>
        </div>
    </div>
</div>

<!--  WITHDRAW HISTORY CTA in account section  -->










<!-- 
     SYSTEM MODALS — Maintenance · Banned · Admin Controls
     These are fullscreen overlays that sit above everything (z:99999).
     Admin is immune — none of these ever show to the admin account.
     Admin sees the control panel pill in the top-right corner instead.
 -->

<!--  MAINTENANCE MODAL  -->
<div id="sysMaintenanceOverlay" style="
    display:none; position:fixed; inset:0; z-index:99999;
    background:#070710;
    flex-direction:column; align-items:center; justify-content:center;
    padding:32px 20px; text-align:center;
    overflow:hidden;
">
    <!-- animated bg glow -->
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
        <div style="position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(ellipse,rgba(168,85,247,0.12) 0%,transparent 70%);animation:sysGlowPulse 4s ease-in-out infinite;"></div>
    </div>
    <div style="position:relative;z-index:1;max-width:420px;width:100%;">
        <!-- spinner -->
        <div style="display:flex;justify-content:center;margin-bottom:28px;">
            <svg width="56" height="56" viewBox="0 0 56 56" style="animation:sysSpin 1.8s linear infinite;">
                <circle cx="28" cy="28" r="22" stroke="rgba(168,85,247,0.18)" stroke-width="3" fill="none"/>
                <path d="M28 6 a22 22 0 0 1 22 22" stroke="url(#sysSpinGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>
                <defs><linearGradient id="sysSpinGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#818cf8"/></linearGradient></defs>
            </svg>
        </div>
        <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#ede9ff;letter-spacing:-.03em;margin-bottom:10px;">
            Down for Maintenance
        </div>
        <p id="sysMaintenanceMsg" style="font-size:14px;color:#8b8aa8;line-height:1.7;margin-bottom:28px;">
            We're making some improvements. We'll be back shortly.
        </p>
        <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.18);border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:20px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="8" cy="8" r="6.5" stroke="#a855f7" stroke-width="1.2"/><path d="M8 5v3.5l2 1.5" stroke="#a855f7" stroke-width="1.2" stroke-linecap="round"/></svg>
            <span style="font-size:12px;color:#b8b3d8;line-height:1.5;" id="sysMaintenanceEta">Estimated time: check back soon</span>
        </div>
        <!-- admin-only close button — hidden from users, shown below via JS -->
        <button id="sysMaintenanceCloseBtn" onclick="closeMaintenance()" style="
            display:none;
            margin-top:8px; padding:12px 28px;
            background:linear-gradient(135deg,#a855f7,#818cf8);
            border:none; border-radius:12px; color:#fff;
            font-family:'Syne',sans-serif; font-size:13px; font-weight:700;
            cursor:pointer; letter-spacing:.02em;
            box-shadow:0 4px 18px rgba(168,85,247,0.4);
            transition:opacity .15s;
        " onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            Close Maintenance (Admin)
        </button>
    </div>
</div>

<!--  BANNED / TERMINATED MODAL  -->
<div id="sysBannedOverlay" style="
    display:none; position:fixed; inset:0; z-index:99999;
    background:#070710;
    flex-direction:column; align-items:center; justify-content:center;
    padding:32px 20px; text-align:center;
    overflow:hidden;
">
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
        <div style="position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(ellipse,rgba(248,113,113,0.1) 0%,transparent 70%);"></div>
    </div>
    <div style="position:relative;z-index:1;max-width:440px;width:100%;">
        <!-- icon -->
        <div style="display:flex;justify-content:center;margin-bottom:22px;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(248,113,113,0.1);border:1.5px solid rgba(248,113,113,0.3);display:flex;align-items:center;justify-content:center;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f87171" stroke-width="1.6"/><path d="M12 8v5" stroke="#f87171" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="#f87171"/></svg>
            </div>
        </div>
        <div id="sysBannedTitle" style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fef2f2;letter-spacing:-.03em;margin-bottom:8px;">
            Account Terminated
        </div>
        <p id="sysBannedMsg" style="font-size:13px;color:#8b8aa8;line-height:1.75;margin-bottom:24px;max-width:360px;margin-left:auto;margin-right:auto;">
            Your account has been terminated for a violation of our Terms of Service. If you believe this is a mistake, you may submit an appeal.
        </p>
        <!-- reason chip -->
        <div id="sysBannedReasonWrap" style="display:none;margin-bottom:20px;">
            <div style="display:inline-flex;align-items:center;gap:7px;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:8px 14px;">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/></svg>
                <span id="sysBannedReason" style="font-size:11px;font-weight:700;color:#fca5a5;letter-spacing:.02em;"></span>
            </div>
        </div>
        <!-- appeal section -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px 18px 16px;margin-bottom:16px;text-align:left;">
            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#ede9ff;margin-bottom:6px;">Appeal this decision</div>
            <p style="font-size:11px;color:#6b6890;line-height:1.65;margin-bottom:12px;">Describe why you believe this action was made in error. Appeals are reviewed by our team within 1–3 business days.</p>
            <textarea id="sysBannedAppealText" placeholder="Explain your appeal…" style="
                width:100%; min-height:80px; resize:vertical;
                background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
                border-radius:10px; padding:10px 12px;
                font-family:'DM Sans',sans-serif; font-size:12px; color:#ede9ff;
                outline:none; transition:border-color .2s; line-height:1.6;
                -webkit-user-select:text; user-select:text;
            " onfocus="this.style.borderColor='rgba(168,85,247,0.4)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'"></textarea>
            <div style="display:flex;align-items:center;gap:10px;margin-top:10px;">
                <button id="sysBannedAppealBtn" onclick="submitBanAppeal()" style="
                    flex:1; padding:11px 18px;
                    background:linear-gradient(135deg,rgba(168,85,247,0.9),rgba(129,140,248,0.8));
                    border:none; border-radius:10px; color:#fff;
                    font-family:'Syne',sans-serif; font-size:12px; font-weight:700;
                    cursor:pointer; transition:opacity .15s;
                    box-shadow:0 3px 12px rgba(168,85,247,0.3);
                " onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                    Submit Appeal
                </button>
                <div id="sysBannedAppealStatus" style="font-size:11px;color:#6b6890;"></div>
            </div>
        </div>
        <p style="font-size:11px;color:#4a4868;">
            Questions? Email <a id="cancelSupportLink" href="mailto:support@siterifty.com" style="color:#8b8aa8;text-decoration:underline;">support@siterifty.com</a>
        </p>
    </div>
</div>



    

<!-- ════════ DONATE MODAL ════════ -->
<div class="donate-modal-overlay" id="homeDonateModal" onclick="if(event.target===this) closeDonateModal()">
    <div class="donate-modal-card">
        <div class="donate-modal-head">
            <div class="donate-modal-title">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="color:#30d158;"><path d="M3 10h14M11 4l6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Send a donation
            </div>
            <button class="donate-modal-close" onclick="closeDonateModal()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
        </div>
        <div class="donate-modal-sub">Send money from your wallet balance directly to <strong id="homeDonateTargetName">this seller</strong>.</div>

        <div class="donate-modal-recipient">
            <div class="donate-modal-rec-pic" id="homeDonateRecipientPic"></div>
            <div class="donate-modal-rec-info">
                <span class="donate-modal-rec-label">To</span>
                <span class="donate-modal-rec-name" id="homeDonateRecipientName">—</span>
            </div>
        </div>

        <div class="donate-modal-balance-row">
            <span class="donate-modal-balance-label">
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style="color:#30d158;"><rect x="1.5" y="4.5" width="15" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 7.5h15" stroke="currentColor" stroke-width="1.4"/><circle cx="13" cy="11.5" r="1" fill="currentColor"/></svg>
                Your wallet balance
            </span>
            <span class="donate-modal-balance-amount" id="homeDonateYourBalance">$0.00</span>
        </div>

        <div class="donate-modal-label" style="margin-top:14px;">Amount to send</div>
        <div class="donate-modal-input-row">
            <span class="donate-modal-currency">$</span>
            <input type="number" id="homeDonateAmountInput" inputmode="decimal" min="1" max="999" step="0.01" placeholder="0.00" oninput="homeUpdateDonatePreview()">
        </div>
        <div class="donate-modal-fee-breakdown">
            <div class="donate-modal-fee-row"><span>Platform fee (3% + $0.49)</span><span id="homeDonateFeeAmount">$0.00</span></div>
            <div class="donate-modal-fee-row total"><span id="homeDonateRecipientLabel">Seller receives</span><span id="homeDonateRecipientAmount">$0.00</span></div>
        </div>
        <div class="donate-modal-error" id="homeDonateError"></div>
        <div class="donate-modal-limits-note">Minimum $1.00 · Maximum $999.00 per transaction</div>

        <div class="donate-modal-actions">
            <button class="donate-modal-btn donate-modal-btn-cancel" onclick="closeDonateModal()">Cancel</button>
            <button class="donate-modal-btn donate-modal-btn-submit" id="homeSubmitDonateBtn" onclick="homeSubmitDonation()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12.5s-5-3.1-5-6.6A2.9 2.9 0 0 1 7 4.2 2.9 2.9 0 0 1 12 5.9c0 3.5-5 6.6-5 6.6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
                Send donation
            </button>
        </div>
    </div>
</div>

<!-- DONATE SUCCESS OVERLAY -->
<div class="donate-success-overlay" id="homeDonateSuccessOverlay">
    <div class="donate-success-backdrop"></div>
    <div class="donate-success-particles" id="homeDonateParticles"></div>
    <div class="donate-success-card">
        <div class="donate-success-tick-ring">
            <svg class="donate-success-tick-svg" viewBox="0 0 38 38" fill="none">
                <path class="d-tick-path" d="M8 20l7 7 15-15" stroke="#2dd4a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="donate-success-title">Donation sent!</div>
        <div class="donate-success-sub" id="homeDonateSuccessSub">Your funds are on their way.</div>
        <div class="donate-success-bar-wrap"><div class="donate-success-bar"></div></div>
    </div>
</div>



<!-- ── GitHub Connection Overlay ── -->


<div id="ghConnectOverlay" role="dialog" aria-modal="true">
  <div class="gh-connect-card">
    <button class="gh-connect-close" onclick="ghConnectClose()" aria-label="Close">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <div class="gh-connect-icon" id="ghConnectIcon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(48,209,88,0.9)"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
    </div>
    <div class="gh-connect-spinner" id="ghConnectSpinner"></div>
    <div class="gh-connect-title" id="ghConnectTitle">Connecting GitHub…</div>
    <p class="gh-connect-sub" id="ghConnectSub">Authorizing with GitHub, please wait.</p>
  </div>
</div>





<!-- ══════════════════════════════════════════════════════
     AVATAR PICKER MODAL (shown after email signup)
══════════════════════════════════════════════════════ -->
<div id="avatarPickerOverlay" style="display:none!important;">


<div class="avp-wrap">
    <div class="avp-card">
        <!-- Avatar strip -->
        <div class="avp-scroll" id="avpStrip"></div>

        <!-- Username -->
        <div class="avp-field">
            <div class="avp-uname-wrap">
                <span class="avp-at">@</span>
                <input id="avpUsername" maxlength="20" placeholder="username" autocomplete="off" spellcheck="false"
                    oninput="this.value=this.value.replace(/[@\\s]/g,'').slice(0,20);var p=document.getElementById('avpPreviewName');if(p)p.textContent=this.value?'@'+this.value:'@username';">
            </div>
        </div>

        <!-- Bio -->
        <div class="avp-field">
            <textarea class="avp-textarea" id="avpBio" maxlength="500" placeholder="Write something about yourself…"
                oninput="var p=document.getElementById('avpPreviewUser');if(p)p.textContent=this.value||'bio not set';"></textarea>
        </div>

        <div class="avp-actions">
            <button class="avp-btn avp-btn-save" id="avpConfirmBtn" onclick="window._avpConfirm()">Save</button>
        </div>
    </div>

    <!-- Preview -->
    <div class="avp-preview">
        <img id="avpPreviewImg" src="" alt="avatar">
        <div class="avp-preview-text">
            <div class="avp-preview-name" id="avpPreviewName">@username</div>
            <div class="avp-preview-user" id="avpPreviewUser">bio not set</div>
        </div>
    </div>
</div>
</div>

<!-- ══ UNIFIED PROFILE SETUP MODAL ══ -->
<div id="profileSetupOverlay" style="display:none;position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,0.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);align-items:center;justify-content:center;padding:20px;overflow-y:auto;">

<div class="pso-wrap">
    <div class="pso-card" id="psoCard">
        <!-- Avatar strip -->
        <div class="pso-scroll" id="psoAvatarStrip"></div>
        <!-- Username — required, 50% width, centered on the card -->
        <div class="pso-field pso-field-username">
            <div class="pso-uname-wrap">
                <span class="pso-at">@</span>
                <input id="psoUsername" maxlength="20" placeholder="username" autocomplete="off" spellcheck="false" required
                    oninput="this.value=this.value.replace(/[@\\s]/g,'').slice(0,20);var p=document.getElementById('psoPreviewName');if(p)p.textContent=this.value?'@'+this.value:'@username';">
            </div>
        </div>
        <!-- Email — locked + prefilled when the auth method supplied one (manual signup, Google); editable when it didn't (e.g. GitHub with no public email) -->
        <div class="pso-field">
            <input id="psoEmail" class="pso-input" type="email" placeholder="you@example.com" autocomplete="email"
                oninput="var p=document.getElementById('psoPreviewUser');if(p)p.textContent=this.value||'email not set';">
        </div>
        <!-- Bio — required, 20–500 characters -->
        <div class="pso-field">
            <textarea id="psoBio" class="pso-textarea" maxlength="500" placeholder="Write something about yourself… (min 20 characters)" required
                oninput="var p=document.getElementById('psoPreviewUser');if(p)p.textContent=this.value||'bio not set'; var h=document.getElementById('psoBioHint'); if(h){ var n=this.value.length; h.textContent=n+'/500'; h.classList.toggle('warn', n>0 && n<20); }"></textarea>
            <div class="pso-hint" id="psoBioHint">0/500 (min 20)</div>
        </div>
        <div id="psoErr" class="pso-err"></div>
        <div class="pso-actions">
            <button class="pso-btn pso-btn-save" id="psoSubmitBtn" onclick="window._psoSubmit()">Save</button>
        </div>
    </div>
    <!-- Preview -->
    <div class="pso-preview" id="psoPreviewCard">
        <img id="psoPreviewImg" src="https://i.pravatar.cc/150?img=120" alt="avatar">
        <div class="pso-preview-text">
            <div class="pso-preview-name" id="psoPreviewName">@username</div>
            <div class="pso-preview-user" id="psoPreviewUser">email not set</div>
        </div>
    </div>
</div>
</div>

<!-- ══════════════════════════════════════════════════════
     THEME PICKER MODAL (shown after the tour)
     Grid of background "theme" images. Skip → random theme.
══════════════════════════════════════════════════════ -->
<div id="themePickerOverlay" style="display:none;position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.85);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);align-items:center;justify-content:center;padding:20px;">

<div class="tpk-card">
    <div class="tpk-header">
        <div class="tpk-title">Pick a theme</div>
        <div class="tpk-sub">Choose a background to make Siterifty feel like yours. You can change it anytime in Settings.</div>
    </div>
    <div class="tpk-body">
        <div class="tpk-grid" id="tpkGrid"></div>
    </div>
    <div class="tpk-footer">
        <button class="tpk-btn" id="tpkConfirmBtn" onclick="window._tpkConfirm()">Use this theme →</button>
    </div>
</div>
</div>

<!-- ══════════════════════════════════════════════════════
     SOCIAL PROFILE SETUP MODAL (Google/GitHub new users)
══════════════════════════════════════════════════════ -->
<div id="socialProfileOverlay" style="display:none!important;">


<div class="spo-wrap">
    <div class="spo-card">
        <!-- Avatar strip -->
        <div class="spo-scroll" id="spoAvatarStrip"></div>

        <!-- Username -->
        <div class="spo-field">
            <div class="spo-uname-wrap">
                <span class="spo-at">@</span>
                <input id="spoUsername" maxlength="20" placeholder="username" autocomplete="off" spellcheck="false"
                    oninput="this.value=this.value.replace(/[@\\s]/g,'').slice(0,20);var p=document.getElementById('spoPreviewName');if(p)p.textContent=this.value?'@'+this.value:'@username';">
            </div>
        </div>

        <!-- Email -->
        <div class="spo-field" id="spoEmailField">
            <input id="spoEmail" class="spo-input" type="email" placeholder="you@example.com" autocomplete="email"
                oninput="var p=document.getElementById('spoPreviewUser');if(p)p.textContent=this.value||'email not set';">
        </div>

        <!-- Bio -->
        <div class="spo-field">
            <textarea id="spoBio" class="spo-textarea" maxlength="500" placeholder="Write something about yourself…"
                oninput="var p=document.getElementById('spoPreviewUser');if(p)p.textContent=this.value||'bio not set';"></textarea>
        </div>

        <div id="spoErr" class="spo-err"></div>

        <div class="spo-actions">
            <button class="spo-btn spo-btn-save" id="spoSubmitBtn" onclick="window._spoSubmit()">Save</button>
        </div>
    </div>

    <!-- Preview -->
    <div class="spo-preview">
        <img id="spoPreviewImg" src="https://i.pravatar.cc/150?img=120" alt="avatar">
        <div class="spo-preview-text">
            <div class="spo-preview-name" id="spoPreviewName">@username</div>
            <div class="spo-preview-user" id="spoPreviewUser">bio not set</div>
        </div>
    </div>
</div>
</div>



`
      }}
    />
  );
}
