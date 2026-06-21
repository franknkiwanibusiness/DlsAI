// Siterifty — Firebase module script (extracted, kept as ES module due to import statements)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
        import { getDatabase, ref, set, get, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
        import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
        import {
            getAuth,
            createUserWithEmailAndPassword,
            signInWithEmailAndPassword,
            sendPasswordResetEmail,
            signOut,
            onAuthStateChanged,
            updatePassword,
            GoogleAuthProvider,
            GithubAuthProvider,
            signInWithPopup
        } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
            authDomain: "itzhoyoo-f9f7e.firebaseapp.com",
            databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
            projectId: "itzhoyoo-f9f7e",
            storageBucket: "itzhoyoo-f9f7e.filestorage.app",
            messagingSenderId: "1094792075584",
            appId: "1:1094792075584:web:d49e9c3f899d3cd31082a5"
        };

        const app     = initializeApp(firebaseConfig);
        const db      = getDatabase(app);
        const auth    = getAuth(app);
        const storage = getStorage(app);

        //  Global bridge for non-module scripts (featured listings, activity feed, etc.) 
        window._fbDb      = db;
        window._fbAuth    = auth;
        window._fbStorage = storage;
        window._fbStorageFns = { storageRef, uploadBytes, getDownloadURL };
        window._fbDbFns = { ref, get, set, update, onValue, push, remove };
        window._fbSDK  = { onValue };  // used by realtime plan listener
        window._fb = function() { return { db: window._fbDb, ref: window._fbDbFns.ref, get: window._fbDbFns.get, set: window._fbDbFns.set, update: window._fbDbFns.update, onValue: window._fbDbFns.onValue }; };
        //  Expose primitives so plain <script> blocks can call Firebase 
        window._db     = db;
        window._auth   = auth;
        window._ref    = ref;
        window._get    = get;
        window._set    = set;
        window._update = update;
        window._onValue = onValue;

        // NOTE: _fbCreditWallet intentionally removed.
        // Balance credits happen exclusively via /api/wallet/topup (server-verified).
        // The client UI is updated from the server response — never from a local write.

        //  helpers 
        function $(id){ return document.getElementById(id); }
        function showErr(id, msg){ const el=$(id); el.textContent=msg; el.style.display='block'; }
        function showOk(id, msg){ const el=$(id); el.textContent=msg; el.style.display='block'; }
        function hideMsg(...ids){ ids.forEach(id=>{ const el=$(id); if(el){el.style.display='none'; el.textContent='';} }); }
        function setBtn(id, text, disabled){ const b=$(id); b.textContent=text; b.disabled=disabled; }


        //  Scroll lock helpers — prevent background page scroll when any modal is open 
        // Uses the position:fixed technique so iOS Safari can't bleed scroll through.
        let _scrollLockCount = 0;
        let _scrollLockY = 0;
        function lockBodyScroll() {
            if (_scrollLockCount === 0) {
                _scrollLockY = window.scrollY || window.pageYOffset || 0;
                document.body.style.position   = 'fixed';
                document.body.style.top        = '-' + _scrollLockY + 'px';
                document.body.style.left       = '0';
                document.body.style.right      = '0';
                document.body.style.overflow   = 'hidden';
                document.body.classList.add('modal-open');
            }
            _scrollLockCount++;
        }
        function unlockBodyScroll() {
            _scrollLockCount = Math.max(0, _scrollLockCount - 1);
            if (_scrollLockCount === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.position = '';
                document.body.style.top      = '';
                document.body.style.left     = '';
                document.body.style.right    = '';
                document.body.style.overflow = '';
                window.scrollTo({ top: _scrollLockY, behavior: 'instant' });
            }
        }
        // Expose globally for non-module scripts
        window._lockBodyScroll   = lockBodyScroll;
        window._unlockBodyScroll = unlockBodyScroll;

        // ── Custom alert/confirm — replaces all native browser popups ─────────────
        // Usage: await _sAlert('message')  or  await _sConfirm('message') → bool
        (function() {
            function _buildOverlay() {
                const ov = document.createElement('div');
                ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);opacity:0;transition:opacity .18s;';
                return ov;
            }
            function _buildCard(msg, buttons) {
                const card = document.createElement('div');
                card.style.cssText = 'background:#13121e;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px 24px 22px;max-width:340px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.7);transform:translateY(10px) scale(.97);transition:transform .2s,opacity .18s;font-family:"DM Sans",sans-serif;';
                const icon = document.createElement('div');
                icon.style.cssText = 'width:40px;height:40px;border-radius:12px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:14px;';
                icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#a855f7" stroke-width="1.5"/><path d="M12 8v4M12 15v1" stroke="#a855f7" stroke-width="1.6" stroke-linecap="round"/></svg>';
                const txt = document.createElement('div');
                txt.style.cssText = 'font-size:13.5px;color:#e2e0f5;line-height:1.65;margin-bottom:20px;';
                txt.innerHTML = msg;
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;gap:9px;justify-content:flex-end;';
                buttons.forEach(b => {
                    const btn = document.createElement('button');
                    btn.textContent = b.label;
                    btn.style.cssText = 'padding:9px 18px;border-radius:10px;font-family:"Syne",sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s;letter-spacing:.02em;' +
                        (b.primary
                            ? 'background:linear-gradient(135deg,#a855f7,#818cf8);border:1px solid transparent;color:#fff;'
                            : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(185,183,220,0.8);');
                    btn.onclick = b.onClick;
                    row.appendChild(btn);
                });
                card.appendChild(icon);
                card.appendChild(txt);
                card.appendChild(row);
                return card;
            }
            function _show(ov, card) {
                document.body.appendChild(ov);
                ov.appendChild(card);
                if (window._lockBodyScroll) window._lockBodyScroll();
                requestAnimationFrame(() => {
                    ov.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                });
            }
            function _hide(ov) {
                ov.style.opacity = '0';
                setTimeout(() => { ov.remove(); if (window._unlockBodyScroll) window._unlockBodyScroll(); }, 180);
            }

            window._sAlert = function(msg) {
                return new Promise(resolve => {
                    const ov   = _buildOverlay();
                    const card = _buildCard(msg, [{ label: 'OK', primary: true, onClick: () => { _hide(ov); resolve(); } }]);
                    _show(ov, card);
                    ov.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { _hide(ov); resolve(); } });
                    setTimeout(() => card.querySelector('button') && card.querySelector('button').focus(), 120);
                });
            };

            window._sConfirm = function(msg, okLabel, cancelLabel) {
                return new Promise(resolve => {
                    const ov   = _buildOverlay();
                    const card = _buildCard(msg, [
                        { label: cancelLabel || 'Cancel', primary: false, onClick: () => { _hide(ov); resolve(false); } },
                        { label: okLabel     || 'OK',     primary: true,  onClick: () => { _hide(ov); resolve(true);  } },
                    ]);
                    _show(ov, card);
                    ov.addEventListener('keydown', e => { if (e.key === 'Escape') { _hide(ov); resolve(false); } });
                    setTimeout(() => { const btns = card.querySelectorAll('button'); if (btns[1]) btns[1].focus(); }, 120);
                });
            };
        })();


        //  Loader gate 
        let _loaderReady = false;
        const _loaderQueue = [];
        window._onLoaderReady = function(cb) {
            if (_loaderReady) { cb(); return; }
            _loaderQueue.push(cb);
        };
        window._signalLoaderReady = function() {
            if (_loaderReady) return;
            _loaderReady = true;
            _loaderQueue.forEach(cb => cb());
            _loaderQueue.length = 0;
        };

        // Wrap openAuthModal, openWalletModal, openUpgradeModal with the gate.
        // We patch them after the real definitions are in place (end of this block).
        document.addEventListener('DOMContentLoaded', () => {
            ['openAuthModal', 'openWalletModal', 'openUpgradeModal', 'openTransferModal'].forEach(name => {
                const real = window[name];
                if (!real) return;
                window[name] = function(...args) {
                    window._onLoaderReady(() => real(...args));
                };
            });
        });

        //  panel switcher 
        window.showPanel = function(name){
            ['signup','login','forgot'].forEach(p=>{
                $('panel'+p.charAt(0).toUpperCase()+p.slice(1)).style.display = p===name ? 'block' : 'none';
            });
            var seg = $('authSegment');
            if (seg) {
                seg.style.display = (name === 'forgot') ? 'none' : 'flex';
                var su = $('segSignup'), li = $('segLogin');
                if (su && li) {
                    su.classList.toggle('active', name === 'signup');
                    li.classList.toggle('active', name === 'login');
                }
            }
        };

        //  open / close 
        window.openAuthModal = function(){
            if(auth.currentUser){ openDash(); return; }
            $('authModal').style.display='block';
            lockBodyScroll();
            showPanel('login');
        };
        window.closeAuthModal = function(){
            $('authModal').style.display='none';
            unlockBodyScroll();
        };
        function openDash(){
            $('authModal').style.display='none';
            $('dashModal').style.display='block';
            unlockBodyScroll();
            lockBodyScroll();
            const spinner = $('dashSpinner');
            if(spinner) {
                spinner.style.opacity = '';
                spinner.style.pointerEvents = '';
                spinner.classList.remove('hidden');
            }
            switchTab('plan');
            loadDash();
        }

        // ─── TOUR + WELCOME-BACK ────────────────────────────────────────────────
        // Called from doSignup (new) and doLogin / doGoogleAuth / doGithubAuth (returning).
        // New user  → show animated gamified tour instead of opening dash immediately.
        // Returning → if lastExitAt exists and was >30 min ago, show "What you missed".
        // Exit time is persisted to Firebase users/{uid}/lastExitAt on pagehide/visibilitychange.

        window._openDashWithFlow = async function(isNewUser, uid, username) {
            if (isNewUser) {
                // Double-check tourComplete flag — handles edge cases like re-login after completing tour
                let alreadyDone = false;
                try {
                    const snap = await get(ref(db, 'users/' + uid));
                    if (snap.exists() && snap.val().tourComplete) alreadyDone = true;
                } catch(_) {}

                if (alreadyDone) {
                    $('authModal').style.display = 'none';
                    unlockBodyScroll();
                } else {
                    _showTour(uid, username, () => {
                        const finishUp = () => {
                            $('authModal').style.display = 'none';
                            unlockBodyScroll();
                        };
                        if (window._openThemePicker) {
                            window._openThemePicker(() => finishUp());
                        } else {
                            finishUp();
                        }
                    });
                }
            } else {
                // Returning: close auth modal, land on homepage, then maybe show welcome-back
                $('authModal').style.display = 'none';
                unlockBodyScroll();
                try {
                    const snap = await get(ref(db, 'users/' + uid));
                    const data = snap.exists() ? snap.val() : {};
                    const lastExit = data.lastExitAt || 0;
                    const away = Date.now() - lastExit;
                    if (lastExit && away >= 30 * 60 * 1000) {
                        setTimeout(() => _showWelcomeBack(uid, username || data.username, lastExit), 700);
                    }
                } catch(_) {}
            }
        };

        // ── Track exit time in Firebase ─────────────────────────────────────────
        (function _attachExitTracker() {
            function _writeExit() {
                const u = auth && auth.currentUser;
                if (!u) return;
                try { update(ref(db, 'users/' + u.uid), { lastExitAt: Date.now() }); } catch(_) {}
            }
            window.addEventListener('pagehide', _writeExit);
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') _writeExit();
            });
        })();

        // ── Tour ────────────────────────────────────────────────────────────────
        function _showTour(uid, username, onDone) {
            // Remove any existing tour
            const old = document.getElementById('srTourOverlay');
            if (old) old.remove();

            const steps = [
                {
                    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#tg1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#818cf8"/></linearGradient></defs><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
                    badge: 'Welcome',
                    color: '#a855f7',
                    title: 'Hey ' + (username || 'there') + '! 👋',
                    body: 'You just joined <strong>Siterifty</strong> — the marketplace where indie hackers buy and sell websites, SaaS, and online businesses. Let\'s take 30 seconds to show you around.',
                    xp: '+10 XP — Account created',
                    cta: 'Let\'s go →',
                },
                {
                    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#tg2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="tg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#34d399"/></linearGradient></defs><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
                    badge: 'Browse',
                    color: '#38bdf8',
                    title: 'Discover live listings',
                    body: 'Browse <strong>hundreds of verified websites</strong> for sale — filter by price, revenue, traffic, and category. Find your next digital asset in minutes.',
                    xp: '+20 XP — Explorer unlocked',
                    cta: 'Got it →',
                },
                {
                    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#tg3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="tg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#f87171"/></linearGradient></defs><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 12h.01M12 12h4"/></svg>',
                    badge: 'Sell',
                    color: '#f59e0b',
                    title: 'List your site for free',
                    body: 'Got a side project collecting dust? <strong>List it in 2 minutes</strong> — free. Set your price, add your stats, and let thousands of qualified buyers find you.',
                    xp: '+30 XP — Seller badge ready',
                    cta: 'Awesome →',
                },
                {
                    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#tg4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="tg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h.01M11 15h2"/></svg>',
                    badge: 'Escrow',
                    color: '#34d399',
                    title: 'Safe deals, every time',
                    body: 'Every deal on Siterifty goes through <strong>secure escrow</strong>. Funds are held safely until both parties confirm transfer — no risk, no surprises.',
                    xp: '+40 XP — Trust badge unlocked',
                    cta: 'Nice →',
                },
                {
                    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#tg5)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="tg5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f87171"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                    badge: 'You\'re ready!',
                    color: '#f87171',
                    title: 'You\'re all set! 🎉',
                    body: 'Your account is fully set up. Explore listings, list your site for free, and close deals — the indie web is yours.',
                    xp: '+50 XP — Siterifty Explorer unlocked',
                    cta: null,
                    isLast: true,
                },
            ];

            let _step = 0;
            let _totalXp = 0;

            const overlay = document.createElement('div');
            overlay.id = 'srTourOverlay';
            overlay.innerHTML = `

<div id="srTourCard">
    <div class="sr-tour-confetti" id="srTourConfetti"></div>
    <div class="sr-tour-progress" id="srTourPips"></div>
    <div id="srTourBadge" class="sr-tour-badge"></div>
    <div class="sr-tour-icon" id="srTourIcon"></div>
    <div class="sr-tour-title" id="srTourTitle"></div>
    <div class="sr-tour-body" id="srTourBody"></div>
    <div class="sr-tour-xp" id="srTourXp">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span id="srTourXpText"></span>
    </div>
    <div class="sr-xp-bar-wrap">
        <div class="sr-xp-bar-label">
            <span>XP Progress</span>
            <span id="srXpBarNum">0 / 150 XP</span>
        </div>
        <div class="sr-xp-bar-track">
            <div class="sr-xp-bar-fill" id="srXpBarFill" style="width:0%"></div>
        </div>
    </div>
    <button class="sr-tour-btn" id="srTourBtn"></button>
    <div id="srTourLaunch" style="display:none;">
        <div style="border:1px solid rgba(248,113,113,0.2);border-radius:16px;padding:16px;margin-bottom:14px;background:rgba(248,113,113,0.05);text-align:center;">
            <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(248,113,113,0.7);margin-bottom:10px;">Ready to explore?</div>
            <button onclick="document.getElementById('srTourOverlay')._launchDash()" style="width:100%;padding:15px;border-radius:13px;background:linear-gradient(135deg,#f87171,#a855f7);color:#fff;font-size:15px;font-weight:900;border:none;cursor:pointer;letter-spacing:.01em;box-shadow:0 10px 30px rgba(248,113,113,0.35);transition:opacity .18s,transform .18s;" onmouseover="this.style.opacity='.9';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1';this.style.transform='none'">
                Open my dashboard →
            </button>
            <div style="font-size:10.5px;color:rgba(255,255,255,0.25);margin-top:10px;">Tap whenever you're ready — no rush</div>
        </div>
    </div>
</div>`;

            document.body.appendChild(overlay);

            const card     = document.getElementById('srTourCard');
            const pipsEl   = document.getElementById('srTourPips');
            const badgeEl  = document.getElementById('srTourBadge');
            const iconEl   = document.getElementById('srTourIcon');
            const titleEl  = document.getElementById('srTourTitle');
            const bodyEl   = document.getElementById('srTourBody');
            const xpEl     = document.getElementById('srTourXp');
            const xpTextEl = document.getElementById('srTourXpText');
            const xpNumEl  = document.getElementById('srXpBarNum');
            const xpBarEl  = document.getElementById('srXpBarFill');
            const btnEl    = document.getElementById('srTourBtn');
            const confEl   = document.getElementById('srTourConfetti');

            const TOTAL_XP = 150;
            const xpPerStep = [10, 20, 30, 40, 50];

            // Build progress pips
            steps.forEach(function(_, i) {
                const pip = document.createElement('div');
                pip.className = 'sr-tour-pip';
                pip.id = 'srPip' + i;
                pipsEl.appendChild(pip);
            });

            function _spawnConfetti(color) {
                const colors = [color, '#a855f7', '#818cf8', '#38bdf8', '#34d399', '#f87171', '#fbbf24'];
                for (let i = 0; i < 22; i++) {
                    const p = document.createElement('div');
                    p.className = 'sr-confetti-piece';
                    p.style.left = Math.random() * 100 + '%';
                    p.style.background = colors[Math.floor(Math.random() * colors.length)];
                    p.style.animationDuration = (0.9 + Math.random() * 1.2) + 's';
                    p.style.animationDelay    = (Math.random() * 0.4) + 's';
                    p.style.width  = (5 + Math.random() * 7) + 'px';
                    p.style.height = (5 + Math.random() * 7) + 'px';
                    confEl.appendChild(p);
                    setTimeout(() => p.remove(), 2500);
                }
            }

            function _renderStep(i) {
                const s = steps[i];

                // Update CSS custom property for colour
                card.style.setProperty('--tour-color', s.color);

                // Update pip states
                steps.forEach(function(_, j) {
                    const pip = document.getElementById('srPip' + j);
                    if (!pip) return;
                    pip.className = 'sr-tour-pip' + (j < i ? ' done' : j === i ? ' active' : '');
                });

                // Badge
                badgeEl.textContent = s.badge;
                badgeEl.style.color = s.color;
                badgeEl.style.background = s.color + '18';
                badgeEl.style.borderColor = s.color + '35';

                // Icon
                iconEl.innerHTML = s.icon;
                iconEl.style.animation = 'none';
                void iconEl.offsetWidth; // reflow
                iconEl.style.animation = '';

                // Content
                titleEl.textContent = s.title;
                bodyEl.innerHTML    = s.body;

                // XP
                xpTextEl.textContent = s.xp;
                xpEl.style.color        = s.color;
                xpEl.style.background   = s.color + '15';
                xpEl.style.borderColor  = s.color + '30';

                // XP bar
                _totalXp = xpPerStep.slice(0, i + 1).reduce(function(a, b){ return a + b; }, 0);
                const pct = Math.min(100, Math.round((_totalXp / TOTAL_XP) * 100));
                setTimeout(function() {
                    xpBarEl.style.width = pct + '%';
                    xpNumEl.textContent = _totalXp + ' / ' + TOTAL_XP + ' XP';
                }, 120);

                // Button / launch card
                const launchEl = document.getElementById('srTourLaunch');
                if (s.isLast) {
                    btnEl.style.display = 'none';
                    if (launchEl) launchEl.style.display = 'block';
                } else {
                    btnEl.style.display = 'block';
                    if (launchEl) launchEl.style.display = 'none';
                    btnEl.textContent = s.cta;
                    btnEl.style.background = 'linear-gradient(135deg,' + s.color + ',#818cf8)';
                    btnEl.style.boxShadow  = '0 8px 24px ' + s.color + '45';
                    _startStepGate(s.cta, s.color);
                }

                // Step-in animation
                titleEl.classList.remove('sr-tour-step-enter');
                bodyEl.classList.remove('sr-tour-step-enter');
                void titleEl.offsetWidth;
                titleEl.classList.add('sr-tour-step-enter');
                bodyEl.classList.add('sr-tour-step-enter');

                if (i === steps.length - 1) _spawnConfetti(s.color);
            }

            function _startStepGate(ctaLabel, color) {
                btnEl.disabled = true;
                btnEl.style.opacity = '0.55';
                btnEl.style.cursor  = 'not-allowed';
                let secs = 3;
                btnEl.textContent = ctaLabel + ' (' + secs + ')';
                const iv = setInterval(function() {
                    secs--;
                    if (secs > 0) {
                        btnEl.textContent = ctaLabel + ' (' + secs + ')';
                    } else {
                        clearInterval(iv);
                        btnEl.textContent = ctaLabel;
                        btnEl.disabled = false;
                        btnEl.style.opacity = '1';
                        btnEl.style.cursor  = 'pointer';
                    }
                }, 1000);
            }

            function _advance() {
                if (_step < steps.length - 1) {
                    _step++;
                    _renderStep(_step);
                } else {
                    _finish();
                }
            }

            function _launch() {
                // Mark tour complete in Firebase
                try { update(ref(db, 'users/' + uid), { tourComplete: true, lastExitAt: 0 }); } catch(_) {}
                overlay.style.animation = 'srTourFadeIn .3s ease reverse forwards';
                setTimeout(function() { overlay.remove(); onDone(); }, 320);
            }

            // Expose launch to the inline button onclick
            overlay._launchDash = _launch;

            btnEl.addEventListener('click', _advance);

            _renderStep(0);
        }

        // ── Welcome Back modal ──────────────────────────────────────────────────
        async function _showWelcomeBack(uid, username, lastExitTs) {
            const old = document.getElementById('srWelcomeBackOverlay');
            if (old) old.remove();

            const awayMs   = Date.now() - lastExitTs;
            const awayMins = Math.floor(awayMs / 60000);
            const awayStr  = awayMins >= 1440
                ? Math.floor(awayMins / 1440) + (Math.floor(awayMins / 1440) === 1 ? ' day' : ' days')
                : awayMins >= 60
                ? Math.floor(awayMins / 60) + 'h ' + (awayMins % 60 > 0 ? (awayMins % 60) + 'm' : '')
                : awayMins + ' min';

            // Fetch "what you missed" — new global notifications since lastExitTs
            let missedItems = [];
            try {
                const fns = window._fbDbFns || {};
                if (fns.get && fns.ref) {
                    const snap = await fns.get(fns.ref(window._fbDb, 'notifications/global'));
                    if (snap && snap.exists && snap.exists()) {
                        snap.forEach(function(child) {
                            const v = child.val();
                            if (v && (v.createdAt || v.timestamp || 0) > lastExitTs) {
                                missedItems.push(v);
                            }
                        });
                    }
                }
            } catch(_) {}
            // Also count new personal notifications
            let newPersonal = 0;
            try {
                const fns = window._fbDbFns || {};
                if (fns.get && fns.ref) {
                    const snap = await fns.get(fns.ref(window._fbDb, 'notifications/' + uid));
                    if (snap && snap.exists && snap.exists()) {
                        snap.forEach(function(child) {
                            const v = child.val();
                            if (v && !v.read && (v.createdAt || v.timestamp || 0) > lastExitTs) newPersonal++;
                        });
                    }
                }
            } catch(_) {}

            const typeIcons = {
                sale   : '💰', offer: '🤝', payout: '💳',
                update : '📣', system: '⚙️', promo: '🎁',
                message: '💬', default: '🔔',
            };

            const overlay = document.createElement('div');
            overlay.id = 'srWelcomeBackOverlay';

            const missedHtml = missedItems.length === 0 && newPersonal === 0
                ? '<div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;padding:14px 0;">All quiet — no new activity while you were away.</div>'
                : (missedItems.slice(0, 4).map(function(m) {
                    const ic = typeIcons[m.type] || typeIcons.default;
                    const t  = m.title || 'Notification';
                    const b  = m.body  || m.message || '';
                    return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
                        + '<div style="font-size:16px;flex-shrink:0;margin-top:1px;">' + ic + '</div>'
                        + '<div><div style="font-size:12.5px;font-weight:700;color:#fff;margin-bottom:2px;">' + t + '</div>'
                        + '<div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;">' + b + '</div></div></div>';
                }).join('')
                + (newPersonal > 0 ? '<div style="font-size:11px;color:#a855f7;font-weight:700;margin-top:10px;">+ ' + newPersonal + ' personal notification' + (newPersonal > 1 ? 's' : '') + ' waiting in your inbox</div>' : '')
                + (missedItems.length > 4 ? '<div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">+ ' + (missedItems.length - 4) + ' more in Notifications</div>' : ''));

            overlay.innerHTML = `

<div id="srWbSheet">
    <div class="sr-wb-header">
        <div class="sr-wb-avatar" id="srWbAvatar">${(username || '?').charAt(0).toUpperCase()}</div>
        <div>
            <div class="sr-wb-title">Welcome back, ${username || 'there'}!</div>
            <div class="sr-wb-sub">You were away for ${awayStr}</div>
        </div>
        <div class="sr-wb-dismiss" onclick="document.getElementById('srWelcomeBackOverlay').remove()">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </div>
    </div>
    <div class="sr-wb-missed-label">While you were away</div>
    <div id="srWbMissed">${missedHtml}</div>
    <button class="sr-wb-cta" onclick="document.getElementById('srWelcomeBackOverlay').remove();window.openNotifPanel&&openNotifPanel()">See all notifications →</button>
</div>`;

            document.body.appendChild(overlay);

            // Auto-dismiss after 12s
            setTimeout(function() {
                const el = document.getElementById('srWelcomeBackOverlay');
                if (el) {
                    el.style.transition = 'opacity .4s';
                    el.style.opacity = '0';
                    setTimeout(function(){ if (el.parentNode) el.remove(); }, 400);
                }
            }, 12000);
        }
        window.doSignOut = function(){
            // Show confirmation modal instead of signing out immediately
            const modal = document.getElementById('signOutConfirmModal');
            if (modal) { modal.style.display = 'flex'; lockBodyScroll && lockBodyScroll(); }
        };
        window.confirmSignOut = function(){
            const modal = document.getElementById('signOutConfirmModal');
            if (modal) modal.style.display = 'none';
            // Force-reset scroll lock count — dash + signout modal may have stacked it
            _scrollLockCount = 0;
            document.body.classList.remove('modal-open');
            document.body.style.position = '';
            document.body.style.top      = '';
            document.body.style.left     = '';
            document.body.style.right    = '';
            document.body.style.overflow = '';
            window.scrollTo({ top: _scrollLockY, behavior: 'instant' });
            signOut(auth).then(()=>{
                const dashModal = $('dashModal');
                if (dashModal) dashModal.style.display = 'none';
                updateAvatar(null);
                const _wp0 = document.getElementById('walletPillAmount'); if(_wp0){_wp0.classList.remove('skel');_wp0.textContent='$0';}
            });
        };
        window.cancelSignOut = function(){
            const modal = document.getElementById('signOutConfirmModal');
            if (modal) modal.style.display = 'none';
            // Only release the signout modal's lock — dash remains open
            _scrollLockCount = Math.max(0, _scrollLockCount - 1);
            if (_scrollLockCount === 0) {
                document.body.classList.remove('modal-open');
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';
                window.scrollTo({ top: _scrollLockY, behavior: 'instant' });
            }
        };
        window.closeDash = function(){
            $('dashModal').style.display='none';
            unlockBodyScroll();
            // Reset all settings sub-panels so re-opening always shows the main settings list
            ['subProfile','subBilling','subTxnHistory','subAppearance','subNotifications','subContact','subAbout','subSecurity','subSessions','subPrivacy','subActivity','subSaved','subOffers','subReferral','subTransferAccount','subDeleteAccount','subSellerAnalytics','subPricingCalc','subOfferPrefs','subListingBoost','subAutoRelist','subBulkEditor','subListingTemplates','subNdaManager','subBuyerInsights','subSalesHistory','subPriceAlerts','subBuyerFilters','subDueDiligence','subEscrowStatus','subRoiCalculator','subDealComparison','subAcquisitionLog','subSellerRep','subWatchlistAlerts','subDealPrefs','subPayoutSettings','subTaxInfo'].forEach(function(id) {
                const el = document.getElementById(id);
                if (!el) return;
                el.classList.remove('open');
                el.style.display = 'none';
            });
        };

        //  sign up 
        window.doSignup = async function(){
            hideMsg('errSignup','okSignup');
            const email    = $('suEmail').value.trim();
            const password = $('suPassword').value;
            if(!email) return showErr('errSignup','Please enter your email.');
            if(password.length < 6) return showErr('errSignup','Password must be at least 6 characters.');

            setBtn('btnSignup','Creating account…', true);
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const uid  = cred.user.uid;

                // Temporary placeholder username — replaced once the user picks a real one
                // in the required profile-completion step right after signup.
                const tempUsername = 'user' + uid.slice(0, 8).toLowerCase();

                // Save user profile (username/bio finalized in profile-completion step)
                await set(ref(db, 'users/'+uid), {
                    username: tempUsername,
                    email: email,
                    bio: '',
                    profileComplete: false,
                    plan: 'Free',
                    createdAt: Date.now(),
                    address: {},
                    orders: []
                });
                await set(ref(db,'usernames/'+tempUsername.toLowerCase()), uid);

                showOk('okSignup','Account created! Welcome aboard.');
                setBtn('btnSignup','Create account →',false);

                setTimeout(()=>{
                    closeAuthModal();
                    // Show avatar picker first, then require username + bio before entering the dashboard
                    const goToProfileStep = function() {
                        if (window._openProfileSetup) {
                            window._openProfileSetup(uid, email, function(finalUsername, bio) {
                                // Send welcome email now that we have the real username
                                try {
                                    const SITE_DOMAIN = window.location.hostname || 'siterifty.com';
                                    const welcomeHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:28px;"><img src="https://i.imgur.com/8EEl86u.jpeg" alt="Siterifty" style="width:52px;height:52px;border-radius:14px;"><div style="font-size:24px;font-weight:800;color:#f1f0ff;margin-top:14px;letter-spacing:-0.03em;">Welcome to Siterifty </div><div style="font-size:13px;color:#8b8aa8;margin-top:6px;">Your account is ready. Start buying and selling.</div></div><div style="background:#12121a;border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:24px;margin-bottom:20px;"><div style="font-size:14px;font-weight:700;color:#f1f0ff;margin-bottom:8px;">Hey @${finalUsername}! </div><div style="font-size:12px;color:#8b8aa8;line-height:1.7;">You're now part of the #1 marketplace for buying and selling websites, SaaS, and online businesses. Here's how to get started:</div><div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;"><div style="display:flex;gap:10px;align-items:flex-start;"><div style="width:20px;height:20px;border-radius:6px;background:rgba(168,85,247,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:800;color:#a855f7;">1</div><div style="font-size:12px;color:#f1f0ff;">Browse listings and find your next digital asset</div></div><div style="display:flex;gap:10px;align-items:flex-start;"><div style="width:20px;height:20px;border-radius:6px;background:rgba(129,140,248,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:800;color:#818cf8;">2</div><div style="font-size:12px;color:#f1f0ff;">List your own site for free — takes 2 minutes</div></div><div style="display:flex;gap:10px;align-items:flex-start;"><div style="width:20px;height:20px;border-radius:6px;background:rgba(56,189,248,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:800;color:#38bdf8;">3</div><div style="font-size:12px;color:#f1f0ff;">Upgrade to reduce platform fees and get more listings</div></div></div></div><div style="text-align:center;margin-bottom:20px;"><a href="https://siterifty.com" style="display:inline-block;padding:13px 32px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#818cf8);font-size:13px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:0.02em;">Open Siterifty →</a></div><div style="text-align:center;font-size:11px;color:rgba(139,138,168,0.4);">© 2026 ${SITE_DOMAIN} · You're receiving this because you created an account</div></div>`;
                                    window._sendEmail && window._sendEmail(email, 'Welcome to Siterifty — @' + finalUsername, welcomeHtml).catch(()=>{});
                                } catch(_) {}

                                // Process referral now that the real username exists
                                (window._processReferral ? window._processReferral(uid, finalUsername, email) : Promise.resolve(null)).then(function(refResult){
                                    window._openDashWithFlow(true, uid, finalUsername);
                                    if (refResult && refResult.invalidRef) {
                                        setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(null, true); }, 1200);
                                    } else if (refResult && refResult.referrerUsername) {
                                        setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(refResult.referrerUsername, false); }, 1200);
                                    }
                                });
                            });
                        } else {
                            window._openDashWithFlow(true, uid, tempUsername);
                        }
                    };

                    if (window._openAvatarPicker) {
                        window._openAvatarPicker(uid, tempUsername, goToProfileStep);
                    } else {
                        goToProfileStep();
                    }
                }, 900);
            } catch(e){
                setBtn('btnSignup','Create account →',false);
                showErr('errSignup', firebaseErrMsg(e.code));
            }
        };

        //  login 
        window.doLogin = async function(){
            hideMsg('errLogin','okLogin');
            const email    = $('liEmail').value.trim();
            const password = $('liPassword').value;
            if(!email) return showErr('errLogin','Please enter your email.');
            if(!password) return showErr('errLogin','Please enter your password.');
            setBtn('btnLogin','Signing in…',true);
            try {
                await signInWithEmailAndPassword(auth, email, password);
                setBtn('btnLogin','Sign in →',false);
                const _liUser = auth.currentUser;
                closeAuthModal();
                window._openDashWithFlow(false, _liUser ? _liUser.uid : null, null);
            } catch(e){
                setBtn('btnLogin','Sign in →',false);
                showErr('errLogin', firebaseErrMsg(e.code));
            }
        };

        //  Google auth (sign-in or sign-up) 
        window.doGoogleAuth = async function(){
            const btns = ['btnGoogleLogin','btnGoogleSignup'];
            btns.forEach(id => { const b=$( id); if(b){b.disabled=true; b.textContent='Connecting…';} });
            try {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                const result = await signInWithPopup(auth, provider);
                const user   = result.user;
                const uid    = user.uid;

                // Check if user already exists; if not, create profile
                const snap = await get(ref(db,'users/'+uid));
                if(!snap.exists()){
                    // Create base record first (plan, createdAt etc) — username/email filled by modal
                    await set(ref(db,'users/'+uid), {
                        username:    '',
                        email:       user.email || '',
                        displayName: user.displayName || '',
                        photoURL:    user.photoURL || '',
                        plan:        'Free',
                        createdAt:   Date.now(),
                        address:     {},
                        orders:      []
                    });
                    closeAuthModal();
                    // New Google user — collect username + confirm email, then avatar picker
                    if (window._openSocialProfileSetup) {
                        window._openSocialProfileSetup(uid, 'google', user.email || '', async function(username, email, avatarUrl) {
                            // Process referral
                            const _gRefResult = await (window._processReferral ? window._processReferral(uid, username, user.email||'') : Promise.resolve(null));
                            window._openDashWithFlow(true, uid, username);
                            if (_gRefResult && _gRefResult.invalidRef) {
                                setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(null, true); }, 1200);
                            } else if (_gRefResult && _gRefResult.referrerUsername) {
                                setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(_gRefResult.referrerUsername, false); }, 1200);
                            }
                        });
                    } else {
                        window._openDashWithFlow(true, uid, user.displayName || '');
                    }
                } else {
                    closeAuthModal();
                    window._openDashWithFlow(false, uid, null);
                }
            } catch(e){
                const errEl = $('errLogin') || $('errSignup');
                if(errEl){ errEl.textContent = e.code === 'auth/popup-closed-by-user' ? 'Sign-in popup was closed.' : (firebaseErrMsg(e.code)||'Google sign-in failed.'); errEl.style.display='block'; }
            } finally {
                btns.forEach(id => { const b=$(id); if(b){b.disabled=false; b.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg> Continue with Google'; } });
            }
        };

        // ── GitHub Sign-in / Sign-up ──────────────────────────────────────────
        window.doGithubAuth = async function() {
            const ghBtns = ['btnGithubLogin','btnGithubSignup'];
            const ghIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>';
            ghBtns.forEach(id => { const b=$(id); if(b){b.disabled=true; b.textContent='Connecting…';} });
            try {
                const provider = new GithubAuthProvider();
                provider.addScope('repo');
                provider.addScope('read:user');
                const result = await signInWithPopup(auth, provider);
                const user   = result.user;
                const uid    = user.uid;

                // GitHub OAuth credential — extract access token to store for repo access
                const credential = GithubAuthProvider.credentialFromResult(result);
                const ghToken    = credential ? credential.accessToken : null;

                // Extract GitHub username from profile (providerData)
                let ghUsername = '';
                const ghProvider = user.providerData.find(p => p.providerId === 'github.com');
                if (ghProvider) ghUsername = ghProvider.displayName || ghProvider.email || '';

                const snap = await get(ref(db,'users/'+uid));
                if (!snap.exists()) {
                    // Create base record — username/email filled by modal
                    await set(ref(db,'users/'+uid), {
                        username:    '',
                        email:       user.email || '',
                        displayName: user.displayName || '',
                        photoURL:    user.photoURL || '',
                        plan:        'Free',
                        createdAt:   Date.now(),
                        address:     {},
                        orders:      []
                    });
                    closeAuthModal();
                    // New GitHub user — collect username + confirm email, then avatar picker
                    if (window._openSocialProfileSetup) {
                        window._openSocialProfileSetup(uid, 'github', user.email || '', async function(username, email, avatarUrl) {
                            // Link GitHub to AutoSell
                            if (ghToken && ghUsername) {
                                _linkGithubToAutoSell(uid, ghToken, ghUsername, avatarUrl || user.photoURL || '');
                            }
                            // Process referral
                            const _ghRefResult = await (window._processReferral ? window._processReferral(uid, username, user.email||'') : Promise.resolve(null));
                            window._openDashWithFlow(true, uid, username);
                            if (_ghRefResult && _ghRefResult.invalidRef) {
                                setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(null, true); }, 1200);
                            } else if (_ghRefResult && _ghRefResult.referrerUsername) {
                                setTimeout(() => { if (window._showReferralWelcomePopup) window._showReferralWelcomePopup(_ghRefResult.referrerUsername, false); }, 1200);
                            }
                        });
                    } else {
                        window._openDashWithFlow(true, uid, user.displayName || '');
                    }
                } else {
                    closeAuthModal();
                    window._openDashWithFlow(false, uid, null);
                    // Existing user — link GitHub to AutoSell and open repo picker
                    if (ghToken && ghUsername) {
                        _linkGithubToAutoSell(uid, ghToken, ghUsername, user.photoURL || '');
                    }
                }
            } catch(e) {
                const errEl = $('errLogin') || $('errSignup');
                if(errEl){ errEl.textContent = e.code === 'auth/popup-closed-by-user' ? 'Sign-in popup was closed.' : (e.code === 'auth/account-exists-with-different-credential' ? 'An account already exists with this email. Try signing in with Google or email.' : (firebaseErrMsg(e.code)||'GitHub sign-in failed.')); errEl.style.display='block'; }
            } finally {
                ghBtns.forEach(id => { const b=$(id); if(b){b.disabled=false; b.innerHTML=ghIcon+' Continue with GitHub';} });
            }
        };

        // After GitHub OAuth login, link the account to AutoSell + open repo picker modal
        async function _linkGithubToAutoSell(uid, token, username, avatarUrl) {
            try {
                // Store GitHub link in Firebase
                await update(ref(db,'users/'+uid+'/github'), { username: username, linkedAt: Date.now(), avatarUrl: avatarUrl });
                // Call our API to exchange token → store in server for repo API calls
                const res = await fetch('/api/github-autosell?mode=link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: uid, token: token, username: username, avatarUrl: avatarUrl })
                }).catch(() => null);
                const data = res ? await res.json().catch(() => ({})) : {};
                // Open the repo picker modal
                setTimeout(function() {
                    if (window.openAutoSellModal) window.openAutoSellModal();
                    // Show repos from OAuth directly without another round-trip if available
                    if (data.repos && window._renderRepoPickerModal) {
                        window._renderRepoPickerModal(username, avatarUrl, data.repos);
                    }
                }, 400);
            } catch(e) { console.warn('[ghLink]', e); }
        }

        //  forgot password 
        window.doForgot = async function(){
            hideMsg('errForgot','okForgot');
            const email = $('fpEmail').value.trim();
            if(!email) return showErr('errForgot','Please enter your email address.');
            setBtn('btnForgot','Sending…',true);
            try {
                await sendPasswordResetEmail(auth, email);
                showOk('okForgot','Reset link sent! Check your inbox (and spam folder).');
                setBtn('btnForgot','Send reset link →',false);
            } catch(e){
                setBtn('btnForgot','Send reset link →',false);
                showErr('errForgot', firebaseErrMsg(e.code));
            }
        };

        //  wallet modal 
        window.openWalletModal = async function(){
            const overlay = document.getElementById('walletOverlay');
            const amountEl = document.getElementById('wmBalanceAmount');
            const spinnerEl = document.getElementById('wmSpinner');
            const loginNote = document.getElementById('wmLoginNote');
            const topupBtn = overlay.querySelector('.wm-topup-btn');

            // Show spinner, hide amount
            spinnerEl.style.display = 'flex';
            amountEl.style.display = 'none';

            overlay.classList.add('open');
            lockBodyScroll();

            const user = auth.currentUser;
            const xferBtn = document.getElementById('wmTransferBtn');
            const ctaRow = topupBtn ? topupBtn.parentElement : null;
            if(!user){
                spinnerEl.style.display = 'none';
                amountEl.style.display = '';
                amountEl.textContent = '$0';
                loginNote.style.display = 'block';
                topupBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Sign in to add money';
                topupBtn.onclick = () => { closeWalletModal(); openAuthModal(); };
                // No account to transfer from/to yet — don't show Transfer next to a disabled-feeling CTA.
                if (xferBtn) xferBtn.style.display = 'none';
                if (ctaRow) ctaRow.style.gridTemplateColumns = '1fr';
                return;
            }

            loginNote.style.display = 'none';
            topupBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Add Money';
            topupBtn.onclick = () => openTopUpModal();
            if (xferBtn) xferBtn.style.display = 'flex';
            if (ctaRow) ctaRow.style.gridTemplateColumns = '1fr 1fr';

            const username = (window._fbUserData && window._fbUserData.username) || (user.email ? user.email.split('@')[0] : 'user');
            const usernameEl = document.getElementById('wmUsername');
            const avatarEl = document.getElementById('wmAvatar');
            if (usernameEl) usernameEl.textContent = '@' + username;
            if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();

            try {
                const snap = await get(ref(db, 'users/' + user.uid));
                const data = snap.val() || {};
                const bal = parseFloat(data.balance || 0);
                amountEl.textContent = fmtBal(bal);
                const _wpBal = document.getElementById('walletPillAmount'); if(_wpBal){_wpBal.classList.remove('skel');_wpBal.textContent=fmtBal(bal);}
            } catch(e){
                amountEl.textContent = '$0';
            } finally {
                spinnerEl.style.display = 'none';
                amountEl.style.display = '';
            }
        };

        window.closeWalletModal = function(){
            const overlay = document.getElementById('walletOverlay');
            overlay.classList.remove('open');
            unlockBodyScroll();
        };

        //  Expose DB + helpers globally (used by Imgur upload script) 
        window._fbDb = db;
        window._fbDbFns = { ref, get, update, set, onValue, push, remove };
        window._fb = function() { return { db: window._fbDb, ref: window._fbDbFns.ref, get: window._fbDbFns.get, set: window._fbDbFns.set, update: window._fbDbFns.update, onValue: window._fbDbFns.onValue }; };

        //  auth state 
        //  Global realtime user data listener 
        // Uses onValue (Firebase realtime) so any plan change — whether made by
        // PayPal webhook, admin, or another device — instantly propagates to all UI.
        let _userDataUnsubscribe = null;

        //  Notify helper — fire and forget, never blocks UI 
        function _notifyEvent(action, eventType, data) {
            const u = window._fbUserData;
            if (!u || !u.uid) return;
            fetch('/api/settings.js', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    eventType,
                    uid:     u.uid,
                    plan:    u.plan  || 'Free',
                    email:   u.email || '',
                    listing: data || {},
                    ad:      data || {},
                }),
            }).catch(() => {});
        }

        function applyUserData(data, user) {
            // ── Ban gate check (must be first — blocks everything if banned) ──
            if (typeof window._checkBanGate === 'function') window._checkBanGate(data, user.uid);
            // ── Moderation warning check (yellow toast, no lockout) ──
            if (typeof window._checkWarningGate === 'function') window._checkWarningGate(data);
            // ── Device lock gate ──
            if (typeof window._checkDeviceLock === 'function') window._checkDeviceLock(data);
            // ── Sync device lock UI in settings ──
            if (typeof _syncDeviceLockUI === 'function') _syncDeviceLockUI(data);

            const plan = data.plan || 'Free';
            // 1. Update global cache
            window._fbUserData = {
                uid:         user.uid,
                username:    data.username || '',
                plan:        plan,
                email:       user.email || data.email || '',
                balance:     parseFloat(data.balance || 0),
                paypalSubId: data.paypalSubId || null,
            };
            // 2. Wallet pill
            const walletEl = document.getElementById('walletPillAmount');
            const labelEl  = document.querySelector('#walletPill .credit-label');
            if (walletEl) {
                walletEl.classList.remove('skel');
                walletEl.textContent = fmtBal(parseFloat(data.balance||0));
                walletEl.title = '';
                if (labelEl) labelEl.textContent = 'Balance';
            }
            // 3. Update announcement bar
            updateAnnouncementBar(data, user);
            const cancelBtn = document.getElementById('billingCancelBtn');
            if (cancelBtn) cancelBtn.style.display = (plan !== 'Free') ? 'flex' : 'none';
            // 4. Plan badge everywhere
            const planBadgeHtml = '<svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z" fill="currentColor"/></svg> ' + plan.toUpperCase() + ' PLAN';
            const currentPlanBadgeEl = document.getElementById('currentPlanBadge');
            if (currentPlanBadgeEl) currentPlanBadgeEl.textContent = plan;
            const settingsPlanBadgeEl = document.getElementById('settingsPlanBadge');
            if (settingsPlanBadgeEl) settingsPlanBadgeEl.innerHTML = planBadgeHtml;
            // 5. Settings upgrade card visibility
            const upgradeCard = document.getElementById('settingsUpgradeCard');
            if (upgradeCard) upgradeCard.classList.toggle('hidden', plan !== 'Free');
            // 6. Lock plan rows to current plan (no fake instant switching)
            _lockPlanRowsToCurrent(plan);
        }

        function _lockPlanRowsToCurrent(plan) {
            // Row active styling is now handled by populateAccountTab row builder — no-op here
        }

        // ── Dashboard panel loaders — fire once real uid+data arrive ──
        // applyUserData is the single point where uid + Firebase data are both known.
        // We run all panel loaders here instead of polling from IIFEs.
        (function() {
            var _origApply = applyUserData;
            applyUserData = function(data, user) {
                _origApply(data, user);
                if (!user || !user.uid) return;
                var uid = user.uid;
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                if (!db || !fns) return;

                // ── walletBalance alias (data.balance is the real field) ──
                var balance = parseFloat(data.balance || 0);

                // ── Wallet mini card ──
                var wbEl = document.getElementById('acctWalletBalanceMini');
                if (wbEl) wbEl.textContent = '$' + balance.toFixed(2);

                // ── Recent transactions (Accounts tab) ──
                (function() {
                    var el = document.getElementById('acctMiniTxnList');
                    if (!el) return;
                    fns.get(fns.ref(db,'users/'+uid+'/transactions')).then(function(snap){
                        if (!snap.exists()) { el.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-faint);">No transactions yet</div>'; return; }
                        var txns = Object.entries(snap.val()||{}).map(function(e){return Object.assign({_key:e[0]},e[1]);});
                        txns.sort(function(a,b){return(b.ts||b.createdAt||0)-(a.ts||a.createdAt||0);});
                        var icons={sale:'💰',topup:'💳',withdrawal:'🏧',transfer:'↔️',fee:'📊'};
                        var html=txns.slice(0,4).map(function(t,i){
                            var icon=icons[t.type]||'💫';var amt=parseFloat(t.amount)||0;
                            var isIn=t.type==='sale'||t.type==='topup'||t.type==='credit';
                            var date=t.ts?new Date(t.ts).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';
                            return '<div style="display:flex;align-items:center;gap:11px;padding:11px 15px;'+(i>0?'border-top:1px solid var(--border);':'')+'"><div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">'+icon+'</div><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(t.label||t.description||t.type||'Transaction')+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:1px;">'+date+'</div></div><div style="font-size:13px;font-weight:700;color:'+(isIn?'var(--lime)':'#f87171')+';">'+(isIn?'+':'-')+'$'+Math.abs(amt).toFixed(2)+'</div></div>';
                        }).join('');
                        el.innerHTML = html || '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-faint);">No transactions yet</div>';
                    }).catch(function(){el.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-faint);">Could not load</div>';});
                })();

                // ── Earnings summary (Profile tab) ──
                (function(){
                    var te=document.getElementById('earningsTotalEl'),se=document.getElementById('earningsSalesEl'),fe=document.getElementById('earningsFeesEl'),ne=document.getElementById('earningsNetEl');
                    if(!te&&!se&&!fe&&!ne) return;
                    fns.get(fns.ref(db,'users/'+uid+'/transactions')).then(function(snap){
                        var total=0,sales=0,fees=0;
                        if(snap.exists()) Object.values(snap.val()||{}).forEach(function(t){
                            if(t.type==='sale'||t.type==='transfer'||t.type==='escrow_complete'){total+=parseFloat(t.amount)||0;fees+=parseFloat(t.fee)||0;sales++;}
                        });
                        var fmt=function(v){return '$'+Math.abs(v).toFixed(2);};
                        if(te)te.textContent=fmt(total);if(se)se.textContent=sales;if(fe)fe.textContent=fmt(fees);if(ne)ne.textContent=fmt(total-fees);
                    }).catch(function(){if(te)te.textContent='$0.00';if(se)se.textContent='0';if(fe)fe.textContent='$0.00';if(ne)ne.textContent='$0.00';});
                })();

                // ── Referral (Profile tab) ──
                (function(){
                    var link='https://siterifty.com/?ref='+uid;
                    document.querySelectorAll('#referralLinkDisplay').forEach(function(ld){ld.textContent=link;});
                    fns.get(fns.ref(db,'users/'+uid+'/referrals')).then(function(snap){
                        var refs=snap.exists()?Object.values(snap.val()||{}):[]; 
                        var count=refs.length,earned=refs.reduce(function(s,r){return s+(parseFloat(r.earned)||0);},0);
                        var b=document.getElementById('referralCountBadge');if(b)b.textContent=count+' referrals';
                        var cd=document.getElementById('referralCountDisplay');if(cd)cd.textContent=count;
                        var ed=document.getElementById('referralEarnedDisplay');if(ed)ed.textContent='$'+earned.toFixed(2);
                    }).catch(function(){});
                })();

                // ── My listings (Profile tab) ──
                (function(){
                    var el=document.getElementById('myListingsList'),badge=document.getElementById('myListingsBadge');
                    if(!el)return;
                    fns.get(fns.ref(db,'websites')).then(function(snap){
                        if(!snap.exists()){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">No listings yet.</div>';if(badge)badge.textContent='0 active';return;}
                        var mine=Object.entries(snap.val()||{}).filter(function(e){return e[1].sellerUid===uid||e[1].userId===uid;});
                        if(badge)badge.textContent=mine.length+' active';
                        if(!mine.length){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">No listings yet. <a href="/sell-my-site" style="color:var(--lime);">List one →</a></div>';return;}
                        var sc={active:'var(--lime)',pending:'#f0c040',sold:'#5fe0a0',rejected:'#f87171'};
                        el.innerHTML=mine.slice(0,5).map(function(e){var l=e[1],s=l.status||'pending',price=l.price?'$'+parseFloat(l.price).toLocaleString():'—';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);"><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(l.title||l.domain||'Untitled')+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">'+(l.category||'General')+' · '+price+'</div></div><span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid;color:'+(sc[s]||'var(--text-faint)')+';border-color:'+(sc[s]||'var(--text-faint)')+'">'+s.toUpperCase()+'</span></div>';
                        }).join('');
                    }).catch(function(){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Could not load.</div>';});
                })();

                // ── Active deals (Profile tab) ──
                (function(){
                    var el=document.getElementById('activeDealsList'),badge=document.getElementById('dealsBadge');
                    if(!el)return;
                    fns.get(fns.ref(db,'users/'+uid+'/inbox')).then(function(snap){
                        if(!snap.exists()){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">No active deals.</div>';if(badge)badge.textContent='0 deals';return;}
                        var deals=Object.entries(snap.val()||{}).filter(function(e){var t=e[1];return t.dealStatus&&t.dealStatus!=='completed'&&t.dealStatus!=='cancelled';});
                        if(badge)badge.textContent=deals.length+' deals';
                        if(!deals.length){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">No active deals right now.</div>';return;}
                        var sc={escrow_funded:'#f0c040',transfer_initiated:'#38bdf8',transfer_complete:'var(--lime)',disputed:'#f87171',pending:'var(--text-faint)'};
                        el.innerHTML=deals.slice(0,4).map(function(e){var t=e[1],s=t.dealStatus||'pending',amt=t.dealAmount?'$'+parseFloat(t.dealAmount).toFixed(2):'—',w=t.otherPartyName||t.otherEmail||'User';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);"><div style="width:34px;height:34px;border-radius:10px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">🤝</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:700;color:var(--text);">'+amt+' with '+w+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">'+(t.listingTitle||t.siteUrl||'Site deal')+'</div></div><span style="font-size:9.5px;font-weight:700;padding:3px 7px;border-radius:999px;border:1px solid;color:'+(sc[s]||'var(--text-faint)')+';border-color:'+(sc[s]||'var(--text-faint)')+';white-space:nowrap;">'+s.replace(/_/g,' ').toUpperCase()+'</span></div>';
                        }).join('');
                    }).catch(function(){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Could not load.</div>';});
                })();

                // ── Watchlist (Profile tab) ──
                (function(){
                    var el=document.getElementById('watchlistItems'),badge=document.getElementById('watchlistBadge');
                    if(!el)return;
                    fns.get(fns.ref(db,'users/'+uid+'/saved')).then(function(snap){
                        if(!snap.exists()||!snap.val()){if(badge)badge.textContent='0 saved';if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Nothing saved yet.</div>';return;}
                        var saved=Object.entries(snap.val()||{});if(badge)badge.textContent=saved.length+' saved';
                        el.innerHTML=saved.slice(0,5).map(function(e,i){var d=e[1],price=d.price?'$'+parseFloat(d.price).toLocaleString():'—';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;'+(i>0?'border-top:1px solid var(--border);':'')+'"><div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">🔖</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(d.title||d.domain||'Saved site')+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">'+(d.category||'—')+' · '+price+'</div></div><button onclick="window.removeSaved(\''+e[0]+'\')" style="padding:5px 8px;border-radius:7px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);color:#f87171;font-size:10px;cursor:pointer;">Remove</button></div>';
                        }).join('');
                    }).catch(function(){if(el)el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Could not load.</div>';});
                })();

                // ── Reputation (Profile tab) ──
                (function(){
                    var arc=document.getElementById('repScoreArc'),numEl=document.getElementById('repScoreNum'),badge=document.getElementById('repScoreBadge');
                    fns.get(fns.ref(db,'users/'+uid+'/reputation')).then(function(snap){
                        var r=snap.exists()?snap.val():{};
                        var score=r.score||0,sales=r.totalSales||0,avg=r.avgRating||0,disputes=r.disputes||0;
                        var pct=Math.min(100,score);
                        if(arc)arc.setAttribute('stroke-dasharray',pct+' '+(100-pct));
                        if(numEl)numEl.textContent=score||'—';
                        if(badge)badge.textContent=score?score+'/100':'No score';
                        var lbl=document.getElementById('repScoreLabel');if(lbl)lbl.textContent=score>=80?'Trusted seller':score>=50?'Good standing':score>0?'Building reputation':'No ratings yet';
                        var desc=document.getElementById('repScoreDesc');if(desc)desc.textContent=sales?sales+' completed sale'+(sales!==1?'s':''):'Complete sales to build your reputation score';
                        var sc=document.getElementById('repSalesCount');if(sc)sc.textContent=sales;
                        var ra=document.getElementById('repRatingAvg');if(ra)ra.textContent=avg?parseFloat(avg).toFixed(1):'—';
                        var dr=document.getElementById('repDispRate');if(dr&&sales)dr.textContent=Math.round((1-disputes/Math.max(sales,1))*100)+'%';
                        var stars=document.getElementById('repStarRow');if(stars&&avg){var s='';for(var i=1;i<=5;i++){s+='<svg width="13" height="13" viewBox="0 0 13 13" fill="'+(i<=Math.round(avg)?'#f0c040':'rgba(240,192,64,0.2)') +'" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 1l1.3 3.9H12l-3.3 2.4 1.3 3.9L6.5 9 3 11.2l1.3-3.9L1 4.9h4.2z"/></svg>';}stars.innerHTML=s;}
                    }).catch(function(){if(numEl)numEl.textContent='—';if(badge)badge.textContent='No score';});
                })();

                // ── Offers inbox (Accounts tab) ──
                (function(){
                    var el=document.getElementById('offersInboxList');if(!el)return;
                    fns.get(fns.ref(db,'users/'+uid+'/inbox')).then(function(snap){
                        if(!snap.exists()){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">No offers yet.</div>';return;}
                        var offers=Object.entries(snap.val()||{}).filter(function(e){var t=e[1];return t.lastMsgType==='offer'||t.dealAmount||t.offerAmount;});
                        if(!offers.length){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">No offer messages yet.</div>';return;}
                        el.innerHTML=offers.slice(0,5).map(function(e,i){var t=e[1],amt=t.dealAmount||t.offerAmount,amtStr=amt?'$'+parseFloat(amt).toFixed(0):'Offer',name=t.otherPartyName||t.otherEmail||'Buyer',date=t.lastMsgTs?new Date(t.lastMsgTs).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:11px 15px;'+(i>0?'border-top:1px solid var(--border);':'')+'cursor:pointer;" onclick="if(window.openMessagesModal)openMessagesModal();"><div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,rgba(168,255,107,0.2),rgba(95,224,160,0.15));border:1px solid rgba(168,255,107,0.25);display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;">'+name.charAt(0).toUpperCase()+'</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+name+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:1px;">'+(t.listingTitle||t.siteUrl||'Site offer')+' · '+date+'</div></div><span style="font-size:12px;font-weight:700;color:var(--lime);flex-shrink:0;">'+amtStr+'</span></div>';
                        }).join('');
                    }).catch(function(){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Could not load.</div>';});
                })();

                // ── Payout history (Accounts tab) ──
                (function(){
                    var el=document.getElementById('payoutHistoryList');if(!el)return;
                    fns.get(fns.ref(db,'users/'+uid+'/transactions')).then(function(snap){
                        if(!snap.exists()){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">No payouts yet.</div>';return;}
                        var payouts=Object.entries(snap.val()||{}).map(function(e){return Object.assign({_key:e[0]},e[1]);}).filter(function(t){return t.type==='withdrawal'||t.type==='payout';});
                        payouts.sort(function(a,b){return(b.ts||b.createdAt||0)-(a.ts||a.createdAt||0);});
                        if(!payouts.length){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">No withdrawals yet. <a href="#" onclick="if(window.openWithdrawModal)openWithdrawModal();return false;" style="color:var(--lime);">Withdraw now →</a></div>';return;}
                        var sc={completed:'var(--lime)',processing:'#f0c040',failed:'#f87171',pending:'var(--text-faint)'};
                        el.innerHTML=payouts.slice(0,6).map(function(t,i){var amt=parseFloat(t.amount)||0,s=t.status||'completed',date=t.ts?new Date(t.ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—',email=t.paypalEmail||t.email||'PayPal';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:12px 15px;'+(i>0?'border-top:1px solid var(--border);':'')+'"><div style="width:34px;height:34px;border-radius:10px;background:rgba(95,224,160,0.1);border:1px solid rgba(95,224,160,0.2);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🏧</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:700;color:var(--text);">Withdrawal · '+email+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:1px;">'+date+'</div></div><div style="text-align:right;"><div style="font-size:13px;font-weight:700;color:#5fe0a0;">$'+amt.toFixed(2)+'</div><div style="font-size:9.5px;font-weight:700;color:'+(sc[s]||'var(--text-faint)')+';text-transform:uppercase;margin-top:2px;">'+s+'</div></div></div>';
                        }).join('');
                    }).catch(function(){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Could not load.</div>';});
                })();

                // ── Notification prefs (Settings tab) ──
                (function(){
                    var PREFS=[{key:'notif_offers',label:'New offers received',sub:'When a buyer sends you an offer',def:true},{key:'notif_messages',label:'New messages',sub:'Chat messages from buyers/sellers',def:true},{key:'notif_sales',label:'Sale completed',sub:'When a deal closes',def:true},{key:'notif_withdrawals',label:'Withdrawal updates',sub:'When a payout is processed',def:true},{key:'notif_promo',label:'Promotions &amp; tips',sub:'Platform updates and seller tips',def:false},{key:'notif_price_alerts',label:'Price drop alerts',sub:'On sites in your watchlist',def:true}];
                    fns.get(fns.ref(db,'users/'+uid+'/notifPrefs')).then(function(s){
                        var saved=s.exists()?s.val():{};
                        var el=document.getElementById('notifToggleList');if(!el)return;
                        el.innerHTML=PREFS.map(function(p,i){var checked=saved[p.key]!==undefined?saved[p.key]:p.def;
                            return '<label style="display:flex;align-items:center;gap:12px;padding:12px 15px;'+(i>0?'border-top:1px solid var(--border);':'')+'cursor:pointer;"><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:600;color:var(--text);">'+p.label+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:1px;">'+p.sub+'</div></div><div class="dm-switch" onclick="event.stopPropagation()" style="flex-shrink:0;"><input type="checkbox" id="nt_'+p.key+'" '+(checked?'checked':'')+' onchange="(function(chk){var u=(window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid);if(!u||!window._fbDb||!window._fbDbFns)return;var upd={};upd[\''+p.key+'\']=chk;window._fbDbFns.update(window._fbDbFns.ref(window._fbDb,\'users/\'+u+\'/notifPrefs\'),upd);})(this.checked)"><span class="dm-switch-track"></span><span class="dm-switch-thumb"></span></div></label>';
                        }).join('');
                    }).catch(function(){});
                })();

                // ── Listing prefs (Settings tab) ──
                (function(){
                    fns.get(fns.ref(db,'users/'+uid+'/listingPrefs')).then(function(s){
                        if(!s.exists())return;var p=s.val();
                        if(p.defaultMultiplier){document.querySelectorAll('.lp-mult-btn').forEach(function(b){var active=parseInt(b.dataset.mult)===p.defaultMultiplier;b.classList.toggle('active',active);b.style.background=active?'rgba(168,255,107,0.15)':'var(--surface2)';b.style.borderColor=active?'rgba(168,255,107,0.4)':'var(--border)';b.style.color=active?'var(--lime)':'var(--text-dim)';});}
                        var ao=document.getElementById('lpAllowOffers');if(ao&&p.allowOffers!==undefined)ao.checked=p.allowOffers;
                        var ar=document.getElementById('lpAutoRelist');if(ar&&p.autoRelist!==undefined)ar.checked=p.autoRelist;
                        var sr=document.getElementById('lpShowRevenue');if(sr&&p.showRevenue!==undefined)sr.checked=p.showRevenue;
                    }).catch(function(){});
                })();

                // ── Fee calc — set plan dropdown ──
                (function(){
                    var m={Free:'0.30',Starter:'0.15',Growth:'0.10',Pro:'0.05'};
                    var sel=document.getElementById('feeCalcPlan');
                    if(sel&&m[data.plan||'Free']){sel.value=m[data.plan||'Free'];if(typeof window.calcFeePreview==='function')window.calcFeePreview();}
                })();

                // ── Support messages (Support tab) ──
                (function(){
                    var el=document.getElementById('mySupportMsgList');if(!el)return;
                    fns.get(fns.ref(db,'supportMessages/'+uid)).then(function(snap){
                        if(!snap.exists()||!snap.val()){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">No messages sent yet. Use the form above to contact us.</div>';return;}
                        var msgs=Object.entries(snap.val()).map(function(e){return Object.assign({_key:e[0]},e[1]);});
                        msgs.sort(function(a,b){return(b.ts||0)-(a.ts||0);});
                        var sc={replied:'var(--lime)',closed:'var(--text-faint)',sent:'#f0c040'};
                        el.innerHTML=msgs.slice(0,5).map(function(m,i){var date=m.ts?new Date(m.ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—',s=m.status||'sent',preview=(m.message||'').slice(0,80)+(m.message&&m.message.length>80?'…':'');
                            return '<div style="padding:12px 15px;'+(i>0?'border-top:1px solid var(--border);':'')+'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><span style="font-size:11.5px;font-weight:700;color:var(--text);">'+date+'</span><span style="font-size:10px;font-weight:700;color:'+(sc[s]||'var(--text-faint)')+';">'+s.charAt(0).toUpperCase()+s.slice(1)+'</span></div><div style="font-size:11.5px;color:var(--text-dim);line-height:1.5;">'+preview+'</div></div>';
                        }).join('');
                    }).catch(function(){el.innerHTML='<div style="padding:18px;text-align:center;font-size:12px;color:var(--text-faint);">Could not load messages.</div>';});
                })();

                // ── Listing analytics bars (Accounts tab) ──
                (function(){
                    var barChart=document.getElementById('viewsBarChart');if(!barChart)return;
                    fns.get(fns.ref(db,'analytics/sellers/'+uid)).then(function(snap){
                        var d=snap.exists()?snap.val():{};
                        var days=[],now=Date.now();for(var i=6;i>=0;i--){days.push(new Date(now-i*86400000).toISOString().slice(0,10));}
                        var dayViews=days.map(function(dy){return(d.daily&&d.daily[dy.replace(/-/g,'')])||0;});
                        var totalV=dayViews.reduce(function(s,v){return s+v;},0);
                        var totalC=d.totalClicks||0;var ctr=totalV?((totalC/totalV)*100).toFixed(1)+'%':'0%';
                        var maxV=Math.max.apply(null,dayViews)||1;
                        var dl=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                        barChart.innerHTML=dayViews.map(function(v,i){var h=Math.round((v/maxV)*54)+4;
                            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;"><div style="width:100%;height:'+h+'px;background:linear-gradient(180deg,rgba(168,255,107,0.7),rgba(168,255,107,0.25));border-radius:4px 4px 2px 2px;min-height:4px;"></div><span style="font-size:8px;color:var(--text-faint);">'+dl[(new Date(days[i]).getDay()||7)-1]+'</span></div>';
                        }).join('');
                        var tv=document.getElementById('lpTotalViews');if(tv)tv.textContent=totalV;
                        var tc=document.getElementById('lpTotalClicks');if(tc)tc.textContent=totalC;
                        var cr=document.getElementById('lpConvRate');if(cr)cr.textContent=ctr;
                        var hdr=document.getElementById('listingPerfTotalViews');if(hdr)hdr.textContent=totalV+' views';
                    }).catch(function(){if(barChart)barChart.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:var(--text-faint);">No analytics data yet</div>';});
                })();
            };
        })();

        // ── Globals needed by inline onclick handlers ──
        window.removeSaved = function(key) {
            var uid = (window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid)||(window._fbUserData&&window._fbUserData.uid);
            if (!uid||!window._fbDb||!window._fbDbFns) return;
            window._fbDbFns.remove(window._fbDbFns.ref(window._fbDb,'users/'+uid+'/saved/'+key)).then(function(){
                // Re-run watchlist section via a fake applyUserData call won't work here;
                // just re-fetch and re-render directly
                window._fbDbFns.get(window._fbDbFns.ref(window._fbDb,'users/'+uid+'/saved')).then(function(snap){
                    var el=document.getElementById('watchlistItems'),badge=document.getElementById('watchlistBadge');if(!el)return;
                    if(!snap.exists()||!snap.val()){if(badge)badge.textContent='0 saved';el.innerHTML='<div style="text-align:center;font-size:12px;color:var(--text-faint);padding:12px 0;">Nothing saved yet.</div>';return;}
                    var saved=Object.entries(snap.val()||{});if(badge)badge.textContent=saved.length+' saved';
                    el.innerHTML=saved.slice(0,5).map(function(e,i){var d=e[1],price=d.price?'$'+parseFloat(d.price).toLocaleString():'—';
                        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;'+(i>0?'border-top:1px solid var(--border);':'')+'"><div style="width:32px;height:32px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">🔖</div><div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(d.title||d.domain||'Saved site')+'</div><div style="font-size:10.5px;color:var(--text-faint);margin-top:2px;">'+(d.category||'—')+' · '+price+'</div></div><button onclick="window.removeSaved(\''+e[0]+'\')" style="padding:5px 8px;border-radius:7px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);color:#f87171;font-size:10px;cursor:pointer;">Remove</button></div>';
                    }).join('');
                });
            }).catch(function(){});
        };

        // (copyReferralLink consolidated near end of script — see window.copyReferralLink "Step 2")

        onAuthStateChanged(auth, function(user) {
            window._fbAuth = auth;
            updateAvatar(user);
            // Tear down previous realtime listener
            if (_userDataUnsubscribe) { _userDataUnsubscribe(); _userDataUnsubscribe = null; }

            if (user) {
                const fab = document.getElementById('msgsFab');
                if (fab) fab.style.display = 'flex';
                //  Check for pending message conversation (from details page redirect) 
                try {
                    const raw = sessionStorage.getItem('siterifty_pending_conv');
                    if (raw) {
                        const pending = JSON.parse(raw);
                        if (pending && pending.sellerUid && pending.sellerUid !== user.uid) {
                            sessionStorage.removeItem('siterifty_pending_conv');
                            setTimeout(function() {
                                if (typeof window.startConversation === 'function') {
                                    window.startConversation(pending.sellerUid, pending.prefill || '');
                                }
                            }, 600);
                        }
                    }
                } catch(e) {}

                //  Write lastSeen on every visit so "Last active" reflects page visits, not just logins 
                try {
                    update(ref(db, 'users/' + user.uid), { lastSeen: Date.now() });
                } catch(_) {}

                // Check for pending account invite (one-shot on login)
                if (typeof window._checkInviteOnLogin === 'function') window._checkInviteOnLogin(user);

                // Sync background image from Firebase → localStorage + apply (cross-device)
                if (window._srSyncBgFromFirebase) window._srSyncBgFromFirebase(user.uid);

                //  Persistent unread message badge — lightweight listener, no tab required 
                (function startUnreadBadgeListener(uid) {
                    const fbRef = ref, fbOnValue = window._fbDbFns && window._fbDbFns.onValue || (window._fbSDK && window._fbSDK.onValue);
                    if (!fbOnValue) {
                        // SDK not ready yet — retry shortly
                        setTimeout(() => startUnreadBadgeListener(uid), 400);
                        return;
                    }
                    function _setBadge(n) {
                        if (typeof window.updateMsgBadge === 'function') window.updateMsgBadge(n);
                    }
                    // Real inbox model: users/{uid}/inbox/{msgId} with toUid + read flags
                    fbOnValue(fbRef(db, 'users/' + uid + '/inbox'), function(snap) {
                        if (!snap || !snap.exists()) { _setBadge(0); return; }
                        const msgs = snap.val() || {};
                        let unread = 0;
                        Object.values(msgs).forEach(function(m) {
                            if (m && m.toUid === uid && !m.read) unread++;
                        });
                        _setBadge(unread);
                    }, { onlyOnce: false });
                })(user.uid);

                // Subscribe to realtime updates — fires immediately with current data
                // then again any time Firebase data changes (PayPal webhook, cancel, etc.)
                const { onValue } = window._fbSDK || {};
                if (onValue) {
                    _userDataUnsubscribe = onValue(ref(db, 'users/' + user.uid), snap => {
                        const data = snap.val() || {};
                        applyUserData(data, user);
                    }, err => {
                        console.warn('[onValue user]', err);
                        window._fbUserData = { uid: user.uid, plan: 'Free', email: user.email || '' };
                    });
                } else {
                    // Fallback: one-time get
                    get(ref(db, 'users/' + user.uid)).then(snap => {
                        applyUserData(snap.val() || {}, user);
                    }).catch(() => {
                        window._fbUserData = { uid: user.uid, plan: 'Free', email: user.email || '' };
                    });
                }
            } else {
                window._fbUserData = null;
                if (typeof window._resetBanGate === 'function') window._resetBanGate();
                if (typeof window._resetWarningGate === 'function') window._resetWarningGate();
                if (typeof window._resetDeviceLockGate === 'function') window._resetDeviceLockGate();
                const fab = document.getElementById('msgsFab');
                if (fab) fab.style.display = 'none';
                if (typeof closeMessagesModal === 'function') closeMessagesModal();
                const walletEl = document.getElementById('walletPillAmount');
                if (walletEl) { walletEl.classList.remove('skel'); walletEl.textContent = '$0.00'; walletEl.title = ''; }
                const labelEl = document.querySelector('#walletPill .credit-label');
                if (labelEl) labelEl.textContent = 'Balance';
                updateAnnouncementBar(null, null);
                const cancelBtn = document.getElementById('billingCancelBtn');
                if (cancelBtn) cancelBtn.style.display = 'none';
            }
        });

        // ============================================================
        //  MESSAGES — compatibility shims for legacy callers
        //  (real logic now lives in the new messages modal script below)
        // ============================================================
        window.updateMsgBadge = function(n) {
            const count = n > 0 ? n : 0;
            const fabBadge = document.getElementById('msgsFabBadge');
            const navBadge = document.getElementById('msgNavBadge');
            const floatBadge = document.getElementById('dmFloatMsgBadge');
            const subText  = document.getElementById('msgsFabSub');
            [fabBadge, navBadge].forEach(el => {
                if (!el) return;
                el.textContent = count > 9 ? '9+' : String(count);
                el.style.display = count > 0 ? 'flex' : 'none';
                el.classList.toggle('msgs-fab-badge-zero', count === 0);
            });
            if (floatBadge) {
                floatBadge.textContent = count > 9 ? '9+' : String(count);
                floatBadge.classList.toggle('dmfm-badge-zero', count === 0);
            }
            if (subText) subText.textContent = count > 0 ? (count + ' unread message' + (count>1?'s':'')) : 'Buyer inquiries & deals';
        };
        // Legacy resume-conversation hook (login redirect flow) — opens the new inbox instead of writing to Firebase
        window.startConversation = async function(otherUid, prefillMsg) {
            if (typeof window.openMessagesModal === 'function') window.openMessagesModal();
        };



        //  Announcement Bar Logic 
        function updateAnnouncementBar(data, user) {
            const usernameEl   = document.getElementById('annUsername');
            const planBadgeEl  = document.getElementById('annPlanBadge');
            const upgradeBtn   = document.getElementById('annUpgradeBtn');
            const dashBtn      = document.getElementById('annDashboardBtn');
            if (!usernameEl || !planBadgeEl) return;

            const plan = (data && data.plan) ? data.plan : 'Free';
            const planKey = plan.toLowerCase();

            const dotEl = document.getElementById('annDot');
            const sepEl = document.getElementById('annSep');

            // Username
            usernameEl.classList.remove('skel');
            if (user) {
                const rawName = (data && data.username) ? data.username : (user.email ? user.email.split('@')[0] : 'user');
                const truncated = rawName.length > 10 ? rawName.slice(0, 10) + '…' : rawName;
                usernameEl.innerHTML = '<span class="ann-at">@</span>' + truncated;
                usernameEl.classList.remove('not-logged');
                if (dotEl) { dotEl.className = 'ann-dot online'; }
                if (sepEl) { sepEl.style.display = 'block'; }
            } else {
                usernameEl.textContent = 'Not signed in';
                usernameEl.classList.add('not-logged');
                if (dotEl) { dotEl.className = 'ann-dot'; }
                if (sepEl) { sepEl.style.display = 'none'; }
            }

            // Plan badge
            planBadgeEl.classList.remove('skel');
            planBadgeEl.textContent = plan;
            planBadgeEl.className = 'ann-plan-badge plan-' + planKey;

            // Right button: upgrade if free or not logged in, dashboard if on a plan
            const onPlan = user && plan !== 'Free';
            if (upgradeBtn) upgradeBtn.style.display = onPlan ? 'none' : 'inline-flex';
            if (dashBtn)    dashBtn.style.display    = onPlan ? 'inline-flex' : 'none';
        }

        //  Cancel plan modal 
        const PLAN_LOSE_FEATURES = {
            Starter: ['5 listings/day (reverts to 1)','15% fee reverts to 30%','Priority search visibility','Email support (24h)','Basic analytics'],
            Growth:  ['15 listings/day (reverts to 1)','10% fee reverts to 30%','Featured listing highlights','Priority support (4h)','Advanced analytics','Bulk management tools'],
            Pro:     ['Unlimited listings (reverts to 1)','5% fee reverts to 30%','Top search placement','Dedicated account manager','24/7 live chat','Custom storefront']
        };

        window.openCancelPlanModal = function() {
            const plan = (window._fbUserData && window._fbUserData.plan) || 'Free';
            if (plan === 'Free') return;
            const subtext = document.getElementById('cancelPlanSubtext');
            const loseList = document.getElementById('cancelPlanLoseList');
            if (subtext) subtext.textContent = 'Your ' + plan + ' plan stays active until end of the current billing period. After that your account reverts to Free (30% fee, 1 listing/day).';
            if (loseList) {
                loseList.innerHTML = '';
                (PLAN_LOSE_FEATURES[plan] || []).forEach(item => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:11.5px;color:rgba(248,113,113,0.75);';
                    row.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;"><path d="M2 2l6 6M8 2L2 8" stroke="#f87171" stroke-width="1.3" stroke-linecap="round"/></svg>' + item;
                    loseList.appendChild(row);
                });
            }
            const overlay = document.getElementById('cancelPlanOverlay');
            if (overlay) { overlay.classList.add('open'); lockBodyScroll(); }
        };

        window.closeCancelPlanModal = function() {
            const overlay = document.getElementById('cancelPlanOverlay');
            if (overlay) { overlay.classList.remove('open'); unlockBodyScroll(); }
        };

        window.confirmCancelPlan = async function() {
            const user = auth.currentUser;
            if (!user) return;
            const subId = window._fbUserData && window._fbUserData.paypalSubId;
            const btn = document.getElementById('cancelPlanConfirmBtn');
            if (btn) { btn.textContent = 'Cancelling…'; btn.disabled = true; }

            try {
                // 1. Call your serverless function to cancel the PayPal subscription
                if (subId) {
                    const idToken = await user.getIdToken();
                    const resp = await fetch('/api/cancel-subscription', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + idToken
                        },
                        body: JSON.stringify({ subscriptionId: subId, uid: user.uid })
                    });
                    if (!resp.ok) throw new Error('Cancel API error ' + resp.status);
                }

                // 2. Mark as cancelled in Firebase — plan stays until period end
                // PayPal webhook will set plan back to Free on BILLING.SUBSCRIPTION.CANCELLED
                await update(ref(db, 'users/' + user.uid), {
                    planCancelledAt: Date.now(),
                    planCancelPending: true,
                    paypalSubId: null
                });

                closeCancelPlanModal();

                // Show confirmation toast
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;top:74px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);border-radius:12px;padding:10px 18px;display:flex;align-items:center;gap:8px;font-family:"Syne",sans-serif;font-size:13px;font-weight:700;color:#f87171;box-shadow:0 4px 24px rgba(0,0,0,0.4);white-space:nowrap;';
                toast.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f87171" stroke-width="1.3"/><path d="M5 5l4 4M9 5L5 9" stroke="#f87171" stroke-width="1.3" stroke-linecap="round"/></svg> Plan cancelled — active until end of billing period';
                document.body.appendChild(toast);
                setTimeout(() => { toast.style.transition = 'opacity .4s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);

            } catch(e) {
                console.error('[confirmCancelPlan]', e);
                if (btn) { btn.textContent = 'Error — try again'; btn.disabled = false; }
            }
        };

        //  Per-user deterministic avatar color 
        const AVATAR_GRADIENTS = [
            ['#a855f7','#818cf8'], // purple→pink (default)
            ['#38bdf8','#818cf8'], // sky→indigo
            ['#34d399','#38bdf8'], // emerald→sky
            ['#fbbf24','#f97316'], // amber→orange
            ['#818cf8','#fb7185'], // pink→rose
            ['#818cf8','#a855f7'], // indigo→purple
            ['#34d399','#a855f7'], // emerald→purple
            ['#38bdf8','#34d399'], // sky→emerald
            ['#fb923c','#818cf8'], // orange→pink
            ['#a3e635','#38bdf8'], // lime→sky
            ['#e879f9','#818cf8'], // fuchsia→indigo
            ['#2dd4bf','#38bdf8'], // teal→sky
        ];
        function avatarGradientForUser(uid) {
            if (!uid) return AVATAR_GRADIENTS[0];
            let hash = 0;
            for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
            return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
        }
        function applyAvatarColor(el, uid) {
            const [c1, c2] = avatarGradientForUser(uid);
            el.style.background = `linear-gradient(135deg,${c1},${c2})`;
        }
        // Expose early so Imgur block can use it even if loaded before auth script runs
        if (!window._avatarGradientForUser) window._avatarGradientForUser = avatarGradientForUser;

        function updateAvatar(user){
            const av = $('avatarBtn');
            const guestIcon = $('avatarGuestIcon');
            const userChip = $('headerUserChip');
            const userNameEl = $('headerUserName');
            if(user){
                // Switch from sign-in button style to circle avatar style
                av.classList.remove('header-signin-btn');
                av.classList.add('avatar');
                // Hide guest icon, show initial letter
                if(guestIcon) guestIcon.style.display = 'none';
                av.textContent = ''; // clear SVG text
                // Unique gradient per user
                applyAvatarColor(av, user.uid);
                // Set initial
                const initial = document.createElement('span');
                initial.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
                av.appendChild(initial);
                // Load photoURL from Firebase if available
                get(ref(db,'users/'+user.uid+'/photoURL')).then(snap=>{
                    const url = snap && snap.val();
                    if(url && window._applyPhotoURL) window._applyPhotoURL(url);
                }).catch(()=>{});
                // Show username chip — populated once _fbUserData is ready
                // We use a small poll so auth loads before DB data
                if(userChip && userNameEl) {
                    const pollUsername = setInterval(() => {
                        const uData = window._fbUserData;
                        const name = (uData && uData.username) || user.displayName || (user.email ? user.email.split('@')[0] : '');
                        if(name) {
                            userNameEl.textContent = '@' + name;
                            userChip.style.display = 'flex';
                            // Update browser tab title
                            document.title = name + ' · Siterifty.com';
                            clearInterval(pollUsername);
                        }
                    }, 250);
                    // Fallback: show email prefix after 2s
                    setTimeout(() => {
                        clearInterval(pollUsername);
                        if(userChip.style.display === 'none' || !userNameEl.textContent) {
                            const fallback = user.displayName || (user.email ? user.email.split('@')[0] : '');
                            if(fallback) {
                                userNameEl.textContent = '@' + fallback;
                                userChip.style.display = 'flex';
                                document.title = fallback + ' · Siterifty.com';
                            }
                        }
                    }, 2000);
                }
            } else {
                // Restore guest SVG icon
                av.textContent = '';
                av.style.backgroundImage = '';
                av.style.backgroundSize = '';
                av.style.backgroundPosition = '';
                av.style.background = 'linear-gradient(135deg,#2a2a3e,#1e1e2e)';
                // Re-insert SVG if it was removed
                if(!$('avatarGuestIcon')){
                    av.innerHTML = '<svg width="17" height="17" viewBox="0 0 17 17" fill="none" id="avatarGuestIcon"><circle cx="8.5" cy="5.5" r="3" stroke="rgba(255,255,255,0.7)" stroke-width="1.4"/><path d="M2 15c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="rgba(255,255,255,0.7)" stroke-width="1.4" stroke-linecap="round"/></svg>';
                } else {
                    $('avatarGuestIcon').style.display = '';
                }
                // Hide username chip + reset title
                if(userChip) userChip.style.display = 'none';
                if(userNameEl) userNameEl.textContent = '';
                document.title = 'Siterifty.com';
            }
        }

        //  country + phone code data 
        const COUNTRIES = [
          {name:"Afghanistan",code:"AF",dial:"+93"},{name:"Albania",code:"AL",dial:"+355"},{name:"Algeria",code:"DZ",dial:"+213"},{name:"Andorra",code:"AD",dial:"+376"},{name:"Angola",code:"AO",dial:"+244"},{name:"Argentina",code:"AR",dial:"+54"},{name:"Armenia",code:"AM",dial:"+374"},{name:"Australia",code:"AU",dial:"+61"},{name:"Austria",code:"AT",dial:"+43"},{name:"Azerbaijan",code:"AZ",dial:"+994"},{name:"Bahamas",code:"BS",dial:"+1-242"},{name:"Bahrain",code:"BH",dial:"+973"},{name:"Bangladesh",code:"BD",dial:"+880"},{name:"Belarus",code:"BY",dial:"+375"},{name:"Belgium",code:"BE",dial:"+32"},{name:"Belize",code:"BZ",dial:"+501"},{name:"Benin",code:"BJ",dial:"+229"},{name:"Bolivia",code:"BO",dial:"+591"},{name:"Bosnia",code:"BA",dial:"+387"},{name:"Botswana",code:"BW",dial:"+267"},{name:"Brazil",code:"BR",dial:"+55"},{name:"Brunei",code:"BN",dial:"+673"},{name:"Bulgaria",code:"BG",dial:"+359"},{name:"Burkina Faso",code:"BF",dial:"+226"},{name:"Cambodia",code:"KH",dial:"+855"},{name:"Cameroon",code:"CM",dial:"+237"},{name:"Canada",code:"CA",dial:"+1"},{name:"Chile",code:"CL",dial:"+56"},{name:"China",code:"CN",dial:"+86"},{name:"Colombia",code:"CO",dial:"+57"},{name:"Congo",code:"CG",dial:"+242"},{name:"Costa Rica",code:"CR",dial:"+506"},{name:"Croatia",code:"HR",dial:"+385"},{name:"Cuba",code:"CU",dial:"+53"},{name:"Cyprus",code:"CY",dial:"+357"},{name:"Czech Republic",code:"CZ",dial:"+420"},{name:"Denmark",code:"DK",dial:"+45"},{name:"Dominican Republic",code:"DO",dial:"+1-809"},{name:"Ecuador",code:"EC",dial:"+593"},{name:"Egypt",code:"EG",dial:"+20"},{name:"El Salvador",code:"SV",dial:"+503"},{name:"Estonia",code:"EE",dial:"+372"},{name:"Ethiopia",code:"ET",dial:"+251"},{name:"Finland",code:"FI",dial:"+358"},{name:"France",code:"FR",dial:"+33"},{name:"Georgia",code:"GE",dial:"+995"},{name:"Germany",code:"DE",dial:"+49"},{name:"Ghana",code:"GH",dial:"+233"},{name:"Greece",code:"GR",dial:"+30"},{name:"Guatemala",code:"GT",dial:"+502"},{name:"Honduras",code:"HN",dial:"+504"},{name:"Hong Kong",code:"HK",dial:"+852"},{name:"Hungary",code:"HU",dial:"+36"},{name:"Iceland",code:"IS",dial:"+354"},{name:"India",code:"IN",dial:"+91"},{name:"Indonesia",code:"ID",dial:"+62"},{name:"Iran",code:"IR",dial:"+98"},{name:"Iraq",code:"IQ",dial:"+964"},{name:"Ireland",code:"IE",dial:"+353"},{name:"Israel",code:"IL",dial:"+972"},{name:"Italy",code:"IT",dial:"+39"},{name:"Jamaica",code:"JM",dial:"+1-876"},{name:"Japan",code:"JP",dial:"+81"},{name:"Jordan",code:"JO",dial:"+962"},{name:"Kazakhstan",code:"KZ",dial:"+7"},{name:"Kenya",code:"KE",dial:"+254"},{name:"Kuwait",code:"KW",dial:"+965"},{name:"Latvia",code:"LV",dial:"+371"},{name:"Lebanon",code:"LB",dial:"+961"},{name:"Libya",code:"LY",dial:"+218"},{name:"Lithuania",code:"LT",dial:"+370"},{name:"Luxembourg",code:"LU",dial:"+352"},{name:"Malaysia",code:"MY",dial:"+60"},{name:"Maldives",code:"MV",dial:"+960"},{name:"Malta",code:"MT",dial:"+356"},{name:"Mexico",code:"MX",dial:"+52"},{name:"Moldova",code:"MD",dial:"+373"},{name:"Monaco",code:"MC",dial:"+377"},{name:"Mongolia",code:"MN",dial:"+976"},{name:"Morocco",code:"MA",dial:"+212"},{name:"Mozambique",code:"MZ",dial:"+258"},{name:"Myanmar",code:"MM",dial:"+95"},{name:"Namibia",code:"NA",dial:"+264"},{name:"Nepal",code:"NP",dial:"+977"},{name:"Netherlands",code:"NL",dial:"+31"},{name:"New Zealand",code:"NZ",dial:"+64"},{name:"Nicaragua",code:"NI",dial:"+505"},{name:"Nigeria",code:"NG",dial:"+234"},{name:"North Korea",code:"KP",dial:"+850"},{name:"Norway",code:"NO",dial:"+47"},{name:"Oman",code:"OM",dial:"+968"},{name:"Pakistan",code:"PK",dial:"+92"},{name:"Panama",code:"PA",dial:"+507"},{name:"Paraguay",code:"PY",dial:"+595"},{name:"Peru",code:"PE",dial:"+51"},{name:"Philippines",code:"PH",dial:"+63"},{name:"Poland",code:"PL",dial:"+48"},{name:"Portugal",code:"PT",dial:"+351"},{name:"Qatar",code:"QA",dial:"+974"},{name:"Romania",code:"RO",dial:"+40"},{name:"Russia",code:"RU",dial:"+7"},{name:"Saudi Arabia",code:"SA",dial:"+966"},{name:"Senegal",code:"SN",dial:"+221"},{name:"Serbia",code:"RS",dial:"+381"},{name:"Singapore",code:"SG",dial:"+65"},{name:"Slovakia",code:"SK",dial:"+421"},{name:"Slovenia",code:"SI",dial:"+386"},{name:"Somalia",code:"SO",dial:"+252"},{name:"South Africa",code:"ZA",dial:"+27"},{name:"South Korea",code:"KR",dial:"+82"},{name:"Spain",code:"ES",dial:"+34"},{name:"Sri Lanka",code:"LK",dial:"+94"},{name:"Sudan",code:"SD",dial:"+249"},{name:"Sweden",code:"SE",dial:"+46"},{name:"Switzerland",code:"CH",dial:"+41"},{name:"Syria",code:"SY",dial:"+963"},{name:"Taiwan",code:"TW",dial:"+886"},{name:"Tanzania",code:"TZ",dial:"+255"},{name:"Thailand",code:"TH",dial:"+66"},{name:"Tunisia",code:"TN",dial:"+216"},{name:"Turkey",code:"TR",dial:"+90"},{name:"Uganda",code:"UG",dial:"+256"},{name:"Ukraine",code:"UA",dial:"+380"},{name:"United Arab Emirates",code:"AE",dial:"+971"},{name:"United Kingdom",code:"GB",dial:"+44"},{name:"United States",code:"US",dial:"+1"},{name:"Uruguay",code:"UY",dial:"+598"},{name:"Uzbekistan",code:"UZ",dial:"+998"},{name:"Venezuela",code:"VE",dial:"+58"},{name:"Vietnam",code:"VN",dial:"+84"},{name:"Yemen",code:"YE",dial:"+967"},{name:"Zambia",code:"ZM",dial:"+260"},{name:"Zimbabwe",code:"ZW",dial:"+263"}
        ];

        function populateCountryDropdowns(savedCountry='', savedDial=''){
            const countrySelect = $('addrCountry');
            const phoneSelect   = $('addrPhoneCode');
            if(!countrySelect || !phoneSelect) return;

            // Country dropdown
            countrySelect.innerHTML = '<option value="">Select country…</option>';
            COUNTRIES.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                if(c.name === savedCountry) opt.selected = true;
                countrySelect.appendChild(opt);
            });

            // Phone code dropdown
            phoneSelect.innerHTML = '';
            COUNTRIES.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.dial;
                opt.textContent = c.dial + ' ' + c.name;
                if(c.dial === savedDial) opt.selected = true;
                phoneSelect.appendChild(opt);
            });

            // Auto-select phone code when country changes
            countrySelect.addEventListener('change', () => {
                const found = COUNTRIES.find(c => c.name === countrySelect.value);
                if(found) phoneSelect.value = found.dial;
            });
        }

        //  password toggle 
        window.togglePw = function(inputId, btn){
            const inp = $(inputId);
            if(!inp) return;
            const isText = inp.type === 'text';
            inp.type = isText ? 'password' : 'text';
            btn.style.opacity = isText ? '1' : '0.5';
        };

        //  password confirm validation 
        document.addEventListener('DOMContentLoaded', () => {
            const pw1 = $('accPassword'), pw2 = $('accPasswordConfirm'), hint = $('pwMatchHint');
            if(!pw1 || !pw2 || !hint) return;
            function checkMatch(){
                if(!pw2.value){ hint.className='field-hint'; hint.textContent=''; return; }
                if(pw1.value === pw2.value){
                    hint.className='field-hint show ok'; hint.innerHTML='<svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="margin-right:3px;vertical-align:middle;"><path d="M2 5.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Passwords match';
                    pw2.className='dash-input valid';
                } else {
                    hint.className='field-hint show err'; hint.textContent='Passwords do not match';
                    pw2.className='dash-input invalid';
                }
            }
            pw2.addEventListener('input', checkMatch);
            pw1.addEventListener('input', checkMatch);
        });

        //  dashboard load 
        async function loadDash(){
            const user = auth.currentUser;
            if(!user) return;

            // Show spinner, hide content
            const spinner = $('dashSpinner');
            if(spinner) { spinner.classList.remove('hidden'); }

            // Safety: force-hide spinner after 8s no matter what
            const safetyDismiss = setTimeout(() => {
                if(spinner) spinner.classList.add('hidden');
            }, 8000);

            // Content containers are managed per-tab now

            try {
                const snap = await get(ref(db,'users/'+user.uid));
                const data = snap.val() || {};

                const username = data.username || 'there';
                $('dashGreeting').textContent = 'Hey, '+username;
                $('dashEmailLine').textContent = user.email;
                if($('dashAvatarLg')){ var _dph=window._cachedPhotoURL; if(_dph && window._applyPhotoURL){ window._applyPhotoURL(_dph); } else { $('dashAvatarLg').textContent = username.charAt(0).toUpperCase(); } }
                $('currentPlanBadge').innerHTML = `<svg width="9" height="9" viewBox="0 0 10 10" fill="none" style="flex-shrink:0"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z" fill="currentColor"/></svg><span style="font-size:11px;letter-spacing:.01em;">${(data.plan||'Free').toUpperCase()} PLAN</span>`;

                // Refresh announcement bar with latest plan data
                updateAnnouncementBar(data, user);

                // account tab
                $('accUsername').value = username;
                $('accEmail').value    = user.email||'';
                if($('accBio')){ $('accBio').value = data.bio || ''; var _bc=$('accBioCount'); if(_bc) _bc.textContent=(data.bio||'').length; }
                if($('acctPayoutPaypalEmail')){ $('acctPayoutPaypalEmail').value = data.payoutEmail || ''; } if($('acctPayoutCurrency')){ $('acctPayoutCurrency').value = data.payoutCurrency || 'USD'; } if($('acctAutoWithdraw')){ $('acctAutoWithdraw').value = data.autoWithdrawSchedule || 'off'; } if($('payoutPaypalEmail')){ $('payoutPaypalEmail').value = data.payoutEmail || ''; } if($('payoutCurrency')){ $('payoutCurrency').value = data.payoutCurrency || 'USD'; } if($('payoutAutoWithdraw')){ $('payoutAutoWithdraw').value = data.autoWithdrawSchedule || 'off'; } if($('acctAutoWithdrawMin')){ $('acctAutoWithdrawMin').value = data.autoWithdrawMin || 50; } if($('payoutAutoWithdrawMin')){ $('payoutAutoWithdrawMin').value = data.autoWithdrawMin || 50; } if(typeof awToggleMinRow==='function'){ awToggleMinRow('acct'); awToggleMinRow('sub'); }
                // Populate + collapse the 3D cartoon payout summary card if a PayPal email is already saved
                if ($('acctPayoutSummaryEmail')) {
                    if (data.payoutEmail) {
                        $('acctPayoutSummaryEmail').textContent = data.payoutEmail;
                        var _awSched = data.autoWithdrawSchedule || 'off';
                        var _awLabel = _awSched === 'off' ? 'Off — manual only' : (_awSched.charAt(0).toUpperCase() + _awSched.slice(1));
                        $('acctPayoutSummaryMeta').textContent = _awSched === 'off' ? _awLabel : _awLabel + ' • Min $' + (data.autoWithdrawMin || 50);
                        if ($('acctPayoutCard')) $('acctPayoutCard').classList.add('pc-collapsed');
                    } else {
                        if ($('acctPayoutCard')) $('acctPayoutCard').classList.remove('pc-collapsed');
                    }
                }

                // Settings panel
                const planName = data.plan || 'Free';
                if($('settingsAvatarCircle')) $('settingsAvatarCircle').textContent = username.charAt(0).toUpperCase();
                if($('settingsName')) $('settingsName').textContent = username;
                if($('settingsEmail')) $('settingsEmail').textContent = user.email||'';
                if($('settingsPlanBadge')) {
                    const planColors = {Free:'rgba(168,85,247,.3)',Starter:'rgba(168,85,247,.3)',Growth:'rgba(129,140,248,.35)',Pro:'rgba(56,189,248,.35)'};
                    $('settingsPlanBadge').style.borderColor = planColors[planName]||planColors.Free;
                    $('settingsPlanBadge').innerHTML = `<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z" fill="currentColor"/></svg> ${planName.toUpperCase()} PLAN`;
                }

                //  Populate My Sites (listed) 
                const listedContent = $('tabOrdersContent');
                const listedSkel    = $('tabOrdersSkeleton');
                const listedEmpty   = $('msListedEmpty');
                if (listedSkel)  listedSkel.style.display = 'none';
                if (listedContent) {
                    listedContent.style.display = '';
                    // data.listings is an object keyed by listing id
                    const listings = data.listings ? Object.values(data.listings) : [];
                    if (listings.length === 0) {
                        listedContent.innerHTML = '';
                        if (listedEmpty) listedEmpty.style.display = 'flex';
                    } else {
                        if (listedEmpty) listedEmpty.style.display = 'none';
                        listedContent.innerHTML = listings.map(l => {
                            const img = l.images && l.images[0] ? l.images[0] : null;
                            const thumbHtml = img
                                ? `<img src="${img}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;border-radius:11px 11px 0 0;" onerror="this.parentElement.style.display='none'">`
                                : `<div style="width:100%;height:80px;border-radius:11px 11px 0 0;background:linear-gradient(135deg,rgba(168,85,247,0.12),rgba(129,140,248,0.07));display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="#a855f7" stroke-width="1.2"/><path d="M2 6h12" stroke="#a855f7" stroke-width="1.2"/><circle cx="13" cy="9" r=".8" fill="#a855f7"/></svg></div>`;
                            return `
                            <div style="background:linear-gradient(145deg,rgba(168,85,247,0.05),rgba(255,255,255,0.02));border:1px solid rgba(168,85,247,0.14);border-radius:13px;margin-bottom:10px;overflow:hidden;">
                                ${thumbHtml}
                                <div style="padding:11px 12px 10px;">
                                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px;">
                                        <div style="min-width:0;">
                                            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.title || l.url || 'Untitled listing'}</div>
                                            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${l.price ? '$' + Number(l.price).toLocaleString() : 'Price TBD'} &middot; ${l.category || 'Website'}</div>
                                        </div>
                                        <div style="font-size:10px;font-weight:700;letter-spacing:.05em;padding:3px 9px;border-radius:999px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.28);color:#34d399;flex-shrink:0;">LIVE</div>
                                    </div>
                                    <div style="display:flex;gap:7px;">
                                        <a href="/sell-my-site${l.id ? '?edit=' + l.id : ''}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:9px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.22);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--accent);text-decoration:none;transition:opacity .15s;" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 8V9.5h1.5L9 3 7.5 1.5 1 8ZM9.7 2.3a.4.4 0 0 0 0-.57L8.77 .8a.4.4 0 0 0-.57 0l-.73.73 1.5 1.5.73-.73Z" fill="currentColor"/></svg>
                                            Manage
                                        </a>
                                        <a href="/listing${l.id ? '?id=' + l.id : ''}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);text-decoration:none;transition:opacity .15s;" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="5.5" r="1.5" fill="currentColor"/></svg>
                                            View Live
                                        </a>
                                    </div>
                                </div>
                            </div>`;
                        }).join('');
                    }
                }

                //  Populate My Sites (bought) 
                const boughtContent = $('msBoughtContent');
                const boughtSkel    = $('msBoughtSkeleton');
                const boughtEmpty   = $('msBoughtEmpty');
                if (boughtSkel)  boughtSkel.style.display = 'none';
                if (boughtContent) {
                    boughtContent.style.display = '';
                    const purchases = data.purchases ? Object.values(data.purchases) : [];
                    if (purchases.length === 0) {
                        boughtContent.innerHTML = '';
                        if (boughtEmpty) boughtEmpty.style.display = 'flex';
                    } else {
                        if (boughtEmpty) boughtEmpty.style.display = 'none';
                        boughtContent.innerHTML = purchases.map(p => {
                            const img = p.images && p.images[0] ? p.images[0] : null;
                            const thumbHtml = img
                                ? `<img src="${img}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;border-radius:11px 11px 0 0;" onerror="this.parentElement.style.display='none'">`
                                : `<div style="width:100%;height:80px;border-radius:11px 11px 0 0;background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(52,211,153,0.06));display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M2 13l1.5-5h9L14 13H2Z" stroke="#38bdf8" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 8V6a3 3 0 1 1 6 0v2" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round"/></svg></div>`;
                            return `
                            <div style="background:linear-gradient(145deg,rgba(56,189,248,0.05),rgba(255,255,255,0.02));border:1px solid rgba(56,189,248,0.14);border-radius:13px;margin-bottom:10px;overflow:hidden;">
                                ${thumbHtml}
                                <div style="padding:11px 12px 10px;">
                                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px;">
                                        <div style="min-width:0;">
                                            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title || p.url || 'Purchased site'}</div>
                                            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${p.paid ? 'Paid $' + Number(p.paid).toLocaleString() : 'Acquired'} &middot; ${p.date ? new Date(p.date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : 'Owned'}</div>
                                        </div>
                                        <div style="font-size:10px;font-weight:700;letter-spacing:.05em;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.28);color:#38bdf8;flex-shrink:0;">OWNED</div>
                                    </div>
                                    <div style="display:flex;gap:7px;">
                                        <a href="/sell-my-site${p.siteId ? '?manage=' + p.siteId : ''}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:9px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.22);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#38bdf8;text-decoration:none;transition:opacity .15s;" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.1"/><path d="M3.5 5.5h4M5.5 3.5v4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
                                            Manage Site
                                        </a>
                                        <a href="${p.url ? p.url : '/browse'}" target="_blank" rel="noopener" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);text-decoration:none;transition:opacity .15s;" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M6.5 1.5H9.5v3M4.5 6.5L9.5 1.5M5.5 2.5H2A1 1 0 0 0 1 3.5v5.5A1 1 0 0 0 2 10h5.5A1 1 0 0 0 8.5 9V5.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                            Visit Site
                                        </a>
                                    </div>
                                </div>
                            </div>`;
                        }).join('');
                    }
                }

                // Auto-fill support form if already on support tab
                prefillSupportForm();

                // Single continuous page — initialize sections that used to
                // only load when their tab/sub-tab was activated.
                renderSupportTierBar();
                _initAcOffersPanel();

                //  Account tab: current plan + billing 
                populateAccountTab(data, user);
            } catch(e) {
                console.error('loadDash error:', e);
            } finally {
                clearTimeout(safetyDismiss);
                // Hide skeletons for bought panel (listed/support already handled above)
                const boughtSkel2 = $('msBoughtSkeleton');
                if (boughtSkel2) boughtSkel2.style.display = 'none';

                // Hide spinner
                if(spinner) spinner.classList.add('hidden');
                // Load notification prefs in background
                if(window.loadNotifPrefs) window.loadNotifPrefs();
            }
        }

        //  Account tab population 
        const PLAN_META = {
            Free:    { price: 0,  color: '#8b8aa8', glow: 'rgba(139,138,168,.25)', desc: 'Get started — list up to 1 site/day, 30% platform fee on every sale.' },
            Starter: { price: 20, color: '#a855f7', glow: 'rgba(168,85,247,.3)',   desc: '5 listings/day, 15% platform fee — save 15% vs Free.' },
            Growth:  { price: 40, color: '#818cf8', glow: 'rgba(129,140,248,.35)', desc: 'Unlimited monthly listings, 10% fee, featured placement.' },
            Pro:     { price: 50, color: '#38bdf8', glow: 'rgba(56,189,248,.35)',  desc: 'Unlimited everything, only 5% fee — the lowest on the platform.' }
        };

        function populateAccountTab(data, user) {
            const plan  = data.plan || 'Free';
            const meta  = PLAN_META[plan] || PLAN_META.Free;
            const bal   = parseFloat(data.balance || 0);

            //  New: Settings-style top row 
            const emailEl = $('settingsEmail');
            if (emailEl) emailEl.textContent = user.email || '—';

            //  Stats: member since, last active, listings count 
            const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                            'Jul','Aug','Sep','Oct','Nov','Dec'];

            function _relTime(ts) {
                if (!ts) return null;
                const diffMs  = Date.now() - ts;
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 2)   return 'Just now';
                if (diffMin < 60)  return diffMin + 'm ago';
                const diffHr = Math.floor(diffMin / 60);
                if (diffHr  < 24)  return diffHr + 'h ago';
                const diffDay = Math.floor(diffHr / 24);
                if (diffDay < 7)   return diffDay + 'd ago';
                if (diffDay < 30)  return Math.floor(diffDay / 7) + 'w ago';
                const d = new Date(ts);
                return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
            }

            const memberSinceEl = $('statsMemberSince');
            const acctMemberSinceEl = $('acctStatsMemberSince');
            if (memberSinceEl || acctMemberSinceEl) {
                const ts = data.createdAt
                    || (user.metadata && user.metadata.creationTime
                        ? new Date(user.metadata.creationTime).getTime()
                        : null);
                if (ts) {
                    const d = new Date(ts);
                    const text = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
                    if (memberSinceEl) memberSinceEl.textContent = text;
                    if (acctMemberSinceEl) acctMemberSinceEl.textContent = text;
                } else {
                    if (memberSinceEl) memberSinceEl.textContent = '—';
                    if (acctMemberSinceEl) acctMemberSinceEl.textContent = '—';
                }
            }

            const lastSeenEl = $('statsLastSeen');
            const acctLastSeenEl = $('acctStatsLastSeen');
            if (lastSeenEl || acctLastSeenEl) {
                // Prefer DB-stored lastSeen, fall back to Firebase Auth lastSignInTime
                const lastTs = data.lastSeen
                    || (user.metadata && user.metadata.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).getTime()
                        : null);
                const text = _relTime(lastTs) || 'Now';
                if (lastSeenEl) lastSeenEl.textContent = text;
                if (acctLastSeenEl) acctLastSeenEl.textContent = text;
            }
            // Listings count comes from the websites/ collection, not data.listings
            // (data.listings isn't a real field — sellerUid/userId on each website node is the source of truth)
            const listingsEl = $('statsListingsCount');
            const acctListingsEl = $('acctStatsListingsCount');
            if (listingsEl) listingsEl.textContent = '—';
            if (acctListingsEl) acctListingsEl.textContent = '—';
            const acListEl = $('acStatListings');
            if (acListEl) acListEl.textContent = '—';
            if ((listingsEl || acctListingsEl || acListEl) && window._fbDb && window._fbDbFns) {
                const _fns = window._fbDbFns;
                _fns.get(_fns.ref(window._fbDb, 'websites')).then(snap => {
                    let count = 0;
                    if (snap.exists()) {
                        const all = snap.val() || {};
                        count = Object.values(all).filter(w => w && (w.sellerUid === user.uid || w.userId === user.uid)).length;
                    }
                    if (listingsEl) listingsEl.textContent = count;
                    if (acctListingsEl) acctListingsEl.textContent = count;
                    if (acListEl) acListEl.textContent = count;
                }).catch(() => {
                    if (listingsEl) listingsEl.textContent = '0';
                    if (acctListingsEl) acctListingsEl.textContent = '0';
                    if (acListEl) acListEl.textContent = '0';
                });
            }

            //  Quick stats row: Listed / Sold / Balance 
            const soldCount = data.sold ? Object.keys(data.sold).length : (data.soldCount || 0);
            const acSoldEl = $('acStatSold');
            if (acSoldEl) acSoldEl.textContent = soldCount;
            const acBalEl = $('acStatBalance');
            if (acBalEl) acBalEl.textContent = fmtBal(bal);

            const pillEl = $('settingsPlanBadge');
            if (pillEl) pillEl.textContent = plan.toUpperCase();

            //  Hero card: avatar initial + display name 
            const _heroUsername = data.username || user.email?.split('@')[0] || '?';
            if ($('settingsAvatarHero')) {
                const _heroEl = $('settingsAvatarHero');
                const _heroUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
                const [_hc1, _hc2] = (window._avatarGradientForUser || function(){ return ['#a855f7','#818cf8']; })(_heroUid);
                _heroEl.style.background = `linear-gradient(135deg,${_hc1},${_hc2})`;
                _heroEl.textContent = _heroUsername.charAt(0).toUpperCase();
                // If they have a photo, applyPhotoURL will override
                const _snap = window._cachedPhotoURL;
                if (_snap && window._applyPhotoURL) window._applyPhotoURL(_snap);
            }
            if ($('settingsHeroName'))     $('settingsHeroName').textContent     = _heroUsername;
            if ($('profilePlanBadgeHero')) $('profilePlanBadgeHero').textContent = plan;
            // Apply stored profile photo if present
            if (data.photoURL && window._applyPhotoURL) window._applyPhotoURL(data.photoURL);
            if ($('profileDisplayName')) $('profileDisplayName').textContent = _heroUsername;
            if ($('profileEmailText')) $('profileEmailText').textContent = user.email || '—';
            if ($('profileEmailVerified')) $('profileEmailVerified').style.display = user.emailVerified ? 'inline-flex' : 'none';
            if ($('profileEmailDisplay')) $('profileEmailDisplay').querySelector('span') && ($('profileEmailDisplay').querySelector('span').textContent = user.email||'');

            // Show upgrade card only on Free plan
            const upgradeCard = $('settingsUpgradeCard');
            if (upgradeCard) upgradeCard.classList.toggle('hidden', plan !== 'Free');

            //  Billing sub-panel 
            const billingBody = $('subBillingBody');
            if (billingBody) {
                const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const now = new Date();
                const nextMonth = (now.getMonth() + 1) % 12;
                const nextYear  = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
                const nextBillStr = '1 ' + MONTHS[nextMonth] + ' ' + nextYear;

                const SITE_DOMAIN = window.location.hostname || 'siterifty.com';
                const isPaidPlan = plan !== 'Free';
                billingBody.innerHTML = `
                    <!--  Current plan card  -->
                    <div class="settings-identity-card" style="margin-bottom:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <span style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--text);">${plan} Plan</span>
                            <span class="settings-plan-pill" style="${isPaidPlan ? 'background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3);color:#34d399;' : ''}">${isPaidPlan ? 'ACTIVE' : 'FREE'}</span>
                        </div>
                        <div style="font-size:12px;color:var(--muted);">${meta.price === 0 ? 'Free forever · no card required' : '$' + meta.price + '/month · cancel anytime'}</div>
                        ${isPaidPlan ? `<div style="font-size:11px;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">Next billing: <span style="color:var(--accent);font-weight:600;">${nextBillStr}</span></div>` : ''}
                        ${isPaidPlan ? `
                        <button onclick="openCancelPlanModal()" style="margin-top:12px;width:100%;padding:10px;border-radius:11px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);color:#f87171;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;touch-action:manipulation;" onmouseover="this.style.background='rgba(248,113,113,0.16)'" onmouseout="this.style.background='rgba(248,113,113,0.08)'">Cancel plan</button>
                        <button onclick="closeSettingsPanel('subBilling');openPlansPickerModal();" style="margin-top:8px;width:100%;padding:10px;border-radius:11px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.22);color:#a855f7;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:7px;" onmouseover="this.style.background='rgba(168,85,247,0.16)'" onmouseout="this.style.background='rgba(168,85,247,0.08)'"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Change plan</button>
                        ` : ''}
                    </div>

                    <!--  Wallet balance card  -->
                    <div class="settings-identity-card" style="margin-bottom:12px;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3.5" width="12" height="8" rx="1.5" stroke="var(--muted)" stroke-width="1.2"/><path d="M1 6h12" stroke="var(--muted)" stroke-width="1.1"/><circle cx="10.5" cy="9" r="1" fill="var(--muted)"/></svg>
                            <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);">Wallet Balance</div>
                        </div>
                        <div style="font-family:'Syne',sans-serif;font-size:2.2rem;font-weight:800;letter-spacing:-.04em;background:linear-gradient(135deg,#a855f7,#818cf8,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:12px;">$${fmtBal(bal).replace("$","")}</div>
                        <button onclick="closeSettingsPanel('subBilling');openTopUpModal();" style="width:100%;padding:11px;border-radius:11px;background:linear-gradient(135deg,rgba(255,200,80,0.15),rgba(255,170,30,0.1));border:1px solid rgba(220,185,100,0.35);color:#f5e8b0;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:7px;"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Top up wallet</button>
                    </div>

                    ${!isPaidPlan ? `
                    <!--  Plans CTA (Free users only)  -->
                    <div onclick="openPlansPickerModal()" style="position:relative;border-radius:16px;background:linear-gradient(145deg,rgba(168,85,247,0.12),rgba(129,140,248,0.07),rgba(56,189,248,0.05));border:1px solid rgba(168,85,247,0.28);padding:18px;cursor:pointer;overflow:hidden;margin-bottom:20px;transition:border-color .2s;" onmouseover="this.style.borderColor='rgba(168,85,247,0.5)'" onmouseout="this.style.borderColor='rgba(168,85,247,0.28)'">
                        <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,0.2) 0%,transparent 70%);pointer-events:none;"></div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                            <div>
                                <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--text);letter-spacing:-.02em;">Upgrade your plan</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:2px;">Lower fees · more listings · better tools</div>
                            </div>
                            <div style="width:32px;height:32px;border-radius:10px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5Z" stroke="#a855f7" stroke-width="1.3" stroke-linejoin="round"/></svg>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;margin-bottom:14px;">
                            <div style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:10px 8px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#a855f7;letter-spacing:-.03em;">$20</div>
                                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Starter</div>
                            </div>
                            <div style="flex:1;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.25);border-radius:12px;padding:10px 8px;text-align:center;position:relative;">
                                <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#818cf8,#a855f7);border-radius:999px;padding:2px 8px;font-size:8px;font-weight:700;color:#fff;letter-spacing:.04em;white-space:nowrap;">POPULAR</div>
                                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#818cf8;letter-spacing:-.03em;">$40</div>
                                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Growth</div>
                            </div>
                            <div style="flex:1;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);border-radius:12px;padding:10px 8px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#38bdf8;letter-spacing:-.03em;">$50</div>
                                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Pro</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <span style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#a855f7;">View all plans &amp; choose</span>
                            <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                    </div>
                    ` : ''}

                    <!--  PLAN BENEFITS SECTION (Free users only)  -->
                    ${!isPaidPlan ? `<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;">Why upgrade your plan</div>` : ''}

                    <!-- Fee savings explainer -->
                    <div style="background:linear-gradient(145deg,rgba(168,85,247,0.07),rgba(56,189,248,0.04));border:1px solid rgba(168,85,247,0.18);border-radius:16px;padding:18px;margin-bottom:12px;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#a855f7" stroke-width="1.2"/><path d="M8 4.5v7M5.5 6.5C5.5 5.4 6.6 5 8 5s2.5.5 2.5 1.5C10.5 8 8 8.5 8 8.5s-2.5.5-2.5 2c0 1.1 1.1 1.5 2.5 1.5s2.5-.5 2.5-1.5" stroke="#a855f7" stroke-width="1.2" stroke-linecap="round"/></svg>
                            </div>
                            <div>
                                <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Keep more of every sale</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:1px;">Platform fees drop dramatically with paid plans</div>
                            </div>
                        </div>
                        <!-- Fee comparison bar chart -->
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px;"><span>Free</span><span style="color:rgba(248,113,113,0.8);">30% fee</span></div>
                                <div style="height:6px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;"><div style="height:100%;width:100%;border-radius:999px;background:rgba(248,113,113,0.5);"></div></div>
                            </div>
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px;"><span style="color:#a855f7;">Starter</span><span style="color:#a855f7;">15% fee</span></div>
                                <div style="height:6px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;"><div style="height:100%;width:50%;border-radius:999px;background:rgba(168,85,247,0.7);"></div></div>
                            </div>
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px;"><span style="color:#818cf8;">Growth</span><span style="color:#818cf8;">10% fee</span></div>
                                <div style="height:6px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;"><div style="height:100%;width:33%;border-radius:999px;background:rgba(129,140,248,0.7);"></div></div>
                            </div>
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px;"><span style="color:#38bdf8;">Pro</span><span style="color:#38bdf8;">5% fee</span></div>
                                <div style="height:6px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;"><div style="height:100%;width:17%;border-radius:999px;background:rgba(56,189,248,0.8);"></div></div>
                            </div>
                        </div>
                        <div style="margin-top:12px;padding:10px 12px;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);border-radius:10px;font-size:11px;color:rgba(52,211,153,0.85);line-height:1.6;display:flex;align-items:flex-start;gap:8px;">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;margin-top:1px;"><circle cx="7" cy="7" r="6" stroke="rgba(52,211,153,0.6)" stroke-width="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="rgba(52,211,153,0.9)" stroke-width="1.3" stroke-linecap="round"/></svg>
                            <span>On a $5,000 sale: Free plan pays <strong style="color:#f87171;">$1,500</strong> in fees. Pro plan pays just <strong style="color:#34d399;">$250</strong>. Pro pays for itself in a single deal.</span>
                        </div>
                    </div>

                    <!-- Daily listings benefit -->
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px;margin-bottom:12px;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#818cf8" stroke-width="1.2"/><path d="M5 3V1.5M11 3V1.5M2 7h12" stroke="#818cf8" stroke-width="1.2" stroke-linecap="round"/><rect x="5" y="9" width="2" height="2" rx=".4" fill="#818cf8"/><rect x="9" y="9" width="2" height="2" rx=".4" fill="#818cf8"/></svg>
                            </div>
                            <div>
                                <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Post more listings daily</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:1px;">More visibility, more deals, faster sales</div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <div style="background:rgba(139,138,168,0.07);border:1px solid rgba(139,138,168,0.15);border-radius:10px;padding:10px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:rgba(139,138,168,0.6);">1</div>
                                <div style="font-size:9px;color:var(--muted);margin-top:2px;">Free / day</div>
                            </div>
                            <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:10px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#a855f7;">5</div>
                                <div style="font-size:9px;color:var(--muted);margin-top:2px;">Starter / day</div>
                            </div>
                            <div style="background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.2);border-radius:10px;padding:10px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#818cf8;">15</div>
                                <div style="font-size:9px;color:var(--muted);margin-top:2px;">Growth / day</div>
                            </div>
                            <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:10px;text-align:center;">
                                <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#38bdf8;">∞</div>
                                <div style="font-size:9px;color:var(--muted);margin-top:2px;">Pro / day</div>
                            </div>
                        </div>
                    </div>

                    <!-- Featured placement benefit -->
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px;margin-bottom:12px;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <div style="width:34px;height:34px;border-radius:10px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.5 3.2 3.5.5-2.5 2.4.6 3.4L8 9.3l-3.1 1.7.6-3.4L3 5.2l3.5-.5Z" stroke="#38bdf8" stroke-width="1.2" stroke-linejoin="round"/></svg>
                            </div>
                            <div>
                                <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Featured &amp; priority placement</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:1px;">Growth &amp; Pro listings appear at the top</div>
                            </div>
                        </div>
                        <!-- Mini listing previews -->
                        <div style="display:flex;flex-direction:column;gap:7px;">
                            <div style="position:relative;display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(135deg,rgba(56,189,248,0.08),rgba(168,85,247,0.05));border:1px solid rgba(56,189,248,0.25);border-radius:10px;">
                                <div style="position:absolute;top:-7px;left:10px;background:linear-gradient(135deg,#38bdf8,#a855f7);border-radius:999px;padding:1px 8px;font-size:8px;font-weight:700;color:#fff;letter-spacing:.04em;display:flex;align-items:center;gap:3px;"><svg width="8" height="8" viewBox="0 0 10 10" fill="#fff"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z"/></svg> FEATURED</div>
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(56,189,248,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="10" rx="2" stroke="#38bdf8" stroke-width="1.3"/><path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round"/><circle cx="9" cy="10" r="1.3" fill="#38bdf8"/></svg></div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dropshipping Store · $12k MRR</div>
                                    <div style="font-size:10px;color:var(--muted);">eCommerce · Asking $85,000</div>
                                </div>
                                <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0;">$85k</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:10px;opacity:0.55;">
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(139,138,168,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2" y="2" width="13" height="13" rx="2" stroke="rgba(139,138,168,0.5)" stroke-width="1.2"/><path d="M5 6h7M5 9h5M5 12h4" stroke="rgba(139,138,168,0.5)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">SEO Blog · 40k monthly visits</div>
                                    <div style="font-size:10px;color:var(--muted);">Blog · Asking $22,000</div>
                                </div>
                                <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:var(--muted);flex-shrink:0;">$22k</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:10px;opacity:0.4;">
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(139,138,168,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="rgba(139,138,168,0.5)" stroke-width="1.2"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" stroke="rgba(139,138,168,0.5)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">SaaS Tool · $3k MRR</div>
                                    <div style="font-size:10px;color:var(--muted);">SaaS · Asking $45,000</div>
                                </div>
                                <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:var(--muted);flex-shrink:0;">$45k</div>
                            </div>
                        </div>
                        <div style="margin-top:10px;font-size:11px;color:var(--muted);line-height:1.6;">Featured listings get <strong style="color:var(--text);">3–5× more views</strong> and appear above standard listings in search results.</div>
                    </div>

                    <!-- Full plan comparison table -->
                    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.13);border-radius:16px;overflow:hidden;margin-bottom:12px;">
                        <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
                            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--text);">Full plan comparison</div>
                        </div>
                        <!-- Header row -->
                        <div style="display:grid;grid-template-columns:1fr 50px 50px 50px 50px;gap:0;padding:8px 16px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);">
                            <div style="font-size:9px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;">Feature</div>
                            <div style="font-size:9px;font-weight:700;color:rgba(139,138,168,0.6);text-align:center;">Free</div>
                            <div style="font-size:9px;font-weight:700;color:#a855f7;text-align:center;">Starter</div>
                            <div style="font-size:9px;font-weight:700;color:#818cf8;text-align:center;">Growth</div>
                            <div style="font-size:9px;font-weight:700;color:#38bdf8;text-align:center;">Pro</div>
                        </div>
                        ${[
                            ['Platform fee','30%','15%','10%','5%'],
                            ['Daily listings','1','5','15','∞'],
                            ['Featured badge','','','',''],
                            ['Priority support','','','',''],
                            ['Analytics','Basic','Basic','Advanced','Advanced'],
                            ['Wallet bonuses','','','',''],
                            ['Early access','','','',''],
                        ].map(([feat,...vals],i) => `
                        <div style="display:grid;grid-template-columns:1fr 50px 50px 50px 50px;gap:0;padding:9px 16px;${i%2===0?'background:rgba(255,255,255,0.015);':''}border-bottom:1px solid rgba(255,255,255,0.04);">
                            <div style="font-size:11px;color:var(--muted);">${feat}</div>
                            ${vals.map((v,vi)=>{
                                const colors=['rgba(139,138,168,0.55)','#a855f7','#818cf8','#38bdf8'];
                                const isCheck = v==='', isCross = v==='';
                                const col = isCheck ? colors[vi] : (isCross ? 'rgba(255,255,255,0.2)' : colors[vi]);
                                return `<div style="font-size:10px;font-weight:700;color:${col};text-align:center;">${v}</div>`;
                            }).join('')}
                        </div>`).join('')}
                    </div>

                    <!-- Real seller testimonials -->
                    <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;margin-top:4px;">What sellers say</div>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
                        <div style="background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.15);border-radius:13px;padding:14px;">
                            <div style="font-size:11px;color:rgba(241,240,255,0.8);line-height:1.65;margin-bottom:8px;">"Upgraded to Growth and sold my SaaS in 11 days. The featured placement made all the difference — I had 3 serious offers within the first week."</div>
                            <div style="display:flex;align-items:center;gap:7px;">
                                <div style="width:22px;height:22px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#818cf8);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;">M</div>
                                <div style="font-size:10px;font-weight:700;color:var(--muted);">@marcus_builds · Growth Plan</div>
                                <div style="margin-left:auto;display:flex;gap:1px;"><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg></div>
                            </div>
                        </div>
                        <div style="background:rgba(56,189,248,0.05);border:1px solid rgba(56,189,248,0.15);border-radius:13px;padding:14px;">
                            <div style="font-size:11px;color:rgba(241,240,255,0.8);line-height:1.65;margin-bottom:8px;">"Pro plan saved me over $4,000 in fees on my last sale. The 5% fee vs Free's 30% — that's not a small difference when you're selling a $15k site."</div>
                            <div style="display:flex;align-items:center;gap:7px;">
                                <div style="width:22px;height:22px;border-radius:999px;background:linear-gradient(135deg,#38bdf8,#a855f7);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;">S</div>
                                <div style="font-size:10px;font-weight:700;color:var(--muted);">@sophiedev · Pro Plan</div>
                                <div style="margin-left:auto;display:flex;gap:1px;"><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg><svg width="10" height="10" viewBox="0 0 12 12" fill="#f59e0b"><path d="M6 0.5l1.8 3.7 4.1.6-3 2.9.7 4.1L6 9.9 2.4 11.8l.7-4.1-3-2.9 4.1-.6L6 0.5z"/></svg></div>
                            </div>
                        </div>
                    </div>

                `;

                // Re-populate plan rows inside billing
                const container = $('acPlanRows');
                if (container) {
                    container.innerHTML = '';
                    _selectedPlan = plan;
                    _acSelectedPlan = null;
                    // Hide warn banner
                    const warnEl = $('acPlanWarn');
                    if (warnEl) warnEl.classList.remove('visible');
                    // Update current plan chip in header
                    const chip = $('acCurrentPlanChip');
                    if (chip) {
                        const chipColors = { Free:'#8b8aa8', Starter:'#a855f7', Growth:'#818cf8', Pro:'#38bdf8' };
                        const chipBg     = { Free:'rgba(139,138,168,.12)', Starter:'rgba(168,85,247,.12)', Growth:'rgba(129,140,248,.12)', Pro:'rgba(56,189,248,.12)' };
                        const chipBorder = { Free:'rgba(139,138,168,.25)', Starter:'rgba(168,85,247,.3)', Growth:'rgba(129,140,248,.3)', Pro:'rgba(56,189,248,.3)' };
                        chip.textContent = plan + ' — active';
                        chip.style.color = chipColors[plan] || '#8b8aa8';
                        chip.style.background = chipBg[plan] || chipBg.Free;
                        chip.style.border = '1px solid ' + (chipBorder[plan] || chipBorder.Free);
                        chip.style.display = 'block';
                    }

                    Object.entries(PLAN_META).forEach(([key, m]) => {
                        const isCurrent = key === plan;
                        const rgbMap = { '#a855f7':'168,85,247', '#818cf8':'129,140,248', '#38bdf8':'56,189,248', '#8b8aa8':'139,138,168' };
                        const rgb = rgbMap[m.color] || '139,138,168';
                        const row = document.createElement('div');
                        const activeClass = isCurrent ? ' plan-active-' + key.toLowerCase() : '';
                        row.className = 'plan-opt-row' + activeClass;
                        row.id = 'acRow-' + key;
                        row.innerHTML = `
                            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                                <div class="plan-opt-icon" style="background:rgba(${rgb},.12);border-color:${m.glow};">
                                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none"><path d="M6.5 1l1.18 2.39L10.5 3.82l-2 1.94.47 2.74L6.5 7.23 4.03 8.5l.47-2.74L2.5 3.82l2.82-.43Z" fill="${m.color}" opacity="${key === 'Free' ? '.5' : '1'}"/></svg>
                                </div>
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;align-items:center;gap:7px;">
                                        <div class="plan-opt-name-r" style="color:${m.color};">${key}</div>
                                        ${isCurrent ? `<span style="font-size:8px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:1px 7px;border-radius:999px;background:rgba(${rgb},.15);border:1px solid rgba(${rgb},.3);color:${m.color};">CURRENT</span>` : ''}
                                    </div>
                                    <div class="plan-opt-desc">${m.desc}</div>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                                <div style="text-align:right;">
                                    <div class="plan-opt-price-r" style="color:${m.color};">${m.price === 0 ? 'Free' : '$' + m.price}</div>
                                    <div class="plan-opt-per">${m.price === 0 ? 'forever' : '/mo'}</div>
                                </div>
                                ${isCurrent
                                    ? `<div style="width:18px;height:18px;border-radius:999px;border:1.5px solid ${m.color};background:${m.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5.5l2 2 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
                                    : `<div class="plan-opt-radio" id="acRadio-${key}"></div>`
                                }
                            </div>`;
                        if (!isCurrent) {
                            row.onclick = () => selectPlanInAccount(key);
                        }
                        container.appendChild(row);
                    });
                }
            }

            // Legacy: keep old acPlanName/acPlanPrice/acPlanBadge/acBillingRow/acWalletBal in sync
            // (they live inside tabPlan which is still the plan tab)
            if ($('acPlanName'))  $('acPlanName').textContent  = plan + ' Plan';
            if ($('acPlanPrice')) $('acPlanPrice').textContent = meta.price === 0 ? 'Free forever' : '$' + meta.price + ' / month';
            const badge = $('acPlanBadge');
            if (badge) {
                if (plan === 'Free') {
                    badge.textContent = 'FREE';
                    badge.style.background = 'rgba(139,138,168,.12)';
                    badge.style.border = '1px solid rgba(139,138,168,.2)';
                    badge.style.color = 'var(--muted)';
                } else {
                    badge.textContent = 'ACTIVE';
                    badge.style.background = 'rgba(52,211,153,.1)';
                    badge.style.border = '1px solid rgba(52,211,153,.28)';
                    badge.style.color = '#34d399';
                }
            }
            const billingRow = $('acBillingRow');
            if (billingRow) {
                const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const now = new Date();
                const nextMonth = (now.getMonth() + 1) % 12;
                const nextYear  = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
                if (plan !== 'Free') {
                    if ($('acNextBill')) $('acNextBill').textContent = '1 ' + MONTHS[nextMonth] + ' ' + nextYear;
                    billingRow.style.display = 'flex';
                    billingRow.style.borderTop = '1px solid rgba(255,255,255,0.05)';
                } else {
                    billingRow.style.display = 'none';
                }
            }
            if ($('acWalletBal')) $('acWalletBal').textContent = fmtBal(bal);
        }

        let _acSelectedPlan = null;
        let _acPendingSwitchPlan = null;

        function selectPlanInAccount(key) {
            const currentPlan = (window._fbUserData && window._fbUserData.plan) || 'Free';

            // Clicking active plan — do nothing
            if (key === currentPlan) return;

            // Free tier: clicking any paid plan → open upgrade modal immediately, no warning
            if (currentPlan === 'Free') {
                openUpgradeModal(key.toLowerCase());
                return;
            }

            // Already on a paid plan → clicking Free does nothing meaningful (use cancel instead)
            if (key === 'Free') return;

            // On a paid plan, clicking a different paid plan → show warning first
            _acPendingSwitchPlan = key;
            const warnEl  = $('acPlanWarn');
            const warnTxt = $('acPlanWarnText');
            if (warnTxt) warnTxt.textContent = 'Switching to ' + key + ' will cancel your ' + currentPlan + ' plan immediately. You\'ll be charged the new amount via PayPal.';
            if (warnEl)  warnEl.classList.add('visible');

            // Highlight the row the user tapped
            _acSelectedPlan = key;
            Object.keys(PLAN_META).forEach(k => {
                const row = $('acRow-' + k);
                if (!row) return;
                const isCurrent = k === currentPlan;
                const isPending = k === key;
                if (!isCurrent) {
                    row.style.background = isPending ? 'rgba(251,191,36,.06)' : '';
                }
            });
        }

        window.confirmPlanSwitch = function() {
            if (!_acPendingSwitchPlan) return;
            openUpgradeModal(_acPendingSwitchPlan.toLowerCase());
            _acPendingSwitchPlan = null;
            const warnEl = $('acPlanWarn');
            if (warnEl) warnEl.classList.remove('visible');
        };

        window.savePlanFromAccount = function() {
            // Legacy shim — no longer used (save button removed)
            if (_acSelectedPlan && _acSelectedPlan !== 'Free') {
                openUpgradeModal(_acSelectedPlan.toLowerCase());
            }
        };

        //  My Sites: toggle between Listed / Bought 
        window.switchSitesView = function(view) {
            const isListed = view === 'listed';
            const listed   = document.getElementById('msListed');
            const bought   = document.getElementById('msBought');
            const sellBtn  = document.getElementById('msSellBtn');
            const buyBtn   = document.getElementById('msBuyBtn');
            if (listed) listed.style.display = isListed ? 'block' : 'none';
            if (bought) bought.style.display = isListed ? 'none'  : 'block';
            if (sellBtn) {
                sellBtn.style.background = isListed ? 'linear-gradient(135deg,#00cfaa,#00a88d)' : 'transparent';
                sellBtn.style.color      = isListed ? '#051210' : 'var(--muted)';
                sellBtn.style.boxShadow  = isListed ? '0 2px 10px rgba(0,207,170,0.25)' : 'none';
            }
            if (buyBtn) {
                buyBtn.style.background = isListed ? 'transparent' : 'linear-gradient(135deg,#60a5fa,#34d399)';
                buyBtn.style.color      = isListed ? 'var(--muted)' : '#0a0a0f';
                buyBtn.style.boxShadow  = isListed ? 'none' : '0 2px 10px rgba(96,165,250,0.25)';
            }
        };

        //  FAQ accordion 
        window.toggleFaq = function(row) {
            // Handle tu-faq-item pattern (top-up modal FAQs with CSS max-height)
            if (row.classList.contains('tu-faq-item')) {
                const wasOpen = row.classList.contains('open');
                const parent = row.closest('.tu-faq');
                if (parent) parent.querySelectorAll('.tu-faq-item.open').forEach(i => i.classList.remove('open'));
                if (!wasOpen) row.classList.add('open');
                return;
            }
            // Handle settings-row / faq-answer pattern
            const answer  = row.querySelector('.faq-answer');
            const chevron = row.querySelector('.faq-chevron');
            if (!answer) return;
            const isOpen = answer.style.display === 'block';
            answer.style.display = isOpen ? 'none' : 'block';
            if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
        };

        //  Support message: auto-fill name/email 
        function prefillSupportForm() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) return;
            const nameEl  = document.getElementById('supportName');
            const emailEl = document.getElementById('supportEmail');
            if (nameEl  && !nameEl.value)  nameEl.value  = user.displayName || (user.email ? user.email.split('@')[0] : '');
            if (emailEl && !emailEl.value) emailEl.value = user.email || '';
        }

        // Auto-fill when support tab is opened

        //  Send support message to Firebase 
        window.sendSupportMessage = async function() {
            const nameEl  = document.getElementById('supportName');
            const emailEl = document.getElementById('supportEmail');
            const msgEl   = document.getElementById('supportMsg');
            const errEl   = document.getElementById('supportErr');
            const okEl    = document.getElementById('supportOk');
            const btn     = document.getElementById('supportSendBtn');

            const name  = (nameEl  ? nameEl.value.trim()  : '');
            const email = (emailEl ? emailEl.value.trim() : '');
            const msg   = (msgEl   ? msgEl.value.trim()   : '');

            // Hide previous status
            if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
            if (okEl)  okEl.style.display = 'none';

            // Validate
            if (!name)  { if (errEl) { errEl.textContent = 'Please enter your name.';    errEl.style.display = 'block'; } return; }
            if (!email) { if (errEl) { errEl.textContent = 'Please enter your email.';   errEl.style.display = 'block'; } return; }
            if (!msg)   { if (errEl) { errEl.textContent = 'Please write a message.';    errEl.style.display = 'block'; } return; }
            if (msg.length > 1000) { if (errEl) { errEl.textContent = 'Message must be 1000 characters or fewer.'; errEl.style.display = 'block'; } return; }

            // Basic email check
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                if (errEl) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = 'block'; }
                return;
            }

            //  Rate limit: free users 1 per day, paid unlimited 
            const userPlan = (window._fbUserData && window._fbUserData.plan) || 'Free';
            const isFree = userPlan === 'Free';
            if (isFree) {
                const RATE_KEY = 'siterifty_support_last_sent';
                const lastSent = parseInt(localStorage.getItem(RATE_KEY) || '0', 10);
                const elapsed  = Date.now() - lastSent;
                const oneDay   = 24 * 60 * 60 * 1000;
                if (elapsed < oneDay) {
                    const hoursLeft = Math.ceil((oneDay - elapsed) / 3600000);
                    if (errEl) {
                        errEl.innerHTML = `Free accounts can send 1 support message per day. Try again in <strong>${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</strong>. <a href="#" onclick="openUpgradeModal('starter');return false;" style="color:#a855f7;text-decoration:underline;">Upgrade</a> for unlimited.`;
                        errEl.style.display = 'block';
                    }
                    return;
                }
            }

            if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

            try {
                const user  = window._fbAuth && window._fbAuth.currentUser;
                const db2   = window._fbDb;
                const fbRef = window._ref || (window._fbDbFns && window._fbDbFns.ref);
                if (!db2 || !fbRef) throw new Error('Firebase not ready — please refresh and try again.');
                const { push } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js');
                await push(fbRef(db2, 'supportmessages'), {
                    name,
                    email,
                    message: msg,
                    uid:       user ? user.uid : null,
                    timestamp: Date.now(),
                    status:    'unread'
                });
                // Also save to per-user path so "Your Messages" list can show it
                if (user && user.uid) {
                    try {
                        const { push: fbPush } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js');
                        await fbPush(fbRef(db2, 'supportMessages/' + user.uid), {
                            message: msg,
                            ts: Date.now(),
                            status: 'sent'
                        });
                    } catch(_) {}
                }
                // Success — save timestamp for free-user rate limit
                if (isFree) { try { localStorage.setItem('siterifty_support_last_sent', String(Date.now())); } catch(_) {} }
                if (okEl)  { okEl.style.display  = 'flex'; }
                if (msgEl) { msgEl.value = ''; document.getElementById('supportCharCount').textContent = '0 / 1000'; }
                if (btn)   { btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

                // Also send email to support
                try {
                    const supportHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:32px 20px;"><div style="background:#12121a;border:1px solid rgba(56,189,248,0.2);border-radius:16px;padding:24px;"><div style="font-size:15px;font-weight:800;color:#38bdf8;margin-bottom:14px;">New Support Message</div><table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;"><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:8px 0;color:#8b8aa8;width:90px;">Name</td><td style="padding:8px 0;color:#f1f0ff;">${name}</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:8px 0;color:#8b8aa8;">Email</td><td style="padding:8px 0;color:#f1f0ff;">${email}</td></tr><tr><td style="padding:8px 0;color:#8b8aa8;vertical-align:top;">Message</td><td style="padding:8px 0;color:#f1f0ff;line-height:1.6;">${msg.replace(/\n/g,'<br>')}</td></tr></table></div></div></body></html>`;
                    window._sendEmail && window._sendEmail('support@'+(window.location.hostname||'siterifty.com'), 'Support: ' + name + ' <' + email + '>', supportHtml).catch(()=>{});
                } catch(_) {}
                setTimeout(() => {
                    if (btn) { btn.textContent = 'Send message'; btn.disabled = false; }
                    if (okEl) okEl.style.display = 'none';
                }, 4000);
            } catch(e) {
                console.error('[support]', e);
                if (errEl) { errEl.textContent = 'Failed to send — please try again or email support@'+(window.location.hostname||'siterifty.com'); errEl.style.display = 'block'; }
                if (btn)   { btn.textContent = 'Send message'; btn.disabled = false; }
            }
        };

        //  tab switcher 
        window.switchTab = function(name){
            // New page-based layout: call showPage
            const pageName = {plan:'profile',orders:'sites',address:'support',account:'settings'}[name] || name;
            if (typeof window.showPage === 'function') {
                window.showPage(pageName);
            }
            // Legacy tab-class toggling for backward compat (in case old markup still exists)
            ['plan','orders','address','account'].forEach(t=>{
                const panel = $('tab'+t.charAt(0).toUpperCase()+t.slice(1));
                if(panel) panel.classList.toggle('active', t===name);
                const nav = $('nav-'+t);
                if(nav) nav.classList.toggle('active', t===name);
            });
            if (name === 'address') { prefillSupportForm(); renderSupportTierBar(); }
            const body = document.querySelector('.dash-body') || document.querySelector('#dashModal .dm-scroll');
            if(body) body.scrollTop = 0;
        };

        //  Support tab tier progress bar 
        window.renderSupportTierBar = function() {
            const plan = (window._fbUserData && window._fbUserData.plan) || 'Free';
            const tierOrder  = ['Free','Starter','Growth','Pro'];
            const tierColors = { Free:'#8b8aa8', Starter:'#a855f7', Growth:'#818cf8', Pro:'#38bdf8' };
            const tierPerks  = {
                Free:    ['1 listing slot','30% platform fee','Community support'],
                Starter: ['5 listing slots','15% platform fee','Email support 24h'],
                Growth:  ['20 listing slots','10% platform fee','Priority support 4h'],
                Pro:     ['Unlimited listings','5% platform fee','24/7 live chat']
            };
            const tierBadgeStyle = {
                Free:    'background:rgba(139,138,168,0.12);border-color:rgba(139,138,168,0.25);color:#8b8aa8;',
                Starter: 'background:rgba(168,85,247,0.12);border-color:rgba(168,85,247,0.3);color:#a855f7;',
                Growth:  'background:rgba(129,140,248,0.12);border-color:rgba(129,140,248,0.3);color:#818cf8;',
                Pro:     'background:rgba(56,189,248,0.12);border-color:rgba(56,189,248,0.3);color:#38bdf8;'
            };
            const idx = tierOrder.indexOf(plan);

            const nameEl  = document.getElementById('supportTierName');
            const badgeEl = document.getElementById('supportTierBadge');
            const nextEl  = document.getElementById('supportTierNext');
            const perksEl = document.getElementById('supportTierPerks');
            const upgradeBtn = document.getElementById('supportUpgradeBtn');

            if (nameEl)  { nameEl.textContent = plan; nameEl.style.color = tierColors[plan] || 'var(--text)'; }
            if (badgeEl) { badgeEl.textContent = plan.toUpperCase(); badgeEl.style.cssText = 'font-size:9px;font-weight:700;letter-spacing:.07em;padding:3px 9px;border-radius:999px;border:1px solid;' + (tierBadgeStyle[plan]||''); }
            if (nextEl)  { nextEl.textContent = idx < tierOrder.length-1 ? 'Next: ' + tierOrder[idx+1] : '\u2746 Max tier reached'; }

            if (upgradeBtn) upgradeBtn.style.display = plan === 'Pro' ? 'none' : 'flex';

            for (let i = 0; i < 4; i++) {
                const fill = document.getElementById('tierFill' + i);
                const seg  = document.getElementById('tierSeg'  + i);
                if (!fill || !seg) continue;
                let pct = 0;
                if (i < idx) pct = 100;
                else if (i === idx) pct = 60;
                setTimeout(() => { fill.style.width = pct + '%'; }, 80);
                seg.style.boxShadow = i <= idx ? '0 0 8px ' + (tierColors[tierOrder[i]]||'transparent') + '55' : 'none';
            }

            if (perksEl) {
                const perks = tierPerks[plan] || tierPerks.Free;
                perksEl.innerHTML = perks.map(p =>
                    '<span style="font-size:10px;color:' + (tierColors[plan]||'var(--muted)') + ';background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:3px 9px;display:inline-flex;align-items:center;gap:4px;"><svg width=\"9\" height=\"9\" viewBox=\"0 0 9 9\" fill=\"none\"><path d=\"M1.5 4.5l2 2 4-4\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>' + p + '</span>'
                ).join('');
            }
        };

        //  account sub-tab switcher 
        // Dashboard and Messages open as full-screen modals — no DOM migration needed
        window.switchAccountSub = function(sub) {
            // Update the sub-nav button highlights
            ['account','dashboard','messages','offers'].forEach(s => {
                const btn = $('acSubBtn-' + s);
                if(btn) {
                    if(s === sub) {
                        btn.style.background = 'rgba(255,255,255,0.09)';
                        btn.style.borderColor = 'rgba(255,255,255,0.12)';
                        btn.style.color = 'var(--text)';
                    } else {
                        btn.style.background = 'transparent';
                        btn.style.borderColor = 'transparent';
                        btn.style.color = 'var(--muted)';
                    }
                }
            });
            if (sub === 'dashboard') { window.location.href = '/dashboard'; return; }
            if (sub === 'messages')  { if (typeof openMessagesModal === 'function') openMessagesModal(); return; }
            // Hide all sub-panels first
            ['acSubAccount','acSubOffers'].forEach(id => {
                const el = $(id);
                if (el) el.style.display = 'none';
            });
            if (sub === 'offers') {
                const offPanel = $('acSubOffers');
                if (offPanel) offPanel.style.display = 'block';
                _initAcOffersPanel();
                return;
            }
            // 'account' — just show the account sub-panel
            const acPanel = $('acSubAccount');
            if (acPanel) acPanel.style.display = 'block';
        };

        // ── Listing Performance Snapshot ──────────────────────────
        window._initAcPerformance = function() {
            const user = (window._fbAuth && window._fbAuth.currentUser) || (window._auth && window._auth.currentUser);
            const empty = document.getElementById('acPerfEmpty');
            const best  = document.getElementById('acPerfBest');
            const canvas = document.getElementById('acPerfSparkline');

            if (!user || !window._fb) {
                if (empty) empty.style.display = 'block';
                if (best)  best.style.display  = 'none';
                return;
            }
            const fb  = window._fb();
            const uid = user.uid;

            fb.get(fb.ref(fb.db, 'listings')).then(function(snap) {
                if (!snap || !snap.exists()) {
                    if (empty) { empty.style.display = 'block'; }
                    return;
                }
                const all = snap.val();
                // Filter to this user's listings
                const mine = Object.entries(all)
                    .filter(([, v]) => v.uid === uid || v.userId === uid)
                    .map(([k, v]) => ({ id: k, ...v }));

                if (!mine.length) {
                    if (empty) empty.style.display = 'block';
                    return;
                }

                if (empty) empty.style.display = 'none';

                // Aggregate simulated 7-day views (use view_count, clicks, offer_count fields)
                let totalViews = 0, totalClicks = 0, totalOffers = 0;
                let bestListing = null, bestViews = -1;
                const dailyViews = [0,0,0,0,0,0,0]; // sparkline buckets

                mine.forEach(function(l, idx) {
                    const v = parseInt(l.view_count || l.views || 0);
                    const c = parseInt(l.click_count || l.clicks || 0);
                    const o = parseInt(l.offer_count || l.offers || 0);
                    totalViews  += v;
                    totalClicks += c;
                    totalOffers += o;
                    // distribute views across sparkline with some variation
                    dailyViews[idx % 7] += v;
                    if (v > bestViews) { bestViews = v; bestListing = l; }
                });

                // Fill metrics
                function _fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
                const setEl = function(id, val, delta, up) {
                    const el = document.getElementById(id);
                    if (el) el.textContent = _fmt(val);
                    const de = document.getElementById(id + 'Delta');
                    if (de && delta !== undefined) {
                        const sign = up ? '+' : '';
                        de.textContent = sign + delta + '%';
                        de.style.color = up ? '#34d399' : '#f87171';
                    }
                };
                setEl('acPerfViews',  totalViews,  Math.round(Math.random()*22+3),  true);
                setEl('acPerfClicks', totalClicks, Math.round(Math.random()*18+2),  true);
                setEl('acPerfOffers', totalOffers, Math.round(Math.random()*40+5),  totalOffers >= 0);

                // Best performer callout
                if (bestListing && best) {
                    const nameEl = document.getElementById('acPerfBestName');
                    const metaEl = document.getElementById('acPerfBestMeta');
                    if (nameEl) nameEl.textContent = bestListing.title || bestListing.name || 'Your listing';
                    if (metaEl) metaEl.textContent = bestViews + ' views · ' + (bestListing.price ? '$'+Number(bestListing.price).toLocaleString() : 'unlisted');
                    best.style.display = 'flex';
                }

                // Sparkline
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const W = canvas.offsetWidth; const H = 48;
                    canvas.width = W * window.devicePixelRatio;
                    canvas.height = H * window.devicePixelRatio;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

                    const max = Math.max(...dailyViews, 1);
                    const pts = dailyViews.map(function(v, i) {
                        return { x: (i / 6) * (W - 16) + 8, y: H - 8 - ((v / max) * (H - 16)) };
                    });

                    // Fill gradient
                    const grad = ctx.createLinearGradient(0, 0, 0, H);
                    grad.addColorStop(0, 'rgba(168,85,247,0.25)');
                    grad.addColorStop(1, 'rgba(168,85,247,0)');
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, H);
                    pts.forEach(function(p) { ctx.lineTo(p.x, p.y); });
                    ctx.lineTo(pts[pts.length-1].x, H);
                    ctx.closePath();
                    ctx.fillStyle = grad;
                    ctx.fill();

                    // Line
                    ctx.beginPath();
                    pts.forEach(function(p, i) { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 1.5;
                    ctx.lineJoin = 'round';
                    ctx.stroke();

                    // Dots
                    pts.forEach(function(p) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                        ctx.fillStyle = '#a855f7';
                        ctx.fill();
                    });

                    // Day labels
                    const days = ['M','T','W','T','F','S','S'];
                    ctx.fillStyle = 'rgba(139,138,168,0.5)';
                    ctx.font = '9px Syne, sans-serif';
                    ctx.textAlign = 'center';
                    pts.forEach(function(p, i) { ctx.fillText(days[i], p.x, H); });
                }
            }).catch(function() {
                if (empty) empty.style.display = 'block';
            });
        };

        // ── Referral & Earnings ───────────────────────────────────
        window._initAcReferral = function() {
            const user = (window._fbAuth && window._fbAuth.currentUser) || (window._auth && window._auth.currentUser);
            const linkEl = document.getElementById('acRefLink');
            if (!user) return;
            const refCode = user.uid.slice(0, 8).toLowerCase();
            const refUrl  = 'https://siterifty.com/ref/' + refCode;
            if (linkEl) linkEl.textContent = refUrl;
            window._currentRefUrl = refUrl;

            // Load referral stats from Firebase
            if (!window._fb) return;
            const fb = window._fb();
            fb.get(fb.ref(fb.db, 'referrals/' + user.uid)).then(function(snap) {
                if (!snap || !snap.exists()) return;
                const d = snap.val();
                const cnt  = document.getElementById('acRefCount');
                const pend = document.getElementById('acRefPending');
                const earn = document.getElementById('acRefEarned');
                if (cnt)  cnt.textContent  = d.count  || 0;
                if (pend) pend.textContent = '$' + (d.pending || 0);
                if (earn) earn.textContent = '$' + (d.earned  || 0);
            }).catch(function() {});
        };

        // (copyReferralLink consolidated below — see single definition near auth listener)

        window.shareReferral = function(channel) {
            const url = encodeURIComponent(window._currentRefUrl || 'https://siterifty.com');
            const msg = encodeURIComponent('Join me on Siterifty — buy and sell websites with 5% fees and escrow protection:');
            if (channel === 'x')         window.open('https://twitter.com/intent/tweet?text=' + msg + '%20' + url, '_blank');
            if (channel === 'whatsapp')  window.open('https://wa.me/?text=' + msg + '%20' + url, '_blank');
            if (channel === 'email')     window.location.href = 'mailto:?subject=Check%20out%20Siterifty&body=' + msg + '%20' + url;
        };

        // Hook into the account sub switch to init both features when Account sub is shown
        const _origSwitchAccountSub = window.switchAccountSub;
        window.switchAccountSub = function(sub) {
            _origSwitchAccountSub(sub);
            if (sub === 'account') {
                setTimeout(function() {
                    window._initAcPerformance && window._initAcPerformance();
                    window._initAcReferral    && window._initAcReferral();
                }, 80);
            }
        };

        // Also init on first modal open (account is default active sub)
        var _perfInited = false;
        var _origOpenAccount = window.openAccountModal;
        window.openAccountModal = function() {
            if (_origOpenAccount) _origOpenAccount.apply(this, arguments);
            if (!_perfInited) {
                _perfInited = true;
                setTimeout(function() {
                    window._initAcPerformance && window._initAcPerformance();
                    window._initAcReferral    && window._initAcReferral();
                }, 300);
            }
        };

        // ── Offers sub-panel: load stats + recent offers list ──
        function _initAcOffersPanel() {
            const user = (window._fbAuth && window._fbAuth.currentUser) || (window._auth && window._auth.currentUser);
            if (!user) return;
            // Stats
            const fb = window._fb && _fb();
            if (!fb) return;
            const uid = user.uid;
            fb.get(fb.ref(fb.db, 'users/' + uid + '/offers')).then(function(snap) {
                let received = 0, made = 0;
                const offersQuickList = document.getElementById('acOffersQuickList');
                const cards = [];
                if (snap && snap.exists()) {
                    const data = snap.val();
                    Object.values(data).forEach(function(o) {
                        if (o.buyerUid === uid) made++;
                        else received++;
                        cards.push(o);
                    });
                }
                const rcEl = document.getElementById('acOffersInCount');
                const mdEl = document.getElementById('acOffersOutCount');
                if (rcEl) rcEl.textContent = received;
                if (mdEl) mdEl.textContent = made;
                if (offersQuickList) {
                    if (!cards.length) {
                        offersQuickList.innerHTML = '<div style="text-align:center;padding:22px 0 18px;font-size:12px;color:rgba(139,138,168,0.4);">No active offers at the moment.</div>';
                    } else {
                        const recent = cards.slice(0, 3);
                        offersQuickList.innerHTML = recent.map(function(o) {
                            const isBuyer = o.buyerUid === uid;
                            const label  = isBuyer ? 'You offered' : 'Offer received';
                            const col    = isBuyer ? '#818cf8' : '#a855f7';
                            const amt    = o.offerPrice != null ? '$' + Number(o.offerPrice).toLocaleString() : '—';
                            const site   = (o.listingTitle || o.listingUrl || 'Listing').slice(0,30);
                            const statusColors = {accepted:'#34d399',declined:'#f87171',pending:'#fbbf24',countered:'#38bdf8'};
                            const sc = statusColors[o.status] || '#8b8aa8';
                            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04);">'
                                + '<div style="width:8px;height:8px;border-radius:999px;background:' + col + ';flex-shrink:0;"></div>'
                                + '<div style="flex:1;min-width:0;">'
                                +   '<div style="font-size:11px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + site + '</div>'
                                +   '<div style="font-size:10px;color:var(--muted);margin-top:1px;">' + label + ' · ' + amt + '</div>'
                                + '</div>'
                                + '<div style="font-size:9px;font-weight:700;letter-spacing:.04em;color:' + sc + ';background:' + sc.replace(')', ',0.12)').replace('rgb','rgba') + ';padding:2px 8px;border-radius:999px;border:1px solid ' + sc.replace(')', ',0.25)').replace('rgb','rgba') + ';flex-shrink:0;">' + (o.status||'pending').toUpperCase() + '</div>'
                                + '</div>';
                        }).join('');
                    }
                }
            }).catch(function(){});
            // Escrow count
            fb.get(fb.ref(fb.db, 'users/' + uid + '/escrow')).then(function(snap) {
                const dlEl = document.getElementById('acDealsCount');
                if (dlEl) dlEl.textContent = snap && snap.exists() ? Object.keys(snap.val()).length : 0;
            }).catch(function(){});
            // Sync push toggle state
            _syncAcPushToggle();
        }

        // ── Offers push toggle (mirrors the main notifications panel) ──
        const VAPID_PUB = 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do';
        function _urlB64ToUint8Arr(b64) {
            const p = (b64 + '==='.slice((b64.length + 3) % 4)).replace(/-/g,'+').replace(/_/g,'/');
            const raw = atob(p); const out = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
            return out;
        }

        // Shared SW helper used by both push toggle handlers.
        // Tries /sw.js first (your real service worker), then falls back to a
        // same-origin script tag trick that all browsers accept.
        async function _ensureSwReg() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
            let reg = await navigator.serviceWorker.getRegistration('/');
            if (!reg) {
                // Try the real service worker file first
                try { reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' }); }
                catch(_) {}
            }
            if (!reg) return null;
            // Wait up to 5 s for the SW to become active
            if (reg.installing || reg.waiting) {
                await new Promise(function(resolve) {
                    const sw = reg.installing || reg.waiting;
                    const h = function() { if (sw.state === 'activated') { sw.removeEventListener('statechange', h); resolve(); } };
                    sw.addEventListener('statechange', h);
                    setTimeout(resolve, 5000);
                });
            }
            return reg;
        }

        function _syncAcPushToggle() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
            navigator.serviceWorker.getRegistration('/').then(function(reg) {
                return reg ? reg.pushManager.getSubscription() : null;
            }).then(function(sub) {
                const tog = document.getElementById('acPushToggle');
                const lbl = document.getElementById('acPushSubLabel');
                if (!tog) return;
                const knob = tog.querySelector('div');
                if (sub) {
                    tog.style.background = '#a855f7';
                    if (knob) { knob.style.left = ''; knob.style.right = '2px'; }
                    if (lbl)  lbl.textContent = 'Push alerts are enabled on this device';
                } else {
                    tog.style.background = 'rgba(255,255,255,0.12)';
                    if (knob) { knob.style.right = ''; knob.style.left = '2px'; }
                    if (lbl)  lbl.textContent = 'Get real-time offer & deal alerts on this device';
                }
            }).catch(function(){});
        }

        window.handleAcPushToggle = async function(el) {
            const statusEl  = document.getElementById('acPushStatus');
            const blockedEl = document.getElementById('acPushBlockedNote');
            const knob = el ? el.querySelector('div') : null;
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                if (statusEl) { statusEl.style.display='block'; statusEl.style.background='rgba(248,113,113,0.1)'; statusEl.style.color='#f87171'; statusEl.textContent='Push not supported in this browser.'; }
                return;
            }
            if (Notification.permission === 'denied') {
                if (blockedEl) blockedEl.style.display = 'block';
                return;
            }
            try {
                // Get (or register) the service worker before anything else
                const reg = await _ensureSwReg();
                if (!reg) throw new Error('Service worker unavailable — make sure /sw.js exists on your server.');

                const existing = await reg.pushManager.getSubscription();
                if (existing) {
                    // Toggle OFF — unsubscribe
                    await existing.unsubscribe();
                    el.style.background = 'rgba(255,255,255,0.12)';
                    if (knob) { knob.style.right=''; knob.style.left='2px'; }
                    const lbl = document.getElementById('acPushSubLabel');
                    if (lbl) lbl.textContent = 'Get real-time offer & deal alerts on this device';
                    if (statusEl) { statusEl.style.display='block'; statusEl.style.background='rgba(139,138,168,0.08)'; statusEl.style.color='var(--muted)'; statusEl.textContent='Push notifications disabled.'; }
                    const mainToggle = document.getElementById('notifPush');
                    if (mainToggle) { mainToggle.style.background='rgba(255,255,255,0.15)'; const mk=mainToggle.querySelector('div'); if(mk){mk.style.right='';mk.style.left='2px';} }
                    return;
                }

                // Toggle ON — request permission then subscribe
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') {
                    if (perm === 'denied' && blockedEl) blockedEl.style.display = 'block';
                    return;
                }
                const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _urlB64ToUint8Arr(VAPID_PUB) });

                // Update UI
                el.style.background = '#a855f7';
                if (knob) { knob.style.left=''; knob.style.right='2px'; }
                const lbl = document.getElementById('acPushSubLabel');
                if (lbl) lbl.textContent = 'Push alerts are enabled on this device';
                if (statusEl) { statusEl.style.display='block'; statusEl.style.background='rgba(52,211,153,0.08)'; statusEl.style.color='#34d399'; statusEl.textContent='Push notifications enabled!'; }
                const mainToggle = document.getElementById('notifPush');
                if (mainToggle) { mainToggle.style.background='var(--accent)'; const mk=mainToggle.querySelector('div'); if(mk){mk.style.left='';mk.style.right='2px';} }

                // Save subscription to Firebase + backend
                const user = (window._fbAuth && window._fbAuth.currentUser) || (window._auth && window._auth.currentUser);
                const fb   = window._fb && _fb();
                const subJson = sub.toJSON ? sub.toJSON() : JSON.parse(JSON.stringify(sub));
                if (user && fb) fb.set(fb.ref(fb.db,'users/'+user.uid+'/pushSubscription'), subJson).catch(function(){});
                // Also notify backend so server-side push works
                fetch('/api/settings.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'push-subscribe',
                        subscription: subJson,
                        deviceId: (user ? user.uid : 'anon') + '_' + Date.now(),
                        metadata: { uid: user ? user.uid : '', email: user ? user.email : '', ua: navigator.userAgent.slice(0,120) },
                        resubscribe: false
                    })
                }).catch(function(){});
            } catch(e) {
                if (statusEl) { statusEl.style.display='block'; statusEl.style.background='rgba(248,113,113,0.1)'; statusEl.style.color='#f87171'; statusEl.textContent='Could not enable push: ' + e.message; }
            }
        };

        //  Seller/Buyer sub-dashboard switcher 


        //  plan selection 
        let _selectedPlan = null;
        // selectPlan moved below
        window.savePlan = async function(){
            // Redirect to PayPal subscription — plan is set by webhook after real payment
            if(!_selectedPlan || _selectedPlan === 'Free') return;
            const user = auth.currentUser; if(!user) return;
            openUpgradeModal(_selectedPlan.toLowerCase());
        };

        //  save address 
        window.saveAddress = async function(){
            hideMsg('addrErr','addrOk');
            const user = auth.currentUser; if(!user) return;
            const addr = {
                name:      $('addrName').value.trim(),
                line1:     $('addrLine1').value.trim(),
                line2:     $('addrLine2').value.trim(),
                city:      $('addrCity').value.trim(),
                state:     $('addrState').value.trim(),
                zip:       $('addrZip').value.trim(),
                country:   $('addrCountry').value,
                phoneCode: $('addrPhoneCode') ? $('addrPhoneCode').value : '',
                phone:     $('addrPhone') ? $('addrPhone').value.trim() : ''
            };
            // Validate required fields
            if(!addr.name)    return showErr('addrErr','Full name is required.');
            if(!addr.line1)   return showErr('addrErr','Street address is required.');
            if(!addr.city)    return showErr('addrErr','City is required.');
            if(!addr.zip)     return showErr('addrErr','ZIP / Postal code is required.');
            if(!addr.country) return showErr('addrErr','Please select a country.');
            // ZIP validation (basic)
            if(addr.country === 'United States' && !/^\d{5}(-\d{4})?$/.test(addr.zip))
                return showErr('addrErr','Enter a valid US ZIP code (e.g. 10001).');
            try {
                await update(ref(db,'users/'+user.uid), { address: addr });
                showAddrSummary(addr);
            } catch(e){ showErr('addrErr','Could not save address. Try again.'); }
        };

        function showAddrSummary(addr){
            const summary = $('addrSavedSummary');
            const formWrap = $('addrFormWrap');
            if(!summary || !formWrap) return;
            const nameLine = addr.name || '';
            const addrLine = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
            $('addrSummaryName').textContent = nameLine;
            $('addrSummaryLine').textContent = addrLine;
            summary.classList.add('visible');
            formWrap.style.maxHeight = '0';
            formWrap.style.opacity = '0';
            formWrap.style.pointerEvents = 'none';
        }

        window.expandAddrForm = function(){
            const summary = $('addrSavedSummary');
            const formWrap = $('addrFormWrap');
            if(!summary || !formWrap) return;
            summary.classList.remove('visible');
            formWrap.style.maxHeight = '';
            formWrap.style.opacity = '';
            formWrap.style.pointerEvents = '';
        };

        //  save account (name only) 
        window.saveAccount = async function(){
            hideMsg('accErr','accOk');
            const user = auth.currentUser; if(!user) return;
            const newUsername = $('accUsername').value.trim();
            if(!newUsername || newUsername.length < 3) return showErr('accErr','Name must be at least 3 characters.');
            if(!/^[a-zA-Z0-9_ ]+$/.test(newUsername)) return showErr('accErr','Letters, numbers, spaces and underscores only.');
            const btn = $('btnSaveAccount');
            if(btn){ btn.disabled=true; btn.style.opacity='.5'; }
            try {
                const snap = await get(ref(db,'users/'+user.uid));
                const oldData = snap.val()||{};
                const oldUsername = (oldData.username||'').toLowerCase();
                const newLower = newUsername.toLowerCase();
                if(newLower !== oldUsername){
                    const taken = await get(ref(db,'usernames/'+newLower));
                    if(taken.exists()){ if(btn){btn.disabled=false;btn.style.opacity='1';} return showErr('accErr','That name is already taken.'); }
                    if(oldUsername) await set(ref(db,'usernames/'+oldUsername), null);
                    await set(ref(db,'usernames/'+newLower), user.uid);
                }
                const newBio = ($('accBio') ? $('accBio').value.trim() : '');
                await update(ref(db,'users/'+user.uid), { username: newUsername, bio: newBio });
                $('dashGreeting').textContent = 'Hey, '+newUsername;
                if(window._fbUserData) window._fbUserData.bio = newBio;
                if($('dashAvatarLg')){ var _dph2=window._cachedPhotoURL; if(_dph2 && window._applyPhotoURL){ window._applyPhotoURL(_dph2); } else { $('dashAvatarLg').textContent = newUsername.charAt(0).toUpperCase(); } }
                if($('settingsAvatarCircle')) $('settingsAvatarCircle').textContent = newUsername.charAt(0).toUpperCase();
                if($('settingsName')) $('settingsName').textContent = newUsername;
                showOk('accOk','Name updated!');
            } catch(e){ showErr('accErr', firebaseErrMsg(e.code)||'Could not save. Try again.'); }
            finally { if(btn){ btn.disabled=false; btn.style.opacity='1'; } }
        };

        //  save password 
        window.savePassword = async function(){
            hideMsg('pwErr','pwOk');
            const user = auth.currentUser; if(!user) return;
            const pw1 = $('accPassword').value;
            const pw2 = $('accPasswordConfirm').value;
            if(!pw1) return showErr('pwErr','Please enter a new password.');
            if(pw1.length < 6) return showErr('pwErr','Password must be at least 6 characters.');
            if(pw1 !== pw2) return showErr('pwErr','Passwords do not match.');
            const btn = $('btnSavePw');
            if(btn){ btn.disabled=true; btn.style.opacity='.5'; }
            try {
                await updatePassword(user, pw1);
                $('accPassword').value = '';
                $('accPasswordConfirm').value = '';
                if($('pwMatchHint')){ $('pwMatchHint').className='field-hint'; $('pwMatchHint').textContent=''; }
                showOk('pwOk','Password updated successfully!');
            } catch(e){ showErr('pwErr', firebaseErrMsg(e.code)||'Could not update password. You may need to sign in again.'); }
            finally { if(btn){ btn.disabled=false; btn.style.opacity='1'; } }
        };

        //  Accordion cards (profile page) 
        window.toggleAccCard = function(key){
            const card = $('accCard-' + key);
            if (!card) return;
            const isOpen = card.classList.contains('open');
            // Only one accordion open at a time keeps the list scannable as more cards get added
            document.querySelectorAll('#dmPage-profile .dm-accordion.open').forEach(c => {
                if (c !== card) c.classList.remove('open');
            });
            card.classList.toggle('open', !isOpen);
            if (!isOpen) {
                if (key === 'team') _loadTeamMembers();
            }
        };

        //  Device lock — single trusted device, Firebase-persisted  
        function _getOrCreateDeviceId() {
            let id = localStorage.getItem('sr_device_id');
            if (!id) {
                id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
                localStorage.setItem('sr_device_id', id);
            }
            return id;
        }
        function _parseDeviceLabel(ua){
            ua = ua || navigator.userAgent;
            let browser = 'Browser';
            if (/Edg\//.test(ua)) browser = 'Edge';
            else if (/Chrome\//.test(ua) && !/OPR|Brave/.test(ua)) browser = 'Chrome';
            else if (/Firefox\//.test(ua)) browser = 'Firefox';
            else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
            let os = 'Unknown';
            if (/iPhone|iPad/.test(ua)) os = 'iOS';
            else if (/Android/.test(ua)) os = 'Android';
            else if (/Mac OS X/.test(ua)) os = 'macOS';
            else if (/Windows/.test(ua)) os = 'Windows';
            else if (/Linux/.test(ua)) os = 'Linux';
            return browser + ' on ' + os;
        }
        function _renderTrustedDevice(lockData) {
            const list = $('secDeviceList');
            if (!list) return;
            if (!lockData || !lockData.enabled) {
                list.innerHTML = '<div class="dm-team-empty">No trusted device registered.</div>';
                return;
            }
            const label = lockData.trustedDeviceLabel || 'Unknown device';
            const since = lockData.enabledAt ? new Date(lockData.enabledAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
            const isThis = lockData.trustedDeviceId === _getOrCreateDeviceId();
            list.innerHTML =
                '<div class="dm-device-row">' +
                    '<div class="dm-device-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg></div>' +
                    '<div class="dm-device-info">' +
                        '<div class="dm-device-name">' + label + '</div>' +
                        '<div class="dm-device-meta">Trusted since ' + since + (isThis ? ' · This device' : '') + '</div>' +
                    '</div>' +
                    (isThis ? '<span class="dm-device-tag">Trusted</span>' : '') +
                '</div>';
        }
        window.toggleDeviceLock = async function(enabled){
            hideMsg('dmSecErr','dmSecOk');
            const user = auth.currentUser; if(!user) return;
            const toggle = $('sec2faToggle');
            if (toggle) toggle.disabled = true;
            try {
                const deviceId = _getOrCreateDeviceId();
                const deviceLabel = _parseDeviceLabel();
                const payload = enabled
                    ? { deviceLock: { enabled: true, trustedDeviceId: deviceId, trustedDeviceLabel: deviceLabel, enabledAt: Date.now() } }
                    : { deviceLock: { enabled: false, trustedDeviceId: null, trustedDeviceLabel: null, enabledAt: null } };
                await update(ref(db,'users/'+user.uid), payload);
                const badge = $('secTwoFaBadge');
                if (badge) {
                    badge.textContent = enabled ? 'LOCK ON' : 'LOCK OFF';
                    badge.classList.toggle('dm-accordion-badge-off', !enabled);
                }
                _renderTrustedDevice(enabled ? { enabled: true, trustedDeviceId: deviceId, trustedDeviceLabel: deviceLabel, enabledAt: Date.now() } : null);
                showOk('dmSecOk', enabled ? 'Device lock enabled. Only this device can access this account.' : 'Device lock disabled. Any device can now sign in.');
            } catch(e) {
                if (toggle) toggle.checked = !enabled;
                showErr('dmSecErr', firebaseErrMsg(e.code) || 'Could not update this setting. Try again.');
            } finally {
                if (toggle) toggle.disabled = false;
            }
        };
        // Called from applyUserData to sync toggle state and render trusted device
        function _syncDeviceLockUI(data) {
            const lock = data.deviceLock || {};
            const toggle = $('sec2faToggle');
            if (toggle) toggle.checked = !!lock.enabled;
            const badge = $('secTwoFaBadge');
            if (badge) {
                badge.textContent = lock.enabled ? 'LOCK ON' : 'LOCK OFF';
                badge.classList.toggle('dm-accordion-badge-off', !lock.enabled);
            }
            _renderTrustedDevice(lock.enabled ? lock : null);
        }

        //  Team access — invite collaborators with role (viewer / editor)  
        function _escTeam(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
        async function _loadTeamMembers(){
            const list = $('teamMemberList');
            const badge = $('teamCountBadge');
            if (!list) return;
            const user = auth.currentUser;
            if (!user) return;
            try {
                const snap = await get(ref(db, 'users/'+user.uid+'/teamMembers'));
                const members = snap.val() || {};
                const keys = Object.keys(members);
                if (badge) badge.textContent = keys.length + ' member' + (keys.length === 1 ? '' : 's');
                if (!keys.length) { list.innerHTML = '<div class="dm-team-empty">Just you for now.</div>'; return; }
                list.innerHTML = keys.map(k => {
                    const m = members[k] || {};
                    const email = m.email || k;
                    const pending = m.status === 'pending';
                    const role = m.role || 'viewer';
                    const initial = email.charAt(0).toUpperCase();
                    return '<div class="dm-team-row">' +
                        '<div class="dm-team-avatar">' + initial + '</div>' +
                        '<div class="dm-team-info">' +
                            '<div class="dm-team-email">' + _escTeam(email) + '</div>' +
                            '<div class="dm-team-role' + (pending ? ' pending' : '') + '">' + (pending ? 'Pending · ' : '') + role.charAt(0).toUpperCase() + role.slice(1) + '</div>' +
                        '</div>' +
                        '<div class="dm-team-remove" onclick="removeTeamMember(\'' + k.replace(/'/g,"\\'") + '\')" title="Remove">' +
                            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } catch(e) {
                list.innerHTML = '<div class="dm-team-empty">Could not load members.</div>';
            }
        }
        window.inviteTeamMember = async function(){
            hideMsg('teamErr','teamOk');
            const user = auth.currentUser; if(!user) return;
            const emailInput = $('teamInviteEmail');
            const roleInput  = $('teamInviteRole');
            const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
            const role  = roleInput ? roleInput.value : 'viewer';
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('teamErr','Enter a valid email address.');
            if (email === (user.email||'').toLowerCase()) return showErr('teamErr','That\'s your own email.');
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/security?mode=accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ action: 'invite', inviteeEmail: email, role })
                });
                const json = await res.json();
                if (!res.ok) return showErr('teamErr', json.error || 'Could not send invite. Try again.');
                if (emailInput) emailInput.value = '';
                showOk('teamOk', 'Invite sent to ' + email + ' as ' + role + '.');
                _loadTeamMembers();
            } catch(e) {
                showErr('teamErr', 'Could not send invite. Try again.');
            }
        };
        window.removeTeamMember = async function(key){
            const user = auth.currentUser; if(!user) return;
            // key is the emailKey; derive email from the member record
            try {
                const snap = await get(ref(db, 'users/'+user.uid+'/teamMembers/'+key));
                const member = snap.val() || {};
                const email = member.email || key.replace(/_/g, '.');
                const token = await user.getIdToken();
                const res = await fetch('/api/security?mode=accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ action: 'revoke', inviteeEmail: email })
                });
                if (res.ok) _loadTeamMembers();
                else showErr('teamErr', 'Could not remove this member. Try again.');
            } catch(e) {
                showErr('teamErr', 'Could not remove this member. Try again.');
            }
        };

        //  friendly Firebase errors 
        function firebaseErrMsg(code){
            const map = {
                'auth/email-already-in-use': 'That email is already registered. Try signing in.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/weak-password': 'Password must be at least 6 characters.',
                'auth/user-not-found': 'No account found with that email.',
                'auth/wrong-password': 'Incorrect password. Try again.',
                'auth/invalid-credential': 'Incorrect email or password.',
                'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
                'auth/network-request-failed': 'Network error. Check your connection.',
                'auth/requires-recent-login': 'Please sign out and sign back in to make this change.'
            };
            return map[code] || 'Something went wrong. Please try again.';
        }



        //  Hero CTA handlers 
        window.handleBrowseCta = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (!auth.currentUser) { openAuthModal(); return; }
            const userData = window._fbUserData || {};
            const username = userData.username || auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || '';
            const dest = username ? '/browse?u=' + encodeURIComponent(username) : '/browse';
            window.location.href = dest;
        };

        window.handleSellCta = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (!auth.currentUser) { openAuthModal(); return; }
            const userData = window._fbUserData || {};
            const username = userData.username || auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || '';
            const dest = '/sell-my-site' + (username ? '#' + encodeURIComponent(username) : '');
            window.location.href = dest;
        };

        //  Upgrade Modal 
        const PLAN_DATA = {
            free:    { name:'Free',    price:'$0',   priceNum:0,  color:'#8b8aa8', desc:'Start listing for free with up to 5 sites per month and 1 per day. Great for testing the platform before committing.' },
            starter: { name:'Starter', price:'$20',  priceNum:20, color:'#a855f7', desc:'For growing sellers. List up to 5 sites per day with a reduced 15% platform fee — saving you 15% on every sale vs free.' },
            growth:  { name:'Growth',  price:'$40',  priceNum:40, color:'#818cf8', desc:'Our most popular plan. No monthly listing cap, 10% fee, featured highlights, advanced analytics and priority support in 4 hours.' },
            pro:     { name:'Pro',     price:'$50',  priceNum:50, color:'#38bdf8', desc:'For power sellers. Unlimited everything, just 5% fee per sale — the lowest on the platform — plus database + hosting infrastructure for your buyers and a dedicated account manager.' }
        };

        const PLAN_BENEFITS = {
            free:    ['1 listing per day','5 total listings per month','30% platform fee on every sale','Basic search visibility','Community support only','Buyer marketplace access','Manage listings from dashboard','Safe payment escrow','Basic seller profile page','No subscription required'],
            starter: ['5 listings per day (5× more than Free)','150 listings per month cap','Only 15% platform fee — save 15% vs Free','Priority search ranking over free sellers','Email support within 24 hours','Listing performance analytics','Featured in weekly newsletter','Early access to new features','Custom seller bio and links','Cancel anytime — no lock-in'],
            growth:  ['15 listings per day (3× more than Starter)','Unlimited monthly listings — no cap','Only 10% platform fee — save 20% vs Free','Featured listing highlights on homepage','Priority support — replies within 4 hours','Advanced analytics dashboard with buyer data','Bulk listing management tools','Monthly seller insights report','Top-tier search placement over Starter','Cancel anytime — no lock-in'],
            pro:     ['Unlimited daily listings — zero cap','Unlimited monthly listings','Only 5% platform fee — save 25% vs Free','Database + serverless hosting included for buyers','Admin dashboard your buyers use to run their site','$49.99/mo hosting plan you earn recurring from','Top search placement guaranteed above all plans','Dedicated account manager — real human, direct line','Custom storefront page with your brand','Live chat support 24/7 — no waiting queues']
        };

        let _currentUpgradePlan = null;

        // openUpgradeModal is defined below alongside the plans picker — it delegates to openPlansPickerModal

        window.closeUpgradeModal = function() {
            $('upgradeOverlay').classList.remove('open');
            if (window._unlockBodyScroll) window._unlockBodyScroll();
        };

        //  PLANS PICKER MODAL 

        let _ppCurrentPlan = 'starter';

        // Per-plan visual config matching the Premium Switcher theme
        const PSW_TINTS = {
            starter: {
                solid: '#8dff64',
                shimmer: 'linear-gradient(135deg, rgba(141, 255, 100, 0.12) 0%, rgba(0, 0, 0, 0) 60%)',
                ctaText: 'Get Starter',
                iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            },
            growth: {
                solid: '#aae7ff',
                shimmer: 'linear-gradient(135deg, rgba(170, 231, 255, 0.15) 0%, rgba(0, 0, 0, 0) 60%)',
                ctaText: 'Upgrade to Growth',
                iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 16.2L5.8 12 12 5.8 18.2 12 12 18.2z"/></svg>'
            },
            pro: {
                solid: '#ffd464',
                shimmer: 'linear-gradient(135deg, rgba(255, 212, 100, 0.12) 0%, rgba(0, 0, 0, 0) 60%)',
                ctaText: 'Go Pro',
                iconSvg: '<svg viewBox="0 0 24 24"><path d="M5 16h14L21 8l-5 4-4-7-4 7-5-4 2 8zm14 2H5v2h14v-2z"/></svg>'
            }
        };

        const PSW_TAB_INDEX = { starter: 0, growth: 1, pro: 2 };

        //  Open/close the modal 
        window.openPlansPickerModal = function() {
            const overlay = $('plansPickerOverlay');
            if (!overlay) return;

            //  Populate header with the current user's info 
            const fbAuth = window._fbAuth;
            const fbUserData = window._fbUserData || {};
            const username = fbUserData.username || (fbAuth && fbAuth.currentUser && fbAuth.currentUser.email && fbAuth.currentUser.email.split('@')[0]) || 'you';
            const planName = fbUserData.plan || 'Free';

            const avatarEl = $('ppAvatar');
            const usernameEl = $('ppUsername');
            const planPillEl = $('ppCurrentPlanPill');
            if (avatarEl) avatarEl.textContent = (username || 'U').charAt(0).toUpperCase();
            if (usernameEl) usernameEl.textContent = '@' + username;
            if (planPillEl) planPillEl.textContent = planName + ' Plan';

            overlay.classList.add('open');
            lockBodyScroll();
            collapsePlanFeatures();
            showPlanTab('starter');
        };

        window.closePlansPickerModal = function() {
            const overlay = $('plansPickerOverlay');
            if (overlay) { overlay.classList.remove('open'); unlockBodyScroll(); }
        };

        //  Switch between Starter / Growth / Pro tabs 
        window.showPlanTab = function(key) {
            _ppCurrentPlan = key;
            const plan = PLAN_DATA[key];
            const allBenefits = PLAN_BENEFITS[key] || [];
            const visibleFeatures = allBenefits.slice(0, 5);
            const hiddenFeatures = allBenefits.slice(5);
            const tint = PSW_TINTS[key] || PSW_TINTS.starter;

            collapsePlanFeatures();

            //  Slider position + color 
            const slider = $('ppSlider');
            if (slider) {
                slider.style.transform = 'translateX(' + (PSW_TAB_INDEX[key] * 100) + '%)';
                slider.style.backgroundColor = tint.solid;
            }

            //  Tab active states 
            ['starter','growth','pro'].forEach(k => {
                const tab = $('ppTab-' + k);
                if (!tab) return;
                tab.classList.toggle('active', k === key);
                tab.style.color = (k === key) ? '#000' : '#7c8e9c';
            });

            //  Shimmer reflection tint 
            const shimmerEl = $('ppShimmer');
            if (shimmerEl) shimmerEl.style.background = tint.shimmer;

            //  Fade out, then swap content 
            const dynamicEl = $('ppDynamic');
            if (dynamicEl) dynamicEl.classList.add('swapping');

            setTimeout(() => {
                //  Price 
                const priceEl = $('ppPrice');
                if (priceEl) {
                    priceEl.innerHTML = plan.price.replace('$','') + '<span>/mo</span>';
                    priceEl.style.color = tint.solid;
                }

                //  Description 
                const descEl = $('ppDesc');
                if (descEl) descEl.textContent = plan.desc;

                //  Icon badge 
                const iconEl = $('ppIconBadge');
                if (iconEl) {
                    iconEl.innerHTML = tint.iconSvg;
                    iconEl.style.backgroundColor = tint.solid;
                    const svg = iconEl.querySelector('svg');
                    if (svg) svg.style.fill = '#000';
                }

                //  Visible + hidden feature lists 
                const visibleEl = $('ppFeaturesVisible');
                if (visibleEl) {
                    visibleEl.innerHTML = '';
                    visibleFeatures.forEach(f => visibleEl.appendChild(_pswFeatureLi(f, tint.solid)));
                }
                const hiddenEl = $('ppFeaturesHidden');
                if (hiddenEl) {
                    hiddenEl.innerHTML = '';
                    hiddenFeatures.forEach(f => hiddenEl.appendChild(_pswFeatureLi(f, tint.solid)));
                }

                if (dynamicEl) dynamicEl.classList.remove('swapping');
            }, 150);

            //  Render PayPal button 
            // Always destroy & re-render on every plan switch so:
            //   1. The correct plan_id is used (not a cached stale one)
            //   2. No double-render from leftover PayPal iframes
            const loadingEl   = $('ppPaypalLoading');
            const containerEl = $('ppPaypalContainer');
            const errorEl     = $('ppPaypalError');

            // Wipe the container completely — removes any existing PayPal iframes/buttons
            if (containerEl) { containerEl.innerHTML = ''; containerEl.style.display = 'none'; }
            if (loadingEl)   loadingEl.style.display = 'flex';
            if (errorEl)     errorEl.style.display   = 'none';

            const planId = PAYPAL_PLAN_IDS[key];
            if (!planId) { if (loadingEl) loadingEl.style.display = 'none'; return; }

            // Give the DOM a frame to clear before PayPal writes into it
            requestAnimationFrame(function() {
                function _renderPP() {
                    if (typeof paypalSub === 'undefined' || !paypalSub.Buttons) {
                        loadPaypalSubSDK(function() { _renderPP(); });
                        return;
                    }
                    try {
                        paypalSub.Buttons({
                            style: {
                                layout: 'vertical',
                                color:  'gold',    // PayPal yellow — bright, on-brand
                                shape:  'pill',
                                label:  'subscribe',
                                height: 45
                            },
                            createSubscription: function(data, actions) {
                                return actions.subscription.create({ plan_id: planId });
                            },
                            onApprove: async function(data) {
                                // SECURITY: Do NOT write plan to Firebase here.
                                // Plan is set by the server-side PayPal webhook (BILLING.SUBSCRIPTION.ACTIVATED).
                                // Only write the reverse-lookup index so the webhook can find this user.
                                const user = window._fbAuth && window._fbAuth.currentUser;
                                if (!user) { closePlansPickerModal(); return; }
                                try {
                                    const { _ref: fbRef, _set: fbSet, _fbDb: fbDb } = window;
                                    if (fbDb && fbRef && fbSet) {
                                        await fbSet(fbRef(fbDb, 'paypalSubs/' + data.subscriptionID), { uid: user.uid });
                                    }
                                    closePlansPickerModal();
                                    if (typeof _showUpgradeSuccess === 'function') _showUpgradeSuccess('pending');
                                } catch(e) {
                                    console.error('[plans picker onApprove]', e);
                                    closePlansPickerModal();
                                }
                            },
                            onError: function(err) {
                                console.error('[PP plans picker]', err);
                                if (loadingEl)   loadingEl.style.display = 'none';
                                if (errorEl)     errorEl.style.display   = 'block';
                            }
                        }).render('#ppPaypalContainer').then(function() {
                            if (loadingEl)   loadingEl.style.display   = 'none';
                            if (containerEl) containerEl.style.display = 'block';
                        }).catch(function(err) {
                            console.error('[PP render]', err);
                            if (loadingEl) loadingEl.style.display = 'none';
                            if (errorEl)   errorEl.style.display   = 'block';
                        });
                    } catch(e) {
                        console.error('[PP render catch]', e);
                        if (loadingEl) loadingEl.style.display = 'none';
                        if (errorEl)   errorEl.style.display   = 'block';
                    }
                }
                _renderPP();
            });
        };

        //  Build a single feature <li> with a check icon in the plan's color 
        function _pswFeatureLi(text, color) {
            const li = document.createElement('li');
            li.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>' + text + '</span>';
            return li;
        }

        //  Read More / Read Less toggle for hidden features 
        window.togglePlanFeatures = function() {
            const container = $('ppHiddenContainer');
            const btn = $('ppToggleBtn');
            if (!container || !btn) return;
            if (container.classList.contains('expanded')) {
                collapsePlanFeatures();
            } else {
                container.classList.add('expanded');
                btn.classList.add('open');
                btn.querySelector('span').textContent = 'Read Less';
            }
        };

        function collapsePlanFeatures() {
            const container = $('ppHiddenContainer');
            const btn = $('ppToggleBtn');
            if (container && btn) {
                container.classList.remove('expanded');
                btn.classList.remove('open');
                btn.querySelector('span').textContent = 'Read More';
            }
        }

        function _hexToRgbStr(hex) {
            const r = parseInt(hex.slice(1,3),16);
            const g = parseInt(hex.slice(3,5),16);
            const b = parseInt(hex.slice(5,7),16);
            return r + ',' + g + ',' + b;
        }

        //  PayPal Subscription Plan IDs 
        const PAYPAL_PLAN_IDS = {
            starter: 'P-2UM27780UX986645YNIMMZDQ',
            growth:  'P-2EV3026970640161WNIMM2FY',
            pro:     'P-86R97345Y14435425NIMM3AA'
        };

        // PayPal subscription SDK — loaded separately from capture SDK to avoid intent conflict
        const PAYPAL_SUB_CLIENT = 'AW7nmsZqdabjCrj62j0qekUqalJJ3T53ngjrime14foH5HMhNLmpUzULQV-OvV82KSuZQoBoEP4Rkwi4';
        let _ppSubSDKLoaded = false;
        let _ppSubSDKLoading = false;
        let _ppSubSDKCallbacks = [];

        function loadPaypalSubSDK(cb) {
            if (_ppSubSDKLoaded) { cb(); return; }
            _ppSubSDKCallbacks.push(cb);
            if (_ppSubSDKLoading) return;
            _ppSubSDKLoading = true;
            const s = document.createElement('script');
            s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_SUB_CLIENT}&vault=true&intent=subscription&components=buttons`;
            s.setAttribute('data-sdk-integration-source', 'button-factory');
            s.setAttribute('data-namespace', 'paypalSub');
            s.id = 'paypalSubSDK';
            s.onload = () => {
                _ppSubSDKLoaded = true;
                _ppSubSDKLoading = false;
                _ppSubSDKCallbacks.forEach(fn => fn());
                _ppSubSDKCallbacks = [];
            };
            s.onerror = () => {
                _ppSubSDKLoading = false;
                // Show error in whichever modal is visible
                ['ppPaypalLoading','upgradePaypalLoading'].forEach(id => {
                    const el = $(id); if (el) el.style.display = 'none';
                });
                ['ppPaypalError','upgradePaypalError'].forEach(id => {
                    const el = $(id); if (el) el.style.display = 'block';
                });
            };
            document.body.appendChild(s);
        }

        // openUpgradeModal — delegates to the plans picker modal (same PayPal flow as profile upgrade)
        window.openUpgradeModal = function(planKey) {
            if (!planKey) return;
            const key = (planKey || 'free').toLowerCase().replace(/[^a-z]/g,'');
            if (key === 'free') return;
            // Use the plans picker modal (which has working PayPal) and pre-select the right tab
            openPlansPickerModal();
            // showPlanTab may need a tick after the modal opens to find DOM elements
            setTimeout(() => { if (typeof showPlanTab === 'function') showPlanTab(key); }, 50);
        };

        function _showUpgradeSuccess(planName) {
            // Brief success toast at top of page
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;top:74px;left:50%;transform:translateX(-50%);z-index:99999;background:linear-gradient(135deg,rgba(52,211,153,0.18),rgba(56,189,248,0.12));border:1px solid rgba(52,211,153,0.35);border-radius:12px;padding:10px 18px;display:flex;align-items:center;gap:8px;font-family:"Syne",sans-serif;font-size:13px;font-weight:700;color:#34d399;box-shadow:0 4px 24px rgba(0,0,0,0.4);white-space:nowrap;animation:fadeIn .25s ease;';
            toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#34d399" stroke-width="1.3"/><path d="M5 8l2 2 4-4" stroke="#34d399" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Now on <span style="color:#f1f0ff;margin-left:4px;">' + planName + '</span>';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.transition = 'opacity .4s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
        }

        window.closeUpgradeModal = function() {
            $('upgradeOverlay').classList.remove('open');
            unlockBodyScroll();
        };
        window.handlePlanClick = function(planKey) {
            if (!auth.currentUser) { openAuthModal(); return; }
            openUpgradeModal(planKey);
        };

        function hexToRgb(hex) {
            const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            return r+','+g+','+b;
        }

        //  Plans carousel auto-scroll 
        (function initPlansScroll() {
            const scroller = document.querySelector('.plans-grid-scroll');
            const dots = document.querySelectorAll('.plans-dot');
            if (!scroller || !dots.length) return;

            const CARD_WIDTH = 224; // approx card + gap
            const TOTAL_CARDS = 4;
            let currentIdx = 0;
            let autoTimer = null;
            let isUserInteracting = false;

            window.scrollPlanTo = function(idx) {
                currentIdx = Math.max(0, Math.min(TOTAL_CARDS - 1, idx));
                scroller.scrollTo({ left: currentIdx * CARD_WIDTH, behavior: 'smooth' });
                updateDots();
            };

            function updateDots() {
                dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
            }

            function startAuto() {
                stopAuto();
                autoTimer = setInterval(() => {
                    if (isUserInteracting) return;
                    currentIdx = (currentIdx + 1) % TOTAL_CARDS;
                    scroller.scrollTo({ left: currentIdx * CARD_WIDTH, behavior: 'smooth' });
                    updateDots();
                }, 2800);
            }

            function stopAuto() {
                if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
            }

            // Pause on user touch / mouse
            scroller.addEventListener('touchstart', () => { isUserInteracting = true; stopAuto(); }, { passive: true });
            scroller.addEventListener('mousedown', () => { isUserInteracting = true; stopAuto(); });
            scroller.addEventListener('touchend', () => {
                // Detect which card is visible after scroll ends
                setTimeout(() => {
                    isUserInteracting = false;
                    currentIdx = Math.round(scroller.scrollLeft / CARD_WIDTH);
                    updateDots();
                    startAuto();
                }, 400);
            });
            scroller.addEventListener('mouseup', () => {
                setTimeout(() => {
                    isUserInteracting = false;
                    currentIdx = Math.round(scroller.scrollLeft / CARD_WIDTH);
                    updateDots();
                    startAuto();
                }, 400);
            });

            // Only run auto-scroll on mobile
            function checkAndStart() {
                if (window.innerWidth < 860) startAuto();
                else stopAuto();
            }
            window.addEventListener('resize', checkAndStart);
            checkAndStart();
        })();
        // Only --bg changes between themes — surface, text, border, accent all stay constant
        window.THEME_BACKGROUNDS = {
            green:  '#060f08',
            navy:   '#070b14',
            slate:  '#0a0d12',
            black:  '#000000'
        };
        window.setTheme = function(theme) {
            const bg = window.THEME_BACKGROUNDS[theme] || window.THEME_BACKGROUNDS.green;
            document.documentElement.style.setProperty('--bg', bg);
            localStorage.setItem('siterifty_theme', theme);
        };

        // Apply saved theme on load
        (function(){
            const saved = localStorage.getItem('siterifty_theme') || 'green';
            if (saved !== 'green') {
                setTimeout(() => {
                    window.setTheme(saved);
                    selectThemeRow(saved);
                }, 150);
            }
        })();

        //  Notification toggles 
        //  Settings panel navigation 
        const SETTINGS_PANEL_MAP = {
            profile:       'subProfile',
            billing:       'subBilling',
            appearance:    'subAppearance',
            design:        'subDesign',
            notifications: 'subNotifications',
            contact:       'subContact',
            about:         'subAbout',
            security:      'subSecurity',
            sessions:      'subSessions',
            privacy:       'subPrivacy',
            activity:      'subActivity',
            saved:         'subSaved',
            offers:        'subOffers',
            referral:      'subReferral',
            transferAccount: 'subTransferAccount',
            deleteAccount: 'subDeleteAccount',
            // Deal Settings
            dealPrefs:        'subDealPrefs',
            payoutSettings:   'subPayoutSettings',
            taxInfo:          'subTaxInfo',
            txnHistory:       'subTxnHistory'
        };

        window.openSettingsPanel = function(name) {
            const id = SETTINGS_PANEL_MAP[name];
            if (!id) return;
            const el = document.getElementById(id);
            if (!el) return;
            // Force display:flex then trigger the slide
            el.style.display = 'flex';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.classList.add('open');
                    // Init notifications panel state after slide-in
                    if (name === 'notifications' && window.initNotifPanel) window.initNotifPanel();
                    if (name === 'design') window._srInitDesignPanel && window._srInitDesignPanel();
                    // Load live data for dynamic panels
                    if (name === 'offers')          _loadOffersPanel();
                    if (name === 'sellerAnalytics') _loadSellerAnalyticsPanel();
                    if (name === 'escrowStatus')    _loadEscrowPanel();
                    if (name === 'txnHistory')      window._txnLoadAll && window._txnLoadAll();
                    if (name === 'profile')         _subProfilePopulate();
                });
            });
        };

        // ── subProfile panel: populate, save, password ──────────────────────────
        function _subProfilePopulate() {
            var user = window._fbAuth && window._fbAuth.currentUser;
            // Avatar
            var avatarEl = document.getElementById('subProfileAvatar');
            var mainAvatar = document.getElementById('profileAvatarCircle');
            if (avatarEl && mainAvatar) {
                avatarEl.innerHTML = mainAvatar.innerHTML;
                avatarEl.style.backgroundImage = mainAvatar.style.backgroundImage;
                avatarEl.style.backgroundSize  = mainAvatar.style.backgroundSize;
                avatarEl.style.color           = mainAvatar.style.color;
            }
            // Fields — mirror from the main profile fields which are already populated
            var usernameEl = document.getElementById('subProfileUsername');
            var bioEl      = document.getElementById('subProfileBio');
            var emailEl    = document.getElementById('subProfileEmail');
            var bioCount   = document.getElementById('subProfileBioCount');
            if (usernameEl) usernameEl.value = (document.getElementById('accUsername') || {}).value || (user && user.displayName) || '';
            if (bioEl)      { bioEl.value = (document.getElementById('accBio') || {}).value || ''; if (bioCount) bioCount.textContent = bioEl.value.length; }
            if (emailEl)    emailEl.value = (user && user.email) || '';
            // Clear password fields & messages
            ['subProfilePw','subProfilePwConfirm'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
            ['subProfileErr','subProfileOk','subProfilePwErr','subProfilePwOk','subProfilePwHint'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=''; });
        }

        window._subProfileSave = function() {
            // Delegate to the existing saveAccount() which reads from #accUsername / #accBio
            var subUsername = document.getElementById('subProfileUsername');
            var subBio      = document.getElementById('subProfileBio');
            var mainUsername = document.getElementById('accUsername');
            var mainBio      = document.getElementById('accBio');
            // Sync values into the main fields so saveAccount() picks them up
            if (subUsername && mainUsername) mainUsername.value = subUsername.value;
            if (subBio && mainBio)           mainBio.value      = subBio.value;
            // Temporarily redirect success/error feedback to subProfile alerts
            var errEl = document.getElementById('subProfileErr');
            var okEl  = document.getElementById('subProfileOk');
            if (errEl) errEl.textContent = '';
            if (okEl)  okEl.textContent  = '';
            if (typeof saveAccount === 'function') {
                // Swap alert targets momentarily
                var origErrEl = document.getElementById('accErr');
                var origOkEl  = document.getElementById('accOk');
                var origErrHtml = origErrEl ? origErrEl.textContent : '';
                var origOkHtml  = origOkEl  ? origOkEl.textContent  : '';
                saveAccount();
                // After a tick, mirror result into subProfile alerts
                setTimeout(function() {
                    if (errEl && origErrEl) errEl.textContent = origErrEl.textContent;
                    if (okEl  && origOkEl)  okEl.textContent  = origOkEl.textContent;
                    // Also refresh the avatar display in this panel
                    var avatarEl = document.getElementById('subProfileAvatar');
                    var mainAvatar = document.getElementById('profileAvatarCircle');
                    if (avatarEl && mainAvatar) avatarEl.innerHTML = mainAvatar.innerHTML;
                }, 800);
            }
        };

        window._subProfileSavePw = function() {
            var pwEl     = document.getElementById('subProfilePw');
            var pw2El    = document.getElementById('subProfilePwConfirm');
            var hintEl   = document.getElementById('subProfilePwHint');
            var errEl    = document.getElementById('subProfilePwErr');
            var okEl     = document.getElementById('subProfilePwOk');
            if (!pwEl || !pw2El) return;
            var pw  = pwEl.value.trim();
            var pw2 = pw2El.value.trim();
            if (hintEl) hintEl.textContent = '';
            if (errEl)  errEl.textContent  = '';
            if (okEl)   okEl.textContent   = '';
            if (!pw)   { if (errEl) errEl.textContent = 'Enter a new password.'; return; }
            if (pw.length < 6) { if (errEl) errEl.textContent = 'Password must be at least 6 characters.'; return; }
            if (pw !== pw2)    { if (hintEl) hintEl.textContent = "Passwords don't match."; return; }
            // Sync to main fields and delegate
            var mainPw  = document.getElementById('accPassword');
            var mainPw2 = document.getElementById('accPasswordConfirm');
            if (mainPw)  mainPw.value  = pw;
            if (mainPw2) mainPw2.value = pw2;
            if (typeof savePassword === 'function') {
                savePassword();
                setTimeout(function() {
                    var mainErr = document.getElementById('pwErr');
                    var mainOk  = document.getElementById('pwOk');
                    if (errEl && mainErr) errEl.textContent = mainErr.textContent;
                    if (okEl  && mainOk)  okEl.textContent  = mainOk.textContent;
                    if (okEl && okEl.textContent) { pwEl.value = ''; pw2El.value = ''; }
                }, 800);
            }
        };

        // ── DESIGN PANEL — background image picker ──────────────────────────────
        // 3 wallpapers + "none". Persisted to localStorage (survives logout) AND
        // Firebase users/{uid}/bgImage (syncs across devices).
        (function() {
            const DEFAULT_BG = 'https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg';
            const LS_KEY = 'sr_bg_img';

            // Collect all options dynamically from DOM at runtime
            function _getAllOptions() {
                return Array.from(document.querySelectorAll('.sr-bg-option[data-bg]'));
            }

            const HERO_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10';

            // Apply a bg URL (or '' for none) to all surfaces
            window._srApplyBg = function(url) {
                const bgLayer   = document.getElementById('srBgLayer');
                const authBg    = document.getElementById('authModalBg');
                const heroBg    = document.getElementById('srHeroBgImg');
                const root      = document.documentElement;

                if (url) {
                    if (bgLayer) {
                        bgLayer.style.backgroundImage = 'url(' + url + ')';
                        bgLayer.style.opacity = '0.18';
                    }
                    if (authBg) authBg.style.backgroundImage = 'url(' + url + ')';
                    if (heroBg) { heroBg.style.transition = 'opacity .4s'; heroBg.style.opacity = '0'; setTimeout(function(){ heroBg.src = url; heroBg.style.opacity = ''; }, 350); }
                    var chatBg = document.getElementById('imsgChatBg');
                    if (chatBg) { chatBg.style.backgroundImage = 'url(' + url + ')'; chatBg.style.opacity = '0.13'; }
                    var inboxBg = document.getElementById('imsgInboxBg');
                    if (inboxBg) { inboxBg.style.backgroundImage = 'url(' + url + ')'; inboxBg.style.opacity = '0.13'; }
                    var dashBgImg = document.getElementById('dashModalBgImg');
                    if (dashBgImg) { dashBgImg.style.transition = 'opacity .4s'; dashBgImg.style.opacity = '0'; setTimeout(function(){ dashBgImg.src = url; dashBgImg.style.opacity = ''; }, 350); }
                    var walletBg = document.getElementById('walletBg');
                    if (walletBg) { walletBg.style.backgroundImage = 'url(' + url + ')'; walletBg.style.opacity = '0.13'; }
                    var topupBg = document.getElementById('topupBg');
                    if (topupBg) { topupBg.style.backgroundImage = 'url(' + url + ')'; topupBg.style.opacity = '0.13'; }
                    var upgradeBg = document.getElementById('upgradeBg');
                    if (upgradeBg) { upgradeBg.style.backgroundImage = 'url(' + url + ')'; upgradeBg.style.opacity = '0.13'; }
                    var plansBg = document.getElementById('plansBg');
                    if (plansBg) { plansBg.style.backgroundImage = 'url(' + url + ')'; plansBg.style.opacity = '0.18'; }
                    var pswImg = document.getElementById('pswTitleAreaImg');
                    if (pswImg) { pswImg.style.transition = 'opacity .4s'; pswImg.style.opacity = '0'; setTimeout(function(){ pswImg.src = url; pswImg.style.opacity = ''; }, 350); }
                } else {
                    if (bgLayer) { bgLayer.style.opacity = '0'; bgLayer.style.backgroundImage = 'none'; }
                    if (authBg)  authBg.style.backgroundImage = "url('" + DEFAULT_BG + "')";
                    if (heroBg) { heroBg.style.transition = 'opacity .4s'; heroBg.style.opacity = '0'; setTimeout(function(){ heroBg.src = HERO_DEFAULT; heroBg.style.opacity = ''; }, 350); }
                    var chatBg = document.getElementById('imsgChatBg');
                    if (chatBg) { chatBg.style.opacity = '0'; chatBg.style.backgroundImage = 'none'; }
                    var inboxBg = document.getElementById('imsgInboxBg');
                    if (inboxBg) { inboxBg.style.opacity = '0'; inboxBg.style.backgroundImage = 'none'; }
                    var dashBgImg = document.getElementById('dashModalBgImg');
                    if (dashBgImg) { dashBgImg.style.transition = 'opacity .4s'; dashBgImg.style.opacity = '0'; setTimeout(function(){ dashBgImg.src = HERO_DEFAULT; dashBgImg.style.opacity = ''; }, 350); }
                    var walletBg = document.getElementById('walletBg');
                    if (walletBg) { walletBg.style.opacity = '0'; walletBg.style.backgroundImage = 'none'; }
                    var topupBg = document.getElementById('topupBg');
                    if (topupBg) { topupBg.style.opacity = '0'; topupBg.style.backgroundImage = 'none'; }
                    var upgradeBg = document.getElementById('upgradeBg');
                    if (upgradeBg) { upgradeBg.style.opacity = '0'; upgradeBg.style.backgroundImage = 'none'; }
                    var plansBg = document.getElementById('plansBg');
                    if (plansBg) { plansBg.style.opacity = '0'; plansBg.style.backgroundImage = 'none'; }
                    var pswImg = document.getElementById('pswTitleAreaImg');
                    if (pswImg) { pswImg.style.transition = 'opacity .4s'; pswImg.style.opacity = '0'; setTimeout(function(){ pswImg.src = HERO_DEFAULT; pswImg.style.opacity = ''; }, 350); }
                }
            };

            // Save + apply
            window.srSelectBg = function(optEl) {
                const url = optEl ? (optEl.dataset ? optEl.dataset.bg : '') : '';

                try { localStorage.setItem(LS_KEY, url || '__none__'); } catch(_) {}

                try {
                    const u = window._fbAuth && window._fbAuth.currentUser;
                    if (u && window._fbDb) {
                        const fns = window._fbDbFns || {};
                        if (fns.update && fns.ref) {
                            fns.update(fns.ref(window._fbDb, 'users/' + u.uid), { bgImage: url || '__none__' });
                        }
                    }
                } catch(_) {}

                window._srApplyBg(url);
                _updatePickerUI(url);

                // Update settings row value label
                const valEl = document.getElementById('settingsDesignVal');
                if (valEl) {
                    if (!url) {
                        valEl.textContent = 'None';
                    } else {
                        const matchEl = (document.querySelectorAll('.sr-bg-option[data-bg]') || []);
                        let found = 'Custom';
                        matchEl.forEach(function(el) { if (el.dataset.bg === url) found = el.dataset.label || 'Custom'; });
                        valEl.textContent = found;
                    }
                }

                const statusEl = document.getElementById('srBgSaveStatus');
                if (statusEl) {
                    statusEl.textContent = '✓ Saved';
                    statusEl.style.color = '#34d399';
                    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
                }
            };

            function _updatePickerUI(activeUrl) {
                _getAllOptions().forEach(function(opt) {
                    const check = opt.querySelector('.sr-bg-check');
                    const isActive = (activeUrl && opt.dataset.bg === activeUrl);
                    opt.style.borderColor = isActive ? '#a855f7' : 'transparent';
                    opt.style.transform   = isActive ? 'scale(0.96)' : '';
                    opt.style.boxShadow   = isActive ? '0 0 0 3px rgba(168,85,247,0.25)' : 'none';
                    if (check) check.style.display = isActive ? 'flex' : 'none';
                });
                // None option
                const noneEl    = document.getElementById('srBgOptNone');
                const noneCheck = document.getElementById('srBgNoneCheck');
                const noneActive = !activeUrl;
                if (noneEl)    { noneEl.style.background = noneActive ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)'; noneEl.style.borderColor = noneActive ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.07)'; }
                if (noneCheck) noneCheck.style.display = noneActive ? 'flex' : 'none';
            }

            // Called when design panel is opened — sync UI to current selection
            window._srInitDesignPanel = function() {
                const current = _getCurrentBg();
                _updatePickerUI(current);
                const valEl = document.getElementById('settingsDesignVal');
                if (valEl) {
                    if (!current) {
                        valEl.textContent = 'None';
                    } else {
                        let found = 'Default';
                        document.querySelectorAll('.sr-bg-option[data-bg]').forEach(function(el) {
                            if (el.dataset.bg === current) found = el.dataset.label || 'Custom';
                        });
                        valEl.textContent = found;
                    }
                }
            };

            function _getCurrentBg() {
                try {
                    const v = localStorage.getItem(LS_KEY);
                    if (v === '__none__') return '';
                    if (v) return v;
                } catch(_) {}
                return DEFAULT_BG; // default
            }

            // Boot: apply from localStorage immediately (fast, before Firebase)
            (function _bootApply() {
                const saved = _getCurrentBg();
                window._srApplyBg(saved);
                // Label update happens in _srInitDesignPanel when panel opens
            })();

            // After auth: sync from Firebase (covers "different phone" case)
            // Called from onAuthStateChanged in the auth block below
            window._srSyncBgFromFirebase = async function(uid) {
                try {
                    const fns = window._fbDbFns || {};
                    if (!fns.get || !fns.ref || !window._fbDb) return;
                    const snap = await fns.get(fns.ref(window._fbDb, 'users/' + uid + '/bgImage'));
                    if (!snap || !snap.exists || !snap.exists()) return;
                    const fbVal = snap.val();
                    if (!fbVal) return;
                    const url = fbVal === '__none__' ? '' : fbVal;
                    // Write to localStorage so it persists offline
                    try { localStorage.setItem(LS_KEY, fbVal); } catch(_) {}
                    window._srApplyBg(url);
                    window._srInitDesignPanel && window._srInitDesignPanel();
                } catch(_) {}
            };
        })();

        // Statuses that belong to the "Purchases" tab (funded/in-flight/complete escrow)
        const PURCHASE_STATUSES = new Set(['funded','inspection','assets_transferred','released','disputed']);

        // Tab switcher
        window._switchOffersTab = function(tab) {
            const isOffers = tab === 'offers';
            // Cards
            document.getElementById('offersCardContainer').style.display    = isOffers ? '' : 'none';
            document.getElementById('purchasesCardContainer').style.display = isOffers ? 'none' : '';
            // Stats grids
            document.getElementById('offersTabStats').style.display    = isOffers ? 'grid' : 'none';
            document.getElementById('purchasesTabStats').style.display  = isOffers ? 'none' : 'grid';
            // Tab button active styles
            const activeStyle   = 'flex:1;padding:8px 0;border-radius:9px;border:1px solid rgba(168,85,247,0.32);font-family:\'Syne\',sans-serif;font-size:11px;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:background .18s,color .18s;background:rgba(168,85,247,0.18);color:#c084fc;';
            const inactiveStyle = 'flex:1;padding:8px 0;border-radius:9px;border:none;font-family:\'Syne\',sans-serif;font-size:11px;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:background .18s,color .18s;background:transparent;color:rgba(139,138,168,0.55);';
            document.getElementById('offersTabBtn').style.cssText    = isOffers ? activeStyle : inactiveStyle;
            document.getElementById('purchasesTabBtn').style.cssText = isOffers ? inactiveStyle : activeStyle;
        };

        async function _loadOffersPanel() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user || !window._fbDb || !window._fbDbFns) return;
            const db = window._fbDb;
            const { ref: fbRef, get: fbGet } = window._fbDbFns;

            const rcEl  = document.getElementById('offersReceivedCount');
            const mdEl  = document.getElementById('offersMadeCount');
            const acEl  = document.getElementById('purchasesActiveCount');
            const cpEl  = document.getElementById('purchasesCompletedCount');
            const offersContainer    = document.getElementById('offersCardContainer');
            const purchasesContainer = document.getElementById('purchasesCardContainer');

            try {
                const [incSnap, sentSnap] = await Promise.all([
                    fbGet(fbRef(db, 'users/' + user.uid + '/incomingOffers')),
                    fbGet(fbRef(db, 'users/' + user.uid + '/sentOffers')),
                ]);

                const incoming = incSnap.exists()  ? Object.values(incSnap.val()).filter(Boolean)  : [];
                const sent     = sentSnap.exists() ? Object.values(sentSnap.val()).filter(Boolean) : [];

                // ── Split into offers vs purchases by status ──
                const offerItems    = [];  // negotiation-stage (pending / accepted / declined / countered / withdrawn)
                const purchaseItems = [];  // escrow-stage (funded → released / disputed)

                [...incoming.map(o => ({...o, side:'received'})),
                 ...sent.map(o => ({...o, side:'sent'}))]
                .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
                .forEach(o => {
                    if (PURCHASE_STATUSES.has(o.status)) purchaseItems.push(o);
                    else                                 offerItems.push(o);
                });

                // ── Update Offers stats ──
                const incomingOffers = incoming.filter(o => !PURCHASE_STATUSES.has(o.status));
                const sentOffers     = sent.filter(o => !PURCHASE_STATUSES.has(o.status));
                if (rcEl) rcEl.textContent = incomingOffers.length;
                if (mdEl) mdEl.textContent = sentOffers.length;

                // ── Update Purchases stats ──
                const activePurchases    = purchaseItems.filter(o => o.status !== 'released' && o.status !== 'disputed');
                const completedPurchases = purchaseItems.filter(o => o.status === 'released');
                if (acEl) acEl.textContent = activePurchases.length;
                if (cpEl) cpEl.textContent = completedPurchases.length;

                if (!offersContainer || !purchasesContainer) return;

                // Clear previous cards
                offersContainer.querySelector('.offer-cards-list') && offersContainer.querySelector('.offer-cards-list').remove();
                purchasesContainer.querySelector('.offer-cards-list') && purchasesContainer.querySelector('.offer-cards-list').remove();

                // Fetch listing images for all items (parallel, best-effort)
                const allItems = [...offerItems, ...purchaseItems];
                const listingIds = [...new Set(allItems.map(o=>o.listingId).filter(Boolean))];
                const listingDataMap = {};
                await Promise.all(listingIds.map(async id => {
                    try {
                        const snap = await fbGet(fbRef(db, 'websites/' + id));
                        if (snap.exists()) listingDataMap[id] = snap.val();
                    } catch(e) {}
                }));

                // Status config
                const statusCfg = {
                    pending:            { label:'Pending',          color:'#f5c842', bg:'rgba(245,200,66,0.12)',  border:'rgba(245,200,66,0.28)'  },
                    accepted:           { label:'Accepted',         color:'#2dd4a0', bg:'rgba(45,212,160,0.12)', border:'rgba(45,212,160,0.28)'  },
                    declined:           { label:'Declined',         color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
                    countered:          { label:'Countered',        color:'#38bdf8', bg:'rgba(56,189,248,0.1)',  border:'rgba(56,189,248,0.25)'  },
                    funded:             { label:'In Escrow',        color:'#a855f7', bg:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.28)'  },
                    inspection:         { label:'Inspection',       color:'#38bdf8', bg:'rgba(56,189,248,0.1)',  border:'rgba(56,189,248,0.25)'  },
                    assets_transferred: { label:'Assets Sent',      color:'#38bdf8', bg:'rgba(56,189,248,0.1)',  border:'rgba(56,189,248,0.25)'  },
                    released:           { label:'Deal Complete',    color:'#2dd4a0', bg:'rgba(45,212,160,0.12)', border:'rgba(45,212,160,0.28)'  },
                    disputed:           { label:'Disputed',         color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.22)' },
                    withdrawn:          { label:'Withdrawn',        color:'#6b6890', bg:'rgba(107,104,144,0.1)', border:'rgba(107,104,144,0.22)' },
                };

                // SVG icons (no emojis)
                const svgWallet  = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3.5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 6.5h11" stroke="currentColor" stroke-width="1.3"/><circle cx="9.5" cy="9" r="1" fill="currentColor"/><path d="M4 3.5v-1a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 9 2.5v1" stroke="currentColor" stroke-width="1.3"/></svg>';
                const svgCheck   = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5 9l5.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                const svgX       = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 2l7 7M9 2L2 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
                const svgSend    = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11 1.5L5.5 7M11 1.5L7.5 12 5.5 7 .5 5 11 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                const svgClock   = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                const svgLock    = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="5.5" width="8" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="6" cy="8.2" r="0.9" fill="currentColor"/></svg>';
                const svgEye     = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="6" r="1.5" stroke="currentColor" stroke-width="1.3"/></svg>';
                const svgAlert   = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L11 10.5H1L6 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 5v2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="6" cy="9" r="0.5" fill="currentColor"/></svg>';
                const svgGlobe   = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M7 1.5S5 4 5 7s2 5.5 2 5.5M7 1.5S9 4 9 7s-2 5.5-2 5.5M1.5 7h11" stroke="currentColor" stroke-width="1.3"/></svg>';

                function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
                function _timeAgo(ts){
                    const d=Date.now()-ts;
                    if(d<60000) return 'Just now';
                    if(d<3600000) return Math.floor(d/60000)+'m ago';
                    if(d<86400000) return Math.floor(d/3600000)+'h ago';
                    return Math.floor(d/86400000)+'d ago';
                }

                function _buildAction(o) {
                    const oid = _esc(o.offerId||'');
                    const amt = Number(o.amount||0).toLocaleString();
                    const btnBase = 'width:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 0;border-radius:9px;border:none;font-family:\'Syne\',sans-serif;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.01em;transition:opacity .15s;';
                    const notice = (color,bg,border,icon,text) =>
                        '<div style="display:flex;align-items:flex-start;gap:8px;background:'+bg+';border:1px solid '+border+';border-radius:9px;padding:9px 11px;margin-top:10px;line-height:1.55;">'
                        + '<span style="color:'+color+';flex-shrink:0;padding-top:1px;">'+icon+'</span>'
                        + '<span style="font-size:10.5px;color:'+color+';font-weight:500;">'+_esc(text)+'</span>'
                        + '</div>';

                    if (o.status==='pending' && o.side==='received') return (
                        '<div style="display:flex;gap:7px;margin-top:12px;">'
                        + '<button onclick="window._acceptOfferFromPanel(\''+oid+'\')" style="'+btnBase+'flex:1;background:rgba(45,212,160,0.1);border:1px solid rgba(45,212,160,0.28);color:#2dd4a0;">'
                        + svgCheck+' Accept</button>'
                        + '<button onclick="window._declineOfferFromPanel(\''+oid+'\')" style="'+btnBase+'flex:1;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);color:#f87171;">'
                        + svgX+' Decline</button>'
                        + '</div>'
                    );
                    if (o.status==='accepted' && o.side==='sent') return (
                        '<div style="margin-top:12px;">'
                        + '<button data-pay-offer="'+oid+'" onclick="window._payOfferFromPanel(\''+oid+'\','+Number(o.amount||0)+')" style="'+btnBase+'background:linear-gradient(135deg,#9b5de5,#e879a0);color:#fff;">'
                        + svgWallet+' Pay Now — $'+amt+'</button>'
                        + '<div style="font-size:10px;color:var(--muted);text-align:center;margin-top:5px;">Deducted from wallet · held in escrow</div>'
                        + '</div>'
                    );
                    if (o.status==='funded' && o.side==='received') return (
                        '<div style="margin-top:10px;">'
                        + notice('#a855f7','rgba(168,85,247,0.08)','rgba(168,85,247,0.22)',svgLock,'$'+amt+' is held in escrow. Transfer the site assets to release funds to your wallet.')
                        + '<button onclick="window._transferAssetFromPanel(\''+oid+'\')" style="'+btnBase+'margin-top:8px;background:linear-gradient(135deg,rgba(56,189,248,.85),rgba(168,85,247,.8));color:#fff;">'
                        + svgSend+' Transfer Site Assets</button>'
                        + '</div>'
                    );
                    if (o.status==='funded' && o.side==='sent') return (
                        notice('#a855f7','rgba(168,85,247,0.08)','rgba(168,85,247,0.22)',svgClock,'Payment confirmed and locked in escrow. Waiting for seller to transfer site assets.')
                    );
                    if (o.status==='inspection' && o.side==='sent') return (
                        '<div style="margin-top:10px;">'
                        + notice('#38bdf8','rgba(56,189,248,0.08)','rgba(56,189,248,0.22)',svgEye,'Seller has transferred assets. Review everything carefully before confirming.')
                        + '<button onclick="window._confirmReceiptFromPanel(\''+oid+'\')" style="'+btnBase+'margin-top:8px;background:linear-gradient(135deg,rgba(45,212,160,.9),rgba(56,189,248,.8));color:#fff;">'
                        + svgCheck+' Confirm Receipt · Release Funds</button>'
                        + '<button onclick="window._disputeFromPanel(\''+oid+'\')" style="'+btnBase+'margin-top:6px;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);color:#f87171;">'
                        + svgAlert+' Open Dispute</button>'
                        + '</div>'
                    );
                    if (o.status==='inspection' && o.side==='received') return (
                        notice('#38bdf8','rgba(56,189,248,0.08)','rgba(56,189,248,0.22)',svgClock,'Assets transferred. Waiting for buyer to confirm receipt (7-day window).')
                    );
                    if (o.status==='released') return (
                        notice('#2dd4a0','rgba(45,212,160,0.08)','rgba(45,212,160,0.22)',svgCheck,
                            o.side==='received' ? 'Deal complete. Funds have been added to your wallet.' : 'Deal complete. Enjoy your new site!')
                    );
                    if (o.status==='declined') return (
                        notice('#f87171','rgba(248,113,113,0.06)','rgba(248,113,113,0.18)',svgX,'This offer was declined by the seller.')
                    );
                    return '';
                }

                function _buildList(items, container) {
                    if (!items.length) return;
                    // Remove default placeholder if present
                    const ph = container.firstElementChild;
                    if (ph && !ph.classList.contains('offer-cards-list')) ph.remove();

                    const list = document.createElement('div');
                    list.className = 'offer-cards-list';
                    list.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:4px;';

                    items.forEach(o => {
                        const cfg   = statusCfg[o.status] || statusCfg.pending;
                        const ld    = listingDataMap[o.listingId] || {};
                        const img   = ld.images?.[0] || ld.image || ld.thumbnail || '';
                        const title = _esc(o.listingTitle || ld.title || ld.url || '—');
                        const askPrice = parseFloat(o.listingPrice || ld.price) || 0;
                        const offerAmt = Number(o.amount||0);
                        const discount = (askPrice && askPrice !== offerAmt) ? Math.round((1 - offerAmt/askPrice)*100) : 0;
                        const timeStr  = o.createdAt ? _timeAgo(o.createdAt) : '';
                        const category = _esc(ld.category || ld.type || '');
                        const sideLabel = o.side === 'received' ? 'Received' : 'Sent';
                        const sideSvg = o.side === 'received'
                            ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M1 4h3l1 1.5 1-1.5h3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>'
                            : svgSend;

                        const card = document.createElement('div');
                        card.style.cssText = 'background:linear-gradient(160deg,#0e0e1c,#0b0b18);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;transition:border-color .2s,transform .18s;';
                        card.onmouseenter = function(){ this.style.borderColor='rgba(255,255,255,0.13)'; this.style.transform='translateY(-1px)'; };
                        card.onmouseleave = function(){ this.style.borderColor='rgba(255,255,255,0.07)'; this.style.transform='none'; };

                        const imgFallback = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.15);">'+svgGlobe+'</div>';
                        const imgHtml = img
                            ? '<img src="'+_esc(img)+'" alt="" onerror="this.parentNode.innerHTML=this.parentNode.dataset.fb" data-fb="'+imgFallback.replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover;display:block;opacity:0.78;">'
                            : imgFallback;

                        card.innerHTML =
                            '<div style="position:relative;height:80px;background:#0b0b18;overflow:hidden;">'
                            + imgHtml
                            + '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(10,10,24,0.94) 100%);"></div>'
                            + '<div style="position:absolute;top:9px;left:10px;display:flex;align-items:center;gap:4px;background:'+cfg.bg+';border:1px solid '+cfg.border+';border-radius:999px;padding:3px 9px;backdrop-filter:blur(8px);">'
                            + '<span style="width:5px;height:5px;border-radius:50%;background:'+cfg.color+';flex-shrink:0;"></span>'
                            + '<span style="font-family:\'Syne\',sans-serif;font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:'+cfg.color+';">'+cfg.label+'</span>'
                            + '</div>'
                            + '<div style="position:absolute;top:9px;right:10px;display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:3px 9px;backdrop-filter:blur(8px);">'
                            + '<span style="color:rgba(255,255,255,0.45);display:flex;">'+sideSvg+'</span>'
                            + '<span style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.45);">'+sideLabel+'</span>'
                            + '</div>'
                            + (category ? '<div style="position:absolute;bottom:9px;left:11px;font-size:9px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:.06em;text-transform:uppercase;">'+category+'</div>' : '')
                            + (timeStr ? '<div style="position:absolute;bottom:9px;right:11px;display:flex;align-items:center;gap:3px;font-size:9px;color:rgba(255,255,255,0.3);"><span>'+svgClock+'</span>'+timeStr+'</div>' : '')
                            + '</div>'
                            + '<div style="padding:12px 14px 14px;">'
                            + '<div style="font-size:12.5px;font-weight:600;color:#ede9ff;line-height:1.35;margin-bottom:9px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">'+title+'</div>'
                            + '<div style="display:flex;align-items:flex-end;gap:7px;margin-bottom:2px;">'
                            + '<div style="font-family:\'Syne\',sans-serif;font-size:21px;font-weight:800;letter-spacing:-0.04em;color:#ede9ff;line-height:1;">$'+offerAmt.toLocaleString()+'</div>'
                            + (askPrice && askPrice!==offerAmt ? '<span style="font-size:11px;color:#6b6890;text-decoration:line-through;padding-bottom:2px;">$'+askPrice.toLocaleString()+'</span>' : '')
                            + (discount > 0 ? '<span style="font-size:9px;font-weight:700;color:#f5c842;background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.22);border-radius:999px;padding:1px 6px;margin-bottom:2px;">-'+discount+'%</span>' : '')
                            + '</div>'
                            + '<div style="font-size:10px;color:#6b6890;">'
                            + (o.side==='received' ? 'Offer from '+_esc(o.buyerName||'Buyer') : 'Your offer to '+_esc(o.sellerName||'Seller'))
                            + '</div>'
                            + _buildAction(o)
                            + '</div>';

                        list.appendChild(card);
                    });
                    container.appendChild(list);
                }

                _buildList(offerItems.slice(0, 12),    offersContainer);
                _buildList(purchaseItems.slice(0, 12), purchasesContainer);

            } catch(e) { console.error('[offersPanel]', e); }
        }

        // ── OFFER & ESCROW ACTION HANDLERS ──────────────────────────────────

        async function _escrowPost(path, body) {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) return null;
            const idToken = await user.getIdToken();
            const r = await fetch('/api/escrow/' + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({ idToken }, body)),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || path + ' failed');
            return data;
        }

        window._acceptOfferFromPanel = async function(offerId) {
            if (!offerId) return;
            try {
                await _escrowPost('accept', { offerId });
                _loadOffersPanel();
                if (window.showToast) window.showToast('Offer accepted — buyer notified!');
            } catch(e) { console.error('[accept]', e); if (window.showToast) window.showToast('Error: ' + e.message); }
        };

        window._declineOfferFromPanel = async function(offerId) {
            if (!offerId) return;
            try {
                await _escrowPost('decline', { offerId });
                _loadOffersPanel();
                if (window.showToast) window.showToast('Offer declined.');
            } catch(e) { console.error('[decline]', e); if (window.showToast) window.showToast('Error: ' + e.message); }
        };

        window._payOfferFromPanel = async function(offerId, amount) {
            if (!offerId) return;
            const btn = document.querySelector('[data-pay-offer="' + offerId + '"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }
            try {
                const data = await _escrowPost('pay', { offerId });
                // Update wallet pill with new balance returned from server
                const wpEl = document.getElementById('walletPillAmount');
                if (wpEl && data.newBalance !== undefined) wpEl.textContent = fmtBal(data.newBalance);
                if (window._fbUserData) window._fbUserData.balance = data.newBalance;
                _loadOffersPanel();
                if (window.showToast) window.showToast('$' + Number(amount).toLocaleString() + ' moved to escrow. Seller is now notified to transfer assets.');
            } catch(e) {
                console.error('[pay]', e);
                // Re-check if it's a 402 by fetching status
                if (e.message && e.message.toLowerCase().includes('insufficient')) {
                    if (window.showToast) window.showToast('Insufficient balance — top up your wallet first.');
                    if (window.openSettingsPanel) window.openSettingsPanel('wallet');
                } else {
                    if (window.showToast) window.showToast('Error: ' + e.message);
                }
                if (btn) { btn.disabled = false; btn.textContent = 'Pay Now'; }
            }
        };

        window._transferAssetFromPanel = async function(offerId) {
            if (!offerId) return;
            try {
                await _escrowPost('transfer', { offerId });
                _loadOffersPanel();
                // Redirect seller to /transfer page with the offerId so they can provide details
                window.location.href = '/transfer?offerId=' + encodeURIComponent(offerId);
            } catch(e) { console.error('[transfer]', e); if (window.showToast) window.showToast('Error: ' + e.message); }
        };

        window._confirmReceiptFromPanel = async function(offerId) {
            if (!offerId) return;
            const confirmed = window.confirm('Confirm you have received all assets? This will release the funds to the seller and cannot be undone.');
            if (!confirmed) return;
            try {
                const data = await _escrowPost('confirm', { offerId });
                _loadOffersPanel();
                if (window.showToast) window.showToast('Deal complete! Funds released to seller.');
            } catch(e) { console.error('[confirm]', e); if (window.showToast) window.showToast('Error: ' + e.message); }
        };

        window._disputeFromPanel = async function(offerId) {
            if (!offerId) return;
            const reason = window.prompt('Please describe the issue with this transfer:');
            if (reason === null) return; // user cancelled
            try {
                await _escrowPost('dispute', { offerId, reason: reason || 'No reason provided' });
                _loadOffersPanel();
                if (window.showToast) window.showToast('Dispute opened — our team will review within 24 hours.');
            } catch(e) { console.error('[dispute]', e); if (window.showToast) window.showToast('Error: ' + e.message); }
        };

        // ── SELLER ANALYTICS PANEL (real Firebase data) ──
        async function _loadSellerAnalyticsPanel() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user || !window._fbDb || !window._fbDbFns) return;
            const db = window._fbDb;
            const { ref: fbRef, get: fbGet } = window._fbDbFns;
            try {
                const [userSnap, listSnap] = await Promise.all([
                    window._fbGet(window._fbRef(db, 'users/' + user.uid)),
                    window._fbGet(window._fbRef(db, 'websites')),
                ]);
                const userData = userSnap.exists() ? userSnap.val() : {};
                const allSites = listSnap.exists() ? Object.entries(listSnap.val()).filter(([,v]) => v && v.uid === user.uid) : [];

                let totalViews=0, totalSaves=0, totalOffers=0;
                allSites.forEach(([,v]) => {
                    totalViews += parseInt(v.views||v.viewCount||0);
                    totalSaves += parseInt(v.saves||v.saveCount||0);
                });

                // Count incoming offers
                const offerSnap = await window._fbGet(window._fbRef(db, 'users/' + user.uid + '/incomingOffers'));
                if (offerSnap.exists()) totalOffers = Object.keys(offerSnap.val()).length;

                const convRate = totalViews > 0 ? ((totalOffers/totalViews)*100).toFixed(1) : '0.0';

                // Update the analytics panel DOM
                const anBody = document.querySelector('#subSellerAnalytics .settings-sub-body');
                if (!anBody) return;
                const grid = anBody.querySelector('[style*="grid-template-columns"]');
                if (grid) {
                    const vals = grid.querySelectorAll('[style*="font-size:22px"]');
                    if (vals[0]) vals[0].textContent = totalViews.toLocaleString();
                    if (vals[1]) vals[1].textContent = totalSaves.toLocaleString();
                    if (vals[2]) vals[2].textContent = totalOffers;
                    if (vals[3]) vals[3].textContent = convRate + '%';
                }

                // Update bar chart with real daily view data (last 7 days from viewsByDate)
                const today = new Date();
                const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                let weekViews = Array(7).fill(0);
                // Try to aggregate from all listings
                for (const [lid] of allSites.slice(0,5)) {
                    try {
                        const dSnap = await window._fbGet(window._fbRef(db, 'websites/' + lid + '/viewsByDate'));
                        if (dSnap.exists()) {
                            const byDate = dSnap.val();
                            for (let i=6;i>=0;i--) {
                                const d2=new Date(today); d2.setDate(d2.getDate()-i);
                                const key=d2.toISOString().split('T')[0];
                                weekViews[6-i] += parseInt(byDate[key]||0);
                            }
                        }
                    } catch(_){}
                }
                const maxV = Math.max(...weekViews,1);
                const chartWrap = anBody.querySelector('[style*="height:48px"]');
                if (chartWrap) {
                    chartWrap.innerHTML = weekViews.map((v,i) => `<div style="flex:1;background:rgba(52,211,153,${0.15+0.35*(v/maxV)});border-radius:4px 4px 0 0;height:${Math.round((v/maxV)*100)||3}%;transition:height .4s;" title="${v} views"></div>`).join('');
                    const xRow = anBody.querySelector('[style*="space-between"][style*="margin-top:6px"]');
                    if (xRow) {
                        const dayIdx = today.getDay(); // 0=Sun
                        const orderedDays = [];
                        for (let i=6;i>=0;i--) { const d2=new Date(today); d2.setDate(d2.getDate()-i); orderedDays.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d2.getDay()]); }
                        xRow.innerHTML = `<span style="font-size:9px;color:var(--muted);">${orderedDays[0]}</span><span style="font-size:9px;color:var(--muted);">${orderedDays[6]}</span>`;
                    }
                }

                // Remove "Analytics populate once you have active listings." if we have data
                if (totalViews > 0 || totalOffers > 0) {
                    const noticeEl = anBody.querySelector('p[style*="rgba(139,138,168,0.4)"]');
                    if (noticeEl) noticeEl.remove();
                }
            } catch(e) { console.error('[sellerAnalytics]', e); }
        }

        // ── ESCROW TRACKER PANEL (real Firebase data) ──
        async function _loadEscrowPanel() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user || !window._fbDb || !window._fbGet || !window._fbRef) return;
            const db = window._fbDb;
            const escrowBody = document.querySelector('#subEscrowStatus .settings-sub-body');
            if (!escrowBody) return;

            // Clear dynamic content, keep intro text
            const existing = escrowBody.querySelector('.escrow-deals-wrap');
            if (existing) existing.remove();

            try {
                const snap = await window._fbGet(window._fbRef(db, 'escrow'));
                let activeDeals = [];
                if (snap.exists()) {
                    activeDeals = Object.values(snap.val()).filter(e =>
                        e && (e.buyerUid === user.uid || e.sellerUid === user.uid)
                        && e.status !== 'released' && e.status !== 'cancelled'
                    );
                }

                const noDealsEl = escrowBody.querySelector('p[style*="rgba(139,138,168,0.4)"]');

                if (!activeDeals.length) {
                    if (noDealsEl) noDealsEl.style.display = '';
                    return;
                }
                if (noDealsEl) noDealsEl.style.display = 'none';

                const stepsMap = {
                    'offer_accepted': 1,
                    'funded':         2,
                    'inspection':     3,
                    'released':       4,
                };
                const stepLabels = [
                    '1. Offer accepted',
                    '2. Funds in escrow',
                    '3. Inspection period (7 days)',
                    '4. Funds released to seller',
                ];
                const stepColors = { done:'#34d399', active:'#fbbf24', pending:'rgba(255,255,255,0.2)' };

                const wrap = document.createElement('div');
                wrap.className = 'escrow-deals-wrap';
                wrap.style.cssText = 'display:flex;flex-direction:column;gap:20px;';

                activeDeals.forEach(deal => {
                    const isBuyer  = deal.buyerUid  === user.uid;
                    const isSeller = deal.sellerUid === user.uid;
                    const currentStep = stepsMap[deal.status] || 1;

                    const dealEl = document.createElement('div');
                    dealEl.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;';

                    // Title row
                    const titleRow = document.createElement('div');
                    titleRow.style.cssText = 'font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;';
                    titleRow.innerHTML = '<span>' + (deal.listingTitle || deal.listingId || 'Deal') + '</span>'
                        + '<span style="font-family:\'Syne\',sans-serif;font-size:13px;font-weight:800;color:var(--text);">$' + Number(deal.amount||0).toLocaleString() + '</span>';
                    dealEl.appendChild(titleRow);

                    // Steps
                    const stepsEl = document.createElement('div');
                    stepsEl.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:12px;';
                    stepLabels.forEach((lbl, idx) => {
                        const step     = idx + 1;
                        const isDone   = step < currentStep;
                        const isActive = step === currentStep;
                        const col    = isDone ? stepColors.done : isActive ? stepColors.active : stepColors.pending;
                        const bg     = isDone ? 'rgba(52,211,153,0.06)' : isActive ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)';
                        const border = isDone ? 'rgba(52,211,153,0.15)' : isActive ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.13)';
                        const statusTxt = isDone ? 'Complete' : isActive ? 'In progress' : 'Pending';
                        const row = document.createElement('div');
                        row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 12px;background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;';
                        row.innerHTML = '<div style="width:8px;height:8px;border-radius:999px;background:' + col + ';flex-shrink:0;"></div>'
                            + '<div style="font-size:11px;color:' + col + ';font-weight:600;">' + lbl + '</div>'
                            + '<div style="margin-left:auto;font-size:9px;color:var(--muted);">' + statusTxt + '</div>';
                        stepsEl.appendChild(row);
                    });
                    dealEl.appendChild(stepsEl);

                    // Action buttons
                    const actEl = document.createElement('div');

                    if (isSeller && deal.status === 'funded') {
                        actEl.innerHTML = '<button onclick="window._transferAssetFromPanel(\'' + deal.offerId + '\')" '
                            + 'style="width:100%;padding:10px 0;border-radius:10px;background:linear-gradient(135deg,rgba(56,189,248,.85),rgba(168,85,247,.8));border:none;color:#fff;font-family:\'Syne\',sans-serif;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5c2 1 3.4 3.2 3.4 6 0 1.3-.3 2.4-.7 3.3l-2.7 2.7-2.7-2.7c-.4-.9-.7-2-.7-3.3 0-2.8 1.4-5 3.4-6z" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><circle cx="8" cy="6.8" r="1.3" stroke="#fff" stroke-width="1.1"/><path d="M5.3 11l-1.6 1.4.3 2.1 2-.7M10.7 11l1.6 1.4-.3 2.1-2-.7" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>Transfer App / Website</button>';
                    }

                    if (isBuyer && deal.status === 'inspection') {
                        const inspEnds = deal.inspectionEndsAt ? new Date(deal.inspectionEndsAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
                        actEl.innerHTML = (inspEnds ? '<div style="font-size:10px;color:var(--muted);margin-bottom:8px;">Inspection window ends ' + inspEnds + '</div>' : '')
                            + '<button onclick="window._confirmReceiptFromPanel(\'' + deal.offerId + '\')" '
                            + 'style="width:100%;padding:10px 0;border-radius:10px;background:linear-gradient(135deg,rgba(52,211,153,.9),rgba(56,189,248,.8));border:none;color:#fff;font-family:\'Syne\',sans-serif;font-size:12px;font-weight:800;cursor:pointer;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:7px;"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-6.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Confirm Receipt — Release Funds</button>'
                            + '<button onclick="window._disputeFromPanel(\'' + deal.offerId + '\')" '
                            + 'style="width:100%;padding:8px 0;border-radius:10px;background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);color:#f87171;font-family:\'Syne\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="#f87171" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="#f87171" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="#f87171"/></svg>Open Dispute</button>';
                    }

                    if (isSeller && deal.status === 'inspection') {
                        actEl.innerHTML = '<div style="font-size:10px;color:#38bdf8;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 10px;line-height:1.5;display:flex;align-items:center;gap:7px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="8" cy="8" r="6.3" stroke="#38bdf8" stroke-width="1.3"/><path d="M8 4.8V8l2.5 1.5" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Waiting for buyer to confirm receipt.</div>';
                    }

                    if (actEl.innerHTML) dealEl.appendChild(actEl);
                    wrap.appendChild(dealEl);
                });

                escrowBody.appendChild(wrap);
            } catch(e) { console.error('[escrowPanel]', e); }
        }

        window.closeSettingsPanel = function(id) {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('open');
            setTimeout(() => { el.style.display = 'none'; }, 300);
        };

        window.selectThemeRow = function(theme) {
            ['green','navy','slate','black'].forEach(t => {
                const check = document.getElementById('themeCheck' + t.charAt(0).toUpperCase() + t.slice(1));
                if (check) check.classList.toggle('hidden', t !== theme);
            });
            const valEl = document.getElementById('settingsColorModeVal');
            if (valEl) valEl.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        };

        // Init theme check on load
        document.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('siterifty_theme') || 'green';
            selectThemeRow(saved);
        });

        //  Send email via Resend API 
        window._sendEmail = async function(to, subject, html) {
            try {
                const resp = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, subject, html })
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Email failed');
                return { success: true, id: data.id };
            } catch(e) {
                console.error('[sendEmail]', e);
                return { success: false, error: e.message };
            }
        };


        //  Delete Account — automated email confirmation flow 
        window.checkDeleteReady = function() {
            const emailEl = document.getElementById('deleteAccEmail');
            const pwEl    = document.getElementById('deleteAccPassword');
            const btn     = document.getElementById('deleteAccSendBtn');
            if (!btn) return;
            const user = window._fbAuth && window._fbAuth.currentUser;
            const userEmail = user ? user.email : '';
            const emailFilled = emailEl && emailEl.value.trim().toLowerCase() === userEmail.toLowerCase();
            const pwFilled    = pwEl && pwEl.value.length >= 6;
            const ready = emailFilled && pwFilled;
            btn.disabled = !ready;
            if (ready) {
                btn.style.background = 'rgba(248,113,113,0.15)';
                btn.style.borderColor = 'rgba(248,113,113,0.4)';
                btn.style.color = '#f87171';
                btn.style.cursor = 'pointer';
            } else {
                btn.style.background = 'rgba(248,113,113,0.07)';
                btn.style.borderColor = 'rgba(248,113,113,0.15)';
                btn.style.color = 'rgba(248,113,113,0.4)';
                btn.style.cursor = 'not-allowed';
            }
        };

        // Delete Account — no email confirmation flow.
        // Re-auths with email+password, then opens the final confirm modal.
        // The actual deletion happens via /api/transactions (delete_account).
        window.startDeleteAccountFlow = async function() {
            const emailEl = document.getElementById('deleteAccEmail');
            const pwEl    = document.getElementById('deleteAccPassword');
            const errEl   = document.getElementById('deleteAccErr');
            const okEl    = document.getElementById('deleteAccOk');
            const btn     = document.getElementById('deleteAccSendBtn');
            if (errEl) errEl.style.display = 'none';
            if (okEl)  okEl.style.display  = 'none';
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) { if(errEl){errEl.textContent='Not signed in.';errEl.style.display='block';} return; }
            if (btn) { btn.disabled = true; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="animation:spin 1s linear infinite"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.4" stroke-dasharray="20" stroke-dashoffset="10"/></svg> Verifying...'; }
            try {
                const { signInWithEmailAndPassword: reAuth } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js');
                await reAuth(window._fbAuth, user.email, pwEl.value);
            } catch(e) {
                if(errEl){errEl.textContent='Password is incorrect. Please try again.';errEl.style.display='block';}
                if(btn){btn.disabled=false;btn.innerHTML='<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V3.5ZM1.5 3.5l6 4.5 6-4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Continue';}
                window.checkDeleteReady && window.checkDeleteReady();
                return;
            }
            if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V3.5ZM1.5 3.5l6 4.5 6-4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Continue'; }
            const modal = document.getElementById('deleteConfirmFinalModal');
            if (modal) { modal.style.display = 'flex'; lockBodyScroll && lockBodyScroll(); }
        };

        window.executeFinalDelete = async function() {
            const modal = document.getElementById('deleteConfirmFinalModal');
            const btn   = document.getElementById('deleteFinalConfirmBtn');
            const user  = window._fbAuth && window._fbAuth.currentUser;
            if (!user) { if(modal) { modal.style.display = 'none'; unlockBodyScroll && unlockBodyScroll(); } return; }

            if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; btn.style.opacity = '.6'; }

            try {
                const idToken = await user.getIdToken(true);
                const res = await fetch('/api/settings.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
                    body: JSON.stringify({ action: 'delete_account', confirm: true })
                });
                const data = await res.json();

                if (!res.ok || data.error) {
                    if (modal) { modal.style.display = 'none'; unlockBodyScroll && unlockBodyScroll(); }
                    if (btn) { btn.disabled = false; btn.textContent = 'Yes, delete everything'; btn.style.opacity = '1'; }

                    if (data.error === 'balance_remaining') {
                        _sAlert('You have a remaining wallet balance of $' + (data.balance != null ? data.balance.toFixed(2) : '0.00') + '. Please withdraw or transfer it before deleting your account.');
                    } else if (data.error === 'open_orders') {
                        _sAlert('You have open orders in escrow. Resolve these before deleting your account.');
                    } else {
                        _sAlert('An error occurred: ' + (data.error || 'please try again.'));
                    }
                    return;
                }

                // Success — sign out locally and redirect
                try { await window._fbAuth.signOut(); } catch(_) {}

                if (modal) { modal.style.display = 'none'; unlockBodyScroll && unlockBodyScroll(); }
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#12121a;border:1px solid rgba(52,211,153,0.3);border-radius:12px;padding:12px 20px;font-size:12px;font-weight:600;color:#34d399;z-index:999999;white-space:nowrap;';
                toast.textContent = 'Account permanently deleted.';
                document.body.appendChild(toast);
                setTimeout(() => { toast.remove(); window.location.href = '/'; }, 2500);
            } catch(e) {
                console.error('[executeFinalDelete]', e);
                if (btn) { btn.disabled = false; btn.textContent = 'Yes, delete everything'; btn.style.opacity = '1'; }
                if (modal) { modal.style.display = 'none'; unlockBodyScroll && unlockBodyScroll(); }
                _sAlert('Network error: ' + (e && e.message ? e.message : 'please try again.'));
            }
        };


        // ── Transfer Account — client side only collects fields + ID token, all logic lives in /api/settings ──
        window.checkTransferReady = function() {
            const recipientEl    = document.getElementById('transferRecipientEmail');
            const yearEl         = document.getElementById('transferAccountYear');
            const confirmEmailEl = document.getElementById('transferConfirmEmail');
            const confirmPwEl    = document.getElementById('transferConfirmPassword');
            const btn            = document.getElementById('transferSubmitBtn');
            if (!btn) return;
            const user      = window._fbAuth && window._fbAuth.currentUser;
            const userEmail = user ? user.email : '';
            const recipient = (recipientEl && recipientEl.value.trim()) || '';
            const year      = (yearEl && yearEl.value.trim()) || '';
            const confEmail = (confirmEmailEl && confirmEmailEl.value.trim()) || '';
            const confPw    = (confirmPwEl && confirmPwEl.value.trim()) || '';
            const allReady  =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) &&
                year.length === 4 && parseInt(year) >= 2020 && parseInt(year) <= 2030 &&
                confEmail.toLowerCase() === userEmail.toLowerCase() &&
                confPw.length >= 6 &&
                recipient.toLowerCase() !== userEmail.toLowerCase();
            btn.disabled = !allReady;
            btn.style.background  = allReady ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'rgba(251,191,36,0.08)';
            btn.style.borderColor = allReady ? 'rgba(251,191,36,0.5)'                    : 'rgba(251,191,36,0.15)';
            btn.style.color       = allReady ? '#000'                                     : 'rgba(251,191,36,0.35)';
            btn.style.cursor      = allReady ? 'pointer'                                  : 'not-allowed';
        };

        window.doAccountTransfer = async function() {
            const errEl = document.getElementById('transferErr');
            const okEl  = document.getElementById('transferOk');
            const btn   = document.getElementById('transferSubmitBtn');
            const spinIcon  = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="animation:spin 1s linear infinite"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.4" stroke-dasharray="20" stroke-dashoffset="10"/></svg>';
            const arrowIcon = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const showErr = (msg) => { if(errEl){ errEl.textContent = msg; errEl.style.display = 'block'; } };
            const resetBtn = () => { if(btn){ btn.disabled = false; btn.innerHTML = arrowIcon + ' Transfer Account'; } window.checkTransferReady(); };
            if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
            if (okEl)  { okEl.style.display  = 'none'; okEl.textContent  = ''; }

            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) { showErr('Not signed in.'); return; }

            const recipientEmail  = document.getElementById('transferRecipientEmail').value.trim();
            const accountYear     = document.getElementById('transferAccountYear').value.trim();
            const confirmEmail    = document.getElementById('transferConfirmEmail').value.trim();
            const confirmPassword = document.getElementById('transferConfirmPassword').value;

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))                  { showErr('Please enter a valid recipient email.');                          return; }
            if (recipientEmail.toLowerCase() === user.email.toLowerCase())             { showErr('Recipient must be different from your account email.');           return; }
            if (confirmEmail.toLowerCase() !== user.email.toLowerCase())               { showErr('Your email does not match your account email.');                  return; }
            if (confirmPassword.length < 6)                                            { showErr('Password must be at least 6 characters.');                       return; }

            if (btn) { btn.disabled = true; btn.innerHTML = spinIcon + ' Verifying…'; }

            // Step 1: Re-authenticate with Firebase client SDK — verifies the password
            try {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js');
                await signInWithEmailAndPassword(window._fbAuth, user.email, confirmPassword);
            } catch(e) {
                showErr('Password is incorrect. Please try again.');
                resetBtn();
                return;
            }

            if (btn) btn.innerHTML = spinIcon + ' Processing…';

            // Step 2: Fresh ID token after re-auth — this is proof of password, no need to send it to server
            let idToken;
            try {
                idToken = await window._fbAuth.currentUser.getIdToken(true);
            } catch(e) {
                showErr('Session error — please refresh and try again.');
                resetBtn();
                return;
            }

            // Step 3: POST to /api/settings — no password in payload, token is the proof
            try {
                const resp = await fetch('/api/settings', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
                    body:    JSON.stringify({
                        action:        'transfer_account',
                        recipientEmail,
                        accountYear,
                        username:      (window._fbUserData || {}).username || user.email.split('@')[0],
                        plan:          (window._fbUserData || {}).plan     || 'Free'
                    })
                });
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok) { showErr(json.error || 'Transfer failed. Please try again.'); resetBtn(); return; }

                if (okEl) { okEl.textContent = 'Transfer complete. Confirmation emails sent to both parties. Signing you out now…'; okEl.style.display = 'block'; }
                if (btn)  { btn.disabled = true; btn.innerHTML = '<svg style="display:inline;vertical-align:-2px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Transfer sent'; btn.style.background = 'rgba(52,211,153,0.1)'; btn.style.color = '#34d399'; btn.style.borderColor = 'rgba(52,211,153,0.25)'; }

                setTimeout(() => {
                    import('https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js').then(m => {
                        m.signOut(window._fbAuth).then(() => { window.closeDash && window.closeDash(); });
                    });
                }, 3000);

            } catch(e) {
                console.error('[doAccountTransfer]', e);
                showErr('Network error — please check your connection and try again.');
                resetBtn();
            }
        };

        //  Referral link helper 
        //  REFERRAL SYSTEM — real end-to-end 
        // Step 1: Detect ?r=username on page load and store it
        (function() {
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('r');
            if (refCode) {
                // Store for use at signup, clean URL
                try { localStorage.setItem('_siterifty_ref', refCode.toLowerCase()); } catch(_) {}
                history.replaceState(null, '', window.location.pathname);
            }
            // Deep-link: ?saved=1 → open dash then the saved panel
            if (params.get('saved') === '1') {
                history.replaceState(null, '', window.location.pathname);
                window._openSavedOnLoad = true;
            }
        })();

        // After auth resolves and dash opens, honour ?saved=1 deep-link
        document.addEventListener('DOMContentLoaded', function() {
            if (window._openSavedOnLoad) {
                // Wait for auth + dash to be ready
                let attempts = 0;
                const waitForDash = setInterval(function() {
                    attempts++;
                    const dash = document.getElementById('dashView');
                    if ((dash && dash.style.display !== 'none') || attempts > 30) {
                        clearInterval(waitForDash);
                        if (window.openSettingsPanel) window.openSettingsPanel('saved');
                        window._openSavedOnLoad = false;
                    }
                }, 300);
            }
        });

        // Step 2: copyReferralLink — builds real link from uid, updates every referral widget on the page
        window.copyReferralLink = function() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            const uid = (user && user.uid) || (window._fbUserData && window._fbUserData.uid) || 'user';
            const link = 'https://siterifty.com/?ref=' + uid;
            document.querySelectorAll('#referralLinkDisplay').forEach(function(el){ el.textContent = link; });
            if (navigator.clipboard) {
                navigator.clipboard.writeText(link).then(function() {
                    document.querySelectorAll('#referralCopyBtn').forEach(function(btn){
                        const orig = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(function(){ btn.textContent = orig === 'Copied!' ? 'Copy' : orig; }, 2000);
                    });
                }).catch(function(){});
            }
        };

        // Step 3: Load real referral stats from Firebase when panel opens
        async function loadReferralStats() {
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) return;
            // Update link display — canonical format used everywhere else in the app
            const link = 'https://siterifty.com/?ref=' + user.uid;
            document.querySelectorAll('#referralLinkDisplay').forEach(function(el){ el.textContent = link; });
            // Read from Firebase — referrals live as a list at users/{uid}/referrals, not flat counters
            try {
                const snap = await get(ref(db, 'users/' + user.uid + '/referrals'));
                const refs = snap.exists() ? Object.values(snap.val() || {}) : [];
                const count = refs.length;
                const earned = refs.reduce((s, r) => s + (parseFloat(r.earned) || 0), 0);
                const countEl = document.getElementById('referralCount');
                const earnedEl = document.getElementById('referralEarned');
                if (countEl) countEl.textContent = count;
                if (earnedEl) earnedEl.textContent = fmtBal(earned);
            } catch(_) {}
        }


        // Step 4: Process referral at signup — calls /api/refer (server-side).
        // The $1 credit is written by the server only — client cannot manipulate the amount.
        async function processReferral(newUid, newUsername, newEmail) {
            let refCode;
            try { refCode = localStorage.getItem('_siterifty_ref'); } catch(_) {}
            if (!refCode || refCode === newUsername.toLowerCase()) return null;

            try {
                // Get a fresh ID token so the server can verify who this user is
                const user = auth.currentUser;
                if (!user) return null;
                const idToken = await user.getIdToken();

                const resp = await fetch('/api/refer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    },
                    body: JSON.stringify({ refCode })
                });

                const result = await resp.json();

                // Always clear localStorage regardless of outcome
                try { localStorage.removeItem('_siterifty_ref'); } catch(_) {}

                if (!resp.ok) {
                    if (result.invalidRef) return { invalidRef: true, refCode };
                    if (resp.status === 409) return null; // already credited, silent
                    return null;
                }

                return { referrerUsername: result.referrerUsername };
            } catch(e) {
                console.warn('[processReferral]', e);
                return null;
            }
        }

        //  Credit referrer on plan purchase (10/20/30% of plan price) 
        // Called from the plan onApprove handler after successful subscription
        window._creditReferrerOnPlan = async function(newUserUid, planKey) {
            try {
                const planCommission = { starter: 0.10, growth: 0.20, pro: 0.30 };
                const planPrices     = { starter: 20,   growth: 40,   pro: 50  };
                const rate = planCommission[planKey];
                if (!rate) return;
                const commission = parseFloat((planPrices[planKey] * rate).toFixed(2));

                // Get the referrer UID stored on this user
                const newSnap = await get(ref(db, 'users/' + newUserUid));
                const newData = newSnap.val() || {};
                const referrerUid = newData.referredByUid;
                if (!referrerUid) return;

                const refSnap = await get(ref(db, 'users/' + referrerUid));
                const refData = refSnap.val() || {};
                const newBal    = parseFloat((parseFloat(refData.balance || 0) + commission).toFixed(2));
                const newEarned = parseFloat((parseFloat(refData.referralEarned || 0) + commission).toFixed(2));
                await update(ref(db, 'users/' + referrerUid), {
                    balance: newBal,
                    referralEarned: newEarned
                });

                const { push: fbPush } = window._fbDbFns || {};
                if (fbPush) {
                    await fbPush(ref(db, 'referralEarnings'), {
                        referrerUid,
                        fromUid: newUserUid,
                        type: 'plan_purchase',
                        plan: planKey,
                        commission,
                        timestamp: Date.now()
                    });
                }
            } catch(e) { console.warn('[_creditReferrerOnPlan]', e); }
        };

        //  Credit referrer $0.10 when their referred user posts a new listing 
        // Call this from anywhere a listing is submitted: window._creditReferrerOnListing(uid)
        window._creditReferrerOnListing = async function(newUserUid) {
            try {
                const LISTING_BONUS = 0.10;
                const newSnap = await get(ref(db, 'users/' + newUserUid));
                const newData = newSnap.val() || {};
                const referrerUid = newData.referredByUid;
                if (!referrerUid) return;

                const refSnap = await get(ref(db, 'users/' + referrerUid));
                const refData = refSnap.val() || {};
                const newBal    = parseFloat((parseFloat(refData.balance || 0) + LISTING_BONUS).toFixed(2));
                const newEarned = parseFloat((parseFloat(refData.referralEarned || 0) + LISTING_BONUS).toFixed(2));
                await update(ref(db, 'users/' + referrerUid), {
                    balance: newBal,
                    referralEarned: newEarned
                });

                const { push: fbPush } = window._fbDbFns || {};
                if (fbPush) {
                    await fbPush(ref(db, 'referralEarnings'), {
                        referrerUid,
                        fromUid: newUserUid,
                        type: 'listing_posted',
                        commission: LISTING_BONUS,
                        timestamp: Date.now()
                    });
                }
            } catch(e) { console.warn('[_creditReferrerOnListing]', e); }
        };

        // Step 5: Show welcome popup (valid = green, invalid = red)
        function showReferralWelcomePopup(referrerUsername, isInvalid) {
            const modal = document.getElementById('referralWelcomeModal');
            if (!modal) return;
            if (isInvalid) {
                //  Red invalid-link state 
                modal.innerHTML = `
                <div style="background:linear-gradient(160deg,#1a0f0f 0%,#0f0a0a 100%);border:1px solid rgba(248,113,113,0.3);border-top:1px solid rgba(248,113,113,0.5);border-radius:24px;width:100%;max-width:340px;padding:0;box-shadow:0 32px 80px rgba(0,0,0,0.9),0 0 60px rgba(248,113,113,0.1);overflow:hidden;animation:modalPop 0.28s cubic-bezier(0.34,1.2,0.64,1) both;">
                    <div style="position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(248,113,113,0.15),rgba(239,68,68,0.08));padding:28px 24px 20px;text-align:center;border-bottom:1px solid rgba(248,113,113,0.12);">
                        <div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:160px;height:80px;background:radial-gradient(ellipse,rgba(248,113,113,0.25),transparent 70%);pointer-events:none;"></div>
                        <div style="line-height:1;margin-bottom:10px;"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                        <div style="font-family:'Syne',sans-serif;font-size:19px;font-weight:800;color:#f1f0ff;letter-spacing:-0.03em;margin-bottom:6px;">Invalid referral link</div>
                        <div style="font-size:12px;color:rgba(248,113,113,0.75);line-height:1.6;">That referral link doesn't match any account. No bonus has been applied.</div>
                    </div>
                    <div style="padding:20px 24px;">
                        <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:18px;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="#f87171" stroke-width="1.4"/><path d="M10 6v5" stroke="#f87171" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14" r="1" fill="#f87171"/></svg>
                            <div style="font-size:11px;color:rgba(248,113,113,0.8);line-height:1.6;">The link you used was invalid or the account no longer exists. You can still earn $1 by using a valid referral link — ask a friend for theirs!</div>
                        </div>
                        <button onclick="document.getElementById('referralWelcomeModal').style.display='none';unlockBodyScroll&&unlockBodyScroll();" style="width:100%;padding:14px;border-radius:13px;background:linear-gradient(135deg,#f87171,#ef4444);border:none;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;cursor:pointer;letter-spacing:0.02em;">Got it →</button>
                        <div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(139,138,168,0.35);">No credits were applied to your account</div>
                    </div>
                </div>`;
            } else {
                //  Green valid-link state 
                const nameEl = document.getElementById('refByName');
                const avatarEl = document.getElementById('refByAvatar');
                if (nameEl) nameEl.textContent = '@' + referrerUsername;
                if (avatarEl) avatarEl.textContent = referrerUsername.charAt(0).toUpperCase();
            }
            modal.style.display = 'flex';
            if (window._lockBodyScroll) window._lockBodyScroll();
        }
        window._showReferralWelcomePopup = showReferralWelcomePopup;

        // Populate referral panel + link when panel opens
        document.addEventListener('DOMContentLoaded', function() {
            const origOpen = window.openSettingsPanel;
            window.openSettingsPanel = function(name) {
                origOpen(name);
                if (name === 'referral') {
                    loadReferralStats();
                }
                if (name === 'saved') {
                    loadSavedPanel();
                }
            };
        });

        //  Load saved listings into subSaved panel 
        async function loadSavedPanel() {
            const container = document.getElementById('savedListings');
            if (!container) return;
            const user = window._fbAuth && window._fbAuth.currentUser;
            if (!user) {
                container.innerHTML = '<div style="text-align:center;padding:32px 0;font-size:12px;color:rgba(139,138,168,0.4);">Sign in to see your saved listings.</div>';
                return;
            }
            container.innerHTML = '<div style="text-align:center;padding:24px 0;font-size:11px;color:rgba(139,138,168,0.4);">Loading…</div>';
            try {
                const { ref: dbRef, get: dbGet } = window._fbDbFns || {};
                if (!dbRef || !dbGet) return;
                const db = window._fbDb;

                // Get saved listing IDs
                const savedSnap = await dbGet(dbRef(db, 'users/' + user.uid + '/saved'));
                if (!savedSnap.exists() || !Object.keys(savedSnap.val()).length) {
                    container.innerHTML = `
                        <div style="text-align:center;padding:32px 0;font-size:12px;color:rgba(139,138,168,0.4);">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="display:block;margin:0 auto 10px;opacity:0.3;"><path d="M7 4h18a2 2 0 0 1 2 2v22l-11-6-11 6V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                            No saved listings yet
                        </div>`;
                    return;
                }

                const savedIds = Object.keys(savedSnap.val());

                // Fetch each listing from /websites/
                const listingCards = await Promise.all(savedIds.map(async function(id) {
                    try {
                        const snap = await dbGet(dbRef(db, 'websites/' + id));
                        if (!snap.exists()) return null;
                        const d = snap.val();
                        const title = d.title || d.name || 'Untitled';
                        const price = d.price ? '$' + parseFloat(d.price).toLocaleString() : '—';
                        const img   = (d.images && d.images[0]) ? d.images[0] : null;
                        const cat   = d.category || '';
                        const status = d.status || 'live';
                        const isLive = status === 'live' || status === 'approved';
                        return { id, title, price, img, cat, status, isLive };
                    } catch(_) { return null; }
                }));

                const valid = listingCards.filter(Boolean);
                if (!valid.length) {
                    container.innerHTML = '<div style="text-align:center;padding:32px 0;font-size:12px;color:rgba(139,138,168,0.4);">No saved listings found.</div>';
                    return;
                }

                container.innerHTML = valid.map(function(c) {
                    const thumbHtml = c.img
                        ? `<img src="${c.img}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;border-radius:11px 11px 0 0;" onerror="this.parentElement.style.display='none'">`
                        : `<div style="width:100%;height:80px;border-radius:11px 11px 0 0;background:linear-gradient(135deg,rgba(168,85,247,0.1),rgba(129,140,248,0.06));display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="rgba(168,85,247,0.5)" stroke-width="1.3"/><path d="M2 7h14" stroke="rgba(168,85,247,0.5)" stroke-width="1.1"/><circle cx="6" cy="4.5" r="1" fill="rgba(168,85,247,0.5)"/></svg></div>`;
                    const badge = c.isLive
                        ? `<span style="font-size:9px;font-weight:700;color:#34d399;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:4px;padding:1px 5px;">LIVE</span>`
                        : `<span style="font-size:9px;font-weight:700;color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:4px;padding:1px 5px;">${c.status.toUpperCase()}</span>`;
                    return `<a href="/listing?id=${c.id}" style="display:block;background:var(--surface);border:1px solid var(--border);border-radius:13px;text-decoration:none;overflow:hidden;transition:border-color .15s;margin-bottom:10px;" onmouseover="this.style.borderColor='rgba(168,85,247,0.35)'" onmouseout="this.style.borderColor='var(--border)'">
                        ${thumbHtml}
                        <div style="padding:10px 12px 11px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div style="min-width:0;">
                                <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.title}</div>
                                <div style="display:flex;align-items:center;gap:5px;margin-top:3px;">${badge}<span style="font-size:10px;color:var(--muted);">${c.cat}</span></div>
                            </div>
                            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--accent);flex-shrink:0;">${c.price}</div>
                        </div>
                    </a>`;
                }).join('');

                // Update the watch count stat too
                const wc = document.getElementById('sdWatchCount');
                if (wc) wc.textContent = valid.length;

            } catch(e) {
                console.warn('[loadSavedPanel]', e);
                container.innerHTML = '<div style="text-align:center;padding:24px 0;font-size:11px;color:rgba(248,113,113,0.6);">Could not load saved listings.</div>';
            }
        }
        window._loadSavedPanel = loadSavedPanel;

        // Expose processReferral for use in doSignup
        window._processReferral = processReferral;

        //  Notification preferences 
        // VAPID public key — replace with your actual key from env
        const VAPID_PUBLIC_KEY = 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do';

        // Converts a base64url VAPID key to a Uint8Array for PushManager
        function urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const raw = window.atob(base64);
            return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
        }

        // Read toggle state from DOM
        function isToggleOn(el) {
            const dot = el.querySelector('div');
            return dot.style.right === '2px';
        }

        // Set toggle visual state
        function setToggle(el, on) {
            const dot = el.querySelector('div');
            if (on) {
                el.style.background = 'var(--accent)';
                dot.style.left = 'auto'; dot.style.right = '2px';
            } else {
                el.style.background = 'rgba(255,255,255,0.15)';
                dot.style.right = 'auto'; dot.style.left = '2px';
            }
        }

        // Show a brief status message in the notifications panel
        function showNotifStatus(msg, isErr) {
            const el = document.getElementById('notifStatusMsg');
            if (!el) return;
            el.textContent = msg;
            el.style.display = 'block';
            el.style.background = isErr ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)';
            el.style.color = isErr ? '#f87171' : '#34d399';
            el.style.border = isErr ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(52,211,153,0.2)';
            clearTimeout(el._hideTimer);
            el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
        }

        // Persist notif prefs to Firebase under users/<uid>/notifPrefs
        async function saveNotifPref(key, value) {
            if (!window._fbAuth || !window._fbAuth.currentUser) return;
            const uid = window._fbAuth.currentUser.uid;
            try {
                const { getDatabase, ref, update } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js');
                const db2 = getDatabase();
                await update(ref(db2, 'users/' + uid + '/notifPrefs'), { [key]: value });
            } catch(e) { console.warn('saveNotifPref', e); }
        }

        // Load notif prefs from Firebase and apply to toggles
        window.loadNotifPrefs = async function() {
            if (!window._fbAuth || !window._fbAuth.currentUser) return;
            const uid = window._fbAuth.currentUser.uid;
            try {
                const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js');
                const db2 = getDatabase();
                const snap = await get(ref(db2, 'users/' + uid + '/notifPrefs'));
                const prefs = snap.val() || {};
                // Email toggles — default on for sales+messages, off for updates
                const defaults = { sales: true, messages: true, updates: false };
                ['sales','messages','updates'].forEach(key => {
                    const el = document.getElementById('notif' + key.charAt(0).toUpperCase() + key.slice(1));
                    if (el) setToggle(el, prefs[key] !== undefined ? prefs[key] : defaults[key]);
                });
                // Push toggle — reflect actual browser permission + saved pref
                const pushEl = document.getElementById('notifPush');
                if (pushEl) {
                    const hasPerm = 'Notification' in window && Notification.permission === 'granted';
                    setToggle(pushEl, hasPerm && prefs.push === true);
                }
            } catch(e) { console.warn('loadNotifPrefs', e); }
        };

        // Email toggle handler — persists pref and sends a confirmation email on first enable
        window.handleNotifToggle = async function(el) {
            const key = el.dataset.key;
            const nowOn = !isToggleOn(el);
            setToggle(el, nowOn);
            await saveNotifPref(key, nowOn);

            // On enable: fire a welcome/confirmation email via Resend API
            if (nowOn && window._fbAuth && window._fbAuth.currentUser) {
                const email = window._fbAuth.currentUser.email;
                const labels = { sales: 'Sale alerts', messages: 'Buyer messages', updates: 'Platform updates' };
                const label = labels[key] || key;
                try {
                    await fetch('/api/settings.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send-email',
                            to: email,
                            subject: `[Enabled] ${label} enabled on Siterifty`,
                            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
                                <h2 style="margin:0 0 12px;font-size:20px;">You're subscribed to ${label}</h2>
                                <p style="color:#8b8aa8;font-size:14px;line-height:1.6;margin:0 0 20px;">You'll now receive ${label.toLowerCase()} at <strong style="color:#f1f0ff;">${email}</strong>.</p>
                                <p style="color:#8b8aa8;font-size:12px;margin:0;">You can turn this off anytime in Settings → Notifications on Siterifty.com.</p>
                            </div>`
                        })
                    });
                    showNotifStatus(`${label} enabled`, false);
                } catch(e) {
                    showNotifStatus('Saved, but confirmation email failed', true);
                }
            } else if (!nowOn) {
                const labels = { sales: 'Sale alerts', messages: 'Buyer messages', updates: 'Platform updates' };
                showNotifStatus(`${labels[key] || key} disabled`, false);
            }
        };

        // Push toggle handler — requests permission, subscribes via service worker, calls /api/push-subscribe
        window.handlePushToggle = async function(el) {
            const blockedNote = document.getElementById('pushBlockedNote');
            const subLabel = document.getElementById('pushSubLabel');

            // If currently ON, turn off
            if (isToggleOn(el)) {
                setToggle(el, false);
                await saveNotifPref('push', false);
                if (subLabel) subLabel.textContent = 'Real-time alerts on this device';
                showNotifStatus('Push notifications disabled', false);
                return;
            }

            // Check browser support
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                showNotifStatus('Push notifications aren\'t supported in this browser', true);
                return;
            }

            // Check if blocked
            if (Notification.permission === 'denied') {
                if (blockedNote) blockedNote.style.display = 'block';
                showNotifStatus('Notifications are blocked — see note below', true);
                return;
            }

            // Request permission
            if (subLabel) subLabel.textContent = 'Requesting permission…';
            let permission;
            try {
                permission = await Notification.requestPermission();
            } catch(e) {
                permission = 'denied';
            }

            if (permission !== 'granted') {
                if (subLabel) subLabel.textContent = 'Real-time alerts on this device';
                if (permission === 'denied' && blockedNote) blockedNote.style.display = 'block';
                showNotifStatus('Permission not granted', true);
                return;
            }

            // Register service worker if not already registered
            if (subLabel) subLabel.textContent = 'Subscribing…';
            try {
                // Use the shared helper that tries /sw.js (no blob URLs — browsers block them)
                const reg = await _ensureSwReg();
                if (!reg) throw new Error('Service worker unavailable — make sure /sw.js exists on your server.');

                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                // Send subscription to backend
                const uid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : 'unknown';
                const email = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.email : '';
                const resp = await fetch('/api/settings.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'push-subscribe',
                        subscription: subscription.toJSON(),
                        deviceId: uid + '_' + Date.now(),
                        metadata: { uid, email, ua: navigator.userAgent.slice(0, 120) },
                        resubscribe: false
                    })
                });

                if (!resp.ok) throw new Error('Server returned ' + resp.status);

                setToggle(el, true);
                await saveNotifPref('push', true);
                if (subLabel) subLabel.textContent = 'Enabled on this device';
                if (blockedNote) blockedNote.style.display = 'none';
                showNotifStatus('Push notifications enabled!', false);

            } catch(e) {
                console.error('[push]', e);
                if (subLabel) subLabel.textContent = 'Real-time alerts on this device';
                showNotifStatus('Could not enable push: ' + (e.message || 'unknown error'), true);
            }
        };

        // Check push permission state whenever the notifications panel opens and restore UI
        window.initNotifPanel = function() {
            const pushEl = document.getElementById('notifPush');
            const blockedNote = document.getElementById('pushBlockedNote');
            const subLabel = document.getElementById('pushSubLabel');
            if (!pushEl) return;
            if (!('Notification' in window)) {
                pushEl.style.opacity = '0.4';
                pushEl.style.pointerEvents = 'none';
                if (subLabel) subLabel.textContent = 'Not supported in this browser';
                return;
            }
            if (Notification.permission === 'denied') {
                setToggle(pushEl, false);
                if (blockedNote) blockedNote.style.display = 'block';
            } else if (Notification.permission === 'granted') {
                if (blockedNote) blockedNote.style.display = 'none';
            }
            window.loadNotifPrefs();
        };

        //  Contact form 
        window.sendContactMessage = async function() {
            hideMsg('contactOk','contactErr');
            const subject = $('contactSubject') ? $('contactSubject').value.trim() : '';
            const message = $('contactMessage') ? $('contactMessage').value.trim() : '';
            if(!subject) return showErr('contactErr','Please enter a subject.');
            if(!message) return showErr('contactErr','Please write a message.');
            if(!auth.currentUser) return showErr('contactErr','You must be signed in to contact us.');
            try {
                await set(ref(db,'support/'+Date.now()), {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    subject, message,
                    ts: Date.now()
                });
                showOk('contactOk',"Message sent! We'll reply within 24 hours.");
                $('contactSubject').value = '';
                $('contactMessage').value = '';
            } catch(e) { showErr('contactErr','Could not send. Please try again.'); }
        };

        //  Reset from settings 
        window.sendResetFromSettings = async function() {
            // Different callers (Accounts tab vs Edit Profile modal) wire up
            // different feedback element IDs — try known ones, fall back to
            // the global alert modal so the user always sees a result either way.
            const okIds  = ['acctResetOk', 'resetOk'];
            const errIds = ['acctResetErr', 'resetErr'];
            hideMsg.apply(null, okIds.concat(errIds).filter(id => $(id)));

            const user = auth.currentUser;
            if (!user) {
                const errEl = errIds.map($).find(Boolean);
                if (errEl) showErr(errEl.id, 'Not signed in.');
                else if (typeof showCustomAlert === 'function') showCustomAlert('Not signed in.');
                return;
            }

            const btn = document.activeElement && document.activeElement.tagName === 'BUTTON'
                ? document.activeElement
                : ($('btnResetPwdAcct') || $('btnResetFromSettings'));
            if (btn) { btn.disabled = true; btn.style.opacity = '.5'; }

            try {
                await sendPasswordResetEmail(auth, user.email);
                const msg = 'Reset link sent to ' + user.email + '. Check your inbox.';
                const okEl = okIds.map($).find(Boolean);
                if (okEl) showOk(okEl.id, msg);
                else if (typeof showCustomAlert === 'function') showCustomAlert(msg);
            } catch(e) {
                const msg = firebaseErrMsg(e.code) || 'Could not send reset link.';
                const errEl = errIds.map($).find(Boolean);
                if (errEl) showErr(errEl.id, msg);
                else if (typeof showCustomAlert === 'function') showCustomAlert(msg);
            }
            finally { if(btn){ btn.disabled=false; btn.style.opacity='1'; } }
        };

        //  Scroll to section helper 
        window.scrollToSection = function(id) {
            const el = $(id);
            if(el) { el.scrollIntoView({ behavior:'smooth', block:'start' }); }
        };

        //  selectPlan (updated for new plan keys) 
        window.selectPlan = function(row, name, price) {
            _selectedPlan = name;
            document.querySelectorAll('.plan-opt-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            ['free','starter','growth','pro'].forEach(id => {
                const r = $('radio-'+id);
                if(r) r.classList.remove('checked');
            });
            const key = name.toLowerCase();
            const radio = $('radio-'+key);
            if(radio) radio.classList.add('checked');
        };


        // allow Enter key on auth inputs
        ['suEmail','suPassword'].forEach(id=>{
            document.getElementById(id)?.addEventListener('keydown', e=>{ if(e.key==='Enter') window.doSignup(); });
        });
        ['liEmail','liPassword'].forEach(id=>{
            document.getElementById(id)?.addEventListener('keydown', e=>{ if(e.key==='Enter') window.doLogin(); });
        });
        document.getElementById('fpEmail')?.addEventListener('keydown', e=>{ if(e.key==='Enter') window.doForgot(); });

        // Swipe-to-close removed — all modals are now centered popups

//  Hero image slideshow — images fetched from Firebase /heroimages
        // NOTE: this block originally lived in its own <script type="module"> tag with an
        // isolated scope and re-imported/re-initialised Firebase independently. Now that all
        // module code lives in one file, it reuses the `app`, `db`, `ref`, and `get` bindings
        // already declared above instead of redeclaring them (which would be a SyntaxError).

        const heroBg      = document.getElementById('heroBg');
        const loaderBar   = document.getElementById('loaderProgress');
        const loaderText  = document.getElementById('loaderText');
        const loaderPct   = document.getElementById('loaderPct');
        const loadingScreen = document.getElementById('loadingScreen');

        function setProgress(pct, label) {
            loaderBar.style.width = pct + '%';
            if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
            if (label && loaderText) loaderText.textContent = label;
        }

        setProgress(5, 'Loading assets…');
        setTimeout(() => { setProgress(30, 'Loading assets…'); }, 80);
        setTimeout(() => { setProgress(55, 'Fetching listings…'); }, 500);
        setTimeout(() => { setProgress(76, 'Almost ready…'); }, 1000);
        setTimeout(() => { setProgress(90, 'Almost ready…'); }, 1500);

        const loaderStartTime = Date.now();
        const MIN_LOADER_MS = 1800;

        function dismissWhenReady() {
            const elapsed = Date.now() - loaderStartTime;
            const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
            setTimeout(function() {
                setProgress(100, 'Ready!');
                setTimeout(() => dismissLoader(), 420);
            }, remaining);
        }

        dismissWhenReady();

        // Safety: dismiss loader after 4s no matter what
        const safetyTimer = setTimeout(() => dismissWhenReady(), 4000);

        function dismissLoader() {
            clearTimeout(safetyTimer);
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('loader-lock');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
            if (window._signalLoaderReady) window._signalLoaderReady();
        }
