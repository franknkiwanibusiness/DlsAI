// Pre-hero legacy block: loading screen, bg layer, auth/ban modals, etc.
// Sourced from index-remaining.html lines 373-589.
// Rendered server-side; scripts run via layout.js's next/script tags.
export default function PreHero() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `<!-- Global background image layer — controlled by Design panel -->
<div id="srBgLayer" style="position:fixed;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .5s ease;"></div>

<!-- ══════════════════════════════════════════════════════════════════
     EAGER IMAGE PRELOADER + localStorage CACHE
     Same handful of background/avatar images are reused everywhere
     (auth modal, profile setup, theme picker, dashboard, chat, wallet…)
     so instead of waiting for a user to scroll a section into view,
     we kick off loading ALL of them the moment the tab opens and keep
     a cache that survives reloads. localStorage caps out around 5MB —
     plenty here since it's a small, shared, reused image set rather
     than per-listing photos.
══════════════════════════════════════════════════════════════════ -->


    <!--  LOADING SCREEN  -->
    <div id="loadingScreen">
        

        <!-- Nav skeleton -->
        <div class="sk-nav">
            <div class="skel skel-r" style="width:80px;height:14px;animation-delay:0s;"></div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div class="skel skel-r" style="width:52px;height:28px;animation-delay:.1s;"></div>
                <div class="skel skel-r" style="width:28px;height:28px;animation-delay:.15s;"></div>
            </div>
        </div>

        <div class="sk-body">

            <!-- Hero text block -->
            <div style="padding-top:8px;display:flex;flex-direction:column;gap:10px;">
                <div class="skel skel-r" style="width:72px;height:18px;animation-delay:.05s;"></div>
                <div class="skel" style="width:92%;height:34px;border-radius:8px;animation-delay:.1s;"></div>
                <div class="skel" style="width:78%;height:34px;border-radius:8px;animation-delay:.15s;"></div>
                <div class="skel" style="width:60%;height:18px;border-radius:6px;animation-delay:.2s;margin-top:2px;"></div>
                <!-- CTA buttons -->
                <div style="display:flex;gap:10px;margin-top:4px;">
                    <div class="skel skel-r" style="flex:1;height:42px;animation-delay:.25s;"></div>
                    <div class="skel skel-r" style="flex:1;height:42px;animation-delay:.3s;"></div>
                </div>
            </div>

            <!-- Section label -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                <div class="skel skel-r" style="width:100px;height:12px;animation-delay:.2s;"></div>
                <div class="skel skel-r" style="width:52px;height:12px;animation-delay:.25s;"></div>
            </div>

            <!-- Listing cards -->
            <div style="display:flex;flex-direction:column;gap:10px;">

                <!-- Card 1 -->
                <div style="background:rgba(168,255,107,0.03);border:1px solid rgba(168,255,107,0.07);border-radius:14px;overflow:hidden;">
                    <div class="skel" style="width:100%;height:120px;border-radius:0;animation-delay:.15s;"></div>
                    <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
                        <div class="skel" style="width:70%;height:13px;animation-delay:.2s;"></div>
                        <div class="skel" style="width:45%;height:11px;animation-delay:.25s;"></div>
                        <div style="display:flex;gap:6px;margin-top:2px;">
                            <div class="skel skel-r" style="width:54px;height:20px;animation-delay:.3s;"></div>
                            <div class="skel skel-r" style="width:54px;height:20px;animation-delay:.35s;"></div>
                        </div>
                    </div>
                </div>

                <!-- Card 2 -->
                <div style="background:rgba(168,255,107,0.03);border:1px solid rgba(168,255,107,0.07);border-radius:14px;overflow:hidden;">
                    <div class="skel" style="width:100%;height:120px;border-radius:0;animation-delay:.25s;"></div>
                    <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
                        <div class="skel" style="width:62%;height:13px;animation-delay:.3s;"></div>
                        <div class="skel" style="width:38%;height:11px;animation-delay:.35s;"></div>
                        <div style="display:flex;gap:6px;margin-top:2px;">
                            <div class="skel skel-r" style="width:54px;height:20px;animation-delay:.4s;"></div>
                            <div class="skel skel-r" style="width:54px;height:20px;animation-delay:.45s;"></div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom tab bar skeleton -->
            <div style="position:fixed;bottom:0;left:0;right:0;height:58px;background:rgba(168,255,107,0.02);border-top:1px solid rgba(168,255,107,0.07);display:flex;align-items:center;justify-content:space-around;padding:0 8px;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                    <div class="skel skel-r" style="width:20px;height:20px;animation-delay:.1s;"></div>
                    <div class="skel skel-r" style="width:28px;height:8px;animation-delay:.15s;"></div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                    <div class="skel skel-r" style="width:20px;height:20px;animation-delay:.2s;"></div>
                    <div class="skel skel-r" style="width:28px;height:8px;animation-delay:.25s;"></div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                    <div class="skel skel-r" style="width:20px;height:20px;animation-delay:.3s;"></div>
                    <div class="skel skel-r" style="width:28px;height:8px;animation-delay:.35s;"></div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                    <div class="skel skel-r" style="width:20px;height:20px;animation-delay:.4s;"></div>
                    <div class="skel skel-r" style="width:28px;height:8px;animation-delay:.45s;"></div>
                </div>
            </div>

        </div>

        <!-- Hidden progress bar — keeps JS working, invisible to user -->
        <div style="display:none;">
            <div id="loaderProgress"></div>
            <span id="loaderPct"></span>
            <span id="loaderText"></span>
        </div>
    </div>

    


    <!--  HEADER  -->
    <header>
        <!-- LEFT: spinning logo + wordmark -->
        <a href="/" aria-label="Siterifty — home" class="header-logo-link">
            <!-- Logo mark — clean spinning ring monogram -->
            <div class="logo-icon-wrap">
                <div class="logo-icon-inner">
                    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                        <circle class="logo-spin-ring" cx="15" cy="15" r="12.5" fill="none" stroke="url(#hsg)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="56 22"/>
                        <text x="15" y="15" text-anchor="middle" dominant-baseline="central" font-family="'Syne', sans-serif" font-weight="800" font-size="13" fill="#fff">S</text>
                        <defs><linearGradient id="hsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>
                    </svg>
                </div>
            </div>
            <span class="wordmark">Siterifty<span class="wordmark-suffix">.com</span></span>
        </a>

        <!-- RIGHT: wallet + username + avatar -->
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <!-- Wallet pill -->
            <div class="credit-pill" id="walletPill" onclick="openWalletModal()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="3" width="10" height="7.5" rx="1.5" stroke="rgba(168,85,247,0.8)" stroke-width="1.1"/>
                    <path d="M1 5.5h10" stroke="rgba(168,85,247,0.8)" stroke-width="1.1"/>
                    <circle cx="8.5" cy="7.5" r="1" fill="rgba(168,85,247,0.8)"/>
                </svg>
                <span class="credit-label">Balance</span>
                <div class="credit-divider"></div>
                <span class="credit-amount skel" id="walletPillAmount">&nbsp;</span>
            </div>

            <!-- Username chip — hidden until logged in -->
            <div id="headerUserChip" style="display:none;align-items:center;gap:5px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:5px 11px 5px 8px;cursor:pointer;transition:background .18s,border-color .18s,box-shadow .18s;" onclick="openDash && openDash()" onmouseover="this.style.background='rgba(168,85,247,0.1)';this.style.borderColor='rgba(168,85,247,0.3)';this.style.boxShadow='0 0 12px rgba(168,85,247,0.18)'" onmouseout="this.style.background='rgba(255,255,255,0.045)';this.style.borderColor='rgba(255,255,255,0.08)';this.style.boxShadow='none'">
                <div id="headerUserDot" style="width:5px;height:5px;border-radius:50%;background:#34d399;flex-shrink:0;box-shadow:0 0 6px rgba(52,211,153,0.7);"></div>
                <span id="headerUserName" style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:-.01em;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;"></span>
            </div>

            <!-- Sign-in button (guest) / Avatar (logged in) -->
            <div class="header-signin-btn" id="avatarBtn" onclick="openAuthModal()" title="Sign in">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" id="avatarGuestIcon">
                    <circle cx="6" cy="4" r="2" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M1.5 11c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <span>Sign in</span>
            </div>
        </div>
    </header>

    <!--  ANNOUNCEMENT BAR  -->
    <!-- df:a7x9m2k4p1 -->
    <div id="billingBanner">
        <div class="ann-inner">
            <!-- LEFT: user status + plan badge -->
            <div class="ann-left">
                <span class="ann-dot" id="annDot"></span>
                <span id="annUsername" class="ann-username not-logged skel">&nbsp;</span>
                <span class="ann-sep" id="annSep" style="display:none"></span>
                <span id="annPlanBadge" class="ann-plan-badge plan-free skel">&nbsp;</span>
            </div>
            <!-- RIGHT: upgrade or dashboard button -->
            <div class="ann-right">
                <a id="annUpgradeBtn" href="#" onclick="if(window._fbAuth&&window._fbAuth.currentUser){(typeof openPlansPickerModal==='function'?openPlansPickerModal():typeof openUpgradeModal==='function'&&openUpgradeModal('starter'));}else{typeof openAuthModal==='function'&&openAuthModal();} return false;" class="ann-upgrade-btn">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z" fill="currentColor"/></svg>
                    Upgrade
                </a>
                <a id="annDashboardBtn" href="/dashboard?ref=a7x9m2k4p1" class="ann-dashboard-btn" style="display:none;">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    View Dashboard
                </a>
            </div>
        </div>
    </div>

    <!--  CANCEL PLAN MODAL  -->
    <div id="cancelPlanOverlay" class="popup-overlay" style="z-index:10000;">
        <div id="cancelPlanModal" class="popup-card" style="border-color:rgba(248,113,113,0.2);">
            <!-- Sticky header -->
            <div class="popup-card-header" style="display:flex;align-items:center;justify-content:space-between;">
                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#f1f0ff;letter-spacing:-.02em;">Cancel Plan</div>
                <button onclick="closeCancelPlanModal()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;width:30px;height:30px;color:var(--muted);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </div>
            <!-- Scrollable body -->
            <div class="popup-card-body" style="padding:24px;">
            <!-- Icon -->
            <div style="width:52px;height:52px;border-radius:14px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#f87171" stroke-width="1.4"/><path d="M11 7v4M11 14v.5" stroke="#f87171" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
            <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#f1f0ff;margin-bottom:6px;">Cancel your plan?</div>
            <div id="cancelPlanSubtext" style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:18px;">Your plan will remain active until the end of your current billing period. After that your account reverts to Free.</div>
            <!-- What you lose -->
            <div style="background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.15);border-radius:12px;padding:12px 14px;margin-bottom:20px;">
                <div style="font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#f87171;margin-bottom:8px;">You will lose access to</div>
                <div id="cancelPlanLoseList" style="display:flex;flex-direction:column;gap:5px;"></div>
            </div>
            <div style="display:flex;gap:8px;">
                <button onclick="closeCancelPlanModal()" style="flex:1;padding:11px;border-radius:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--text);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">Keep plan</button>
                <button id="cancelPlanConfirmBtn" onclick="confirmCancelPlan()" style="flex:1;padding:11px;border-radius:11px;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);color:#f87171;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;" onmouseover="this.style.background='rgba(248,113,113,0.2)'" onmouseout="this.style.background='rgba(248,113,113,0.12)'">Yes, cancel</button>
            </div>
            </div><!-- end popup-card-body -->
        </div>
    </div>

`
      }}
    />
  );
}
