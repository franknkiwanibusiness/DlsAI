// ── Next.js DOMContentLoaded patch ──────────────────────────────────────────
// Next.js loads this script afterInteractive, meaning DOMContentLoaded has
// already fired. Patch addEventListener so any 'DOMContentLoaded' listener
// added after the fact runs immediately instead of silently being dropped.
(function() {
  var _origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, opts) {
    if (type === 'DOMContentLoaded' && this === document &&
        (document.readyState === 'interactive' || document.readyState === 'complete')) {
      try { fn(); } catch(e) { console.warn('[DOMContentLoaded patch]', e); }
      return;
    }
    return _origAdd.call(this, type, fn, opts);
  };
})();
// ─────────────────────────────────────────────────────────────────────────────

// Siterifty — extracted scripts (homepage-fixed.html)

(function() {
    var LS_PREFIX  = 'sr_imgcache:';
    var BUDGET_BYTES = 4.5 * 1024 * 1024; // leave headroom under the ~5MB localStorage ceiling
    var usedBytes = 0;

    // Every image URL the site reuses across cards/modals/backgrounds.
    var IMAGE_URLS = [
        // Galaxy / theme background pool (auth card, profile setup card, theme picker, design panel)
        'https://plus.unsplash.com/premium_photo-1710962184823-907ade6b3783?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1711136314696-b27c2a148d55?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1710962184909-f9f8dc2c9f5f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1710030733204-6816ffb0a1b2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1710965560034-778eedc929ff?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0',
        'https://plus.unsplash.com/premium_photo-1673292293042-cafd9c8a3ab3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1502318217862-aa4e294ba657?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
        'https://images.unsplash.com/photo-1725615357444-6123528686cf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
        'https://m.media-amazon.com/images/I/81SNLEuNQuL._UF1000,1000_QL80_.jpg',
        'https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg',
        // Avatar pool (avatar strip in profile setup / avatar picker)
        'https://wallpapers.com/images/hd/dark-galaxy-1080-x-1920-wallpaper-2pax0j8xoqtty0av.jpg',
        'https://i.pinimg.com/474x/52/97/b4/5297b4d029cc0d64ed6484d3c9919d6b.jpg',
        'https://img.magnific.com/free-photo/cyberpunk-illustration-with-neon-colors-futuristic-technology_23-2151672018.jpg',
        'https://media.licdn.com/dms/image/v2/D5612AQG1iOLVOq8rOg/article-cover_image-shrink_720_1280/B56Z2VeuyvKcAM-/0/1776329354950?e=2147483647&v=beta&t=1vi3VbDwsgwyYKqGf_03thFpOz0M3jTejsGy07sFwzY',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ5ZNLMeTSmgQWXnHT0g32VtpbTCO9Ao0GXbf0M29X8A&s=10',
        // Hero / brand images reused across header, dashboard, chat headers, emails
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRANmB5Hwth7loc_aHJGTJKHYOImvhr_emj-1Yy5ABw3XCXxennbcSEaAw9&s=10',
        'https://i.imgur.com/8EEl86u.jpeg',
        'https://i.imgur.com/n5LhUiV.jpeg'
    ];

    function _b64Size(b64) {
        // rough byte size of a base64 data URL
        var idx = b64.indexOf(',');
        var data = idx >= 0 ? b64.slice(idx + 1) : b64;
        return Math.floor(data.length * 0.75);
    }

    function _currentCacheBytes() {
        var total = 0;
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(LS_PREFIX) === 0) {
                    var v = localStorage.getItem(k);
                    if (v) total += v.length;
                }
            }
        } catch(_) {}
        return total;
    }

    function _cacheKeyFor(url) {
        // short stable hash so keys stay well under localStorage's per-key limits
        var h = 0;
        for (var i = 0; i < url.length; i++) { h = ((h << 5) - h + url.charCodeAt(i)) | 0; }
        return LS_PREFIX + h;
    }

    function _blobToDataUrl(blob) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Apply any already-cached image immediately to <img> tags / CSS backgrounds
    // referencing the original URL, so a repeat visit renders from cache instantly.
    function _applyCachedToDom(originalUrl, dataUrl) {
        try {
            document.querySelectorAll('img[src="' + originalUrl + '"]').forEach(function(img) {
                img.src = dataUrl;
            });
        } catch(_) {}
    }

    function _loadOne(url) {
        var key = _cacheKeyFor(url);
        var cached;
        try { cached = localStorage.getItem(key); } catch(_) { cached = null; }

        if (cached) {
            _applyCachedToDom(url, cached);
            return Promise.resolve();
        }

        // Fetch in the background; this does NOT wait for the image's section
        // to scroll into view — it starts as soon as the tab is open.
        return fetch(url, { mode: 'cors' }).then(function(res) {
            if (!res.ok) throw new Error('fetch failed');
            return res.blob();
        }).then(_blobToDataUrl).then(function(dataUrl) {
            var size = _b64Size(dataUrl);
            // Respect the ~5MB localStorage ceiling — stop caching once we're full,
            // the image still rendered for this session, it just won't persist.
            if (usedBytes + size <= BUDGET_BYTES) {
                try {
                    localStorage.setItem(key, dataUrl);
                    usedBytes += size;
                } catch(e) {
                    // Quota exceeded (private browsing, full disk, etc.) — fail silently,
                    // the image already loaded over the network for this session.
                }
            }
            _applyCachedToDom(url, dataUrl);
        }).catch(function() {
            // CORS-blocked or network error — harmless, browser's own image cache
            // still picks it up normally via the <img>/background-image tags.
        });
    }

    function _preloadAll() {
        usedBytes = _currentCacheBytes();
        // Load sequentially-ish in small bursts so we don't fight the rest of the
        // page for bandwidth on slow connections, but never wait for scroll/visibility.
        var i = 0;
        function next() {
            if (i >= IMAGE_URLS.length) return;
            var batch = IMAGE_URLS.slice(i, i + 4);
            i += 4;
            Promise.all(batch.map(_loadOne)).then(next);
        }
        next();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _preloadAll);
    } else {
        _preloadAll();
    }

    // Expose so other scripts (theme picker, profile setup, design panel) can
    // request a specific URL be cached/applied on demand too.
    window._srPreloadImage = _loadOne;
})();

(function(){
        const colors = ['#ffffff','#ffffff','#ffffff','#ffffff','#7dd3fc','#7dd3fc','#c4b5fd','#c4b5fd','#f9a8d4','#a5f3fc','#e9d5ff'];
        const rnd = (a,b) => a + Math.random()*(b-a);

        function makeSpark(size, color) {
            const h = size/2, q = size/4;
            const el = document.createElementNS('http://www.w3.org/2000/svg','svg');
            el.setAttribute('viewBox',`0 0 ${size} ${size}`);
            el.setAttribute('width', size); el.setAttribute('height', size);
            el.style.cssText = 'overflow:visible;display:block;flex-shrink:0;';
            const p = document.createElementNS('http://www.w3.org/2000/svg','path');
            p.setAttribute('d',`M${h},0 L${h+q*.3},${h-q*.3} L${size},${h} L${h+q*.3},${h+q*.3} L${h},${size} L${h-q*.3},${h+q*.3} L0,${h} L${h-q*.3},${h-q*.3} Z`);
            p.setAttribute('fill', color);
            el.appendChild(p);
            return el;
        }

        function spawnGlitter(container, count) {
            for (let i = 0; i < count; i++) {
                const isSpark = Math.random() < 0.5;
                const size    = isSpark ? rnd(3, 8) : rnd(1, 3);
                const color   = colors[Math.floor(Math.random()*colors.length)];
                const dur     = rnd(1.6, 5);
                const delay   = rnd(0, 5);
                const minOp   = rnd(0, 0.06);
                const maxOp   = rnd(0.55, 1);
                const pulse   = rnd(1.2, 2.2);
                const wrap    = document.createElement('div');
                wrap.style.cssText = `position:absolute;left:${rnd(0,100)}%;top:${rnd(0,100)}%;width:${size}px;height:${size}px;pointer-events:none;animation:starTwinkle ${dur}s ease-in-out ${delay}s infinite;--min-op:${minOp};--max-op:${maxOp};--pulse:${pulse};transform-origin:center;display:flex;align-items:center;justify-content:center;`;
                if (isSpark) { wrap.appendChild(makeSpark(size, color)); }
                else { wrap.style.borderRadius='50%'; wrap.style.background=color; wrap.style.boxShadow=`0 0 ${size*2.5}px ${color}`; }
                container.appendChild(wrap);
            }
        }

        /* Loader glitter removed — skeleton has no glitter */

        /* Top-up modal glitters */
        function initTuGlitters() {
            const tl = document.getElementById('tuGlitterLayer');
            if (tl && tl.childElementCount === 0) spawnGlitter(tl, 32);
        }
        const _origOpen = window.openTopUpModal;
        window.openTopUpModal = function() {
            if (_origOpen) _origOpen.apply(this, arguments);
            setTimeout(initTuGlitters, 60);
        };
    })();

// Global balance formatter — strips .00 for whole numbers, keeps real cents
    window.fmtBal = function(n){ var v=parseFloat(n)||0; if(v===0) return '$0.00'; return '$'+v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); };

// Mobile plan tab switcher
    window.switchPlanTab = function(plan) {
        document.querySelectorAll('.plan-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.plan === plan);
        });
        document.querySelectorAll('.plan-card-new').forEach(c => {
            c.classList.toggle('pc-tab-active', c.dataset.plan === plan);
        });
    };

    // handlePlanClick still used by pc-btn buttons
    if (typeof handlePlanClick === 'undefined') {
        window.handlePlanClick = function(planId) {
            const auth = window._auth && window._auth();
            if (auth && auth.currentUser) {
                if (planId === 'free') return;
                if (typeof openPlansPickerModal === 'function') openPlansPickerModal();
                else if (typeof openUpgradeModal === 'function') openUpgradeModal(planId);
            } else {
                if (typeof openAuthModal === 'function') openAuthModal();
            }
        };
    }

(function() {
        // ── ALL 8 FEATURES (4 left, 4 right) + center hub ──
        const allFeatures = [
            // LEFT group
            { id:'f0', name:'Secure Escrow',    color:'#a855f7', bg:'rgba(168,85,247,0.12)',   border:'rgba(168,85,247,0.25)',  desc:'Funds held by Siterifty until both parties confirm. Nobody gets cheated.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="10" rx="2" stroke="#a855f7" stroke-width="1.3"/><path d="M6 5V3.5a3 3 0 0 1 6 0V5" stroke="#a855f7" stroke-width="1.3" stroke-linecap="round"/><circle cx="9" cy="10" r="1.3" fill="#a855f7"/></svg>' },
            { id:'f1', name:'Vetted Listings',  color:'#818cf8', bg:'rgba(129,140,248,0.12)', border:'rgba(129,140,248,0.25)', desc:'Every listing reviewed. Metrics verified. No fake traffic or inflated numbers.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 2l2.09 4.26L16 7.27l-3.5 3.41.83 4.82L9 13.27l-4.33 2.23.83-4.82L2 7.27l4.91-.71L9 2Z" stroke="#818cf8" stroke-width="1.3" stroke-linejoin="round"/></svg>' },
            { id:'f2', name:'Managed Hosting',  color:'#38bdf8', bg:'rgba(56,189,248,0.12)',   border:'rgba(56,189,248,0.25)',  desc:'Keep sites live with our $49.99/mo stack — DB, serverless &amp; admin included.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="5" rx="1.5" stroke="#38bdf8" stroke-width="1.3"/><rect x="2" y="10" width="14" height="5" rx="1.5" stroke="#38bdf8" stroke-width="1.3"/><circle cx="4.5" cy="5.5" r="1" fill="#38bdf8"/><circle cx="4.5" cy="12.5" r="1" fill="#38bdf8"/></svg>' },
            { id:'f3', name:'Buyer Protection', color:'#34d399', bg:'rgba(52,211,153,0.12)',   border:'rgba(52,211,153,0.25)',  desc:'Dispute resolution, transfer verification and full asset handover — guaranteed.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 2l-6 3v4.5C3 13.5 6.6 16.4 9 17c2.4-.6 6-3.5 6-7.5V5L9 2z" stroke="#34d399" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 9l2 2 4-4" stroke="#34d399" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            // RIGHT group
            { id:'f4', name:'Lowest Fees',      color:'#34d399', bg:'rgba(52,211,153,0.12)',   border:'rgba(52,211,153,0.25)',  desc:'Start free at 30%, drop to just 5% on Pro. Keep the lion\'s share of every deal.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M2 12l4-5 3 3.5L13 5l3 2.5" stroke="#34d399" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            { id:'f5', name:'Fast Closings',    color:'#fbbf24', bg:'rgba(251,191,36,0.12)',   border:'rgba(251,191,36,0.25)',  desc:'Most deals close in under 14 days. Streamlined process cuts out the noise.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#fbbf24" stroke-width="1.3"/><path d="M9 5v4l3 2" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            { id:'f6', name:'AI Support',       color:'#818cf8', bg:'rgba(129,140,248,0.12)', border:'rgba(129,140,248,0.25)', desc:'Instant answers on listings, deals, billing &amp; plans — always available.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C5.41 1.5 2.5 4.19 2.5 7.56c0 1.87.84 3.55 2.16 4.77L3.9 15l2.96-1.25c.67.21 1.38.31 2.14.31 3.59 0 6.5-2.69 6.5-6.06S12.59 1.5 9 1.5Z" stroke="#818cf8" stroke-width="1.3" stroke-linejoin="round"/><circle cx="6.5" cy="7.5" r="1" fill="#818cf8"/><circle cx="9" cy="7.5" r="1" fill="#818cf8"/><circle cx="11.5" cy="7.5" r="1" fill="#818cf8"/></svg>' },
            { id:'f7', name:'Global Reach',     color:'#fb923c', bg:'rgba(251,146,60,0.12)',   border:'rgba(251,146,60,0.25)',  desc:'10,000+ buyers worldwide. List once, get discovered by serious buyers everywhere.',
              svg:'<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#fb923c" stroke-width="1.3"/><path d="M2 9h14M9 2c-2 2-3 4-3 7s1 5 3 7M9 2c2 2 3 4 3 7s-1 5-3 7" stroke="#fb923c" stroke-width="1.1" stroke-linecap="round"/></svg>' },
        ];

        // Track which 4 are left, which 4 are right (positions 0-3 = left, 4-7 = right)
        // Grid slot order: [0,1,2, 3,CENTER,4, 5,6,7] → left=slots 0-3 mapped, right=slots 4-7 mapped
        // We keep a flat array of 8 feature indices for the 8 non-center slots
        let slotOrder = [0,1,2,3,4,5,6,7]; // indices into allFeatures

        const grid = document.getElementById('wsfGrid');
        const CENTER_SLOT = 4; // slot index in 3x3 (0-8) that is center

        function buildGrid() {
            grid.innerHTML = '';
            // 9 slots: 0-8, center=4
            let fi = 0; // feature index into slotOrder
            for (let slot = 0; slot < 9; slot++) {
                const cell = document.createElement('div');
                if (slot === CENTER_SLOT) {
                    cell.className = 'wsf-cell wsf-cell-center';
                    cell.style.cursor = 'default';
                    cell.innerHTML = `<div class="wsf-icon" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.4)" stroke-width="1.3"/><path d="M4 10h12M10 4c-2.5 2-4 4-4 6s1.5 4 4 6M10 4c2.5 2 4 4 4 6s-1.5 4-4 6" stroke="rgba(255,255,255,0.4)" stroke-width="1.1" stroke-linecap="round"/></svg>
                    </div><span style="color:rgba(255,255,255,0.35);font-size:9px;font-weight:700;letter-spacing:.05em;">SITERIFTY</span>`;
                } else {
                    const f = allFeatures[slotOrder[fi]];
                    const panel = fi < 4 ? 'left' : 'right';
                    const pidx  = fi < 4 ? fi : fi - 4;
                    cell.className = 'wsf-cell wsf-cell-' + (fi < 4 ? 'active' : 'right');
                    cell.dataset.panel = panel;
                    cell.dataset.idx   = pidx;
                    cell.dataset.fid   = f.id;
                    cell.onclick = () => wsfSelectFeat(f, panel, pidx);
                    cell.innerHTML = `<div class="wsf-icon" style="background:${f.bg};border-color:${f.border};">${f.svg}</div><span>${f.name}</span>`;
                    fi++;
                }
                grid.appendChild(cell);
            }
            // Sync side panel text to current feature[0] of each side
            syncSidePanels();
            restoreHighlights();
        }

        // Side panel cycling state
        let leftIdx = 0, rightIdx = 0;

        function syncSidePanels() {
            const lf = slotOrder.slice(0,4).map(i => allFeatures[i]);
            const rf = slotOrder.slice(4,8).map(i => allFeatures[i]);
            // Update anim spans
            for (let i = 0; i < 4; i++) {
                const le = document.getElementById('wsf-la-' + i);
                const re = document.getElementById('wsf-ra-' + i);
                if (le) le.textContent = lf[i] ? lf[i].name : '';
                if (re) re.textContent = rf[i] ? rf[i].name : '';
            }
            // Labels
            const ll = document.getElementById('wsf-left-label');
            const rl = document.getElementById('wsf-right-label');
            if (ll) ll.textContent = lf.map(f => f.name.split(' ')[0]).join(' · ');
            if (rl) rl.textContent = rf.map(f => f.name.split(' ')[0]).join(' · ');
            // Reset cycling indices
            leftIdx = 0; rightIdx = 0;
            // Reset anim classes
            ['wsf-la-','wsf-ra-'].forEach((p, si) => {
                for (let i = 0; i < 4; i++) {
                    const el = document.getElementById(p + i);
                    if (el) { el.classList.remove('wsf-anim-active','wsf-anim-exit'); }
                }
                document.getElementById(p + '0').classList.add('wsf-anim-active');
            });
            // Update descriptions
            const ld = document.getElementById('wsf-left-desc');
            const rd = document.getElementById('wsf-right-desc');
            if (ld) ld.innerHTML = lf[0].desc;
            if (rd) rd.innerHTML = rf[0].desc;
        }

        function restoreHighlights() {
            document.querySelectorAll('.wsf-cell-active').forEach(c => c.classList.remove('wsf-lit'));
            document.querySelectorAll('.wsf-cell-right').forEach(c => c.classList.remove('wsf-lit-r'));
            const la = document.querySelector('.wsf-cell-active[data-idx="' + leftIdx + '"]');
            const ra = document.querySelector('.wsf-cell-right[data-idx="' + rightIdx + '"]');
            if (la) la.classList.add('wsf-lit');
            if (ra) ra.classList.add('wsf-lit-r');
        }

        // ── SHUFFLE ──
        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }

        function doShuffle() {
            // Fade all cells out
            const cells = grid.querySelectorAll('.wsf-cell:not(.wsf-cell-center)');
            cells.forEach(c => c.classList.add('wsf-shuffle-out'));
            setTimeout(() => {
                // Shuffle the 8 feature slots
                const left4  = slotOrder.slice(0,4);
                const right4 = slotOrder.slice(4,8);
                shuffleArray(left4);
                shuffleArray(right4);
                slotOrder = [...left4, ...right4];
                buildGrid();
                // Fade new cells in
                const newCells = grid.querySelectorAll('.wsf-cell:not(.wsf-cell-center)');
                newCells.forEach(c => { c.classList.add('wsf-shuffle-in'); });
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    newCells.forEach(c => { c.classList.remove('wsf-shuffle-in'); });
                }));
            }, 280);
        }

        setInterval(doShuffle, 3000);

        // ── SIDE PANEL CYCLING ──
        function cyclePanel(side) {
            const count = 4;
            let idx = side === 'left' ? leftIdx : rightIdx;
            const prefix = side === 'left' ? 'wsf-la-' : 'wsf-ra-';
            const descEl = document.getElementById('wsf-' + side + '-desc');
            const feats  = side === 'left'
                ? slotOrder.slice(0,4).map(i => allFeatures[i])
                : slotOrder.slice(4,8).map(i => allFeatures[i]);

            const cur = document.getElementById(prefix + idx);
            if (cur) { cur.classList.remove('wsf-anim-active'); cur.classList.add('wsf-anim-exit'); }
            setTimeout(() => { if (cur) cur.classList.remove('wsf-anim-exit'); }, 370);

            idx = (idx + 1) % count;
            if (side === 'left') leftIdx = idx; else rightIdx = idx;

            const next = document.getElementById(prefix + idx);
            if (next) next.classList.add('wsf-anim-active');
            if (descEl && feats[idx]) descEl.innerHTML = feats[idx].desc;

            // Highlight cell
            if (side === 'left') {
                document.querySelectorAll('.wsf-cell-active').forEach(c => c.classList.remove('wsf-lit'));
                const t = document.querySelector('.wsf-cell-active[data-idx="' + idx + '"]');
                if (t) t.classList.add('wsf-lit');
            } else {
                document.querySelectorAll('.wsf-cell-right').forEach(c => c.classList.remove('wsf-lit-r'));
                const t = document.querySelector('.wsf-cell-right[data-idx="' + idx + '"]');
                if (t) t.classList.add('wsf-lit-r');
            }
        }

        setInterval(() => cyclePanel('left'),  1400);
        setTimeout(() => setInterval(() => cyclePanel('right'), 1400), 700);

        // ── MANUAL CLICK ──
        window.wsfSelectFeat = function(f, panel, pidx) {
            const prefix = panel === 'left' ? 'wsf-la-' : 'wsf-ra-';
            const curIdx = panel === 'left' ? leftIdx : rightIdx;
            const descEl = document.getElementById('wsf-' + panel + '-desc');

            const cur = document.getElementById(prefix + curIdx);
            if (cur) { cur.classList.remove('wsf-anim-active'); cur.classList.add('wsf-anim-exit'); }
            setTimeout(() => { if (cur) cur.classList.remove('wsf-anim-exit'); }, 370);
            if (panel === 'left') leftIdx = pidx; else rightIdx = pidx;

            const next = document.getElementById(prefix + pidx);
            if (next) next.classList.add('wsf-anim-active');
            if (descEl) descEl.innerHTML = f.desc;

            if (panel === 'left') {
                document.querySelectorAll('.wsf-cell-active').forEach(c => c.classList.remove('wsf-lit'));
                const t = document.querySelector('.wsf-cell-active[data-idx="' + pidx + '"]');
                if (t) t.classList.add('wsf-lit');
            } else {
                document.querySelectorAll('.wsf-cell-right').forEach(c => c.classList.remove('wsf-lit-r'));
                const t = document.querySelector('.wsf-cell-right[data-idx="' + pidx + '"]');
                if (t) t.classList.add('wsf-lit-r');
            }
        };

        // Initial build
        buildGrid();
    })();

function handleFooterSubscribe(e) {
        e.preventDefault();
        const input = document.getElementById('footerEmailInput');
        const successEl = document.getElementById('footerSubSuccess');
        if (!input) return;
        const email = input.value.trim();
        // Basic email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            input.style.borderColor = 'rgba(129,140,248,0.55)';
            input.focus();
            setTimeout(() => { input.style.borderColor = ''; }, 2000);
            return;
        }
        // Submit to newsletter endpoint (replace with your actual endpoint)
        fetch('/api/settings.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'newsletter-subscribe', email })
        }).catch(() => {}); // Silently handle — show success regardless for UX
        input.value = '';
        const formRow = input.closest('.footer-newsletter-form');
        if (formRow) formRow.style.display = 'none';
        if (successEl) successEl.classList.add('show');
    }

//  FAQ accordion for main page 
    function toggleFaqMain(btn) {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    }

    //  AI Site Valuator — calls Vercel /api/valuate (server scrapes URL + GROQ) 
    async function runValuation() {
        const btn     = document.getElementById('valBtn');
        const revenue = document.getElementById('valRevenue').value.trim();
        const traffic = document.getElementById('valTraffic').value.trim();
        const desc    = document.getElementById('valDesc').value.trim();
        const urlRaw  = document.getElementById('valUrl').value.trim();

        if (!urlRaw && !desc && !revenue) {
            document.getElementById('valResultText').innerHTML = '<span style="color:#f87171;">Please paste your site URL or fill in at least one field.</span>';
            document.getElementById('valResult').style.display = 'block';
            return;
        }

        const spinSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation:spin .8s linear infinite;"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" stroke-width="2.5"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>';
        const idleBtnHtml = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 1.62.88 3.03 2.18 3.79L5 13h6l-.68-3.21A4.5 4.5 0 0 0 12.5 6C12.5 3.51 10.49 1.5 8 1.5Z" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 13h4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg> Estimate My Site Value';

        btn.innerHTML = spinSVG + ' Analysing...';
        btn.disabled = true;
        document.getElementById('valResult').style.display = 'none';
        document.getElementById('valUrlNote').style.display = 'none';

        try {
            const payload = { revenue, traffic, desc };
            if (urlRaw) {
                // Validate URL shape before sending
                try { new URL(urlRaw); payload.url = urlRaw; } catch(_) {}
            }

            const resp = await fetch('/api/valuate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();

            if (!resp.ok) {
                document.getElementById('valResultText').innerHTML =
                    '<span style="color:#f87171;">' + (data.error || 'Valuation failed. Please try again.') + '</span>';
            } else {
                if (data.urlFetched) {
                    const note = document.getElementById('valUrlNote');
                    if (note) note.style.display = 'flex';
                }
                const text = data.result || 'Could not generate valuation. Please try again.';
                document.getElementById('valResultText').innerHTML =
                    text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
                        .replace(/\n/g, '<br>');
            }
        } catch(e) {
            document.getElementById('valResultText').innerHTML =
                '<span style="color:#f87171;">Valuation service unavailable. Please try again shortly.</span>';
        }

        document.getElementById('valResult').style.display = 'block';
        btn.innerHTML = idleBtnHtml;
        btn.disabled = false;
    }

    //  Live Activity Feed — Firebase Realtime Database 
    (function initActivityFeed() {
        const FEED_ITEMS = [
            { type: 'listing', text: 'New listing: SaaS analytics tool — $2,400/mo revenue', time: 'just now', color: '#a855f7' },
            { type: 'sale', text: 'Deal closed: Content blog sold for $18,000', time: '2 min ago', color: '#34d399' },
            { type: 'listing', text: 'New listing: Newsletter with 4.2k subscribers', time: '5 min ago', color: '#818cf8' },
            { type: 'offer', text: 'New offer placed on e-commerce store ($8,500)', time: '9 min ago', color: '#38bdf8' },
            { type: 'sale', text: 'Deal closed: Chrome extension sold for $3,200', time: '14 min ago', color: '#34d399' },
            { type: 'listing', text: 'New listing: Directory site — 22k monthly visitors', time: '18 min ago', color: '#a855f7' },
        ];

        function renderFeed(items) {
            const feed = document.getElementById('activityFeed');
            if (!feed) return;
            feed.innerHTML = items.map(item => `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:12px;animation:fadeIn .4s ease;">
                    <div style="width:8px;height:8px;border-radius:999px;background:${item.color};flex-shrink:0;"></div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.text}</div>
                    </div>
                    <div style="font-size:10px;color:var(--muted);flex-shrink:0;white-space:nowrap;">${item.time}</div>
                </div>
            `).join('');
            const count = document.getElementById('activityCount');
            if (count) count.innerHTML = '<div style="width:6px;height:6px;border-radius:999px;background:#34d399;animation:typingPulse 1.4s ease-in-out infinite;"></div> ' + items.length + ' recent events · Live';
        }

        // Try Firebase if available, fall back to mock
        function tryFirebase() {
            if (typeof firebase !== 'undefined' && firebase.database) {
                const ref = firebase.database().ref('activity').limitToLast(6);
                ref.on('value', snap => {
                    const items = [];
                    snap.forEach(child => items.unshift(child.val()));
                    if (items.length) renderFeed(items);
                    else renderFeed(FEED_ITEMS);
                });
            } else {
                renderFeed(FEED_ITEMS);
                // Simulate live updates
                let idx = 0;
                setInterval(() => {
                    const rotated = FEED_ITEMS.map((item, i) => ({
                        ...item,
                        time: i === 0 ? 'just now' : (i * 4 + idx * 2) + ' min ago'
                    }));
                    renderFeed(rotated);
                    idx = (idx + 1) % 5;
                }, 12000);
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryFirebase);
        } else {
            tryFirebase();
        }
    })();

(function(){
          var _platform = null;
          var _connected = {};   // { facebook: 'url', twitter: 'url', ... }

          var PLATFORMS = {
            facebook: {
              label:      'Facebook',
              subtitle:   'Connect your Facebook profile',
              accent:     '#1877F2',
              accentBg:   'rgba(24,119,242,0.15)',
              placeholder:'https://facebook.com/yourprofile',
              icon: '<svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5Z" stroke="#1877F2" stroke-width="1.3"/><path d="M10.5 5.5H9a1.5 1.5 0 0 0-1.5 1.5v1H10l-.5 2H7.5V13h-2v-3H4V8h1.5V7A3 3 0 0 1 8.5 4h2v1.5Z" fill="#1877F2"/></svg>',
            },
            twitter: {
              label:      'X / Twitter',
              subtitle:   'Connect your X profile',
              accent:     '#e7e7e7',
              accentBg:   'rgba(220,220,220,0.1)',
              placeholder:'https://x.com/yourhandle',
              icon: '<svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M2.5 2.5h3.4l2.5 3.5 3-3.5H13L9.5 7l4 6.5h-3.4L7.5 9.5 4.2 13.5H2.5l3.8-4.6L2.5 2.5Z" fill="#e7e7e7"/></svg>',
            },
            linkedin: {
              label:      'LinkedIn',
              subtitle:   'Connect your LinkedIn profile',
              accent:     '#0A66C2',
              accentBg:   'rgba(10,102,194,0.15)',
              placeholder:'https://linkedin.com/in/yourprofile',
              icon: '<svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5v7A2.5 2.5 0 0 1 11.5 14h-7A2.5 2.5 0 0 1 2 11.5v-7Z" stroke="#0A66C2" stroke-width="1.2"/><circle cx="5.5" cy="5.5" r=".75" fill="#0A66C2"/><path d="M5.5 7.5V11M8 7.5V11M8 9a2.5 2.5 0 0 1 5 0v2" stroke="#0A66C2" stroke-width="1.2" stroke-linecap="round"/></svg>',
            },
          };

          window.openSocialConnectModal = function(platform) {
            _platform = platform;
            var p   = PLATFORMS[platform];
            var mod = document.getElementById('socialConnectModal');
            var sheet = document.getElementById('socialConnectSheet');

            // Theme the sheet
            sheet.style.background = 'linear-gradient(160deg, #0e1612 0%, #0b1010 100%)';
            sheet.style.border     = '1.5px solid ' + p.accent + '33';

            // Icon
            var iconWrap = document.getElementById('scmIconWrap');
            iconWrap.style.background = p.accentBg;
            iconWrap.style.border     = '1.5px solid ' + p.accent + '44';
            iconWrap.innerHTML = p.icon;

            // Title / subtitle
            document.getElementById('scmTitle').textContent    = 'Connect ' + p.label;
            document.getElementById('scmSubtitle').textContent  = p.subtitle;
            document.getElementById('scmSubtitle').style.color  = p.accent + 'bb';

            // Connect button colour
            var btn = document.getElementById('scmConnectBtn');
            btn.style.background = p.accent;
            btn.style.color      = platform === 'twitter' ? '#000' : '#fff';

            // Input placeholder / focus colour
            window._scmAccent = p.accent + '88';
            document.getElementById('scmInput').placeholder = p.placeholder;
            document.getElementById('scmLabel').textContent  = p.label + ' profile URL';

            // Hide error
            document.getElementById('scmError').style.display = 'none';

            var alreadyConnected = _connected[platform];
            if (alreadyConnected) {
              // Show connected state
              document.getElementById('scmInputWrap').style.display    = 'none';
              document.getElementById('scmConnectBtn').style.display   = 'none';
              document.getElementById('scmConnectedState').style.display = 'flex';
              document.getElementById('scmConnectedUrl').textContent    = alreadyConnected;
            } else {
              document.getElementById('scmInputWrap').style.display    = 'flex';
              document.getElementById('scmConnectBtn').style.display   = 'block';
              document.getElementById('scmConnectedState').style.display = 'none';
              document.getElementById('scmInput').value = '';
            }

            mod.style.display = 'flex';
            setTimeout(function(){ document.getElementById('scmInput').focus(); }, 80);
          };

          window.closeSocialConnectModal = function() {
            document.getElementById('socialConnectModal').style.display = 'none';
            _platform = null;
          };

          window.doSocialConnect = function() {
            var input = document.getElementById('scmInput');
            var url   = input.value.trim();
            var err   = document.getElementById('scmError');

            if (!url) {
              showScmError('Please enter a URL');
              return;
            }
            // Basic URL check
            if (!/^https?:\/\/.+\..+/.test(url)) {
              showScmError('Enter a valid URL starting with https://');
              return;
            }
            // Platform-specific check
            var p = PLATFORMS[_platform];
            var domains = { facebook: 'facebook.com', twitter: ['x.com','twitter.com'], linkedin: 'linkedin.com' };
            var allowed = domains[_platform];
            var ok = Array.isArray(allowed) ? allowed.some(function(d){ return url.includes(d); }) : url.includes(allowed);
            if (!ok) {
              showScmError('Please enter a valid ' + p.label + ' URL');
              return;
            }

            // Save
            _connected[_platform] = url;
            updateSocialRow(_platform, url);
            saveSocialToFirebase(_platform, url);
            closeSocialConnectModal();
            showSocialToast('<svg width="11" height="11" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:2px;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' + p.label + ' connected', p.accent);
          };

          window.doSocialDisconnect = function() {
            if (!_platform) return;
            var p = PLATFORMS[_platform];
            delete _connected[_platform];
            updateSocialRow(_platform, null);
            removeSocialFromFirebase(_platform);
            closeSocialConnectModal();
            showSocialToast(_platform.charAt(0).toUpperCase()+_platform.slice(1) + ' disconnected', '#888');
          };

          function updateSocialRow(platform, url) {
            var btn = document.getElementById('socialBtn-' + platform);
            var sub = document.getElementById('socialSub-' + platform);
            if (!btn || !sub) return;
            if (url) {
              sub.textContent = url.replace(/^https?:\/\/(www\.)?/,'').split('/')[0];
              sub.style.color = '#a8ff6b';
              btn.textContent = 'Connected';
              btn.style.color = '#a8ff6b';
              btn.style.background = 'rgba(168,255,107,0.12)';
              btn.style.border = '1px solid rgba(168,255,107,0.3)';
            } else {
              sub.textContent = 'Not connected';
              sub.style.color = '';
              btn.textContent = 'Connect';
              btn.style.color = 'var(--lime)';
              btn.style.background = 'rgba(168,255,107,0.1)';
              btn.style.border = '1px solid rgba(168,255,107,0.2)';
            }
          }

          function showScmError(msg) {
            var el = document.getElementById('scmError');
            el.textContent = msg;
            el.style.display = 'block';
            var input = document.getElementById('scmInput');
            input.style.borderColor = '#ff6b6b';
            setTimeout(function(){ input.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.display='none'; }, 2800);
          }

          function showSocialToast(msg, color) {
            var t = document.createElement('div');
            t.innerHTML = msg;
            t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:'+(color||'#30d158')+';color:'+(color==='#e7e7e7'?'#000':'#fff')+';padding:10px 20px;border-radius:999px;font-family:Syne,sans-serif;font-weight:700;font-size:13px;z-index:999999;pointer-events:none;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.5);opacity:0;transition:opacity .25s;display:flex;align-items:center;gap:6px;justify-content:center;';
            document.body.appendChild(t);
            requestAnimationFrame(function(){ t.style.opacity='1'; });
            setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },300); }, 2600);
          }

          function saveSocialToFirebase(platform, url) {
            try {
              var uid = (window._auth&&window._auth.currentUser&&window._auth.currentUser.uid)
                     || (window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid);
              var db  = window._fbDb; var fns = window._fbDbFns;
              if (!uid||!db||!fns||!fns.ref||!fns.update) return;
              var upd = {}; upd['social_' + platform] = url;
              fns.update(fns.ref(db, 'users/' + uid), upd);
            } catch(e){}
          }

          function removeSocialFromFirebase(platform) {
            try {
              var uid = (window._auth&&window._auth.currentUser&&window._auth.currentUser.uid)
                     || (window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid);
              var db  = window._fbDb; var fns = window._fbDbFns;
              if (!uid||!db||!fns||!fns.ref||!fns.update) return;
              var upd = {}; upd['social_' + platform] = null;
              fns.update(fns.ref(db, 'users/' + uid), upd);
            } catch(e){}
          }

          // Load saved socials when Firebase user data becomes available
          (function pollSocials(){
            if (window._fbUserData) {
              ['facebook','twitter','linkedin'].forEach(function(p){
                var val = window._fbUserData['social_' + p];
                if (val) { _connected[p] = val; updateSocialRow(p, val); }
              });
            } else {
              setTimeout(pollSocials, 900);
            }
          })();

        })();

window.calcFeePreview=function(){
            var val=parseFloat(document.getElementById('feeCalcInput').value)||1000;
            var rate=parseFloat(document.getElementById('feeCalcPlan').value)||0.30;
            var fee=val*rate;var pp=(val-fee)*0.0349+0.49;var net=val-fee-pp;
            var fmt=function(v){return '$'+(v<0?'0':v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));};
            document.getElementById('fcSalePrice').textContent=fmt(val);
            document.getElementById('fcFee').textContent='-'+fmt(fee);
            document.getElementById('fcPaypal').textContent='-'+fmt(pp);
            document.getElementById('fcNet').textContent=fmt(Math.max(0,net));
          };
          calcFeePreview();
          // Auto-set plan dropdown to user's current plan
          (function(){function setPlan(){var p=(window._fbUserData&&window._fbUserData.plan)||'Free';var m={Free:'0.30',Starter:'0.15',Growth:'0.10',Pro:'0.05'};var sel=document.getElementById('feeCalcPlan');if(sel&&m[p]){sel.value=m[p];calcFeePreview();}}if(window._fbUserData)setPlan();else setTimeout(setPlan,1200);})();

// Listing preferences — persist to users/{uid}/listingPrefs in Firebase.
          // (Previously these onclick/onchange handlers called functions that were
          // never defined anywhere, so every toggle and multiplier button was a no-op.)
          window.saveListingPref = function(key, val) {
            var u = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || (window._fbUserData && window._fbUserData.uid);
            if (!u || !window._fbDb || !window._fbDbFns) return;
            var upd = {}; upd[key] = val;
            window._fbDbFns.update(window._fbDbFns.ref(window._fbDb, 'users/' + u + '/listingPrefs'), upd).catch(function(){});
          };
          window.setMultPref = function(mult, btn) {
            document.querySelectorAll('.lp-mult-btn').forEach(function(b) {
              var active = (b === btn);
              b.classList.toggle('active', active);
              b.style.background    = active ? 'rgba(168,255,107,0.15)' : 'var(--surface2)';
              b.style.borderColor    = active ? 'rgba(168,255,107,0.4)' : 'var(--border)';
              b.style.color          = active ? 'var(--lime)'          : 'var(--text-dim)';
            });
            window.saveListingPref('defaultMultiplier', mult);
          };

window.calcROI=function(){
            var price=parseFloat(document.getElementById('roiPrice').value)||5000;
            var mrr=parseFloat(document.getElementById('roiMRR').value)||500;
            var cost=parseFloat(document.getElementById('roiCost').value)||50;
            var profit=mrr-cost;
            var payback=profit>0?Math.ceil(price/profit):999;
            var annual=profit*12;
            var roi=price>0?((annual/price)*100).toFixed(0)+'%':'—';
            var mult=profit>0?(price/profit).toFixed(1)+'×':'—';
            var pb=payback>=99?'∞':payback+'mo';
            document.getElementById('roiPayback').textContent=pb;
            document.getElementById('roiAnnual').textContent='$'+Math.max(0,annual).toLocaleString();
            document.getElementById('roiROI').textContent=roi;
            document.getElementById('roiMultiple').textContent=mult;
          };
          calcROI();

(function(){
          var ITEMS=[
            {k:'dd_traffic',l:'Verify traffic via GA/analytics screenshot'},
            {k:'dd_revenue',l:'Confirm revenue with Stripe / PayPal statements'},
            {k:'dd_domain',l:'Check domain age, expiry & registrar'},
            {k:'dd_backlinks',l:'Review backlink profile (Ahrefs / SEMrush)'},
            {k:'dd_penalties',l:'Check for Google penalties (Search Console)'},
            {k:'dd_ip',l:'Seller owns all assets, code & IP'},
            {k:'dd_pl',l:'Request 12-month P&L statement'},
            {k:'dd_features',l:'Test all critical product features personally'},
            {k:'dd_churn',l:'Review customer churn rate (SaaS)'},
            {k:'dd_infra',l:'Verify hosting & infrastructure costs'},
            {k:'dd_handover',l:'Agree on transition / handover terms'},
            {k:'dd_legal',l:'Confirm no pending lawsuits or disputes'}
          ];
          function getChecked(){try{return JSON.parse(localStorage.getItem('dd_support_checklist')||'{}');}catch(e){return{};}}
          function saveChecked(c){try{localStorage.setItem('dd_support_checklist',JSON.stringify(c));}catch(e){}}
          function renderDD(){
            var c=getChecked();var el=document.getElementById('ddSupportChecklist');if(!el)return;
            var done=Object.values(c).filter(Boolean).length;
            el.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="flex:1;height:5px;background:var(--border);border-radius:999px;overflow:hidden;"><div style="height:100%;width:'+(done/ITEMS.length*100)+'%;background:var(--lime);border-radius:999px;transition:width .3s;"></div></div><span style="font-size:11px;font-weight:700;color:var(--lime);flex-shrink:0;">'+done+'/'+ITEMS.length+'</span></div>'
              +ITEMS.map(function(item){
                var chk=!!c[item.k];
                return '<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;border:1px solid '+(chk?'rgba(168,255,107,0.2)':'var(--border)')+';background:'+(chk?'rgba(168,255,107,0.05)':'transparent')+';cursor:pointer;" onclick="toggleDD(\''+item.k+'\')">'
                  +'<div style="width:18px;height:18px;border-radius:5px;border:1.5px solid '+(chk?'var(--lime)':'rgba(255,255,255,0.15)')+';background:'+(chk?'rgba(168,255,107,0.15)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
                  +(chk?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="var(--lime)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')
                  +'</div><span style="font-size:11.5px;color:'+(chk?'var(--text-faint)':'var(--text)')+';'+(chk?'text-decoration:line-through;':'')+'">'+item.l+'</span></div>';
              }).join('');
          }
          window.toggleDD=function(k){var c=getChecked();c[k]=!c[k];saveChecked(c);renderDD();};
          window.resetDDChecklist=function(){saveChecked({});renderDD();};
          renderDD();
        })();

function calcValuation(){var rev=parseFloat(document.getElementById("calcRevenue").value)||0,prof=parseFloat(document.getElementById("calcProfit").value)||0,type=document.getElementById("calcType").value;if(!prof&&!rev){document.getElementById("calcResult").style.display="none";return;}var multiples={content:[24,36],saas:[36,60],ecom:[24,40],affiliate:[20,32],newsletter:[18,28],tool:[12,24]},lo=multiples[type][0],hi=multiples[type][1],base=prof||rev*0.4,low=(base*lo).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),high=(base*hi).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});document.getElementById("calcLow").textContent=low+" – "+high;document.getElementById("calcMultiple").textContent=lo+"×–"+hi+"× monthly profit multiple";document.getElementById("calcResult").style.display="block";}

(function(){var items=[["Verify traffic via GA screenshot","ga"],["Check revenue with Stripe/PayPal statements","rev"],["Confirm domain age &amp; expiry","dom"],["Review backlink profile (Ahrefs/SEMrush)","links"],["Check for Google penalties","seo"],["Confirm seller owns all assets &amp; IP","ip"],["Ask for 12-month P&amp;L statement","pl"],["Test all critical product features","feat"],["Review customer churn rate (SaaS)","churn"],["Verify hosting &amp; infra costs","infra"],["Ask for seller transition support terms","trans"],["Confirm no pending lawsuits","legal"]];var el=document.getElementById("ddChecklist");if(!el)return;var checked={};try{checked=JSON.parse(localStorage.getItem("dd_checklist")||"{}");}catch(e){}items.forEach(function(item){var label=item[0],key=item[1],c=!!checked[key];var row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid "+(c?"rgba(52,211,153,0.2)":"var(--border)")+";border-radius:10px;padding:10px 12px;cursor:pointer;transition:.15s;";row.innerHTML='<div style="width:18px;height:18px;border-radius:5px;border:1.5px solid '+(c?"#34d399":"rgba(255,255,255,0.15)")+';background:'+(c?"rgba(52,211,153,0.15)":"transparent")+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.15s;">'+(c?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#34d399" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':"")+'</div><span style="font-size:11px;color:'+(c?"rgba(139,138,168,0.55)":"var(--text)")+';'+(c?"text-decoration:line-through;":"")+'">'+ label +'</span>';row.addEventListener("click",function(){checked[key]=!checked[key];try{localStorage.setItem("dd_checklist",JSON.stringify(checked));}catch(e){}var nc=checked[key];row.style.borderColor=nc?"rgba(52,211,153,0.2)":"var(--border)";row.querySelector("div").style.borderColor=nc?"#34d399":"rgba(255,255,255,0.15)";row.querySelector("div").style.background=nc?"rgba(52,211,153,0.15)":"transparent";row.querySelector("div").innerHTML=nc?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#34d399" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':"";row.querySelector("span").style.color=nc?"rgba(139,138,168,0.55)":"var(--text)";row.querySelector("span").style.textDecoration=nc?"line-through":"";});el.appendChild(row);});})();

window.calcValuationROI=function(){var price=parseFloat(document.getElementById("vroiPrice").value)||0,profit=parseFloat(document.getElementById("vroiProfit").value)||0,growth=(parseFloat(document.getElementById("vroiGrowth").value)||0)/100;if(!price||!profit){document.getElementById("vroiResult").style.display="none";return;}var payback=Math.ceil(price/profit),annual=((profit*12)/price*100).toFixed(1),tot=0,p=profit;for(var i=0;i<36;i++){tot+=p;p*=(1+growth);}var net3=tot-price;document.getElementById("vroiPayback").textContent=payback+"mo";document.getElementById("vroiAnnual").textContent=annual+"%";document.getElementById("vroi3yr").textContent=(net3>=0?"+":"")+net3.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});document.getElementById("vroi3yr").style.color=net3>=0?"#00cfaa":"#f87171";document.getElementById("vroiResult").style.display="block";}

// ─── Page / nav switching ───────────────────────────────
    window.showPage = function(name){
      document.querySelectorAll('#dashModal .dm-page').forEach(function(p){ p.classList.add('hidden'); });
      document.querySelectorAll('#dashModal .dm-navswitch-item').forEach(function(i){ i.classList.remove('active'); });
      var page = document.getElementById('dmPage-' + name);
      var nav  = document.getElementById('dmNav-' + name);
      if (page) page.classList.remove('hidden');
      if (nav) nav.classList.add('active');
      var scroll = document.querySelector('#dashModal .dm-scroll');
      if (scroll) scroll.scrollTop = 0;
      var balance = document.querySelector('#dashModal .dm-balance');
      if (balance) balance.style.display = name === 'profile' ? '' : 'none';
    };

    // ─── Password show/hide ──────────────────────────────────
    window.togglePw = function(id){
      var input = document.getElementById(id);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    };

    // ─── Bio character counter ───────────────────────────────
    (function(){
      var bio = document.getElementById('accBio');
      var count = document.getElementById('accBioCount');
      if (bio && count) {
        count.textContent = bio.value.length;
        bio.addEventListener('input', function(){ count.textContent = this.value.length; });
      }
    })();

    // ─── Live password match hint ────────────────────────────
    (function(){
      var p1 = document.getElementById('accPassword');
      var p2 = document.getElementById('accPasswordConfirm');
      var hint = document.getElementById('pwMatchHint');
      if (!p1 || !p2 || !hint) return;
      function check(){
        var v1 = p1.value, v2 = p2.value;
        if (!v1 && !v2) { hint.textContent = ''; hint.className = 'dm-hint'; return; }
        if (v1 && v2 && v1 === v2) { hint.textContent = 'Passwords match'; hint.className = 'dm-hint good'; }
        else if (v2) { hint.textContent = "Passwords don't match yet"; hint.className = 'dm-hint bad'; }
        else { hint.textContent = ''; hint.className = 'dm-hint'; }
      }
      p1.addEventListener('input', check);
      p2.addEventListener('input', check);
    })();

    // ─── Time-of-day greeting label ──────────────────────────
    (function(){
      var label = document.getElementById('dashGreetingLabel');
      if (!label) return;
      var h = new Date().getHours();
      label.textContent = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    })();

// PayPal fee: 3.49% + $0.49
        function calcFee(amount) {
            const fee = parseFloat((amount * 0.0349 + 0.49).toFixed(2));
            const total = parseFloat((amount + fee).toFixed(2));
            return { credit: amount, fee, total };
        }

        let tuCurrentAmount = 10;
        let ppButtonsRendered = false;

        function onTuInput(val) {
            let v = parseFloat(val) || 0;
            if (v < 10) v = 10;
            v = Math.round(v);
            tuCurrentAmount = v;
            document.getElementById('tuAmountDisplay').textContent = v;
            // clear active pill
            document.querySelectorAll('.tu-pill').forEach(p => {
                p.classList.toggle('active', parseFloat(p.textContent.replace('$','')) === v);
            });
            updateFeeDisplay(v);
            rerenderPayPal(v);
        }

        function setAmount(val, pill) {
            tuCurrentAmount = val;
            document.getElementById('tuAmountDisplay').textContent = val;
            document.getElementById('tuHiddenInput').value = val;
            document.querySelectorAll('.tu-pill').forEach(p => p.classList.remove('active'));
            if (pill) pill.classList.add('active');
            updateFeeDisplay(val);
            rerenderPayPal(val);
        }

        function updateFeeDisplay(amount) {
            const { credit, fee, total } = calcFee(amount);
            document.getElementById('tuFeeCredit').textContent = '$' + credit.toFixed(2);
            document.getElementById('tuFeeAmount').textContent = '$' + fee.toFixed(2);
            document.getElementById('tuFeeTotal').textContent = '$' + total.toFixed(2);
        }

        // toggleFaq is handled by window.toggleFaq (defined globally)

        let ppRenderTimeout;
        function rerenderPayPal(amount) {
            clearTimeout(ppRenderTimeout);
            ppRenderTimeout = setTimeout(() => {
                const container = document.getElementById('paypal-button-container');
                container.innerHTML = '';
                renderPayPalButton(amount);
            }, 300);
        }

        function renderPayPalButton(amount) {
            if (typeof paypalCapture === 'undefined') return;
            const container = document.getElementById('paypal-button-container');
            container.innerHTML = ''; // clear placeholder
            const { total } = calcFee(amount);
            paypalCapture.Buttons({
                style: {
                    layout: 'vertical',
                    color:  'gold',
                    shape:  'pill',
                    label:  'pay',
                    height: 48
                },
                createOrder: function(data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            description: 'Siterifty Wallet Top-Up',
                            amount: {
                                value: calcFee(tuCurrentAmount).total.toFixed(2),
                                currency_code: 'USD'
                            }
                        }]
                    });
                },
                onApprove: async function(data, actions) {
                    try {
                        // Capture server-side via our API — never trust the client amount
                        const user = window._fbAuth && window._fbAuth.currentUser;
                        if (!user) throw new Error('Not signed in');
                        const idToken = await user.getIdToken();
                        const resp = await fetch('/api/wallet/topup', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + idToken
                            },
                            body: JSON.stringify({ orderId: data.orderID })
                        });
                        const result = await resp.json();
                        if (!resp.ok) throw new Error(result.error || 'Top-up failed');
                        // Update UI with server-confirmed balance
                        const wpEl = document.getElementById('walletPillAmount');
                        if (wpEl) { wpEl.classList.remove('skel'); wpEl.textContent = fmtBal(result.balance); }
                        const wmEl = document.getElementById('wmBalanceAmount');
                        if (wmEl) wmEl.textContent = fmtBal(result.balance);
                        showSuccessResult(tuCurrentAmount);
                    } catch(e) {
                        console.error('[topup onApprove]', e);
                        showFailResult(e.message || 'Payment capture failed. Please contact support.');
                    }
                },
                onCancel: function() {
                    // User closed PayPal — not a failure, do nothing
                },
                onError: function(err) {
                    console.error('PayPal error', err);
                    showFailResult('Payment failed. Please check your details and try again.');
                }
            }).render('#paypal-button-container');
        }

        // Pre-render as soon as the PayPal SDK script fires onload
        (function waitForPayPal() {
            if (typeof paypalCapture !== 'undefined') {
                renderPayPalButton(tuCurrentAmount);
                ppButtonsRendered = true;
            } else {
                const sdkScript = document.getElementById('paypalCaptureSDK');
                if (sdkScript) {
                    sdkScript.addEventListener('load', function() {
                        // Give SDK a tick to initialise
                        setTimeout(function() {
                            renderPayPalButton(tuCurrentAmount);
                            ppButtonsRendered = true;
                        }, 80);
                    });
                } else {
                    // fallback poll
                    const iv = setInterval(function() {
                        if (typeof paypalCapture !== 'undefined') {
                            clearInterval(iv);
                            renderPayPalButton(tuCurrentAmount);
                            ppButtonsRendered = true;
                        }
                    }, 200);
                }
            }
        })();

        // creditUserWallet removed — balance is updated from the /api/wallet/topup server response only.

        window.openTopUpModal = function() {
            // Must be logged in
            if (window._fbAuth && !window._fbAuth.currentUser) {
                closeWalletModal();
                openAuthModal();
                return;
            }
            window.closeWalletModal();

            updateFeeDisplay(tuCurrentAmount);
            document.getElementById('topupOverlay').classList.add('open');
            lockBodyScroll();

            // Only render if SDK loaded but buttons haven't been rendered yet
            if (!ppButtonsRendered && typeof paypalCapture !== 'undefined') {
                renderPayPalButton(tuCurrentAmount);
                ppButtonsRendered = true;
            }
        };

        window.closeTopUpModal = function() {
            document.getElementById('topupOverlay').classList.remove('open');
            unlockBodyScroll();
        };

        window.openTransferModal = function() {
            window.closeWalletModal();
            // Reset fields
            var emailIn = document.getElementById('tfEmailInput');
            var amtIn   = document.getElementById('tfAmountInput');
            if (emailIn) emailIn.value = '';
            if (amtIn)   amtIn.value   = '';
            ['tfStep1Error','tfStep2Error','tfStep3Error'].forEach(function(id){
                var el = document.getElementById(id); if(el) el.textContent = '';
            });
            ['tfSendVal','tfFeeVal','tfTotalVal','tfCreditVal','tfNewBalVal'].forEach(function(id){
                var el = document.getElementById(id); if(el) el.textContent = '—';
            });
            // Show step 1
            [1,2,3,4].forEach(function(i){
                var s = document.getElementById('tfStep'+i);
                if(s) s.classList.toggle('active', i===1);
            });
            var sub = document.getElementById('tfHeaderSub');
            if(sub) sub.textContent = 'Send funds to another account';
            document.getElementById('transferOverlay').classList.add('open');
            if (window._lockBodyScroll) window._lockBodyScroll();
            setTimeout(function(){ var el = document.getElementById('tfEmailInput'); if(el) el.focus(); }, 100);
        };

        window.closeTransferModal = function() {
            document.getElementById('transferOverlay').classList.remove('open');
            if (window._unlockBodyScroll) window._unlockBodyScroll();
        };

        //  Transfer step functions 
        var _tfRecipient = null;
        var _tfAmount    = 0;
        var TF_FEE_RATE  = 0.03;

        function tfUsd(n) { return '$' + parseFloat(n).toFixed(2); }
        function tfGetBalance() { return parseFloat((window._fbUserData && window._fbUserData.balance) || 0); }

        function tfShowStep(n) {
            [1,2,3,4].forEach(function(i){
                var s = document.getElementById('tfStep'+i);
                if(s) s.classList.toggle('active', i===1 ? i===n : i===n);
            });
            var subs = {1:'Send funds to another account',2:'Confirm recipient',3:'Review & confirm',4:''};
            var sub = document.getElementById('tfHeaderSub');
            if(sub) sub.textContent = subs[n] || '';
        }

        window.tfClearError = function() {
            var el = document.getElementById('tfStep1Error'); if(el) el.textContent='';
        };

        window.tfLookupEmail = async function() {
            var emailInput = document.getElementById('tfEmailInput');
            var btn   = document.getElementById('tfLookupBtn');
            var errEl = document.getElementById('tfStep1Error');
            var email = (emailInput.value||'').trim().toLowerCase();
            if(!email||!email.includes('@')){ errEl.textContent='Please enter a valid email address.'; return; }
            var user = window._fbAuth && window._fbAuth.currentUser;
            if(!user){ closeTransferModal(); openAuthModal(); return; }
            if(email===(user.email||'').toLowerCase()){ errEl.textContent='You cannot transfer to yourself.'; return; }
            btn.disabled=true; btn.textContent='Looking up...'; errEl.textContent='';
            try {
                var idToken = await user.getIdToken(true);
                var res = await fetch('/api/transfer',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+idToken},body:JSON.stringify({action:'transfer_lookup',recipientEmail:email})});
                var data = await res.json();
                if(!res.ok||data.error){ errEl.textContent=data.error||'Account not found.'; return; }
                _tfRecipient = {email:data.email,name:data.name||''};
                var initials = (_tfRecipient.name||_tfRecipient.email).charAt(0).toUpperCase();
                document.getElementById('tfAvatarEl').textContent       = initials;
                document.getElementById('tfRecipientName').textContent  = _tfRecipient.name||'(no display name)';
                document.getElementById('tfRecipientEmail').textContent = _tfRecipient.email;
                document.getElementById('tfAmountInput').value='';
                ['tfSendVal','tfFeeVal','tfTotalVal','tfCreditVal','tfNewBalVal'].forEach(function(id){document.getElementById(id).textContent='—';});
                tfShowStep(2);
                setTimeout(function(){ var a=document.getElementById('tfAmountInput'); if(a) a.focus(); },100);
            } catch(e){ errEl.textContent='Network error. Please try again.'; }
            finally { btn.disabled=false; btn.textContent='Look Up Account'; }
        };

        window.tfUpdateFees = function() {
            var raw   = parseFloat(document.getElementById('tfAmountInput').value)||0;
            var errEl = document.getElementById('tfStep2Error');
            if(raw<=0){ ['tfSendVal','tfFeeVal','tfTotalVal','tfCreditVal','tfNewBalVal'].forEach(function(id){document.getElementById(id).textContent='—';}); errEl.textContent=''; return; }
            if(raw<1) errEl.textContent='Minimum $1.00';
            else if(raw>1000) errEl.textContent='Maximum $1,000.00';
            else errEl.textContent='';
            var fee=parseFloat((raw*TF_FEE_RATE).toFixed(2)), total=parseFloat((raw+fee).toFixed(2)), bal=tfGetBalance(), newBal=parseFloat((bal-total).toFixed(2));
            document.getElementById('tfSendVal').textContent  =tfUsd(raw);
            document.getElementById('tfFeeVal').textContent   =tfUsd(fee);
            document.getElementById('tfTotalVal').textContent =tfUsd(total);
            document.getElementById('tfCreditVal').textContent=tfUsd(raw);
            document.getElementById('tfNewBalVal').textContent=newBal>=0?tfUsd(newBal):'Insufficient balance';
            document.getElementById('tfNewBalVal').style.color=newBal<0?'#f87171':'rgba(185,183,220,0.8)';
        };

        window.tfBackToStep1 = function() { _tfRecipient=null; document.getElementById('tfStep2Error').textContent=''; tfShowStep(1); setTimeout(function(){var el=document.getElementById('tfEmailInput');if(el)el.focus();},100); };
        window.tfBackToStep2 = function() { document.getElementById('tfStep3Error').textContent=''; tfShowStep(2); };

        window.tfReview = function() {
            var raw=parseFloat(document.getElementById('tfAmountInput').value)||0;
            var errEl=document.getElementById('tfStep2Error'), bal=tfGetBalance();
            if(raw<1){errEl.textContent='Minimum $1.00';return;}
            if(raw>1000){errEl.textContent='Maximum $1,000.00';return;}
            var fee=parseFloat((raw*TF_FEE_RATE).toFixed(2)), total=parseFloat((raw+fee).toFixed(2));
            if(total>bal){errEl.textContent='Insufficient balance. You have '+tfUsd(bal)+' but need '+tfUsd(total)+'.';return;}
            errEl.textContent=''; _tfAmount=raw;
            var toDisplay=_tfRecipient.name?_tfRecipient.name+' ('+_tfRecipient.email+')':_tfRecipient.email;
            document.getElementById('tfConfirmAmount').textContent=tfUsd(raw);
            document.getElementById('tfConfirmTo').textContent=toDisplay;
            document.getElementById('tfConfirmFee').textContent=tfUsd(fee);
            document.getElementById('tfConfirmTotal').textContent=tfUsd(total);
            document.getElementById('tfConfirmCredit').textContent=tfUsd(raw);
            document.getElementById('tfStep3Error').textContent='';
            var wb=document.getElementById('tfWarningBox'); if(wb) wb.classList.remove('show');
            tfShowStep(3);
        };

        window.tfExecuteTransfer = async function() {
            var btn=document.getElementById('tfSendBtn'), errEl=document.getElementById('tfStep3Error');
            var user=window._fbAuth&&window._fbAuth.currentUser;
            if(!user){closeTransferModal();openAuthModal();return;}
            if(!_tfRecipient||!_tfAmount) return;
            btn.disabled=true; btn.textContent='Sending...'; errEl.textContent='';
            try {
                var idToken=await user.getIdToken(true);
                var res=await fetch('/api/transfer',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+idToken},body:JSON.stringify({action:'transfer',recipientEmail:_tfRecipient.email,amount:_tfAmount})});
                var data;
                try { data=await res.json(); } catch(jsonErr) {
                    // Server returned a non-JSON body (e.g. 500 HTML error page)
                    var statusText = res.status ? ('Server error ('+res.status+').') : 'Unexpected server response.';
                    errEl.textContent=statusText+' Please try again.';
                    btn.disabled=false; btn.textContent='Confirm & Send';
                    return;
                }
                if(!res.ok||data.error){errEl.textContent=data.error||'Transfer failed.';btn.disabled=false;btn.textContent='Confirm & Send';return;}
                if(window._fbUserData) window._fbUserData.balance=data.newBalance;
                var wp=document.getElementById('walletPillAmount'); if(wp) wp.textContent=fmtBal(data.newBalance);
                var recipDisp=(data.recipient&&data.recipient.name)?data.recipient.name:_tfRecipient.email;
                document.getElementById('tfSuccessMsg').innerHTML='<strong style="color:#fff;">'+tfUsd(data.amount)+'</strong> sent to <strong style="color:#fff;">'+recipDisp+'</strong>.<br>3% fee ('+tfUsd(data.fee)+') deducted.';
                document.getElementById('tfSuccessBalance').textContent=fmtBal(data.newBalance);
                var sw=document.getElementById('tfSuccessWarning'), st=document.getElementById('tfSuccessWarningText');
                if(data.warning){st.textContent=data.warning;sw.style.removeProperty('display');sw.classList.add('show');}
                else{sw.style.setProperty('display','none','important');}
                tfShowStep(4);
            } catch(e){
                // True network failure (offline, DNS, CORS, etc.)
                errEl.textContent='Network error: '+(e&&e.message?e.message:'Could not reach server.')+' Please check your connection and try again.';
                btn.disabled=false; btn.textContent='Confirm & Send';
            }
        };

        function showSuccessResult(amount) {
            closeTopUpModal();
            const result = document.getElementById('topupResult');
            const badge  = document.getElementById('trBadge');
            const cta    = document.getElementById('trCta');
            const cta2   = document.getElementById('trCta2');
            const emoji  = document.getElementById('trEmoji');
            const title  = document.getElementById('trTitle');
            const sub    = document.getElementById('trSub');

            emoji.innerHTML = '<svg width="44" height="44" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.4)" stroke-width="1.5"/><path d="M20 32l10 10 14-16" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            title.textContent = 'Balance Added!';
            badge.textContent = '+$' + amount.toFixed(2);
            badge.className = 'tr-amount-badge success';
            sub.textContent = 'Your wallet has been topped up. Happy selling on Siterifty!';
            cta.className = 'tr-cta success-cta';
            cta.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Go to Marketplace';
            cta.onclick = closeResult;
            cta2.style.display = 'none';
            document.getElementById('trCard').classList.remove('fail-mode');

            result.classList.add('open');
            lockBodyScroll();
            launchCoins();
        }

        function showFailResult(message) {
            closeTopUpModal();
            const result = document.getElementById('topupResult');
            const badge  = document.getElementById('trBadge');
            const cta    = document.getElementById('trCta');
            const cta2   = document.getElementById('trCta2');
            const emoji  = document.getElementById('trEmoji');
            const title  = document.getElementById('trTitle');
            const sub    = document.getElementById('trSub');

            emoji.innerHTML = '<svg width="44" height="44" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" fill="rgba(248,113,113,0.15)" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/><path d="M20 20l24 24M44 20L20 44" stroke="#f87171" stroke-width="3" stroke-linecap="round"/></svg>';
            title.textContent = 'Payment Failed';
            badge.textContent = 'Not charged';
            badge.className = 'tr-amount-badge fail';
            sub.textContent = message;
            cta.className = 'tr-cta fail-cta';
            cta.innerHTML = 'Try Again';
            cta.onclick = () => { closeResult(); openTopUpModal(); };
            cta2.style.display = 'block';
            cta2.textContent = 'Cancel';
            cta2.onclick = closeResult;
            document.getElementById('trCard').classList.add('fail-mode');

            result.classList.add('open');
            lockBodyScroll();
        }

        window.closeResult = function() {
            document.getElementById('topupResult').classList.remove('open');
            unlockBodyScroll();
        };

        function launchCoins() {
            const container = document.getElementById('trCoins');
            container.innerHTML = '';
            const coins = ['+','x','o','*','#','='];
            for (let i = 0; i < 18; i++) {
                const c = document.createElement('span');
                c.className = 'tr-coin';
                c.textContent = coins[Math.floor(Math.random() * coins.length)];
                c.style.color = ['#34d399','#a855f7','#818cf8','#38bdf8','#fbbf24'][Math.floor(Math.random()*5)];
                c.style.left = (5 + Math.random() * 90) + '%';
                c.style.top  = (-20 + Math.random() * 40) + '%';
                const dur = (0.8 + Math.random() * 1.2).toFixed(2);
                const delay = (Math.random() * 0.6).toFixed(2);
                c.style.animationDuration = dur + 's';
                c.style.animationDelay = delay + 's';
                c.style.fontSize = (14 + Math.random() * 14) + 'px';
                container.appendChild(c);
            }
        }

(function() {

        //  Plan limits (per hour) 
        const PLAN_LIMITS = { Free: 10, Starter: 100, Growth: 250, Pro: Infinity };

        //  VIP-locked topics — Free users get a teaser + upgrade prompt 
        // These keywords trigger a locked response for Free plan users
        const VIP_PATTERNS = [
            /\b(analytics|dashboard stats|revenue report|traffic report|buyer data|conversion rate|performance data)\b/i,
            /\b(bulk (list|manage|upload)|advanced (filter|sort|analytics))\b/i,
            /\b(account manager|dedicated support|priority queue|4.?hour|24.?7)\b/i,
            /\b(custom storefront|brand page|featured highlight|top placement)\b/i,
            /\b(hosting (plan|fee|infra)|serverless|admin (dashboard|panel))\b/i
        ];

        function isVipQuery(text) {
            return VIP_PATTERNS.some(p => p.test(text));
        }

        //  Hourly rate-limit helpers 
        const HOUR_MS = 60 * 60 * 1000;

        function _rateKey(uid) {
            const slot = Math.floor(Date.now() / HOUR_MS);
            return 'sr_chat_' + uid + '_' + slot;
        }

        function getHourlyCount(uid) {
            try { return parseInt(localStorage.getItem(_rateKey(uid)) || '0', 10); }
            catch(_) { return 0; }
        }

        function setHourlyCount(uid, n) {
            try { localStorage.setItem(_rateKey(uid), String(n)); }
            catch(_) {}
        }

        function msUntilReset() {
            return HOUR_MS - (Date.now() % HOUR_MS);
        }

        function fmtCountdown(ms) {
            const m = Math.ceil(ms / 60000);
            return m <= 1 ? 'less than a minute' : m + ' min';
        }

        //  Live countdown ticker in the ratebar 
        function fmtCountdownFull(ms) {
            const totalSec = Math.ceil(ms / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            return m > 0 ? m + 'm ' + String(s).padStart(2,'0') + 's' : s + 's';
        }

        //  Update the progress bar UI 
        function updateRatebar(uid, plan) {
            const bar   = document.getElementById('chatRatebar');
            const fill  = document.getElementById('chatRateFill');
            const label = document.getElementById('chatRateLabel');
            const note  = document.getElementById('chatResetNote');
            const upgBtn = document.getElementById('chatRateUpgradeBtn');
            if (!bar || !fill || !label) return;

            const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.Free;

            // Pro: show "Unlimited" bar permanently full in green
            if (!isFinite(limit)) {
                bar.style.display = 'flex';
                fill.style.width = '100%';
                fill.style.background = 'linear-gradient(90deg,#34d399,#38bdf8)';
                label.textContent = '∞ Unlimited';
                label.style.color = '#34d399';
                if (note) note.style.display = 'none';
                if (upgBtn) upgBtn.style.display = 'none';
                return;
            }

            bar.style.display = 'flex';
            const used = getHourlyCount(uid);
            const remaining = Math.max(limit - used, 0);
            const pct  = Math.min((used / limit) * 100, 100);
            fill.style.width = pct + '%';

            if (pct >= 100) {
                fill.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
                label.style.color = '#f87171';
                label.textContent = '0 left';
            } else if (pct >= 65) {
                fill.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
                label.style.color = '#fbbf24';
                label.textContent = remaining + ' left';
            } else {
                fill.style.background = 'linear-gradient(90deg,#a855f7,#818cf8)';
                label.style.color = 'var(--muted)';
                label.textContent = used + ' / ' + limit;
            }

            // Reset countdown — show when ≥50% used
            if (note) {
                if (pct >= 50) {
                    note.style.display = 'block';
                    note.textContent = 'Resets in ' + fmtCountdown(msUntilReset());
                } else {
                    note.style.display = 'none';
                }
            }

            // Upgrade button — show when ≥80% used and not already Pro
            if (upgBtn) {
                upgBtn.style.display = (pct >= 80 && plan !== 'Pro') ? 'inline-flex' : 'none';
            }
        }

        // Tick the countdown every 10s while panel is open
        let _ratebarTick = null;
        function startRatebarTick(uid, plan) {
            stopRatebarTick();
            updateRatebar(uid, plan);
            _ratebarTick = setInterval(() => {
                updateRatebar(uid, plan);
                // Also tick the reset note more precisely
                const note = document.getElementById('chatResetNote');
                const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.Free;
                if (note && isFinite(limit)) {
                    const used = getHourlyCount(uid);
                    const pct = Math.min((used / limit) * 100, 100);
                    if (pct >= 50) note.textContent = 'Resets in ' + fmtCountdownFull(msUntilReset());
                }
            }, 10000);
        }
        function stopRatebarTick() {
            if (_ratebarTick) { clearInterval(_ratebarTick); _ratebarTick = null; }
        }

        //  State 
        let _chatOpen    = false;
        let _chatHistory = [];
        let _chatBusy    = false;
        let _greeted     = false;

        //  Chat persistence helpers 
        function _chatStoreKey() {
            const uid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || null;
            return uid ? 'sr_chat_history_' + uid : null;
        }
        function saveChatHistory() {
            const key = _chatStoreKey();
            if (!key) return;
            try {
                const msgs = document.getElementById('chatMessages');
                localStorage.setItem(key, JSON.stringify({
                    history: _chatHistory.slice(-20),
                    html: msgs ? msgs.innerHTML : '',
                    ts: Date.now()
                }));
            } catch(_) {}
        }
        function loadChatHistory() {
            const key = _chatStoreKey();
            if (!key) return false;
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return false;
                const data = JSON.parse(raw);
                // Expire after 24 hours
                if (!data || !data.ts || (Date.now() - data.ts) > 86400000) {
                    localStorage.removeItem(key);
                    return false;
                }
                _chatHistory = data.history || [];
                const msgs = document.getElementById('chatMessages');
                if (msgs && data.html) {
                    msgs.innerHTML = data.html;
                    _greeted = true;
                    setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
                }
                return _chatHistory.length > 0;
            } catch(_) { return false; }
        }
        function clearChatHistory() {
            const key = _chatStoreKey();
            if (key) try { localStorage.removeItem(key); } catch(_) {}
            _chatHistory = [];
            _greeted = false;
        }

        //  Helpers 
        function $(id) { return document.getElementById(id); }

        function getUser() {
            const auth = window._fbAuth;
            if (!auth || !auth.currentUser) return null;
            const ud = window._fbUserData || {};
            return {
                uid:      auth.currentUser.uid,
                username: ud.username || auth.currentUser.email?.split('@')[0] || 'there',
                plan:     ud.plan || 'Free',
                email:    ud.email || auth.currentUser.email || ''
            };
        }

        function getMsgLimit(plan) {
            return PLAN_LIMITS[plan] ?? PLAN_LIMITS.Free;
        }

        function scrollChat() {
            const el = $('chatMessages');
            if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
        }

        function appendMessage(role, text) {
            const el = $('chatMessages');
            if (!el) return;
            const div = document.createElement('div');
            div.className = role === 'user' ? 'chat-msg-user' : 'chat-msg-ai';
            div.textContent = text;
            el.appendChild(div);
            scrollChat();
            saveChatHistory();
        }

        function appendSystem(html, isHTML) {
            const el = $('chatMessages');
            if (!el) return;
            const div = document.createElement('div');
            div.style.cssText = 'align-self:stretch;';
            if (isHTML) div.innerHTML = html;
            else {
                div.style.cssText += 'text-align:center;font-size:11px;color:var(--muted);padding:6px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.13);border-radius:999px;max-width:90%;align-self:center;line-height:1.5;';
                div.textContent = html;
            }
            el.appendChild(div);
            scrollChat();
        }

        function setTyping(on) {
            const t = $('chatTyping');
            if (t) t.style.display = on ? 'block' : 'none';
            if (on) scrollChat();
        }

        function setBusy(on) {
            _chatBusy = on;
            const btn = $('chatSendBtn');
            const inp = $('chatInput');
            if (btn) { btn.style.opacity = on ? '0.4' : '1'; btn.style.pointerEvents = on ? 'none' : ''; }
            if (inp && !inp.dataset.locked) inp.disabled = on;
        }

        function lockInput(msg) {
            const inp = $('chatInput');
            const btn = $('chatSendBtn');
            if (inp) { inp.disabled = true; inp.placeholder = msg; inp.dataset.locked = '1'; }
            if (btn) { btn.style.opacity = '0.25'; btn.style.pointerEvents = 'none'; }
        }

        //  Plan comparison cards shown when limit is hit 
        function buildPlanUpgradeCards(currentPlan) {
            const plans = [
                {
                    key:'starter', name:'Starter', price:'$20', color:'#a855f7',
                    msgs:'100 msg/hr',
                    perks:['100 messages / hour','15% platform fee','Priority search','Email support 24h','Basic analytics']
                },
                {
                    key:'growth', name:'Growth', price:'$40', color:'#818cf8', badge:'POPULAR',
                    msgs:'250 msg/hr',
                    perks:['250 messages / hour','10% platform fee','Featured highlights','Priority support 4h','Advanced analytics','Bulk management']
                },
                {
                    key:'pro', name:'Pro', price:'$50', color:'#38bdf8', badge:'BEST VALUE',
                    msgs:'Unlimited',
                    perks:['Unlimited messages','5% platform fee — lowest','Top search placement','Dedicated account manager','24/7 live chat','Custom storefront']
                }
            ];

            const resetIn = fmtCountdownFull(msUntilReset());

            let html = `
            <div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.2);border-radius:14px;padding:12px 14px;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f87171" stroke-width="1.3"/><path d="M7 4v3M7 9v.5" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/></svg>
                <span style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#f87171;">Hourly limit reached</span>
              </div>
              <div style="font-size:11px;color:rgba(248,113,113,0.7);line-height:1.5;">You've used all ${PLAN_LIMITS[currentPlan]||10} messages this hour on the <strong style="color:#f87171;">${currentPlan}</strong> plan. Free resets in <strong style="color:#f87171;" id="chatLimitCountdown">${resetIn}</strong>.</div>
            </div>
            <div style="font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;text-align:center;">Or upgrade for more messages</div>
            <div style="display:flex;flex-direction:column;gap:7px;">`;

            plans.forEach(p => {
                const isCurrent = p.name === currentPlan;
                if (isCurrent) return;
                html += `
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(${p.color === '#a855f7' ? '168,85,247' : p.color === '#818cf8' ? '129,140,248' : '56,189,248'},0.2);border-radius:12px;padding:11px 12px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:7px;">
                      <span style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:${p.color};">${p.name}</span>
                      ${p.badge ? `<span style="font-size:9px;font-weight:700;letter-spacing:.07em;padding:2px 7px;border-radius:999px;background:rgba(${p.color === '#818cf8' ? '129,140,248' : '56,189,248'},0.15);border:1px solid rgba(${p.color === '#818cf8' ? '129,140,248' : '56,189,248'},0.3);color:${p.color};">${p.badge}</span>` : ''}
                    </div>
                    <div style="text-align:right;">
                      <span style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:${p.color};">${p.price}</span>
                      <span style="font-size:10px;color:var(--muted);">/mo</span>
                    </div>
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px;">
                    ${p.perks.slice(0,4).map(k => `<span style="font-size:10px;color:var(--muted);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.13);border-radius:999px;padding:2px 8px;white-space:nowrap;"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg> ${k}</span>`).join('')}
                  </div>
                  <button onclick="toggleChat();openPlansPickerModal();setTimeout(()=>showPlanTab('${p.key}'),80);" style="width:100%;padding:8px;border-radius:9px;background:linear-gradient(135deg,${p.color},${p.color === '#a855f7' ? '#818cf8' : p.color === '#818cf8' ? '#a855f7' : '#a855f7'});color:#fff;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;border:none;cursor:pointer;touch-action:manipulation;transition:opacity .15s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                    Upgrade to ${p.name} →
                  </button>
                </div>`;
            });

            html += `</div>`;
            return html;
        }

        //  VIP locked card shown to Free users asking advanced questions 
        function buildVipLockedCard() {
            return `
            <div style="background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(129,140,248,0.05));border:1px solid rgba(168,85,247,0.25);border-radius:14px;padding:13px 14px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
                <div style="width:26px;height:26px;border-radius:8px;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="5" width="8" height="6" rx="1.2" stroke="#a855f7" stroke-width="1.2"/><path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="#a855f7" stroke-width="1.2" stroke-linecap="round"/></svg>
                </div>
                <div>
                  <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#a855f7;">Pro Feature</div>
                  <div style="font-size:10px;color:var(--muted);">Available on Starter and above</div>
                </div>
              </div>
              <div style="font-size:11.5px;color:rgba(241,240,255,0.75);line-height:1.55;margin-bottom:10px;">This information is only available to paid plan members. Upgrade to unlock advanced analytics, performance data, and more from your AI assistant.</div>
              <div style="display:flex;gap:6px;">
                <button onclick="toggleChat();openPlansPickerModal()" style="flex:1;padding:8px 10px;border-radius:9px;background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(129,140,248,0.15));border:1px solid rgba(168,85,247,0.35);color:#f1f0ff;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;touch-action:manipulation;transition:opacity .15s;" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">View all plans — Starter · Growth · Pro</button>
              </div>
            </div>`;
        }

        //  Show login wall 
        function showLoginWall() {
            const el = $('chatMessages');
            if (!el) return;
            el.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:24px;text-align:center;';
            wrap.innerHTML =
                '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="19" stroke="rgba(168,85,247,0.3)" stroke-width="1.5"/><path d="M20 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" stroke="#a855f7" stroke-width="1.4"/><path d="M8 34c0-6.627 5.373-10 12-10s12 3.373 12 10" stroke="#a855f7" stroke-width="1.4" stroke-linecap="round"/></svg>' +
                '<div style="font-family:\'Syne\',sans-serif;font-size:14px;font-weight:700;color:#f1f0ff;">Sign in to chat</div>' +
                '<div style="font-size:12px;color:var(--muted);line-height:1.6;">Chat support is available to registered users only. Sign in or create a free account to continue.</div>' +
                '<button onclick="toggleChat();openAuthModal();" style="padding:10px 22px;border-radius:10px;background:linear-gradient(135deg,#a855f7,#818cf8);color:#fff;font-family:\'Syne\',sans-serif;font-size:13px;font-weight:700;border:none;cursor:pointer;touch-action:manipulation;">Sign in / Register</button>';
            el.appendChild(wrap);
            lockInput('Sign in to send messages');
        }

        //  Greeting 
        function showGreeting(user) {
            if (_greeted) return;
            _greeted = true;
            const limit   = getMsgLimit(user.plan);
            const hasLimit = isFinite(limit);
            const planColor = { Free:'#8b8aa8', Starter:'#a855f7', Growth:'#818cf8', Pro:'#34d399' }[user.plan] || '#8b8aa8';
            const planLabel = (user.plan||'Free').charAt(0).toUpperCase() + (user.plan||'Free').slice(1);

            const el = $('chatMessages');
            if (!el) return;

            const card = document.createElement('div');
            card.style.cssText = 'display:flex;flex-direction:column;gap:0;animation:fadeIn .35s ease both;';
            card.innerHTML = `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(129,140,248,0.15));border:1px solid rgba(168,85,247,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                    <rect x="11.5" y="2" width="2.5" height="8.5" rx="1.25" fill="url(#cgg)" transform="rotate(0,14,14)" opacity=".9"/>
                    <rect x="11.5" y="2" width="2.5" height="8.5" rx="1.25" fill="url(#cgg)" transform="rotate(72,14,14)" opacity=".7"/>
                    <rect x="11.5" y="2" width="2.5" height="8.5" rx="1.25" fill="url(#cgg)" transform="rotate(144,14,14)" opacity=".5"/>
                    <rect x="11.5" y="2" width="2.5" height="8.5" rx="1.25" fill="url(#cgg)" transform="rotate(216,14,14)" opacity=".3"/>
                    <rect x="11.5" y="2" width="2.5" height="8.5" rx="1.25" fill="url(#cgg)" transform="rotate(288,14,14)" opacity=".15"/>
                    <circle cx="14" cy="14" r="2.5" fill="#818cf8"/>
                    <defs><linearGradient id="cgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>
                  </svg>
                </div>
                <div>
                  <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#f1f0ff;line-height:1.2;">Siterifty Assistant</div>
                  <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                    <div style="width:6px;height:6px;border-radius:50%;background:#34d399;flex-shrink:0;"></div>
                    <span style="font-size:10px;color:#34d399;font-weight:500;">Online</span>
                  </div>
                </div>
              </div>

              <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);border-radius:16px 16px 16px 4px;padding:12px 14px;font-size:13px;color:#f1f0ff;line-height:1.55;margin-bottom:10px;">
                Hey <strong style="color:#f1f0ff;">${user.username}</strong> — I'm your Siterifty assistant. I can help with listings, plans, billing, or anything about the platform.
              </div>

              <div style="align-self:flex-start;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:4px 10px;margin-bottom:12px;">
                <div style="width:6px;height:6px;border-radius:50%;background:${planColor};flex-shrink:0;"></div>
                <span style="font-size:10.5px;color:var(--muted);font-weight:500;">${planLabel} plan · ${hasLimit ? `<span style="color:${planColor}">${limit} msg/hr</span>` : '<span style="color:#34d399">Unlimited</span>'}</span>
                ${user.plan === 'Free' ? `<span style="font-size:10px;color:rgba(168,85,247,0.7);margin-left:2px;">· <span style="cursor:pointer;text-decoration:underline;" onclick="toggleChat();openPlansPickerModal()">Upgrade</span></span>` : ''}
              </div>

              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${[
                  ['<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 4h5M4 6.5h5M4 9h3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>', 'List a site'],
                  ['<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 8.5l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>', 'Browse listings'],
                  ['<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M1 6h11" stroke="currentColor" stroke-width="1.1"/><rect x="3" y="7.5" width="3" height="1" rx=".5" fill="currentColor"/></svg>', 'Plans & pricing'],
                  ['<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="3" y="6" width="7" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6V4a2 2 0 0 1 4 0v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>', 'How escrow works'],
                ].map(([icon, label]) => `
                  <button onclick="(function(){const i=document.getElementById('chatInput');if(i){i.value='${label}';i.dispatchEvent(new Event('input'));i.focus();}sendChatMessage&&sendChatMessage();})()" style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:5px 11px;font-size:11.5px;color:rgba(241,240,255,0.7);cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s,color .15s;white-space:nowrap;" onmouseenter="this.style.background='rgba(255,255,255,0.1)';this.style.color='#f1f0ff'" onmouseleave="this.style.background='rgba(255,255,255,0.05)';this.style.color='rgba(241,240,255,0.7)'">${icon} ${label}</button>
                `).join('')}
              </div>
            `;
            el.appendChild(card);
            scrollChat();
        }

        //  Check and handle limit 
        function checkAndShowLimitWarning(user) {
            const limit = getMsgLimit(user.plan);
            if (!isFinite(limit)) return false;
            const used      = getHourlyCount(user.uid);
            const remaining = limit - used;

            if (remaining <= 0) {
                // Show rich upgrade cards
                appendSystem(buildPlanUpgradeCards(user.plan), true);
                lockInput('Limit reached — upgrade or wait ' + fmtCountdown(msUntilReset()));
                // Start live countdown inside the cards
                _startLimitCountdownTicker();
                return true;
            }
            if (remaining <= Math.max(2, Math.floor(limit * 0.05))) {
                appendSystem(`${remaining} message${remaining === 1 ? '' : 's'} left this hour · <span style="cursor:pointer;color:#a855f7;text-decoration:underline;" onclick="toggleChat();openPlansPickerModal()">Upgrade for more</span>`, true);
            }
            updateRatebar(user.uid, user.plan);
            return false;
        }

        // Ticker for the countdown inside the limit-reached card
        let _limitCountdownTick = null;
        function _startLimitCountdownTicker() {
            if (_limitCountdownTick) return;
            _limitCountdownTick = setInterval(() => {
                const el = document.getElementById('chatLimitCountdown');
                if (el) el.textContent = fmtCountdownFull(msUntilReset());
                else { clearInterval(_limitCountdownTick); _limitCountdownTick = null; }
            }, 1000);
        }

        //  First-visit chat greeting tooltip 
        const CHAT_GREET_KEY = 'sr_chat_greet_seen';
        let _chatGreetTimer = null;
        function _dismissChatGreet() {
            const greet = $('chatBubbleGreet');
            if (greet) greet.classList.remove('show');
            if (_chatGreetTimer) { clearTimeout(_chatGreetTimer); _chatGreetTimer = null; }
            try { localStorage.setItem(CHAT_GREET_KEY, '1'); } catch (e) {}
        }
        window._dismissChatGreet = _dismissChatGreet;
        function _initChatGreet() {
            let seen = false;
            try { seen = !!localStorage.getItem(CHAT_GREET_KEY); } catch (e) {}
            if (seen) return;
            const greet = $('chatBubbleGreet');
            if (!greet) return;
            setTimeout(() => {
                if (_chatOpen) return; // don't pop it if user already opened chat
                greet.classList.add('show');
                _chatGreetTimer = setTimeout(_dismissChatGreet, 8000);
            }, 2500);
        }
        document.addEventListener('DOMContentLoaded', _initChatGreet);

        //  Open / close 
        window.toggleChat = function() {
            _chatOpen = !_chatOpen;
            const panel  = $('chatPanel');
            const bubble = $('chatBubble');
            const iconO  = $('chatIconOpen');
            const iconC  = $('chatIconClose');

            if (_chatOpen) {
                _dismissChatGreet();
                panel.style.display = 'flex';
                requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('open')));
                bubble.classList.add('open');
                if (iconO) iconO.style.display = 'none';
                if (iconC) iconC.style.display = '';

                const user = getUser();
                if (!user) {
                    showLoginWall();
                } else {
                    // Restore previous chat history from localStorage
                    const restored = loadChatHistory();
                    if (!restored) showGreeting(user);
                    startRatebarTick(user.uid, user.plan);
                }
            } else {
                panel.classList.remove('open');
                bubble.classList.remove('open');
                if (iconO) iconO.style.display = '';
                if (iconC) iconC.style.display = 'none';
                stopRatebarTick();
                setTimeout(() => { panel.style.display = 'none'; }, 240);
            }
        };

        //  Input auto-grow 
        window.chatInputGrow = function(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
        };

        //  Enter to send 
        window.chatInputKeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        };

        //  Send message 
        window.sendChatMessage = async function() {
            if (_chatBusy) return;

            const user = getUser();
            if (!user) { showLoginWall(); return; }

            const inp = $('chatInput');
            if (!inp || inp.dataset.locked) return;
            const text = inp.value.trim();
            if (!text) return;

            // Check hourly limit first
            if (checkAndShowLimitWarning(user)) return;

            // VIP check — block advanced queries for Free plan
            if (user.plan === 'Free' && isVipQuery(text)) {
                inp.value = '';
                inp.style.height = 'auto';
                appendMessage('user', text);
                appendSystem(buildVipLockedCard(), true);
                return;
            }

            inp.value = '';
            inp.style.height = 'auto';

            appendMessage('user', text);
            _chatHistory.push({ role: 'user', content: text });

            // Increment hourly counter
            const newCount = getHourlyCount(user.uid) + 1;
            setHourlyCount(user.uid, newCount);
            updateRatebar(user.uid, user.plan);

            setBusy(true);
            setTyping(true);

            try {
                const resp = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: _chatHistory,
                        deviceId: user.uid,
                        userPlan: user.plan,
                        username: user.username
                    })
                });

                setTyping(false);

                let reply = 'Sorry, something went wrong. Please try again or email support@'+(window.location.hostname||'siterifty.com')+'.';
                if (resp.ok) {
                    const data = await resp.json();
                    reply = data.reply || reply;
                } else {
                    console.error('[chat] API error', resp.status);
                }

                appendMessage('assistant', reply);
                _chatHistory.push({ role: 'assistant', content: reply });

                if (_chatHistory.length > 20) _chatHistory = _chatHistory.slice(-20);

                // Check limit again after response (shows warning card with 1-2 left)
                checkAndShowLimitWarning(user);

            } catch(e) {
                setTyping(false);
                appendMessage('assistant', 'Connection error — please check your network and try again.');
                console.error('[chat]', e);
            } finally {
                setBusy(false);
                if (window.innerWidth > 600) { const inp2 = $('chatInput'); if (inp2 && !inp2.dataset.locked) inp2.focus(); }
            }
        };

        // Reset chat state on auth change
        let _lastAuthState = null;
        setInterval(() => {
            const isLoggedIn = !!(window._fbAuth && window._fbAuth.currentUser);
            if (_lastAuthState !== null && _lastAuthState !== isLoggedIn) {
                clearChatHistory();
                if (_limitCountdownTick) { clearInterval(_limitCountdownTick); _limitCountdownTick = null; }
                const inp = $('chatInput');
                if (inp) { delete inp.dataset.locked; inp.disabled = false; inp.placeholder = 'Ask anything\u2026'; inp.style.height = 'auto'; }
                const btn = $('chatSendBtn');
                if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; }
                const msgs = $('chatMessages');
                if (msgs) msgs.innerHTML = '';
                if (_chatOpen) {
                    if (!isLoggedIn) showLoginWall();
                    else showGreeting(getUser());
                }
            }
            _lastAuthState = isLoggedIn;
        }, 1500);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && _chatOpen) window.toggleChat();
            if (e.key === 'Escape' && document.getElementById('transferOverlay')?.classList.contains('open')) window.closeTransferModal();
        });

    })();

(function() {
        var _CACHE_KEY = 'sr_stats_cache';
        var _TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

        function _apply(s) {
            var ids = {
                statSellers:     s.a + 'k+',
                statSitesListed: s.b + 'k+',
                statCountries:   s.c + '+',
                pulseSellers:    s.a + 'k',
                pulseCountries:  s.c + '+'
            };
            Object.keys(ids).forEach(function(id) {
                var el = document.getElementById(id);
                if (el) { el.classList.remove('skel'); el.textContent = ids[id]; }
            });
        }

        function _readCache() {
            try {
                var raw = localStorage.getItem(_CACHE_KEY);
                if (!raw) return null;
                var entry = JSON.parse(raw);
                if (!entry || !entry.ts || !entry.data) return null;
                if (Date.now() - entry.ts > _TTL) { localStorage.removeItem(_CACHE_KEY); return null; }
                return entry.data;
            } catch(_) { return null; }
        }

        function _writeCache(data) {
            try { localStorage.setItem(_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch(_) {}
        }

        // Serve from cache instantly if still fresh
        var cached = _readCache();
        if (cached) {
            _apply(cached);
            if (window._onHeroStats) window._onHeroStats(cached);
            return;
        }

        // Cache miss — fetch once, then store for 24 hours
        fetch('/api/stats', { method: 'GET' })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (!d || !d.a) return; // bad response — don't cache, retry next load
                _apply(d);
                if (window._onHeroStats) window._onHeroStats(d);
                _writeCache(d);
            })
            .catch(function() {}); // silent fail — stats are cosmetic
    })();

(function() {

        // ── Ticker data ──────────────────────────────────────────
        const SITES = [
            { name: 'NicheReviews.io',   niche: 'Affiliate / SEO',  rev: '$420/mo',  price: '$8,200',  type: 'saas'    },
            { name: 'TaskFlowApp',        niche: 'SaaS / Productivity', rev: '$1,100/mo', price: '$22,000', type: 'saas' },
            { name: 'GardenHacks.net',    niche: 'Content / Display',  rev: '$310/mo',  price: '$5,800',  type: 'blog'   },
            { name: 'InvoiceKit.co',      niche: 'SaaS / Finance',     rev: '$740/mo',  price: '$14,900', type: 'saas'   },
            { name: 'TechDealsToday',     niche: 'Newsletter',          rev: '$590/mo',  price: '$10,200', type: 'news'   },
            { name: 'FitTrack.app',       niche: 'SaaS / Health',       rev: '$2,100/mo',price: '$42,000', type: 'saas'   },
            { name: 'RecipeFinder.io',    niche: 'Content / Ads',       rev: '$180/mo',  price: '$3,100',  type: 'blog'   },
            { name: 'ShipBuilder.dev',    niche: 'Tool / Dev',          rev: '$330/mo',  price: '$7,600',  type: 'tool'   },
            { name: 'LegalDocs.app',      niche: 'SaaS / Legal',        rev: '$920/mo',  price: '$18,500', type: 'saas'   },
            { name: 'PixelStock.co',      niche: 'Marketplace / Media', rev: '$460/mo',  price: '$9,200',  type: 'mkt'    },
            { name: 'CryptoAlert.io',     niche: 'SaaS / Crypto',       rev: '$1,400/mo',price: '$28,000', type: 'saas'   },
            { name: 'RemoteJobsHQ',       niche: 'Jobs / Directory',    rev: '$680/mo',  price: '$12,200', type: 'dir'    },
            { name: 'WeddingGuide.net',   niche: 'Content / Ads',       rev: '$240/mo',  price: '$4,400',  type: 'blog'   },
            { name: 'PodcastTools.app',   niche: 'SaaS / Media',        rev: '$810/mo',  price: '$16,200', type: 'saas'   },
            { name: 'EcoShop.store',      niche: 'eCommerce / Green',   rev: '$1,900/mo',price: '$38,000', type: 'shop'   },
            { name: 'StudyFlash.io',      niche: 'SaaS / Edtech',       rev: '$560/mo',  price: '$11,200', type: 'saas'   },
            { name: 'HackerDigest',       niche: 'Newsletter / Tech',   rev: '$390/mo',  price: '$7,000',  type: 'news'   },
            { name: 'LinkVault.app',      niche: 'Tool / Productivity', rev: '$270/mo',  price: '$4,900',  type: 'tool'   },
        ];

        const TYPE_ICONS = {
            saas: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="2" stroke="#a855f7" stroke-width="1.2"/><path d="M5 8h6M5 10.5h3" stroke="#a855f7" stroke-width="1.1" stroke-linecap="round"/></svg>' },
            blog: { bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 7h10M3 10h6" stroke="#818cf8" stroke-width="1.2" stroke-linecap="round"/></svg>' },
            news: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#fbbf24" stroke-width="1.2"/><path d="M4 6h4M4 8.5h6M4 11h3" stroke="#fbbf24" stroke-width="1.1" stroke-linecap="round"/></svg>' },
            tool: { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5a3 3 0 0 1-4 4L3 10a1.41 1.41 0 0 0 2 2l2.5-2.5a3 3 0 0 1 4-4l-1.5 1.5 1 1 1.5-1.5Z" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            shop: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 2h1.8l2 7h5.4l1.8-5H5.5" stroke="#34d399" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="13" r="1" fill="#34d399"/><circle cx="11" cy="13" r="1" fill="#34d399"/></svg>' },
            mkt:  { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#818cf8" stroke-width="1.2"/><path d="M5.5 8h5M8 5.5v5" stroke="#818cf8" stroke-width="1.2" stroke-linecap="round"/></svg>' },
            dir:  { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="#f87171" stroke-width="1.2"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="#f87171" stroke-width="1.2"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="#f87171" stroke-width="1.2"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="#f87171" stroke-width="1.2"/></svg>' },
        };

        const STATUSES = ['Sold', 'Sold', 'Sold', 'Listed', 'Listed', 'Under offer'];

        function makeCard(site, idx) {
            const icon = TYPE_ICONS[site.type] || TYPE_ICONS.saas;
            const status = STATUSES[idx % STATUSES.length];
            const isSold = status === 'Sold';
            const isOffer = status === 'Under offer';
            const tagClass = isSold ? ' sold' : isOffer ? ' offer' : '';
            const barPct = isSold ? Math.floor(55 + (idx * 7 % 45)) : isOffer ? Math.floor(30 + (idx * 11 % 30)) : Math.floor(10 + (idx * 5 % 20));
            const amtClass = isSold ? ' sold' : '';
            return `<div class="ticker-card">
                <div class="ticker-card-icon" style="background:${icon.bg};border:1px solid ${icon.border};">${icon.svg}</div>
                <div class="ticker-card-body">
                    <div class="ticker-card-name">${site.name}</div>
                    <div class="ticker-card-meta">${site.niche} &middot; ${site.rev}/mo</div>
                    <div class="ticker-card-bar"><div class="ticker-card-bar-fill" style="width:${barPct}%"></div></div>
                </div>
                <div class="ticker-card-price">
                    <div class="ticker-card-amount${amtClass}">${site.price}</div>
                    <div class="ticker-card-tag${tagClass}">${status}</div>
                </div>
            </div>`;
        }

        function buildTicker() {
            const row1El = document.getElementById('tickerRow1');
            const row2El = document.getElementById('tickerRow2');
            if (!row1El || !row2El) return;

            const half = Math.ceil(SITES.length / 2);
            const row1Sites = SITES.slice(0, half);
            const row2Sites = SITES.slice(half);

            // Double for seamless loop
            const r1Html = [...row1Sites, ...row1Sites].map((s, i) => makeCard(s, i)).join('');
            const r2Html = [...row2Sites, ...row2Sites].map((s, i) => makeCard(s, i + 3)).join('');
            row1El.innerHTML = r1Html;
            row2El.innerHTML = r2Html;
        }

        // ── BTC price via CoinGecko (free, no key) ────────────────
        function fetchBtcPrice() {
            const el = document.getElementById('btcPrice');
            const chEl = document.getElementById('btcChange');
            if (!el) return;
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
                .then(r => r.json())
                .then(d => {
                    const p = d.bitcoin;
                    if (!p) return;
                    el.textContent = '$' + Number(p.usd).toLocaleString();
                    const ch = p.usd_24h_change;
                    if (chEl && ch !== undefined) {
                        const sign = ch >= 0 ? '+' : '';
                        chEl.textContent = sign + ch.toFixed(1) + '%';
                        chEl.className = 'ticker-signal-change ' + (ch >= 0 ? 'up' : 'dn');
                    }
                })
                .catch(() => { if (el) el.textContent = '$—'; });
        }

        // ── Active buyers signal (from stats cache or fallback) ───
        function fillBuyersStat() {
            const el = document.getElementById('tickerBuyers');
            if (!el) return;
            try {
                const raw = localStorage.getItem('sr_stats_cache');
                if (raw) {
                    const d = JSON.parse(raw);
                    if (d && d.data && d.data.a) { el.textContent = d.data.a + 'k+'; return; }
                }
            } catch(_) {}
            el.textContent = '8k+';
        }

        document.addEventListener('DOMContentLoaded', function() {
            buildTicker();
            fetchBtcPrice();
            fillBuyersStat();
        });

        // ── Particles canvas ──────────────────────────────────────
        document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.getElementById('ctaParticles');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let W, H, particles = [], raf;

            function resize() {
                W = canvas.width  = canvas.offsetWidth;
                H = canvas.height = canvas.offsetHeight;
            }

            function Particle() {
                this.reset = function() {
                    this.x  = Math.random() * W;
                    this.y  = Math.random() * H;
                    this.r  = Math.random() * 1.4 + 0.3;
                    this.vx = (Math.random() - 0.5) * 0.3;
                    this.vy = -Math.random() * 0.5 - 0.1;
                    this.alpha = Math.random() * 0.5 + 0.1;
                    const palette = ['168,85,247','129,140,248','56,189,248','129,140,248','52,211,153'];
                    this.color = palette[Math.floor(Math.random() * palette.length)];
                };
                this.reset();
                this.y = Math.random() * H; // start distributed, not all at bottom
            }

            function init() {
                particles = Array.from({ length: 70 }, () => new Particle());
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                particles.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + p.color + ',' + p.alpha + ')';
                    ctx.fill();
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.y < -4 || p.x < -4 || p.x > W + 4) p.reset();
                });
                raf = requestAnimationFrame(draw);
            }

            // Only animate when section is visible (perf)
            const ctaSection = document.getElementById('finalCtaSection');
            const io2 = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) { resize(); init(); draw(); }
                    else { cancelAnimationFrame(raf); }
                });
            }, { threshold: 0.05 });
            if (ctaSection) io2.observe(ctaSection);
            window.addEventListener('resize', () => { resize(); });
        });

    })();

(function () {
        const sections = document.querySelectorAll('.reveal-section');
        if (!sections.length) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target); // fire once
                    }
                });
            },
            { threshold: 0.12 }
        );
        sections.forEach(s => io.observe(s));
    })();

(function(){
        const IMGUR_CLIENT_ID = "891e5bb4aa94282";

        //  Per-user avatar gradient (mirrors auth block definition) 
        const _AVATAR_GRADIENTS = [
            ['#a855f7','#818cf8'],['#38bdf8','#818cf8'],['#34d399','#38bdf8'],
            ['#fbbf24','#f97316'],['#818cf8','#fb7185'],['#818cf8','#a855f7'],
            ['#34d399','#a855f7'],['#38bdf8','#34d399'],['#fb923c','#818cf8'],
            ['#a3e635','#38bdf8'],['#e879f9','#818cf8'],['#2dd4bf','#38bdf8'],
        ];
        function avatarGradientForUser(uid) {
            if (!uid) return _AVATAR_GRADIENTS[0];
            let hash = 0;
            for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
            return _AVATAR_GRADIENTS[hash % _AVATAR_GRADIENTS.length];
        }
        window._avatarGradientForUser = avatarGradientForUser;

        //  Apply a stored photoURL to all avatar elements 
        function applyPhotoURL(url) {
            if (!url) return;
            // All avatar elements across the page
            const els = [
                document.getElementById('avatarBtn'),
                document.getElementById('profileAvatarCircle'),
                document.getElementById('settingsAvatarHero'),
                document.getElementById('dashAvatarLg'),
                document.getElementById('imsgMyAvatar'),
                document.getElementById('wmAvatar'),
            ];
            els.forEach(el => {
                if (!el) return;
                if (el.id === 'avatarBtn') {
                    el.classList.remove('header-signin-btn');
                    el.classList.add('avatar');
                }
                el.textContent = '';
                el.style.backgroundImage = '';
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Profile';
                img.style.cssText = 'width:100%;height:100%;max-width:100%;max-height:100%;object-fit:cover;border-radius:999px;display:block;flex-shrink:0;';
                img.onerror = function() {
                    if (img.parentNode === el) el.removeChild(img);
                    const user = window._fbAuth && window._fbAuth.currentUser;
                    const name = (user && (user.displayName || user.email)) || '?';
                    const uid  = (user && user.uid) || '';
                    const [c1, c2] = (window._avatarGradientForUser || function(){ return ['#a855f7','#818cf8']; })(uid);
                    el.style.background = `linear-gradient(135deg,${c1},${c2})`;
                    el.textContent = name.charAt(0).toUpperCase();
                };
                el.appendChild(img);
            });
        }

        //  Load stored photoURL on auth state 
        function tryLoadStoredPhoto() {
            const interval = setInterval(() => {
                if (window._fbAuth && window._fbDb && typeof firebase !== 'undefined') {
                    clearInterval(interval);
                    window._fbAuth.onAuthStateChanged(user => {
                        if (!user) return;
                        // Try Firebase DB first
                        const { ref: dbRef, get, onValue } = window._fbDbFns || {};
                        if (dbRef && get) {
                            get(dbRef(window._fbDb, 'users/' + user.uid + '/photoURL')).then(snap => {
                                const url = snap && snap.val();
                                if (url) {
                                    window._cachedPhotoURL = url;
                                    applyPhotoURL(url);
                                }
                            }).catch(() => {});
                        }
                    });
                }
            }, 300);
        }
        tryLoadStoredPhoto();

        //  Main upload function 
        window.uploadAvatarToImgur = async function(input) {
            const file = input.files[0];
            if (!file) return;

            // Validate: image, max 5MB
            if (!file.type.startsWith('image/')) {
                showAvatarStatus('Only image files are supported.', 'error'); return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showAvatarStatus('Image must be under 5MB.', 'error'); return;
            }

            showAvatarStatus('Uploading...', 'loading');

            // Show local preview immediately
            const localURL = URL.createObjectURL(file);
            applyPhotoURL(localURL);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const resp = await fetch('https://api.imgur.com/3/image', {
                    method: 'POST',
                    headers: { Authorization: 'Client-ID ' + IMGUR_CLIENT_ID },
                    body: formData
                });

                if (!resp.ok) throw new Error('Imgur upload failed: ' + resp.status);
                const data = await resp.json();

                if (!data.success) throw new Error(data.data?.error || 'Imgur error');
                const imgurURL = data.data.link;

                // Apply the permanent Imgur URL
                window._cachedPhotoURL = imgurURL;
                applyPhotoURL(imgurURL);

                // Save to Firebase Realtime DB
                await savePhotoURLToFirebase(imgurURL);

                showAvatarStatus('Profile picture updated!', 'ok');
            } catch (err) {
                console.error('[Imgur upload]', err);
                showAvatarStatus('Upload failed. Try a smaller image.', 'error');
            } finally {
                input.value = ''; // reset so same file can be re-selected
            }
        };

        async function savePhotoURLToFirebase(url) {
            const user = window._fbAuth?.currentUser;
            if (!user) return;

            const { ref: dbRef, update } = window._fbDbFns || {};
            if (!dbRef || !update || !window._fbDb) {
                console.warn('[Imgur] Firebase DB not ready, photoURL not persisted.');
                return;
            }
            try {
                await update(dbRef(window._fbDb, 'users/' + user.uid), { photoURL: url });
            } catch (e) {
                console.error('[Imgur] Firebase write failed:', e);
            }
        }

        function showAvatarStatus(msg, type) {
            // Try to show in accErr/accOk alert boxes in the profile panel
            const errEl = document.getElementById('accErr');
            const okEl  = document.getElementById('accOk');
            if (type === 'error' && errEl) {
                errEl.textContent = msg;
                errEl.style.display = 'block';
                setTimeout(() => { errEl.style.display = 'none'; }, 4000);
            } else if (type === 'ok' && okEl) {
                okEl.textContent = msg;
                okEl.style.display = 'block';
                setTimeout(() => { okEl.style.display = 'none'; }, 3500);
            } else if (type === 'loading' && okEl) {
                okEl.textContent = msg;
                okEl.style.display = 'block';
            }
        }

        //  Expose applyPhotoURL for populateAccountTab to call 
        window._applyPhotoURL = applyPhotoURL;
        window._savePhotoURLToFirebase = savePhotoURLToFirebase;
        window._showAvatarStatus = showAvatarStatus;

    })();

(function() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('upgrade') === 'plans') {
            // Wait for auth + modal to be ready, then open
            function tryOpen() {
                if (typeof window.openPlansPickerModal === 'function') {
                    // If not logged in, open auth modal first
                    if (window._fbAuth && !window._fbAuth.currentUser) {
                        if (typeof window.openAuthModal === 'function') window.openAuthModal();
                    } else {
                        window.openPlansPickerModal();
                    }
                    // Clean the URL so refreshing doesn't re-open it
                    history.replaceState(null, '', window.location.pathname);
                } else {
                    setTimeout(tryOpen, 150);
                }
            }
            // Give the page a moment to finish rendering
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(tryOpen, 400));
            } else {
                setTimeout(tryOpen, 400);
            }
        }
    })();

// 
        //  FULL-SCREEN MODAL HELPERS — Dashboard & Messages
        // 

        //  Firebase bridge for plain scripts 
        function _fb() {
            return {
                auth:    window._auth    || window._fbAuth,
                db:      window._db      || window._fbDb,
                ref:     window._ref     || (window._fbDbFns && window._fbDbFns.ref),
                get:     window._get     || (window._fbDbFns && window._fbDbFns.get),
                set:     window._set     || (window._fbDbFns && window._fbDbFns.set),
                update:  window._update  || (window._fbDbFns && window._fbDbFns.update),
                onValue: window._onValue || (window._fbDbFns && window._fbDbFns.onValue)
            };
        }

        function loadChartJs() {
            if (window.Chart) return Promise.resolve();
            return new Promise(function(resolve) {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
                s.onload = resolve; s.onerror = resolve;
                document.head.appendChild(s);
            });
        }

(function(){
        var _soMessages = [
            "You have unseen messages from buyers. Don't leave them waiting.",
            "Your listings are live — sellers who stay active get 3× more inquiries.",
            "Someone may be browsing your profile right now.",
            "Your wallet balance is still sitting here. Come back anytime.",
            "Deals move fast on Siterifty. You don't want to miss a bid.",
            "You've built something here. It'll be waiting when you return.",
            "Staying signed in means instant replies — buyers love that.",
            "Your dashboard, offers and messages are one tap away.",
        ];
        var _soIdx = 0;
        var _soTimer = null;

        function _soNextMsg() {
            var el = document.getElementById('soMsg');
            if (!el) return;
            // Cycle through messages
            el.textContent = _soMessages[_soIdx % _soMessages.length];
            el.style.animation = 'none';
            void el.offsetWidth; // reflow
            el.style.animation = 'soFadeMsg 4.5s ease forwards';
            _soIdx++;
            _soTimer = setTimeout(_soNextMsg, 4200);
        }

        // Patch doSignOut to start cycling messages
        var _origDoSignOut = window.doSignOut;
        window.doSignOut = function(){
            _soIdx = Math.floor(Math.random() * _soMessages.length); // start random
            if (_soTimer) clearTimeout(_soTimer);
            _soNextMsg();
            if (_origDoSignOut) _origDoSignOut();
            else {
                var modal = document.getElementById('signOutConfirmModal');
                if (modal) { modal.style.display = 'flex'; }
            }
        };

        // Stop cycling when modal closes
        var _origCancel = window.cancelSignOut;
        window.cancelSignOut = function() {
            if (_soTimer) { clearTimeout(_soTimer); _soTimer = null; }
            if (_origCancel) _origCancel();
        };
        var _origConfirm = window.confirmSignOut;
        window.confirmSignOut = function() {
            if (_soTimer) { clearTimeout(_soTimer); _soTimer = null; }
            if (_origConfirm) _origConfirm();
        };
    })();

(function(){
        var d = window.location.hostname || 'siterifty.com';
        var supportEmail  = 'support@' + d;
        var supportMailto = 'mailto:' + supportEmail;

        // Visible support email in settings panel
        var el = document.getElementById('supportEmailDisplay');
        if (el) el.textContent = supportEmail;

        // Parent <a> wrapping it + the direct email link
        var parentA = el && el.closest ? el.closest('a') : null;
        if (parentA && parentA.href.indexOf('mailto:') === 0) parentA.href = supportMailto;
        var directLink = document.getElementById('supportDirectEmailLink');
        if (directLink) directLink.href = supportMailto;

        // PayPal error fallback contact links
        document.querySelectorAll('#ppErrMailLink, #ppPaypalErrLink').forEach(function(a) {
            a.href = supportMailto;
        });

        // Cancel subscription modal support link
        var cancelLink = document.getElementById('cancelSupportLink');
        if (cancelLink) { cancelLink.href = supportMailto; cancelLink.textContent = supportEmail; }
    })();

//  WITHDRAWAL SYSTEM 
(function(){

const PLAN_FEES   = { free: 0.30, starter: 0.15, growth: 0.10, pro: 0.05 };
const PLAN_COLORS = {
    free:    { color:'rgba(248,113,113,0.75)',  dot:'#f87171' },
    starter: { color:'rgba(168,85,247,0.85)',   dot:'#a855f7' },
    growth:  { color:'rgba(129,140,248,0.85)',  dot:'#818cf8' },
    pro:     { color:'rgba(56,189,248,0.9)',    dot:'#38bdf8' }
};
const PLAN_LABELS = { free:'Free', starter:'Starter', growth:'Growth', pro:'Pro' };

let wdState = {
    gross: 0, net: 0, fee: 0,
    feeRate: 0.30, plan: 'free',
    email: '',
    localRate: 1, localCode: 'USD', localName: 'US Dollar',
    timerSec: 15, timerInterval: null, rateInterval: null,
    confirmed: false, fullBalance: 0
};

function fmtUSD(n){ return '$' + (parseFloat(n)||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
function fmtShort(n){
    var v = parseFloat(n)||0;
    if(v >= 1000) return '$'+(v/1000).toFixed(1).replace(/\.0$/,'')+'k';
    var s = v.toFixed(2);
    return '$' + (s.endsWith('.00') ? s.slice(0,-3) : s);
}
function fmtLocal(n, code){
    try { return new Intl.NumberFormat(undefined,{style:'currency',currency:code,maximumFractionDigits:2}).format(n); }
    catch(e){ return code + ' ' + (parseFloat(n)||0).toFixed(2); }
}
function getBalance(){
    const el = document.getElementById('acStatBalance');
    if(!el) return 0;
    return parseFloat(el.textContent.replace(/[^0-9.]/g,'')) || 0;
}
function getUserPlan(){
    const badge = document.getElementById('acPlanName');
    if(!badge) return 'free';
    const txt = badge.textContent.toLowerCase();
    if(txt.includes('pro')) return 'pro';
    if(txt.includes('growth')) return 'growth';
    if(txt.includes('starter')) return 'starter';
    return 'free';
}

// ── Step dots ──
function wdUpdateDots(step){
    [1,2,3].forEach(function(i){
        var d = document.getElementById('wdDot'+i);
        if(!d) return;
        d.className = 'wd-step-dot' + (i===step?' active':'');
    });
    var sub = document.getElementById('wdHeaderSub');
    var titles = {1:'Step 1 of 3 · Amount',2:'Step 2 of 3 · Payout',3:'Step 3 of 3 · Confirm'};
    if(sub) sub.textContent = titles[step]||'';
}

// ── Plan comparison table ──
function wdUpdatePlanTable(gross){
    var plans = ['free','starter','growth','pro'];
    var colIds = ['wdCmpFree','wdCmpStarter','wdCmpGrowth','wdCmpPro'];
    var feeIds = ['wdCmpFeeAmt0','wdCmpFeeAmt1','wdCmpFeeAmt2','wdCmpFeeAmt3'];
    var netElIds = [null,null,null,null]; // net value is first child div inside col
    plans.forEach(function(p,i){
        var col = document.getElementById(colIds[i]);
        var feeEl = document.getElementById(feeIds[i]);
        if(!col) return;
        var netDiv = col.querySelector('div:first-child');
        if(gross > 0){
            var fee = gross * PLAN_FEES[p];
            var net = gross - fee;
            if(netDiv) netDiv.textContent = fmtShort(net);
            if(feeEl)  feeEl.textContent  = '−'+fmtShort(fee);
        } else {
            if(netDiv) netDiv.textContent = '—';
            if(feeEl)  feeEl.textContent  = '';
        }
        // highlight current user plan
        var bgTints = { free:'rgba(248,113,113,0.07)', starter:'rgba(168,85,247,0.09)', growth:'rgba(129,140,248,0.08)', pro:'rgba(56,189,248,0.09)' };
        var isUser = (p === wdState.plan);
        col.style.outline = 'none';
        col.style.background = isUser ? bgTints[p] : 'transparent';
    });
    // your plan bar
    var planLabel = document.getElementById('wdYourPlanLabel');
    var planDot   = document.getElementById('wdYourPlanDot');
    var upgradeLink = document.getElementById('wdUpgradeLink');
    if(planLabel){ planLabel.textContent = PLAN_LABELS[wdState.plan]||'Free'; planLabel.style.color = PLAN_COLORS[wdState.plan].color; }
    if(planDot)  { planDot.style.background = PLAN_COLORS[wdState.plan].dot; }
    if(upgradeLink){ upgradeLink.style.display = wdState.plan==='pro'?'none':'inline-block'; }
    // quick net amount hint
    var hint = document.getElementById('wdNetAmtQuick');
    if(hint && gross>0){ hint.textContent = 'You keep: '+fmtUSD(gross*(1-wdState.feeRate)); }
    else if(hint){ hint.textContent=''; }
}

// ── KYC banner ──
function wdUpdateKycBanner(gross){
    var banner = document.getElementById('wdKycBanner');
    var continueBtn = document.getElementById('wdContinueBtn');
    if(!banner) return;
    if(gross >= 50){
        banner.style.display = 'block';
        // don't block — just show. KYC popup is accessed via the button inside banner.
    } else {
        banner.style.display = 'none';
    }
}

window.wdOpenKycPopup = function(){
    var el = document.getElementById('wdKycOverlay');
    if(el){ el.style.display='flex'; }
};
window.wdCloseKycPopup = function(){
    var el = document.getElementById('wdKycOverlay');
    if(el){ el.style.display='none'; }
};

//  Open / close 
window.openWithdrawModal = function(){
    var overlay = document.getElementById('withdrawOverlay');
    if(!overlay) return;
    wdState.fullBalance = getBalance();
    wdState.plan        = getUserPlan();
    wdState.feeRate     = PLAN_FEES[wdState.plan] || 0.30;
    wdState.confirmed   = false;
    _wdCurrencyDetected = false;
    var amtInput = document.getElementById('wdAmountInput');
    if(amtInput){ amtInput.value=''; amtInput.style.borderColor='rgba(255,255,255,0.1)'; amtInput.style.boxShadow='none'; }
    var amtErr = document.getElementById('wdAmountError');
    if(amtErr){ amtErr.textContent=''; amtErr.style.display='none'; }
    var grossEl = document.getElementById('wdGrossAmount');
    if(grossEl) grossEl.textContent = fmtShort(wdState.fullBalance);
    // Load pending + rejected from server (GET /api/wallet)
    (async function(){
        try {
            var user = window._fbAuth && window._fbAuth.currentUser;
            if(!user) return;
            var idToken = await user.getIdToken();
            var res = await fetch('/api/wallet', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + idToken }
            });
            var d = await res.json();
            if(!d.success) return;
            var grossEl = document.getElementById('wdGrossAmount');
            var pendEl  = document.getElementById('wdPendingAmount');
            var rejEl   = document.getElementById('wdRejectedAmount');
            if(grossEl){ grossEl.textContent = fmtShort(d.balance); wdState.fullBalance = d.balance; }
            if(pendEl)  pendEl.textContent  = '$' + Number(d.pendingBalance).toFixed(2);
            if(rejEl)   rejEl.textContent   = '$' + Number(d.rejectedBalance).toFixed(2);
            wdUpdatePlanTable(0);
        } catch(e){ console.warn('[wallet] balance fetch failed', e); }
    })();
    wdUpdatePlanTable(0);
    wdUpdateKycBanner(0);
    wdShowStep(1);
    overlay.classList.add('open');
    if(window._lockBodyScroll) window._lockBodyScroll();
    setTimeout(function(){ var a=document.getElementById('wdAmountInput'); if(a) a.focus(); },200);
};

window.closeWithdrawModal = function(){
    const overlay = document.getElementById('withdrawOverlay');
    if(overlay) overlay.classList.remove('open');
    if(window._unlockBodyScroll) window._unlockBodyScroll();
    wdStopTimers();
    // Close any open tooltips
    ['available','pending','rejected'].forEach(function(k){
        var t = document.getElementById('wdTooltip-'+k); if(t) t.style.display='none';
    });
};

// Info tooltip toggle — click ⓘ to open, click anywhere else to close
window.wdToggleInfo = function(key){
    var ids = ['available','pending','rejected'];
    ids.forEach(function(k){
        var el = document.getElementById('wdTooltip-'+k);
        if(!el) return;
        el.style.display = (k === key && el.style.display === 'none') ? 'block' : 'none';
    });
    // Stop propagation so the doc-level closer doesn't immediately hide it
    event && event.stopPropagation && event.stopPropagation();
};
// Click outside any tooltip → close all
document.addEventListener('click', function(){
    ['available','pending','rejected'].forEach(function(k){
        var t = document.getElementById('wdTooltip-'+k); if(t) t.style.display='none';
    });
});

//  Step navigation 
function wdShowStep(n){
    [1,2,3,4].forEach(function(i){
        var el = document.getElementById('wdStep'+i);
        if(el) el.style.display = (i===n)?'block':'none';
    });
    var titles={1:'Withdraw Revenue',2:'Payout Method',3:'Confirm Withdrawal',4:'Withdrawal Submitted'};
    var titleEl = document.getElementById('wdHeaderTitle');
    if(titleEl) titleEl.textContent = titles[n]||'Withdraw Revenue';
    if(n<=3) wdUpdateDots(n);
    // hide dots on success
    var dotsEl = document.getElementById('wdStepDots');
    if(dotsEl) dotsEl.style.display = n===4?'none':'flex';
}

window.wdGoBack = function(){ wdShowStep(1); };

window.wdOnAmountInput = function(){
    var input = document.getElementById('wdAmountInput');
    var errEl = document.getElementById('wdAmountError');
    var raw   = parseFloat(input.value);
    var full  = wdState.fullBalance || getBalance();

    if(!input.value || isNaN(raw) || raw<=0){
        wdState.gross=0; wdState.net=0; wdState.fee=0;
        wdUpdatePlanTable(0);
        wdUpdateKycBanner(0);
        errEl.textContent=''; errEl.style.display='none';
        input.style.borderColor='rgba(255,255,255,0.1)'; input.style.boxShadow='none';
        return;
    }

    var fee = parseFloat((raw * wdState.feeRate).toFixed(2));
    var net = parseFloat((raw - fee).toFixed(2));
    wdState.gross=raw; wdState.fee=fee; wdState.net=net;
    wdUpdatePlanTable(raw);
    wdUpdateKycBanner(raw);

    var msg='';
    if(raw > full)     msg='Exceeds your available balance of '+fmtUSD(full)+'.';
    else if(raw < 50)  msg='Minimum withdrawal amount is $50.00.';
    else if(raw > 999) msg='Maximum is $999.00 per transaction.';
    else msg='';

    if(msg){ errEl.textContent=msg; errEl.style.display='block'; input.style.borderColor='rgba(248,113,113,0.5)'; input.style.boxShadow='0 0 0 3px rgba(248,113,113,0.08)'; }
    else   { errEl.textContent=''; errEl.style.display='none'; input.style.borderColor='rgba(52,211,153,0.5)'; input.style.boxShadow='0 0 0 3px rgba(52,211,153,0.08)'; }
};

window.wdSetMaxAmount = function(){
    var full  = wdState.fullBalance || getBalance();
    var input = document.getElementById('wdAmountInput');
    var maxAllowed = Math.min(full, 999);
    if(maxAllowed<=0){ if(typeof _sAlert==='function') _sAlert('No balance available.'); return; }
    input.value = maxAllowed.toFixed(2);
    wdOnAmountInput();
};

window.wdGoToPayment = function(){
    var input = document.getElementById('wdAmountInput');
    var errEl = document.getElementById('wdAmountError');
    var full  = wdState.fullBalance || getBalance();

    if(full<=0){ if(typeof _sAlert==='function') _sAlert('No revenue to withdraw yet.'); return; }

    var raw = parseFloat(input.value);
    if(!input.value||isNaN(raw)||raw<=0){
        errEl.textContent='Please enter an amount to withdraw.';
        errEl.style.display='block'; input.focus(); return;
    }
    if(raw > full){
        errEl.textContent = 'Exceeds your available balance of ' + fmtUSD(full) + '.';
        errEl.style.display = 'block';
        input.style.borderColor = 'rgba(248,113,113,0.5)';
        return;
    }
    if(raw < 50){
        errEl.textContent = 'Minimum withdrawal amount is $50.00.';
        errEl.style.display = 'block';
        input.style.borderColor = 'rgba(248,113,113,0.5)'; input.style.boxShadow='0 0 0 3px rgba(248,113,113,0.08)';
        return;
    }
    if(raw > 999){
        errEl.textContent = 'Maximum is $999.00 per transaction.';
        errEl.style.display = 'block';
        input.style.borderColor = 'rgba(248,113,113,0.5)'; input.style.boxShadow='0 0 0 3px rgba(248,113,113,0.08)';
        return;
    }
    errEl.textContent=''; errEl.style.display='none';
    // populate step 2 summary chip
    var s2net = document.getElementById('wdStep2Net');
    var s2fee = document.getElementById('wdStep2Fee');
    var s2lbl = document.getElementById('wdStep2FeeLabel');
    if(s2net) s2net.textContent = fmtUSD(wdState.net);
    if(s2fee) s2fee.textContent = '−'+fmtUSD(wdState.fee);
    if(s2lbl) s2lbl.textContent = (wdState.feeRate*100).toFixed(0)+'% · '+({free:'Free',starter:'Starter',growth:'Growth',pro:'Pro'}[wdState.plan]||'Free');
    wdShowStep(2);
};

window.wdSelectMethod = function(m){ /* only paypal for now */ };

window.wdGoToConvert = function(){
    var emailEl = document.getElementById('wdPaypalEmail');
    var email = emailEl ? emailEl.value.trim() : '';
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        if(emailEl){ emailEl.style.borderColor='rgba(248,113,113,0.6)'; emailEl.style.boxShadow='0 0 0 3px rgba(248,113,113,0.08)'; emailEl.placeholder='Enter a valid PayPal email'; emailEl.focus(); }
        return;
    }
    wdState.email = email;
    // populate step 3
    var el;
    el=document.getElementById('wdConfirmNet');   if(el) el.textContent=fmtUSD(wdState.net);
    el=document.getElementById('wdConfirmEmail'); if(el) el.textContent=wdState.email;
    el=document.getElementById('wdSummaryGross'); if(el) el.textContent=fmtUSD(wdState.gross);
    el=document.getElementById('wdSummaryFeeRate'); if(el) el.textContent=(wdState.feeRate*100).toFixed(0)+'%';
    el=document.getElementById('wdSummaryFeeAmt'); if(el) el.textContent='−'+fmtUSD(wdState.fee);
    el=document.getElementById('wdSummaryNet');   if(el) el.textContent=fmtUSD(wdState.net);
    el=document.getElementById('wdSummaryEmail'); if(el) el.textContent=wdState.email;
    wdShowStep(3);
    var minWarn=document.getElementById('wdMinWarning');
    var confirmBtn=document.getElementById('wdConfirmBtn');
    var belowMin = wdState.gross < 50;
    if(minWarn) minWarn.style.display = belowMin?'block':'none';
    if(confirmBtn){ confirmBtn.disabled=belowMin; confirmBtn.style.opacity=belowMin?'0.35':'1'; confirmBtn.style.cursor=belowMin?'not-allowed':'pointer'; }
    wdFetchRate();
    wdStartTimer();
};

//  FX rate + IP-based currency detection 
// Currency name lookup table
const WD_CURR_NAMES = {
    USD:'US Dollar',GBP:'British Pound',EUR:'Euro',AUD:'Australian Dollar',
    CAD:'Canadian Dollar',JPY:'Japanese Yen',CNY:'Chinese Yuan',INR:'Indian Rupee',
    BRL:'Brazilian Real',KRW:'South Korean Won',MXN:'Mexican Peso',SGD:'Singapore Dollar',
    HKD:'Hong Kong Dollar',NOK:'Norwegian Krone',SEK:'Swedish Krona',DKK:'Danish Krone',
    PLN:'Polish Złoty',CHF:'Swiss Franc',ZAR:'South African Rand',AED:'UAE Dirham',
    SAR:'Saudi Riyal',ILS:'Israeli Shekel',TRY:'Turkish Lira',IDR:'Indonesian Rupiah',
    MYR:'Malaysian Ringgit',THB:'Thai Baht',PHP:'Philippine Peso',VND:'Vietnamese Dong',
    PKR:'Pakistani Rupee',BDT:'Bangladeshi Taka',EGP:'Egyptian Pound',MAD:'Moroccan Dirham',
    KES:'Kenyan Shilling',NGN:'Nigerian Naira',GHS:'Ghanaian Cedi',TWD:'New Taiwan Dollar',
    CZK:'Czech Koruna',HUF:'Hungarian Forint',RON:'Romanian Leu',UAH:'Ukrainian Hryvnia',
    CLP:'Chilean Peso',COP:'Colombian Peso',PEN:'Peruvian Sol',ARS:'Argentine Peso',
    IRR:'Iranian Rial',QAR:'Qatari Riyal',KWD:'Kuwaiti Dinar',BHD:'Bahraini Dinar',
    OMR:'Omani Rial',JOD:'Jordanian Dinar',LBP:'Lebanese Pound',NZD:'New Zealand Dollar',
    MKD:'Macedonian Denar',RSD:'Serbian Dinar',HRK:'Croatian Kuna',BGN:'Bulgarian Lev',
    RUB:'Russian Ruble',TND:'Tunisian Dinar',DZD:'Algerian Dinar',LYD:'Libyan Dinar',
    ETB:'Ethiopian Birr',TZS:'Tanzanian Shilling',UGX:'Ugandan Shilling',GHS:'Ghanaian Cedi',
    MMK:'Myanmar Kyat',KHR:'Cambodian Riel',LAK:'Lao Kip',MNT:'Mongolian Tögrög',
};

// Cache the detected currency so we don't re-hit the geo API on every 15s refresh
let _wdCurrencyDetected = false;

async function wdDetectCurrency(){
    if(_wdCurrencyDetected) return; // already done
    _wdCurrencyDetected = true;
    try {
        // ipapi.co — free, keyless, returns JSON with currency field
        const geo = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if(geo.ok){
            const gd = await geo.json();
            const code = gd.currency || 'USD';
            wdState.localCode = code;
            wdState.localName = WD_CURR_NAMES[code] || (gd.country_name ? gd.country_name + ' ' + code : code);
            return;
        }
    } catch(e){}
    // Fallback: use browser locale as a hint (less accurate but always available)
    try {
        const locale = navigator.language || 'en-US';
        const fmt = new Intl.NumberFormat(locale, {style:'currency', currency:'USD'});
        // Intl doesn't expose the "local" currency — use country from locale tag
        const country = locale.split('-')[1] || '';
        const countryToCurrency = {
            GB:'GBP',AU:'AUD',CA:'CAD',JP:'JPY',CN:'CNY',IN:'INR',BR:'BRL',KR:'KRW',
            MX:'MXN',SG:'SGD',HK:'HKD',NO:'NOK',SE:'SEK',DK:'DKK',PL:'PLN',CH:'CHF',
            ZA:'ZAR',AE:'AED',SA:'SAR',IL:'ILS',TR:'TRY',ID:'IDR',MY:'MYR',TH:'THB',
            PH:'PHP',VN:'VND',PK:'PKR',BD:'BDT',EG:'EGP',MA:'MAD',KE:'KES',NG:'NGN',
            GH:'GHS',TW:'TWD',CZ:'CZK',HU:'HUF',RO:'RON',UA:'UAH',CL:'CLP',CO:'COP',
            PE:'PEN',AR:'ARS',NZ:'NZD',QA:'QAR',KW:'KWD',BH:'BHD',OM:'OMR',JO:'JOD',
        };
        const code = countryToCurrency[country] || 'USD';
        wdState.localCode = code;
        wdState.localName = WD_CURR_NAMES[code] || 'US Dollar';
    } catch(e){
        wdState.localCode = 'USD';
        wdState.localName = 'US Dollar';
    }
}

async function wdFetchRate(){
    // Step 1: detect currency from IP (only runs once per modal open)
    await wdDetectCurrency();
    // Step 2: fetch live exchange rate
    try {
        const resp = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
        if(resp.ok){
            const data = await resp.json();
            const rate = data.rates && data.rates[wdState.localCode];
            if(rate){
                wdState.localRate = rate;
            } else {
                // Currency not in rate list — fall back to USD
                wdState.localRate = 1;
                wdState.localCode = 'USD';
                wdState.localName = 'US Dollar';
            }
        } else { throw new Error('rate fetch failed'); }
    } catch(e){
        wdState.localRate = 1;
        wdState.localCode = 'USD';
        wdState.localName = 'US Dollar';
    }
    wdUpdateConvertUI();
}

function wdUpdateConvertUI(){
    const local = wdState.net * wdState.localRate;
    const localEl  = document.getElementById('wdLocalAmount');
    const labelEl  = document.getElementById('wdLocalCurrLabel');
    const rateEl   = document.getElementById('wdRateDisplay');
    if(localEl)  localEl.textContent  = fmtLocal(local, wdState.localCode);
    if(labelEl)  labelEl.textContent  = wdState.localName + ' (' + wdState.localCode + ')';
    if(rateEl)   rateEl.textContent   = '1 USD = ' + wdState.localRate.toFixed(4) + ' ' + wdState.localCode;
}

//  Timer 
function wdStartTimer(){
    wdStopTimers();
    wdState.timerSec = 15;
    wdUpdateTimerUI();
    wdState.timerInterval = setInterval(function(){
        wdState.timerSec--;
        wdUpdateTimerUI();
        if(wdState.timerSec <= 0){
            wdState.timerSec = 15;
            wdFetchRate(); // refresh rate
        }
    }, 1000);
}

function wdUpdateTimerUI(){
    const s = wdState.timerSec;
    const dispEl  = document.getElementById('wdTimerDisplay');
    const inlEl   = document.getElementById('wdTimerInline');
    const barEl   = document.getElementById('wdTimerBar');
    const dotEl   = document.getElementById('wdTimerDot');
    if(dispEl) dispEl.textContent = '0:' + String(s).padStart(2,'0');
    if(inlEl)  inlEl.textContent  = s + 's';
    const pct = (s/15)*100;
    if(barEl)  barEl.style.width  = pct + '%';
    // color urgency
    if(dotEl){
        dotEl.style.background = s <= 5 ? '#f87171' : '#38bdf8';
    }
    if(barEl){
        barEl.style.background = s <= 5
            ? 'linear-gradient(90deg,#f87171,#fbbf24)'
            : 'linear-gradient(90deg,#38bdf8,#a855f7)';
    }
}

function wdStopTimers(){
    if(wdState.timerInterval){ clearInterval(wdState.timerInterval); wdState.timerInterval=null; }
    if(wdState.rateInterval){  clearInterval(wdState.rateInterval);  wdState.rateInterval=null; }
}

//  Confirm & submit to API 
window.wdConfirm = async function(){
    if(wdState.confirmed) return;

    var btn   = document.getElementById('wdConfirmBtn');
    var errEl = document.getElementById('wdMinWarning');

    // Final guard: re-check min/max before sending
    if(wdState.gross < 50){
        if(errEl){ errEl.textContent = 'Minimum withdrawal amount is $50.00.'; errEl.style.display = 'block'; }
        return;
    }
    if(wdState.gross > 999){
        if(errEl){ errEl.textContent = 'Maximum is $999.00 per transaction.'; errEl.style.display = 'block'; }
        return;
    }

    wdState.confirmed = true;
    wdStopTimers();
    if(btn){ btn.disabled=true; btn.textContent='Processing...'; btn.style.opacity='.6'; }
    if(errEl){ errEl.textContent=''; errEl.style.display='none'; }

    try {
        var user = (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser : null;

        if(!user){
            wdState.confirmed = false;
            if(btn){ btn.disabled=false; btn.textContent='Approve & Withdraw'; btn.style.opacity='1'; }
            closeWithdrawModal();
            if(typeof openAuthModal === 'function') openAuthModal();
            return;
        }

        var idToken = await user.getIdToken(true);

        var res = await fetch('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
            body: JSON.stringify({
                action:        'withdraw',
                paypalEmail:   wdState.email,
                method:        'paypal',
                requestedGross: wdState.gross
            })
        });

        var data = await res.json();

        if(!res.ok || data.error){
            wdState.confirmed = false;
            if(btn){ btn.disabled=false; btn.textContent='Approve & Withdraw'; btn.style.opacity='1'; }
            if(errEl){ errEl.textContent = data.error || 'Withdrawal failed. Please try again.'; errEl.style.display='block'; }
            return;
        }

        //  Update all balance displays from server response 
        var newBal = (typeof data.newBalance === 'number') ? data.newBalance : Math.max(0, (wdState.fullBalance||0) - wdState.gross);
        if(window._fbUserData) window._fbUserData.balance = newBal;
        var balEl = document.getElementById('acStatBalance');
        if(balEl) balEl.textContent = fmtUSD(newBal);
        var acWalEl = document.getElementById('acWalletBal');
        if(acWalEl) acWalEl.textContent = fmtUSD(newBal);
        var wpEl = document.getElementById('walletPillAmount');
        if(wpEl) wpEl.textContent = fmtUSD(newBal);

        //  Save entry to localStorage history 
        var entry = {
            id:          data.withdrawalId || ('wd_' + Date.now()),
            amount:      data.amount      || wdState.net,
            gross:       data.gross       || wdState.gross,
            fee:         data.fee         || wdState.fee,
            feeRate:     wdState.feeRate,
            email:       wdState.email,
            localAmount: (data.amount || wdState.net) * (wdState.localRate || 1),
            localCode:   wdState.localCode || 'USD',
            localRate:   wdState.localRate || 1,
            status:      data.status || 'pending',
            date:        new Date().toISOString(),
            plan:        wdState.plan
        };
        var key = 'siterifty_withdrawals';
        var hist = [];
        try { hist = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
        hist.unshift(entry);
        localStorage.setItem(key, JSON.stringify(hist));

        //  Show success step 
        setTimeout(function(){
            document.getElementById('wdSuccessAmt').textContent   = fmtUSD(entry.amount);
            document.getElementById('wdSuccessEmail').textContent = wdState.email;
            wdShowStep(4);
        }, 400);

    } catch(e) {
        wdState.confirmed = false;
        if(btn){ btn.disabled=false; btn.textContent='Approve & Withdraw'; btn.style.opacity='1'; }
        if(errEl){ errEl.textContent = 'Network error. Please try again.'; errEl.style.display='block'; }
    }
};

//  History modal 
window.openWithdrawHistory = function(){
    const overlay = document.getElementById('wdHistoryOverlay');
    if(!overlay) return;
    const list = document.getElementById('wdHistoryList');
    let history = [];
    try { history = JSON.parse(localStorage.getItem('siterifty_withdrawals') || '[]'); } catch(e){}
    if(!history.length){
        list.innerHTML = '<div style="text-align:center;padding:40px 0;"><div style="display:flex;justify-content:center;margin-bottom:12px;opacity:.3;color:var(--text);"><svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="3" y="8" width="30" height="22" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 14h30" stroke="currentColor" stroke-width="1.6"/><path d="M12 22h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div><div style="font-size:13px;color:var(--muted);">No withdrawals yet</div></div>';
    } else {
        const statusCfg = {
            pending:  { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.25)',  label:'Pending' },
            approved: { color:'#34d399', bg:'rgba(52,211,153,0.08)',  border:'rgba(52,211,153,0.25)',  label:'Approved' },
            declined: { color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.25)', label:'Declined' }
        };
        list.innerHTML = history.map(function(e){
            const cfg = statusCfg[e.status] || statusCfg.pending;
            const dt  = new Date(e.date);
            const dateStr = dt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
            return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:14px;padding:14px 16px;margin-bottom:10px;">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
                    + '<div><div style="font-family:\'Syne\',sans-serif;font-size:14px;font-weight:800;color:var(--text);">' + fmtUSD(e.amount) + '</div>'
                    + '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + dateStr + ' · PayPal · ' + e.email + '</div></div>'
                    + '<span style="font-size:10px;font-weight:700;font-family:\'Syne\',sans-serif;color:' + cfg.color + ';background:' + cfg.bg + ';border:1px solid ' + cfg.border + ';border-radius:999px;padding:3px 10px;">' + cfg.label + '</span>'
                + '</div>'
                + '<div style="display:flex;gap:16px;">'
                    + '<div><div style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;">Gross</div><div style="font-size:11px;font-weight:600;color:var(--text);">' + fmtUSD(e.gross) + '</div></div>'
                    + '<div><div style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;">Fee</div><div style="font-size:11px;font-weight:600;color:#f87171;">−' + fmtUSD(e.fee) + '</div></div>'
                    + '<div><div style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;">Local</div><div style="font-size:11px;font-weight:600;color:var(--text);">' + fmtLocal(e.localAmount, e.localCode || 'USD') + '</div></div>'
                + '</div>'
            + '</div>';
        }).join('');
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeWithdrawHistory = function(){
    const overlay = document.getElementById('wdHistoryOverlay');
    if(overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
};

//  Add history link in account section 
document.addEventListener('DOMContentLoaded', function(){
    // inject "View Withdrawal History" link after wallet balance row if logged in
    const walBal = document.getElementById('acWalletBal');
    if(walBal){
        const container = walBal.closest('[style*="padding:12px 20px"]');
        if(container && container.parentNode){
            const histRow = document.createElement('div');
            histRow.style.cssText = 'padding:10px 20px 14px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.05);';
            histRow.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">'
                + '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="opacity:.45;flex-shrink:0"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.1"/><path d="M4.5 6.5h4M6.5 4.5v4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>'
                + '<span style="font-size:12px;color:var(--muted);">Withdrawal history</span></div>'
                + '<button onclick="openWithdrawHistory()" style="font-size:10px;font-weight:700;font-family:\'Syne\',sans-serif;color:rgba(56,189,248,0.85);background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.22);border-radius:999px;padding:3px 9px;cursor:pointer;transition:opacity .15s;" onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'">View</button>';
            container.parentNode.insertBefore(histRow, container.nextSibling);
        }
    }
});


})();

//  Hero stats slot-machine animation — values persist across page loads (daily cache)
(function() {
    // Persistence key: resets at UTC midnight each day (matches /api/stats cadence)
    var _slotKey = 'sr_hero_slots_' + new Date().toISOString().slice(0, 10);

    // Fallback sequences used on very first visit (before /api/stats resolves)
    var defaultBuyers = [
        '1,000', '1,500', '2,000', '2,800', '3,500',
        '4,200', '5,100', '6,000', '7,200', '8,500', '10,000+'
    ];
    var defaultTransacted = [
        '$10K', '$15K', '$22K', '$31K', '$40K',
        '$52K', '$63K', '$74K', '$85K', '$95K', '$100K+'
    ];
    var fees = ['30%', '15%', '10%', '5%'];

    // Live sequences — overwritten once /api/stats resolves (see window._onHeroStats below)
    var buyers     = defaultBuyers.slice();
    var transacted = defaultTransacted.slice();

    // ── persistence helpers ──────────────────────────────────────────────────
    function _saveSlots(bVal, tVal, fVal) {
        try { localStorage.setItem(_slotKey, JSON.stringify({ b: bVal, t: tVal, f: fVal })); } catch(_) {}
    }
    function _loadSlots() {
        try {
            var raw = localStorage.getItem(_slotKey);
            if (raw) return JSON.parse(raw);
        } catch(_) {}
        return null;
    }

    // ── reel helpers ─────────────────────────────────────────────────────────
    function buildReel(el, items) {
        var reel = el.querySelector('.hero-slot-reel');
        reel.innerHTML = '';
        items.forEach(function(val) {
            var span = document.createElement('span');
            span.className = 'hero-slot-item';
            span.textContent = val;
            reel.appendChild(span);
        });
        var itemH = 20;
        el.style.height = itemH + 'px';
        reel.style.transform = 'translateY(0)';
        return { reel: reel, index: 0, total: items.length, itemH: itemH };
    }

    // Jump instantly to a specific value (no animation) — used when loading persisted data
    function jumpReel(el, items, value) {
        var idx = items.indexOf(value);
        if (idx < 0) idx = items.length - 1; // fallback to last
        var state = buildReel(el, items);
        state.index = idx;
        state.reel.style.transition = 'none';
        state.reel.style.transform = 'translateY(-' + (idx * state.itemH) + 'px)';
        return state;
    }

    function animateSlot(state, intervalMs, staggerMs, onDone) {
        var step = 0;
        function tick() {
            if (step >= state.total - 1) { if (onDone) onDone(); return; }
            step++;
            state.index = step;
            state.reel.style.transition = 'transform 0.18s cubic-bezier(0.22,1,0.36,1)';
            state.reel.style.transform = 'translateY(-' + (step * state.itemH) + 'px)';
            var delay = step >= state.total - 2 ? intervalMs * 1.8 : intervalMs;
            setTimeout(tick, delay);
        }
        setTimeout(tick, staggerMs);
    }

    // ── unpause hero CSS animations ──────────────────────────────────────────
    function _unpauseHero() {
        var statsEl = document.querySelector('.hero-stats');
        if (statsEl) statsEl.style.animationPlayState = 'running';

    }

    // ── main: show persisted values instantly OR animate + persist ────────────
    function startSlots() {
        var bEl = document.getElementById('slotBuyers');
        var tEl = document.getElementById('slotTransacted');
        var fEl = document.getElementById('slotFee');
        if (!bEl || !tEl || !fEl) return;

        _unpauseHero();

        var saved = _loadSlots();
        if (saved && saved.b && saved.t && saved.f) {
            // Already animated today — jump straight to the saved final values
            jumpReel(bEl, buyers,     saved.b);
            jumpReel(tEl, transacted, saved.t);
            jumpReel(fEl, fees,       saved.f);
            return;
        }

        // First visit today — run the animation then persist the final values
        var bFinal = buyers[buyers.length - 1];
        var tFinal = transacted[transacted.length - 1];
        var fFinal = fees[fees.length - 1];

        var bState = buildReel(bEl, buyers);
        var tState = buildReel(tEl, transacted);
        var fState = buildReel(fEl, fees);

        var startDelay = 400;
        var saved_ = false;
        function maybeSave() {
            if (saved_) return;
            saved_ = true;
            _saveSlots(bFinal, tFinal, fFinal);
        }

        animateSlot(bState, 700, startDelay, maybeSave);
        animateSlot(tState, 700, startDelay + 180);
        animateSlot(fState, 900, startDelay + 360);
    }

    // ── expose hook so /api/stats can update the sequences before animation ──
    // Called by the LIVE STATS script below when real data arrives
    window._onHeroStats = function(s) {
        // Build sequences that end on the real live value from the API
        // s.a = sellers/buyers (e.g. "12"), s.b = sites listed, fee is always 5%
        var liveB = s.a + 'k+';
        var liveT = s.b + 'k+'; // use listed count as proxy for transacted if no dedicated field

        // Only update if the live value isn't already the last item
        if (buyers[buyers.length - 1] !== liveB) {
            // Rebuild sequence ending at live value
            buyers = defaultBuyers.slice();
            if (buyers.indexOf(liveB) < 0) { buyers[buyers.length - 1] = liveB; }
        }
        if (transacted[transacted.length - 1] !== liveT) {
            transacted = defaultTransacted.slice();
            if (transacted.indexOf(liveT) < 0) { transacted[transacted.length - 1] = liveT; }
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        var bEl = document.getElementById('slotBuyers');
        var tEl = document.getElementById('slotTransacted');
        var fEl = document.getElementById('slotFee');
        if (!bEl || !tEl || !fEl) return;

        // Pre-build reels so the first item is visible during the loader
        buildReel(bEl, buyers);
        buildReel(tEl, transacted);
        buildReel(fEl, fees);

        // Hook into loader dismissal signal
        var prev = window._signalLoaderReady;
        window._signalLoaderReady = function() {
            if (prev) prev();
            startSlots();
        };

        // Safety fallback
        setTimeout(function() {
            var statsEl = document.querySelector('.hero-stats');
            if (statsEl && statsEl.style.animationPlayState !== 'running') {
                startSlots();
            }
        }, 3000);
    });
})();

//  Hero ticker — rotates phrases every 2s, text slides up from bottom 
(function() {
    var phrases = [
        'Buy &amp; sell sites',
        'Lowest fees',
        'Vetted listings',
        'Secure escrow',
        'For indie hackers',
        '10K+ buyers',
        'Close deals fast'
    ];
    var idx = 0;

    function nextPhrase() {
        var slot = document.getElementById('tickerWord');
        if (!slot) return;
        slot.classList.remove('entering');
        slot.classList.add('leaving');
        setTimeout(function() {
            idx = (idx + 1) % phrases.length;
            slot.innerHTML = phrases[idx];
            slot.classList.remove('leaving');
            slot.classList.add('entering');
        }, 290);
    }

    document.addEventListener('DOMContentLoaded', function() {
        setInterval(nextPhrase, 2000);
    });
})();

//  Seller Reputation Search 
// Debounced: waits 400ms after typing stops before hitting Firebase.
// On explicit button click (force=true) runs immediately.
(function() {
    var _srTimer = null;
    var _srLast  = '';

    window.sellerRepSearch = function(raw, force) {
        var q = (raw || '').trim().toLowerCase().replace(/^@/, '');
        if (!q) {
            _showRepPlaceholder();
            _srLast = '';
            clearTimeout(_srTimer);
            return;
        }
        if (q === _srLast && !force) return; // same query, no change

        clearTimeout(_srTimer);
        var delay = force ? 0 : 400;
        _srTimer = setTimeout(function() { _doSearch(q); }, delay);
    };

    function _showRepPlaceholder() {
        var el = document.getElementById('sellerRepResults');
        if (!el) return;
        el.innerHTML = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="display:block;margin:0 auto 10px;opacity:0.25;"><circle cx="18" cy="12" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M5 32c0-7 5.8-12 13-12s13 5 13 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div style="font-size:12px;color:rgba(139,138,168,0.4);">Enter a username to look up their reputation score</div>';
        el.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:20px;text-align:center;';
    }

    function _showRepLoading() {
        var el = document.getElementById('sellerRepResults');
        if (!el) return;
        el.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:20px;text-align:center;';
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:var(--muted);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation:spin 1s linear infinite;flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="40" stroke-dashoffset="10" stroke-linecap="round"/></svg>Searching…</div>';
    }

    function _doSearch(username) {
        _srLast = username;
        _showRepLoading();

        var fns = window._fbDbFns;
        var db  = window._fbDb || window._db;
        if (!fns || !db) {
            _showRepError('Firebase not ready. Please try again.');
            return;
        }
        var ref = fns.ref, get = fns.get;

        // Step 1: look up uid from usernames index (one cheap read)
        get(ref(db, 'usernames/' + username)).then(function(snap) {
            if (!snap || !snap.exists()) {
                _showRepNotFound(username);
                return;
            }
            var uid = snap.val();
            // Step 2: fetch user profile (one read)
            return get(ref(db, 'users/' + uid)).then(function(uSnap) {
                if (!uSnap || !uSnap.exists()) { _showRepNotFound(username); return; }
                _showRepProfile(uSnap.val(), uid);
            });
        }).catch(function(err) {
            console.warn('[sellerRepSearch]', err);
            _showRepError('Could not load profile. Check your connection.');
        });
    }

    function _showRepNotFound(username) {
        var el = document.getElementById('sellerRepResults');
        if (!el) return;
        el.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.13);border-radius:13px;padding:20px;text-align:center;';
        el.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;">@' + _esc(username) + ' not found</div>'
            + '<div style="font-size:11px;color:var(--muted);">No Siterifty account with that username.</div>';
    }

    function _showRepError(msg) {
        var el = document.getElementById('sellerRepResults');
        if (!el) return;
        el.style.cssText = 'background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.2);border-radius:13px;padding:20px;text-align:center;';
        el.innerHTML = '<div style="font-size:12px;color:var(--red);">' + _esc(msg) + '</div>';
    }

    function _showRepProfile(data, uid) {
        var el = document.getElementById('sellerRepResults');
        if (!el) return;

        var username   = data.username || 'Unknown';
        var plan       = (data.plan || 'Free');
        var planLow    = plan.toLowerCase();
        var deals      = parseInt(data.transactions || data.deals || 0);
        var rating     = parseFloat(data.rating || 0);
        var joinedTs   = data.createdAt || null;
        var lastSeenTs = data.lastSeen  || null;
        var listings   = parseInt(data.listingCount || 0);
        var bio        = data.bio || '';

        // Avatar
        var GRADS = [['#9b5de5','#e879a0'],['#38bdf8','#818cf8'],['#2dd4a0','#38bdf8'],['#f5c842','#f97316'],['#e879a0','#fb7185'],['#818cf8','#9b5de5']];
        var h = 0; for (var i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
        var gc = GRADS[h % GRADS.length];
        var avStyle = 'background:linear-gradient(135deg,' + gc[0] + ',' + gc[1] + ');';
        var avHtml = data.photoURL
            ? '<img src="' + _esc(data.photoURL) + '" style="width:100%;height:100%;object-fit:cover;border-radius:999px;" onerror="this.style.display=\'none\'">'
            : username.charAt(0).toUpperCase();

        // Plan badge colour
        var planColor = planLow === 'pro' ? '#a855f7' : planLow === 'growth' ? '#38bdf8' : planLow === 'starter' ? '#34d399' : 'var(--muted)';

        // Stars
        var starsHtml = '';
        for (var s = 1; s <= 5; s++) {
            starsHtml += '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1l1.18 2.39L9 3.82 7 5.76l.47 2.74L5 7.23 2.53 8.5 3 5.76 1 3.82l2.82-.43Z" fill="' + (s <= Math.round(rating) ? '#f5c842' : 'rgba(255,255,255,0.12)') + '"/></svg>';
        }

        // Joined / last seen
        var joinedStr  = joinedTs  ? 'Joined ' + _relDate(joinedTs)  : '';
        var lastStr    = lastSeenTs ? 'Active ' + _relDate(lastSeenTs) : '';

        el.style.cssText = 'border:1px solid rgba(255,255,255,0.1);border-radius:13px;overflow:hidden;';
        el.innerHTML = '<div style="padding:16px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.03);">'
            + '<div style="width:44px;height:44px;border-radius:999px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:\'Syne\',sans-serif;font-size:18px;font-weight:800;color:#fff;overflow:hidden;' + avStyle + '">' + avHtml + '</div>'
            + '<div style="flex:1;min-width:0;">'
            +   '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
            +     '<span style="font-family:\'Syne\',sans-serif;font-size:14px;font-weight:800;color:var(--text);">@' + _esc(username) + '</span>'
            +     '<span style="font-size:9px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:4px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);color:' + planColor + ';">' + _esc(plan).toUpperCase() + '</span>'
            +   '</div>'
            +   (bio ? '<div style="font-size:11px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(bio) + '</div>' : '')
            +   '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + (joinedStr ? joinedStr : '') + (lastStr && joinedStr ? ' · ' : '') + (lastStr || '') + '</div>'
            + '</div>'
            + '</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:rgba(255,255,255,0.07);">'
            +   _statCell(deals, 'Deals')
            +   _statCell(listings, 'Listings')
            +   _statCell(rating > 0 ? rating.toFixed(1) : '—', 'Rating', rating > 0 ? starsHtml : '')
            + '</div>';
    }

    function _statCell(val, label, extra) {
        return '<div style="background:var(--surface);padding:12px 8px;text-align:center;">'
            + '<div style="font-family:\'Syne\',sans-serif;font-size:16px;font-weight:800;color:var(--text);">' + val + '</div>'
            + '<div style="font-size:9.5px;color:var(--muted);margin-top:2px;">' + label + '</div>'
            + (extra ? '<div style="display:flex;gap:1px;justify-content:center;margin-top:4px;">' + extra + '</div>' : '')
            + '</div>';
    }

    function _relDate(ts) {
        var sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 86400)     return 'today';
        if (sec < 86400*7)   return Math.floor(sec/86400) + 'd ago';
        if (sec < 86400*30)  return Math.floor(sec/86400/7) + 'w ago';
        if (sec < 86400*365) return Math.floor(sec/86400/30) + 'mo ago';
        return Math.floor(sec/86400/365) + 'y ago';
    }

    function _esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();

//  Messages modal open/close 
        var _inboxUnsubscribe = null;

        function _imsgTimeAgo(ts) {
            if (!ts) return '';
            var diff = Date.now() - ts;
            var m = Math.floor(diff / 60000);
            if (m < 1)  return 'just now';
            if (m < 60) return m + 'm ago';
            var h = Math.floor(m / 60);
            if (h < 24) return h + 'h ago';
            var d = Math.floor(h / 24);
            return d + 'd ago';
        }

        function _renderInboxThreads(messages, myUid) {
            var list = document.getElementById('imsgThreadList');
            var empty = document.getElementById('imsgThreadEmpty');
            if (!list) return;

            // Group messages by conversation partner
            var threads = {};
            Object.keys(messages || {}).forEach(function(msgId) {
                var msg = messages[msgId];
                if (!msg) return;
                // Partner is whoever isn't me
                var partnerUid  = (msg.fromUid === myUid) ? msg.toUid   : msg.fromUid;
                var partnerName = (msg.fromUid === myUid) ? (msg.toName || msg.toUid || 'Buyer') : (msg.fromUsername || msg.fromEmail || 'Buyer');
                if (!partnerUid) return;
                if (!threads[partnerUid] || (msg.sentAt || 0) > (threads[partnerUid].sentAt || 0)) {
                    threads[partnerUid] = {
                        partnerUid:  partnerUid,
                        partnerName: partnerName,
                        message:     msg.message || '',
                        sentAt:      msg.sentAt  || 0,
                        read:        msg.read !== false,
                        listingTitle: msg.listingTitle || ''
                    };
                }
                // Count unread (messages TO me that are unread)
                if (msg.toUid === myUid && !msg.read) {
                    threads[partnerUid] = threads[partnerUid] || {};
                    threads[partnerUid].unread = (threads[partnerUid].unread || 0) + 1;
                }
            });

            var sorted = Object.values(threads).sort(function(a,b){ return (b.sentAt||0)-(a.sentAt||0); });

            // Remove old thread rows (keep empty placeholder + pinned group chat row)
            Array.from(list.querySelectorAll('.imsg-thread-row')).forEach(function(el){
                if (el.id === 'imsgGroupChatRow') return;
                el.remove();
            });

            if (sorted.length === 0) {
                if (empty) empty.style.display = '';
                return;
            }
            if (empty) empty.style.display = 'none';

            sorted.forEach(function(t) {
                var initials = (t.partnerName||'?').slice(0,2).toUpperCase();
                var preview  = t.message.length > 60 ? t.message.slice(0,60)+'…' : t.message;
                var timeStr  = _imsgTimeAgo(t.sentAt);
                var unreadBadge = (t.unread && !t.read) ? '<div class="imsg-thread-unread">' + (t.unread||1) + '</div>' : '';


                var row = document.createElement('div');
                row.className = 'imsg-thread-row';
                row.innerHTML =
                    '<div class="imsg-thread-avatar-wrap">'
                    + '<div class="imsg-thread-avatar" style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:999px;background:linear-gradient(135deg,#9b5de5,#e879a0);font-family:\'Syne\',sans-serif;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;">' + initials + '</div>'
                    + '<span class="imsg-thread-dot"></span>'
                    + '</div>'
                    + '<div class="imsg-thread-body">'
                    + '<div class="imsg-thread-top">'
                    + '<h4 class="imsg-thread-name" style="display:flex;align-items:center;gap:2px;">@' + (t.partnerName||'User') + '</h4>'
                    + '<span class="imsg-thread-time">' + timeStr + '</span>'
                    + '</div>'
                    + '<p class="imsg-thread-preview">' + (t.listingTitle ? '[' + t.listingTitle + '] ' : '') + preview + '</p>'
                    + '</div>'
                    + unreadBadge;

                row.addEventListener('click', function() {
                    openChat(t.partnerName, '', 'Buyer', t.partnerUid, t.partnerUid);
                    // Mark messages as read
                    _markInboxRead(myUid, t.partnerUid);
                });
                list.appendChild(row);
            });
        }

        function _markInboxRead(myUid, partnerUid) {
            try {
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                if (!db || !fns || !fns.ref || !fns.get || !fns.update) return;
                fns.get(fns.ref(db, 'users/' + myUid + '/inbox')).then(function(snap) {
                    if (!snap.exists()) return;
                    var updates = {};
                    snap.forEach(function(child) {
                        var msg = child.val();
                        if (msg && msg.fromUid === partnerUid && !msg.read) {
                            updates['users/' + myUid + '/inbox/' + child.key + '/read'] = true;
                        }
                    });
                    if (Object.keys(updates).length > 0) fns.update(fns.ref(db, '/'), updates).catch(function(){});
                }).catch(function(){});
            } catch(e) {}
        }

        function _loadInbox(uid) {
            // Unsubscribe previous listener
            if (_inboxUnsubscribe) { try { _inboxUnsubscribe(); } catch(e){} _inboxUnsubscribe = null; }

            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.onValue) return;

            // Listen to inbox in realtime
            var inboxRef = fns.ref(db, 'users/' + uid + '/inbox');
            _inboxUnsubscribe = fns.onValue(inboxRef, function(snap) {
                var msgs = snap.exists() ? snap.val() : {};
                _renderInboxThreads(msgs, uid);
                // Update unread badge on FAB/tab
                var unread = 0;
                Object.values(msgs||{}).forEach(function(m){ if (m && m.toUid === uid && !m.read) unread++; });
            }, function(err) { console.warn('[inbox]', err); });
        }

        window.openMessagesModal = function(){
            var overlay = document.getElementById('messagesOverlay');
            overlay.classList.add('open');
            if (window._lockBodyScroll) window._lockBodyScroll();
            var userData = window._fbUserData;
            var authUser = window._fbAuth && window._fbAuth.currentUser;
            var username = (userData && userData.username) || (authUser && authUser.email ? authUser.email.split('@')[0] : 'user');
            var uid      = (authUser && authUser.uid) || (userData && userData.uid) || '';
            var unameEl  = document.getElementById('imsgMyUsername');
            var avEl     = document.getElementById('imsgMyAvatar');
            if (unameEl) unameEl.textContent = '@' + username;
            if (avEl)    avEl.textContent    = username.charAt(0).toUpperCase();
            refreshPlanUI();
            // Load real inbox from Firebase
            if (uid) _loadInbox(uid);
        };
        window.closeMessagesModal = function(){
            document.getElementById('messagesOverlay').classList.remove('open');
            if (window._unlockBodyScroll) window._unlockBodyScroll();
            if (_inboxUnsubscribe) { try { _inboxUnsubscribe(); } catch(e){} _inboxUnsubscribe = null; }
        };

        // ── Real daily message counter persisted in localStorage ──
        function _msgDayKey(uid) {
            const d = new Date();
            return 'sr_msgs_' + (uid || 'guest') + '_' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        }
        function getRealMsgCount(uid) {
            try { return parseInt(localStorage.getItem(_msgDayKey(uid)) || '0', 10); } catch(_) { return 0; }
        }
        function setRealMsgCount(uid, n) {
            try {
                // Clear old keys for this user
                const prefix = 'sr_msgs_' + (uid || 'guest') + '_';
                const curKey = _msgDayKey(uid);
                Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix) && k !== curKey) localStorage.removeItem(k); });
                localStorage.setItem(curKey, String(n));
            } catch(_) {}
        }
        function getUidForMsg() {
            return (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || 'guest';
        }

        // ── Hourly image counter persisted in localStorage ──
        function _imgHourKey(uid) {
            const d = new Date();
            return 'sr_imgs_' + (uid || 'guest') + '_' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + '-' + d.getHours();
        }
        function getRealImgCount(uid) {
            try { return parseInt(localStorage.getItem(_imgHourKey(uid)) || '0', 10); } catch(_) { return 0; }
        }
        function setRealImgCount(uid, n) {
            try {
                const prefix = 'sr_imgs_' + (uid || 'guest') + '_';
                const curKey = _imgHourKey(uid);
                Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix) && k !== curKey) localStorage.removeItem(k); });
                localStorage.setItem(curKey, String(n));
            } catch(_) {}
        }

        let messagesSentToday = getRealMsgCount(getUidForMsg());
        let imagesSentToday = getRealImgCount(getUidForMsg());
        let contextDealMode = 'send';
        let dealsRegistry = {};
        let _msgReportRegistry = {};
        let _msgReportSeq = 0;
        let targetPendingPaymentPrice = 0;
        let targetPendingDealId = null;
        let _activeStickyDealId = null;
        let _stickyCountdownTimer = null;

        const mockListings = [
            { id: 'list_1', title: 'Minimisty Fan Store', price: 500, desc: 'Complete high-converting Shopify build with inventory automation loops.', img: 'https://images.unsplash.com/photo-1619244434231-c4238db3005a?auto=format&fit=crop&w=300&q=80' },
            { id: 'list_2', title: 'Siterifty Platform Engine', price: 850, desc: 'Full-stack platform code. Configured for high performance.', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80' },
            { id: 'list_3', title: 'SaaS Bundle Asset Pack', price: 300, desc: 'Includes nextjs design layouts and active API webhook integrations.', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80' }
        ];

        const tierConfig = {
            Free:    { msgLimit: 50,   imgLimit: 3,  fileSize: 1 },
            Starter: { msgLimit: 500,  imgLimit: 10, fileSize: 3 },
            Growth:  { msgLimit: 1500, imgLimit: 20, fileSize: 3 },
            Pro:     { msgLimit: 5000, imgLimit: 30, fileSize: 3 }
        };

        function getCurrentPlan() {
            const plan = (window._fbUserData && window._fbUserData.plan) || 'Free';
            return tierConfig[plan] ? plan : 'Free';
        }

        function refreshPlanUI() {
            const plan = getCurrentPlan();
            const badge = document.getElementById('userTierBadge');
            const upgradeBtn = document.getElementById('imsgUpgradeBtn');
            if (badge) badge.textContent = plan + ' Plan';
            if (upgradeBtn) upgradeBtn.style.display = (plan === 'Pro') ? 'none' : 'inline-flex';
            // Always sync from localStorage before updating UI
            messagesSentToday = getRealMsgCount(getUidForMsg());
            updateSystemCountersUI();
        }

        function updateSystemCountersUI() {
            const plan = getCurrentPlan();
            const config = tierConfig[plan];
            // Re-read from localStorage so count is always accurate after refresh
            messagesSentToday = getRealMsgCount(getUidForMsg());
            document.getElementById('msgCounterDisplay').innerText = messagesSentToday;
            document.getElementById('msgLimitDisplay').innerText = config.msgLimit;
            const msgPercentage = Math.min((messagesSentToday / config.msgLimit) * 100, 100);
            document.getElementById('msgProgressBar').style.width = `${msgPercentage}%`;
        }

        function incrementMsgCount() {
            const uid = getUidForMsg();
            const n = getRealMsgCount(uid) + 1;
            setRealMsgCount(uid, n);
            messagesSentToday = n;
        }

        function checkMessageQuota() {
            const plan = getCurrentPlan();
            const config = tierConfig[plan];
            messagesSentToday = getRealMsgCount(getUidForMsg());
            if (messagesSentToday >= config.msgLimit) {
                showCustomAlert(`Daily text limit reached on your ${plan} plan. Upgrade for a higher quota.`);
                return false;
            }
            return true;
        }

        var _currentChatUid = '';
        var _currentChatName = '';
        var _currentChatPhoto = '';

        var _chatMsgUnsubscribe = null;

        function openChat(name, avatarUrl, status, uid) {
            _currentChatUid   = uid || '';
            _currentChatName  = name || '';
            _currentChatPhoto = avatarUrl || '';

            // Reset sticky deal banner — this mock demo only tracks one active deal at a time
            _activeStickyDealId = null;
            if (_stickyCountdownTimer) { clearInterval(_stickyCountdownTimer); _stickyCountdownTimer = null; }
            var stickyBanner = document.getElementById('dealStickyBanner');
            if (stickyBanner) stickyBanner.classList.remove('show');

            // Name row with admin/verified badges if applicable
            var nameEl = document.getElementById('chatTargetName');
            if (nameEl) {
                nameEl.textContent = '@' + (name || 'User');
            }

            var avatarEl = document.getElementById('chatAvatar');
            if (avatarEl) {
                if (avatarUrl) { avatarEl.src = avatarUrl; avatarEl.style.display = ''; }
                else { avatarEl.src = ''; avatarEl.style.display = 'none'; }
            }
            var statusEl = document.getElementById('chatTargetStatus');
            if (statusEl) statusEl.innerText = status || '';

            document.getElementById('imsgChatView').classList.add('open');

            // Load real messages from Firebase
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            var container = document.getElementById('chatMessagesContent');
            if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Loading messages…</div>';

            if (_chatMsgUnsubscribe) { try { _chatMsgUnsubscribe(); } catch(e){} _chatMsgUnsubscribe = null; }

            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.onValue || !myUid) {
                if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Sign in to view messages.</div>';
                return;
            }

            // Listen to my inbox for messages from this partner
            var inboxRef = fns.ref(db, 'users/' + myUid + '/inbox');
            _chatMsgUnsubscribe = fns.onValue(inboxRef, function(snap) {
                var msgs = [];
                if (snap.exists()) {
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (!m) return;
                        // Show messages that involve this partner
                        if (m.fromUid === uid || m.toUid === uid) {
                            msgs.push(m);
                        }
                    });
                }
                msgs.sort(function(a,b){ return (a.sentAt||0)-(b.sentAt||0); });

                if (!container) return;
                if (msgs.length === 0) {
                    container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">No messages yet. Start the conversation!</div>';
                    return;
                }
                container.innerHTML = '';
                msgs.forEach(function(m) {
                    var isMe = m.fromUid === myUid;
                    var time = _imsgTimeAgo(m.sentAt);

                    // Image message
                    if (m.type === 'image' && m.fileUrl) {
                        var escapedName = (m.fileName || 'image').replace(/'/g, "\\'");
                        var imgBubbleStyle = isMe
                            ? 'border-bottom-right-radius:0;border-bottom-left-radius:16px;'
                            : 'border-bottom-left-radius:0;border-bottom-right-radius:16px;';
                        var imgDots = _msgActionsHtml(m, isMe);
                        container.insertAdjacentHTML('beforeend',
                            '<div class="' + (isMe ? 'imsg-bubble-out' : 'imsg-bubble-in') + '">'
                            + (isMe ? imgDots : '')
                            + '<div class="imsg-img-bubble" style="' + imgBubbleStyle + '">'
                            + '<div class="imsg-img-frame">'
                            + '<img src="' + m.fileUrl + '" alt="">'
                            + '<div class="imsg-img-hover">'
                            + '<button onclick="openImageInPopup(\'' + m.fileUrl + '\', \'' + escapedName + '\')" class="imsg-img-view-btn">'
                            + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>VIEW IMAGE'
                            + '</button></div></div>'
                            + '<div class="imsg-img-meta"><span class="imsg-img-filename">' + (m.fileName || '') + '</span>'
                            + '<button onclick="openImageInPopup(\'' + m.fileUrl + '\', \'' + escapedName + '\')" class="imsg-img-view-link">VIEW</button>'
                            + '</div></div>'
                            + (isMe ? '' : imgDots)
                            + '<div style="font-size:10px;color:var(--muted,#6b6890);text-align:' + (isMe ? 'right' : 'left') + ';margin-top:3px;">' + time + '</div>'
                            + '</div>');
                        return;
                    }


                    // Document message — supports both legacy fileUrl and new base64 fileData
                    if (m.type === 'document' && (m.fileUrl || m.fileData)) {
                        appendDocumentMessage(
                            m.fileName || 'document',
                            m.fileUrl   || null,
                            m.fileData  || null,
                            m.mimeType  || 'application/octet-stream',
                            isMe,
                            time,
                            m
                        );
                        return;
                    }

                    // Deal card message — reconstruct full card from stored payload
                    if (m.type === 'deal' && m.deal) {
                        var d      = m.deal;
                        var dealId = m.dealId || ('deal_' + m.sentAt);

                        // The *recipient* (not the sender) is the one who approves/rejects.
                        var iAmRecipient = !isMe;
                        var sellerIsMe   = iAmRecipient;

                        // Always restore/update the registry entry from Firebase data so
                        // status changes written by _syncDealStatus are picked up on re-render.
                        dealsRegistry[dealId] = {
                            id:         d.id,
                            title:      d.title,
                            desc:       d.desc,
                            price:      d.price,
                            img:        d.img,
                            mode:       d.mode,
                            status:     d.status || 'pending',
                            sellerIsMe: sellerIsMe
                        };

                        var labelIcon = d.mode === 'send'
                            ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.1a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-4.1M16 6.5l-4-4-4 4m4-4v12.5"/></svg>'
                            : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 17.5v-12.5l4 4 4-4v12.5M4 19.5h16"/></svg>';
                        var labelText  = d.mode === 'send' ? 'MARKETPLACE CONTRACT OFFER' : 'INBOUND ACQUISITION REQUEST';
                        var labelClass = d.mode === 'send' ? 'send' : 'request';
                        var cardClass  = d.mode === 'send' ? '' : 'request';
                        var status     = dealsRegistry[dealId].status;

                        var actionsHtml = sellerIsMe && status === 'pending'
                            ? '<div class="imsg-deal-actions">'
                              + '<button onclick="handleReceiverAction(\'' + dealId + '\', \'approve\')" class="imsg-deal-btn approve">APPROVE</button>'
                              + '<button onclick="handleReceiverAction(\'' + dealId + '\', \'reject\')" class="imsg-deal-btn reject">REJECT</button>'
                              + '</div>'
                            : '<div class="imsg-deal-lock" style="justify-content:center;"><span>'
                              + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v.008M5.25 7.5h13.5A2.25 2.25 0 0 1 21 9.75v7.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25v-7.5A2.25 2.25 0 0 1 5.25 7.5Z"/></svg>'
                              + 'Waiting on the other party\'s decision</span></div>';

                        var approvedOverlayStyle = status === 'approved' ? 'display:flex;' : '';
                        var rejectedOverlayStyle = status === 'rejected' ? 'display:flex;' : '';
                        var dealDots = '<div style="position:absolute;top:6px;right:6px;z-index:2;">' + _msgActionsHtml(m, isMe) + '</div>';

                        container.insertAdjacentHTML('beforeend',
                            '<div id="wrapper_' + dealId + '" class="' + (isMe ? 'imsg-bubble-out' : 'imsg-bubble-in') + '">'
                            + '<div class="imsg-deal-card ' + cardClass + '" style="position:relative;">'
                            + dealDots
                            + '<div id="overlay_approved_' + dealId + '" class="imsg-deal-overlay approved" style="' + approvedOverlayStyle + '">'
                            + '<div class="imsg-deal-overlay-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>'
                            + '<span class="imsg-deal-overlay-title">DEAL APPROVED</span>'
                            + '<p class="imsg-deal-overlay-sub">Awaiting payment from buyer</p>'
                            + '</div>'
                            + '<div id="overlay_rejected_' + dealId + '" class="imsg-deal-overlay rejected" style="' + rejectedOverlayStyle + '">'
                            + '<div class="imsg-deal-overlay-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg></div>'
                            + '<span class="imsg-deal-overlay-title">DEAL REJECTED</span>'
                            + '<p class="imsg-deal-overlay-sub">Merchant context parameters closed by receiver side parameters</p>'
                            + '</div>'
                            + '<div><span class="imsg-deal-label ' + labelClass + '">' + labelIcon + labelText + '</span>'
                            + '<span class="imsg-deal-id">ID: ' + dealId + '</span></div>'
                            + '<div class="imsg-deal-listing">'
                            + '<img src="' + (d.img || '') + '" alt="">'
                            + '<div class="imsg-deal-listing-body">'
                            + '<h5 class="imsg-deal-listing-title">' + (d.title || '') + '</h5>'
                            + '<p class="imsg-deal-listing-desc">' + (d.desc || '') + '</p>'
                            + '<span class="imsg-deal-listing-price">$' + (d.price || 0) + '</span>'
                            + '</div></div>'
                            + '<div style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">'
                            + actionsHtml
                            + '<div class="imsg-deal-lock"><span>'
                            + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>'
                            + 'Sender Security Lock Active</span></div>'
                            + '</div></div></div>'
                            + '<div style="font-size:10px;color:var(--muted,#6b6890);text-align:' + (isMe?'right':'left') + ';margin-top:3px;">' + time + '</div>'
                        );

                        // Restore sticky banner for pending deal on my end
                        if (status === 'pending' && sellerIsMe) {
                            dealsRegistry[dealId].respondBy = dealsRegistry[dealId].respondBy || (m.sentAt + (3*24*60*60*1000));
                            _activeStickyDealId = dealId;
                            updateDealStickyBanner(dealId);
                        }

                        // For REQUEST deals: sender=buyer. When the seller approves, Firebase updates
                        // the status to 'approved'. The next inbox re-render triggers this block on the
                        // buyer's side — open the payment modal so the buyer can complete the purchase.
                        if (status === 'approved' && isMe && d.mode === 'request') {
                            var _prevStatus = window._dealLastSeenStatus && window._dealLastSeenStatus[dealId];
                            if (_prevStatus !== 'approved') {
                                if (!window._dealLastSeenStatus) window._dealLastSeenStatus = {};
                                window._dealLastSeenStatus[dealId] = 'approved';
                                targetPendingPaymentPrice = d.price;
                                targetPendingDealId = dealId;
                                var _modal = document.getElementById('paymentProcessingModal');
                                var _setEl = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val || '—'; };
                                var _setImg = function(id, src) { var el = document.getElementById(id); if (el) el.src = src || ''; };
                                _setEl('dealApprovalTitle', d.title || 'Listing');
                                _setEl('dealApprovalDesc',  d.desc  || '');
                                _setEl('dealApprovalPrice', d.price ? '$' + Number(d.price).toLocaleString() : '—');
                                _setEl('paymentValueDisplay', '$' + d.price);
                                _setEl('paymentDescription', 'Authorize direct allocation transfer for "' + d.title + '"');
                                _setImg('dealApprovalImg', d.img || '');
                                if (_modal) { _modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
                            }
                        }
                        if (status !== 'pending' && _activeStickyDealId === dealId) {
                            updateDealStickyBanner(dealId);
                        }
                        return;
                    }

                    // Link message — render as rich clickable card, not raw text
                    if (m.type === 'link' && m.linkUrl) {
                        var linkTitle = (m.linkTitle || m.linkUrl).replace(/</g,'&lt;').replace(/>/g,'&gt;');
                        var linkUrl   = (m.linkUrl || '').replace(/"/g,'&quot;');
                        var bubbleClass = isMe ? 'imsg-bubble-out' : 'imsg-bubble-in';
                        var linkCorner  = isMe
                            ? 'border-bottom-right-radius:0;'
                            : 'border-bottom-left-radius:0;';
                        var linkDots = _msgActionsHtml(m, isMe);
                        container.insertAdjacentHTML('beforeend',
                            '<div class="' + bubbleClass + '">'
                            + (isMe ? linkDots : '')
                            + '<div class="imsg-bubble-link" style="' + linkCorner + '">'
                            + '<span class="imsg-bubble-link-tag">'
                            + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>'
                            + 'LINK EMBED</span>'
                            + '<h5>' + linkTitle + '</h5>'
                            + '<a href="' + linkUrl + '" target="_blank">' + linkUrl + '</a>'
                            + '</div>'
                            + (isMe ? '' : linkDots)
                            + '<div style="font-size:10px;color:var(--muted,#6b6890);text-align:' + (isMe ? 'right' : 'left') + ';margin-top:3px;">' + time + '</div>'
                            + '</div>');
                        return;
                    }


                    // Plain text message
                    var text = (m.message || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    var dots = _msgActionsHtml(m, isMe);
                    if (isMe) {
                        container.insertAdjacentHTML('beforeend',
                            '<div class="imsg-bubble-out">' + dots + '<div class="imsg-bubble-out-content">' + text + '</div>'
                            + '<div style="font-size:10px;color:var(--muted,#6b6890);text-align:right;margin-top:3px;">' + time + '</div></div>');
                    } else {
                        container.insertAdjacentHTML('beforeend',
                            '<div class="imsg-bubble-in"><div class="imsg-bubble-in-content">' + text + '</div>' + dots
                            + '<div style="font-size:10px;color:var(--muted,#6b6890);margin-top:3px;">' + time + '</div></div>');
                    }
                });
                scrollToLatest();
            }, function(err) { console.warn('[chat msgs]', err); });
        }

        function viewChatSeller() {
            if (_currentChatUid) {
                window.location.href = '/user-profile?uid=' + _currentChatUid;
            } else {
                showCustomAlert('Seller profile not available.');
            }
        }

        // ── Per-message "3 dots" → Report message → escalate to AI assistant ──
        // Builds a small, readable summary of a buyer/seller message and stores it
        // in a registry keyed by id, so the click handler never has to inline-escape
        // arbitrary message text into an onclick attribute.
        function _msgSummaryFor(m, isMe) {
            if (m.type === 'image') return '[Image attachment' + (m.fileName ? ': ' + m.fileName : '') + ']';
            if (m.type === 'document') return '[Document attachment' + (m.fileName ? ': ' + m.fileName : '') + ']';
            if (m.type === 'deal' && m.deal) return '[Deal card: "' + (m.deal.title || 'Untitled listing') + '" — $' + (m.deal.price || 0) + ']';
            if (m.type === 'link') return '[Link: ' + (m.linkTitle || m.linkUrl || '') + ']';
            return m.message || '';
        }

        function _msgActionsHtml(m, isMe) {
            var id = 'mr_' + (++_msgReportSeq);
            _msgReportRegistry[id] = {
                text: _msgSummaryFor(m, isMe),
                type: m.type || 'text',
                fromUid: m.fromUid || '',
                toUid: m.toUid || '',
                sentAt: m.sentAt || Date.now(),
                isMe: !!isMe,
                partnerName: (document.getElementById('chatTargetName') && document.getElementById('chatTargetName').textContent) || 'this user'
            };
            return '<button type="button" class="imsg-msg-dots" onclick="openMsgReportMenu(event,\'' + id + '\')" title="More" aria-label="Message options">'
                + '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/></svg>'
                + '</button>';
        }

        var _msgReportMenuTargetId = null;

        window.openMsgReportMenu = function(evt, id) {
            evt.stopPropagation();
            _msgReportMenuTargetId = id;
            var menu = document.getElementById('msgReportMenu');
            if (!menu) return;
            var btnRect = evt.currentTarget.getBoundingClientRect();
            var menuWidth = 180;
            var left = Math.min(btnRect.left, window.innerWidth - menuWidth - 12);
            menu.style.left = Math.max(8, left) + 'px';
            menu.style.top = (btnRect.bottom + 6) + 'px';
            menu.classList.add('open');

            // Close on next outside click / escape — one-shot listeners
            var closeMenu = function(e) {
                if (e && menu.contains(e.target)) return;
                menu.classList.remove('open');
                document.removeEventListener('click', closeMenu, true);
                document.removeEventListener('keydown', escClose, true);
            };
            var escClose = function(e) { if (e.key === 'Escape') closeMenu(); };
            setTimeout(function() {
                document.addEventListener('click', closeMenu, true);
                document.addEventListener('keydown', escClose, true);
            }, 0);
        };

        // "Report message" — surfaces the message to the AI assistant chat in case it
        // was missed, so the user gets help/escalation without leaving the app.
        window.reportCurrentMessage = function() {
            var menu = document.getElementById('msgReportMenu');
            if (menu) menu.classList.remove('open');
            var id = _msgReportMenuTargetId;
            var payload = id && _msgReportRegistry[id];
            if (!payload) return;
            reportMessageToAI(payload);
        };

        function reportMessageToAI(payload) {
            // Open the AI assistant panel if it's closed
            if (!_chatOpen && typeof window.toggleChat === 'function') {
                window.toggleChat();
            }
            var when = payload.sentAt ? _imsgTimeAgo(payload.sentAt) : 'recently';
            var who  = payload.isMe ? 'me' : (payload.partnerName || 'the other user');
            var snippet = (payload.text || '').trim() || '(no text content)';
            var report = 'I want to report a message from my conversation in case you missed it. '
                + 'It was sent by ' + who + ' ' + when + '. '
                + 'Message: "' + snippet + '". Please review this and let me know if any action is needed.';

            var inp = document.getElementById('chatInput');
            if (inp) {
                inp.value = report;
                if (typeof window.chatInputGrow === 'function') window.chatInputGrow(inp);
                // Give the panel a beat to finish opening before sending
                setTimeout(function() {
                    if (typeof window.sendChatMessage === 'function') window.sendChatMessage();
                }, _chatOpen ? 0 : 260);
            }
        }
        window.reportMessageToAI = reportMessageToAI;

        // ── SITERIFTY GROUPS — picker sheet + multiple shared rooms ──
        // GROUP_CHAT_UID kept as the legacy/default group id so any older code referencing it still works.
        var GROUP_CHAT_UID = 'GROUP_CHAT';
        var _groupChatUnsubInbox = null;   // listener on the pinned preview row (works even when inbox closed)
        var _groupJoinUnsub      = null;   // listener on the active room's member count (for the join gate)
        var _currentGroupId      = null;   // which sub-group's chat is currently open

        // Group catalog. The "main" group requires joining once (no leaving / no backdoor).
        // "work" and "niche" groups are open chat rooms anyone can post in immediately.
        var SITERIFTY_GROUPS = [
            { id: 'GROUP',          name: 'GROUP',            sub: 'The official Siterifty community', type: 'main', icon: 'main' },
            { id: 'SHOW_YOUR_WORK', name: 'Show Your Work',   sub: 'Share what you\'re building',      type: 'open', icon: 'work', mediaOnly: true },
            { id: 'NICHE_DESIGN',   name: 'Design & UI',      sub: 'Talk design, UI, and branding',     type: 'open', icon: 'niche' },
            { id: 'NICHE_DEV',      name: 'Dev & Code',       sub: 'Talk dev, code, and tooling',       type: 'open', icon: 'niche' },
            { id: 'NICHE_MARKETING',name: 'Marketing & Growth', sub: 'Talk marketing and growth',       type: 'open', icon: 'niche' },
            { id: 'NICHE_ECOM',     name: 'E-commerce',       sub: 'Talk stores and selling online',    type: 'open', icon: 'niche' },
            { id: 'NICHE_FREELANCE',name: 'Freelancers',      sub: 'Talk freelancing and clients',      type: 'open', icon: 'niche' }
        ];
        function _gpFindGroup(id) { for (var i=0;i<SITERIFTY_GROUPS.length;i++) if (SITERIFTY_GROUPS[i].id===id) return SITERIFTY_GROUPS[i]; return null; }
        function _gpIconSvg(icon) {
            if (icon === 'main') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
            if (icon === 'work')  return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
        }

        // ── Picker sheet open/close ──
        window.openGroupsPicker = function() {
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            if (!myUid) { if (typeof showLoginWall === 'function') showLoginWall(); return; }
            renderGroupsPicker();
            document.getElementById('groupsPickerOverlay').classList.add('open');
        };
        window.closeGroupsPicker = function() {
            document.getElementById('groupsPickerOverlay').classList.remove('open');
        };

        function renderGroupsPicker() {
            var body = document.getElementById('groupsPickerBody');
            if (!body) return;
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';

            var mainGroup = _gpFindGroup('GROUP');
            var html = '<div class="gp-section-label">Main</div>';
            html += '<div class="gp-row" onclick="closeGroupsPicker();openGroupChat(\'GROUP\')">'
                  +   '<div class="gp-row-icon">' + _gpIconSvg('main') + '</div>'
                  +   '<div class="gp-row-body">'
                  +     '<div class="gp-row-name">GROUP</div>'
                  +     '<div class="gp-row-sub">' + mainGroup.sub + '</div>'
                  +   '</div>'
                  +   '<div class="gp-row-meta" id="gpMemberCount">…</div>'
                  + '</div>';

            html += '<div class="gp-section-label">Community</div>';
            html += '<div class="gp-row" onclick="closeGroupsPicker();openGroupChat(\'SHOW_YOUR_WORK\')">'
                  +   '<div class="gp-row-icon gp-work">' + _gpIconSvg('work') + '</div>'
                  +   '<div class="gp-row-body">'
                  +     '<div class="gp-row-name">Show Your Work</div>'
                  +     '<div class="gp-row-sub">Share what you\'re building</div>'
                  +   '</div>'
                  + '</div>';

            html += '<div class="gp-section-label">Niche groups</div>';
            SITERIFTY_GROUPS.filter(function(g){ return g.id.indexOf('NICHE_') === 0; }).forEach(function(g) {
                html += '<div class="gp-row" onclick="closeGroupsPicker();openGroupChat(\'' + g.id + '\')">'
                      +   '<div class="gp-row-icon gp-niche">' + _gpIconSvg('niche') + '</div>'
                      +   '<div class="gp-row-body">'
                      +     '<div class="gp-row-name">' + g.name + '</div>'
                      +     '<div class="gp-row-sub">' + g.sub + '</div>'
                      +   '</div>'
                      +   '<span class="gp-public-tag">Public</span>'
                      + '</div>';
            });
            body.innerHTML = html;

            // Live member count for the main GROUP row
            if (db && fns && fns.ref && fns.get) {
                fns.get(fns.ref(db, 'groupChat/GROUP/memberCount')).then(function(snap) {
                    var el = document.getElementById('gpMemberCount');
                    if (el) el.textContent = (snap.val() || 0) + ' members';
                }).catch(function(){});
            }
        }

        // ── Open a group room ──
        window.openGroupChat = function(groupId) {
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            if (!myUid) { if (typeof showLoginWall === 'function') showLoginWall(); return; }

            var g = _gpFindGroup(groupId) || _gpFindGroup('GROUP');
            _currentGroupId   = g.id;
            _currentChatUid   = GROUP_CHAT_UID;     // keep using the shared "this is a group room" sentinel
            _currentChatName  = g.name;
            _currentChatPhoto = '';

            _activeStickyDealId = null;
            if (_stickyCountdownTimer) { clearInterval(_stickyCountdownTimer); _stickyCountdownTimer = null; }
            var stickyBanner = document.getElementById('dealStickyBanner');
            if (stickyBanner) stickyBanner.classList.remove('show');

            var nameEl = document.getElementById('chatTargetName');
            if (nameEl) nameEl.textContent = g.name;
            var avatarEl = document.getElementById('chatAvatar');
            if (avatarEl) avatarEl.style.display = 'none';
            var statusEl = document.getElementById('chatTargetStatus');
            if (statusEl) statusEl.innerText = g.type === 'main' ? 'Members only · one-time join' : 'Open group · everyone can post';

            // Deals are 1:1 — hide the send/request deal action bar in any group room
            var actionBar = document.getElementById('imsgActionBar');
            if (actionBar) actionBar.style.display = 'none';
            var donateBtn = document.getElementById('imsgDonateBtn');
            if (donateBtn) donateBtn.style.display = 'none';
            var merchantRow = document.getElementById('imsgMerchantRow');
            if (merchantRow) merchantRow.style.display = 'none';

            // "Show Your Work" is media-only — no text composer, just the attach button
            var textComposer  = document.getElementById('imsgComposer');
            var mediaComposer = document.getElementById('imsgComposerMediaOnly');
            if (g.mediaOnly) {
                if (textComposer)  textComposer.style.display  = 'none';
                if (mediaComposer) mediaComposer.style.display = 'flex';
            } else {
                if (textComposer)  textComposer.style.display  = '';
                if (mediaComposer) mediaComposer.style.display = 'none';
            }

            document.getElementById('imsgChatView').classList.add('open');

            if (_groupJoinUnsub) { try { _groupJoinUnsub(); } catch(e){} _groupJoinUnsub = null; }

            if (g.type === 'main') {
                _renderGroupJoinGate(g, myUid);
            } else {
                _loadGroupMessages(g, myUid);
            }
        };

        // ── Join gate for the main GROUP — must join once before reading/posting, no leave path ──
        function _renderGroupJoinGate(g, myUid) {
            var container = document.getElementById('chatMessagesContent');
            var inputBar  = document.querySelector('.imsg-composer');
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.get) {
                if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Sign in to view this group.</div>';
                return;
            }

            fns.get(fns.ref(db, 'groupChat/GROUP/members/' + myUid)).then(function(snap) {
                var alreadyJoined = !!(snap && snap.exists());
                if (alreadyJoined) {
                    if (inputBar) inputBar.style.display = '';
                    _loadGroupMessages(g, myUid);
                    return;
                }

                if (inputBar) inputBar.style.display = 'none';
                if (!container) return;

                function paintGate(count) {
                    container.innerHTML =
                        '<div class="gc-join-gate">'
                        + '<div class="gc-join-count" id="gcJoinCount">' + count + '</div>'
                        + '<div class="gc-join-count-label">members in GROUP</div>'
                        + '<button class="gc-join-btn" id="gcJoinBtn" onclick="window._joinMainGroup()">Join GROUP</button>'
                        + '<div class="gc-join-note">Joining is permanent — one-time entry, no leaving once you\'re in.</div>'
                        + '</div>';
                }

                fns.get(fns.ref(db, 'groupChat/GROUP/memberCount')).then(function(cSnap) {
                    paintGate(cSnap.val() || 0);
                }).catch(function(){ paintGate(0); });

                // Keep the live count fresh while the gate is showing
                if (fns.onValue) {
                    _groupJoinUnsub = fns.onValue(fns.ref(db, 'groupChat/GROUP/memberCount'), function(cSnap) {
                        var el = document.getElementById('gcJoinCount');
                        if (el) el.textContent = cSnap.val() || 0;
                    });
                }
            }).catch(function(err) {
                console.warn('[group join check]', err);
                if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Could not load this group. Try again.</div>';
            });
        }

        // Join action — adds the user permanently, +1 to memberCount. No corresponding "leave" function exists.
        window._joinMainGroup = function() {
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            if (!myUid) { if (typeof showLoginWall === 'function') showLoginWall(); return; }
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.get || !fns.update) return;

            var btn = document.getElementById('gcJoinBtn');
            if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }

            var userData = window._fbUserData || {};
            var myUsername = userData.username || (window._fbAuth.currentUser.email ? window._fbAuth.currentUser.email.split('@')[0] : 'User');

            // Guard against double-joining (e.g. double click) — check membership first.
            fns.get(fns.ref(db, 'groupChat/GROUP/members/' + myUid)).then(function(snap) {
                if (snap && snap.exists()) {
                    // Already a member somehow — just enter the room.
                    var g = _gpFindGroup('GROUP');
                    var inputBar = document.querySelector('.imsg-composer');
                    if (inputBar) inputBar.style.display = '';
                    if (_groupJoinUnsub) { try { _groupJoinUnsub(); } catch(e){} _groupJoinUnsub = null; }
                    _loadGroupMessages(g, myUid);
                    return;
                }
                fns.get(fns.ref(db, 'groupChat/GROUP/memberCount')).then(function(cSnap) {
                    var newCount = (cSnap.val() || 0) + 1;
                    var updates = {};
                    updates['groupChat/GROUP/members/' + myUid] = { username: myUsername, joinedAt: Date.now() };
                    updates['groupChat/GROUP/memberCount'] = newCount;
                    fns.update(fns.ref(db, '/'), updates).then(function() {
                        if (_groupJoinUnsub) { try { _groupJoinUnsub(); } catch(e){} _groupJoinUnsub = null; }
                        var g = _gpFindGroup('GROUP');
                        var inputBar = document.querySelector('.imsg-composer');
                        if (inputBar) inputBar.style.display = '';
                        _loadGroupMessages(g, myUid);
                    }).catch(function(err) {
                        console.warn('[join group] failed', err);
                        if (btn) { btn.disabled = false; btn.textContent = 'Join GROUP'; }
                    });
                });
            }).catch(function(err) {
                console.warn('[join group] check failed', err);
                if (btn) { btn.disabled = false; btn.textContent = 'Join GROUP'; }
            });
        };

        // ── Render + live-subscribe to a group room's messages ──
        function _loadGroupMessages(g, myUid) {
            var container = document.getElementById('chatMessagesContent');
            if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Loading messages…</div>';

            if (_chatMsgUnsubscribe) { try { _chatMsgUnsubscribe(); } catch(e){} _chatMsgUnsubscribe = null; }

            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.onValue) {
                if (container) container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">Sign in to view messages.</div>';
                return;
            }

            var groupRef = fns.ref(db, 'groupChat/' + g.id + '/messages');
            _chatMsgUnsubscribe = fns.onValue(groupRef, function(snap) {
                var msgs = [];
                if (snap.exists()) {
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (m) { m._key = child.key; msgs.push(m); }
                    });
                }
                msgs.sort(function(a,b){ return (a.sentAt||0)-(b.sentAt||0); });

                if (!container) return;
                if (msgs.length === 0) {
                    container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted,#6b6890);font-size:12px;">No messages yet. Be the first to say hi!</div>';
                    return;
                }
                container.innerHTML = '';
                var lastDateLabel = '';
                msgs.forEach(function(m) {
                    var isMe = m.fromUid === myUid;
                    var username = m.fromUsername || 'User';
                    var initial  = username.charAt(0).toUpperCase();
                    var photo    = m.fromPhoto || '';
                    var time     = _imsgTimeAgo(m.sentAt);

                    // Date divider
                    var dateLabel = m.sentAt ? new Date(m.sentAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
                    if (dateLabel && dateLabel !== lastDateLabel) {
                        lastDateLabel = dateLabel;
                        container.insertAdjacentHTML('beforeend',
                            '<div class="gc-date-divider">' + dateLabel + '</div>');
                    }

                    var avatarHtml = photo
                        ? '<div class="gc-avatar"><img src="' + photo + '" alt="' + initial + '" onerror="this.parentElement.textContent=\'' + initial + '\'"></div>'
                        : '<div class="gc-avatar">' + initial + '</div>';

                    var dmBtn = !isMe
                        ? '<button class="gc-contact-btn" onclick="window._gcDM(\'' + m.fromUid.replace(/'/g,"\\'") + '\',\'' + username.replace(/'/g,"\\'") + '\')">'
                          + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
                          + ' Message</button>'
                        : '';

                    var bodyHtml = _gcRenderMessageBody(m);
                    var seenHtml = _gcRenderSeenRow(g.id, m, myUid);

                    container.insertAdjacentHTML('beforeend',
                        '<div class="gc-msg-row' + (isMe ? ' gc-me' : '') + '">'
                        + avatarHtml
                        + '<div class="gc-bubble">'
                            + '<div class="gc-meta">'
                                + '<span class="gc-username"' + (!isMe ? ' onclick="window._gcDM(\'' + m.fromUid.replace(/'/g,"\\'") + '\',\'' + username.replace(/'/g,"\\'") + '\')"' : '') + '>'
                                    + (isMe ? 'You' : '@' + username)
                                + '</span>'
                                + '<span class="gc-time">' + time + '</span>'
                            + '</div>'
                            + bodyHtml
                            + dmBtn
                            + seenHtml
                        + '</div>'
                        + '</div>'
                    );
                });
                scrollToLatest();
            }, function(err) { console.warn('[group chat]', err); });
        }

        // ── Render a group message's body — auto-renders photos, link cards, and HTML pages inline ──
        function _gcRenderMessageBody(m) {
            var text = (m.message || '').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

            if (m.type === 'image' && m.fileUrl) {
                var safeName = (m.fileName || 'photo').replace(/'/g,"\\'");
                return '<div class="gc-photo-frame" onclick="openImageInPopup(\'' + m.fileUrl.replace(/'/g,"\\'") + '\',\'' + safeName + '\')">'
                     +   '<img src="' + m.fileUrl + '" alt="' + (m.fileName || 'photo') + '" loading="lazy">'
                     + '</div>';
            }

            if (m.type === 'link' && m.linkUrl) {
                var title = (m.linkTitle || m.linkUrl).replace(/</g,'&lt;').replace(/>/g,'&gt;');
                var url   = m.linkUrl.replace(/"/g,'&quot;');
                return '<a href="' + url + '" target="_blank" class="gc-link-card">'
                     +   '<div class="gc-link-card-body">'
                     +     '<div class="gc-link-card-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg></div>'
                     +     '<div class="gc-link-card-text">'
                     +       '<div class="gc-link-card-title">' + title + '</div>'
                     +       '<div class="gc-link-card-url">' + m.linkUrl + '</div>'
                     +     '</div>'
                     +   '</div>'
                     + '</a>';
            }

            if (m.type === 'document' && (m.fileUrl || m.fileData)) {
                var fileName = m.fileName || 'file';
                var isHtml = fileName.toLowerCase().endsWith('.html');
                var resolvedUrl = m.fileUrl || (m.fileData ? base64ToObjectURL(m.fileData, m.mimeType) : '#');
                if (isHtml) {
                    return '<div class="gc-html-frame-wrap">'
                         +   '<div class="gc-html-frame-label"><span>' + fileName + '</span><a href="' + resolvedUrl + '" target="_blank">Open</a></div>'
                         +   '<iframe src="' + resolvedUrl + '" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>'
                         + '</div>';
                }
                return '<a href="' + resolvedUrl + '" target="_blank" class="imsg-doc-bubble" style="display:block;">'
                     +   '<div class="imsg-doc-row">'
                     +     '<div class="imsg-doc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg></div>'
                     +     '<div style="min-width:0;"><span class="imsg-doc-type">DOCUMENT PDF</span><p class="imsg-doc-name">' + fileName + '</p><span class="imsg-doc-sub">Click to preview file</span></div>'
                     +   '</div>'
                     + '</a>';
            }

            return '<div class="gc-text">' + text + '</div>';
        }

        // ── Emoji reaction row — aggregated emoji pills + "React" button ──
        var _GC_EMOJIS = ['😂','❤️','🔥','🚀','💯','👏','😍','🤯','💎','🙌',
                          '😎','👀','🤝','💪','🎉','⚡','🌟','😅','🤔','👍'];

        function _gcRenderSeenRow(groupId, m, myUid) {
            var reactions = m.reactions || {};
            var key = m._key;
            if (!key) return '';

            // Aggregate: { emoji -> count }
            var counts = {};
            var myEmoji = reactions[myUid] || null;
            Object.values(reactions).forEach(function(e) {
                if (e && typeof e === 'string') counts[e] = (counts[e] || 0) + 1;
            });

            var pillsHtml = Object.keys(counts).sort().map(function(e) {
                var isMine = (e === myEmoji);
                return '<button class="gc-react-pill' + (isMine ? ' gc-react-mine' : '') + '"'
                     + ' title="' + counts[e] + ' reaction' + (counts[e] > 1 ? 's' : '') + '"'
                     + ' onclick="window._gcPickEmoji(\'' + groupId + '\',\'' + key + '\',\'' + e + '\')">'
                     + '<span class="gc-pill-emoji">' + e + '</span>'
                     + '<span class="gc-pill-count">' + counts[e] + '</span>'
                     + '</button>';
            }).join('');

            var addBtn = '<button class="gc-react-add-btn" onclick="window._gcOpenEmojiPicker(\'' + groupId + '\',\'' + key + '\')">'
                       + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>'
                       + ' React'
                       + '</button>';

            return '<div class="gc-seen-row">' + pillsHtml + addBtn + '</div>';
        }

        // Open the centered emoji picker for a given message
        window._gcOpenEmojiPicker = function(groupId, msgKey) {
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            if (!myUid) { if (typeof showLoginWall === 'function') showLoginWall(); return; }

            // Store target context on overlay element
            var overlay = document.getElementById('gcEmojiPickerOverlay');
            if (!overlay) return;
            overlay.dataset.groupId = groupId;
            overlay.dataset.msgKey  = msgKey;

            // Build grid with current reaction highlighted
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            var grid = document.getElementById('gcEmojiPickerGrid');
            if (!grid) return;

            function _renderGrid(myEmoji) {
                grid.innerHTML = _GC_EMOJIS.map(function(e) {
                    return '<button class="gc-ep-btn' + (e === myEmoji ? ' gc-ep-mine' : '') + '"'
                         + ' title="' + e + '"'
                         + ' onclick="window._gcPickEmoji(\'' + groupId + '\',\'' + msgKey + '\',\'' + e + '\')">'
                         + e + '</button>';
                }).join('');
            }

            if (db && fns && fns.ref && fns.get) {
                var reactionRef = fns.ref(db, 'groupChat/' + groupId + '/messages/' + msgKey + '/reactions/' + myUid);
                fns.get(reactionRef).then(function(snap) {
                    _renderGrid(snap && snap.exists() ? snap.val() : null);
                }).catch(function() { _renderGrid(null); });
            } else {
                _renderGrid(null);
            }

            overlay.classList.add('gc-ep-open');
        };

        window._gcCloseEmojiPicker = function() {
            var overlay = document.getElementById('gcEmojiPickerOverlay');
            if (overlay) overlay.classList.remove('gc-ep-open');
        };

        // Pick (or toggle off) an emoji reaction
        window._gcPickEmoji = function(groupId, msgKey, emoji) {
            window._gcCloseEmojiPicker();
            var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
            if (!myUid) { if (typeof showLoginWall === 'function') showLoginWall(); return; }
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.get || !fns.set || !fns.remove) return;

            var reactionRef = fns.ref(db, 'groupChat/' + groupId + '/messages/' + msgKey + '/reactions/' + myUid);
            fns.get(reactionRef).then(function(snap) {
                var current = snap && snap.exists() ? snap.val() : null;
                if (current === emoji) {
                    // Same emoji — remove (toggle off)
                    fns.remove(reactionRef).catch(function(err){ console.warn('[emoji reaction] remove failed', err); });
                } else {
                    // New or different emoji — set (replaces previous)
                    fns.set(reactionRef, emoji).catch(function(err){ console.warn('[emoji reaction] set failed', err); });
                }
            }).catch(function(err) { console.warn('[emoji reaction] check failed', err); });
        };

        // Restore the deal action bar / donate / merchant row whenever leaving the group room for a normal DM
        var _origOpenChatForGroup = openChat;
        openChat = function(name, avatarUrl, status, uid) {
            _currentGroupId = null;
            if (_groupJoinUnsub) { try { _groupJoinUnsub(); } catch(e){} _groupJoinUnsub = null; }
            var textComposer  = document.getElementById('imsgComposer');
            var mediaComposer = document.getElementById('imsgComposerMediaOnly');
            if (textComposer)  textComposer.style.display  = '';
            if (mediaComposer) mediaComposer.style.display = 'none';
            var actionBar = document.getElementById('imsgActionBar');
            if (actionBar) actionBar.style.display = '';
            var donateBtn = document.getElementById('imsgDonateBtn');
            if (donateBtn) donateBtn.style.display = '';
            var merchantRow = document.getElementById('imsgMerchantRow');
            if (merchantRow) merchantRow.style.display = '';
            return _origOpenChatForGroup.apply(this, arguments);
        };

        // DM shortcut from group chat "Message" button
        window._gcDM = function(uid, username) {
            if (!uid) return;
            // Fetch their photo from Firebase for a proper avatar
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (db && fns && fns.ref && fns.get) {
                fns.get(fns.ref(db, 'users/' + uid)).then(function(snap) {
                    var u = snap.val() || {};
                    var photo = u.avatarUrl || u.photoURL || '';
                    openChat(username || uid, photo, 'Siterifty member', uid);
                }).catch(function() {
                    openChat(username || uid, '', 'Siterifty member', uid);
                });
            } else {
                openChat(username || uid, '', 'Siterifty member', uid);
            }
        };

        // Live preview/time for the pinned SITERIFTY GROUPS row in the inbox list (mirrors the main GROUP room)
        function _watchGroupChatPreview() {
            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.onValue) return;
            if (_groupChatUnsubInbox) { try { _groupChatUnsubInbox(); } catch(e){} }
            var groupRef = fns.ref(db, 'groupChat/GROUP/messages');
            _groupChatUnsubInbox = fns.onValue(groupRef, function(snap) {
                var latest = null;
                if (snap.exists()) {
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (m && (!latest || (m.sentAt||0) > (latest.sentAt||0))) latest = m;
                    });
                }
                var previewEl = document.getElementById('imsgGroupChatPreview');
                var timeEl    = document.getElementById('imsgGroupChatTime');
                if (latest && previewEl) {
                    var prefix = latest.fromUsername ? ('@' + latest.fromUsername + ': ') : '';
                    var preview = prefix + (latest.message || '');
                    previewEl.textContent = preview.length > 60 ? preview.slice(0,60) + '…' : preview;
                }
                if (latest && timeEl) timeEl.textContent = _imsgTimeAgo(latest.sentAt);
            }, function(err) { console.warn('[group chat preview]', err); });
        }
        // Kick off once Firebase is ready (poll briefly, then watch)
        (function _initGroupChatPreviewWatch() {
            var tries = 0;
            var iv = setInterval(function() {
                tries++;
                if (window._fbDb && window._fbDbFns) {
                    clearInterval(iv);
                    _watchGroupChatPreview();
                } else if (tries > 40) {
                    clearInterval(iv);
                }
            }, 250);
        })();

        function closeChat() {
            document.getElementById('imsgChatView').classList.remove('open');
            document.getElementById('dropUpMenu').classList.remove('open');
            if (_chatMsgUnsubscribe) { try { _chatMsgUnsubscribe(); } catch(e){} _chatMsgUnsubscribe = null; }
            // Remove admin badge injected into header
            var nameRow = document.getElementById('chatTargetName');
            if (nameRow && nameRow.nextElementSibling && nameRow.nextElementSibling.style && nameRow.nextElementSibling.style.display === 'inline-flex') {
                nameRow.nextElementSibling.remove();
            }
        }

        function toggleDropUp() {
            document.getElementById('dropUpMenu').classList.toggle('open');
        }

        function triggerInput(id) {
            document.getElementById(id).click();
            document.getElementById('dropUpMenu').classList.remove('open');
        }

        // ── Imgur upload for chat images ──────────────────────────
        const _IMGUR_CLIENT_ID = (function() {
            // Reuse the same Client-ID already defined in the avatar upload block
            // Try to read it from the already-loaded script context first;
            // fall back to the known constant so this block is self-contained.
            return "891e5bb4aa94282";
        })();

        async function uploadImageToImgur(file) {
            const formData = new FormData();
            formData.append('image', file);
            const resp = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: { Authorization: 'Client-ID ' + _IMGUR_CLIENT_ID },
                body: formData
            });
            if (!resp.ok) throw new Error('Imgur upload failed: ' + resp.status);
            const data = await resp.json();
            if (!data.success) throw new Error(data.data?.error || 'Imgur error');
            return data.data.link; // permanent Imgur URL
        }

        function appendImageMessageUploading(fileName) {
            // Insert a placeholder bubble while uploading
            const container = document.getElementById('chatMessagesContent');
            const id = 'img_upload_' + Date.now();
            const html = `
              <div id="${id}" class="imsg-bubble-out">
                <div class="imsg-img-bubble">
                  <div class="imsg-img-frame" style="min-height:80px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.04);border-radius:10px;">
                    <div style="display:flex;align-items:center;gap:8px;color:var(--muted);font-size:11px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Uploading…
                    </div>
                  </div>
                  <div class="imsg-img-meta"><span class="imsg-img-filename">${fileName}</span></div>
                </div>
              </div>`;
            container.insertAdjacentHTML('beforeend', html);
            scrollToLatest();
            return id;
        }

        function replaceUploadingBubble(placeholderId, fileName, imgurURL) {
            const placeholder = document.getElementById(placeholderId);
            if (!placeholder) return;
            const escapedName = fileName.replace(/'/g, "\'");
            placeholder.outerHTML = `
              <div class="imsg-bubble-out">
                <div class="imsg-img-bubble">
                  <div class="imsg-img-frame">
                    <img src="${imgurURL}" alt="" />
                    <div class="imsg-img-hover">
                      <button onclick="openImageInPopup('${imgurURL}', '${escapedName}')" class="imsg-img-view-btn">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>VIEW IMAGE
                      </button>
                    </div>
                  </div>
                  <div class="imsg-img-meta">
                    <span class="imsg-img-filename">${fileName}</span>
                    <button onclick="openImageInPopup('${imgurURL}', '${escapedName}')" class="imsg-img-view-link">VIEW</button>
                  </div>
                </div>
              </div>`;
            scrollToLatest();
        }

        async function processFileSelection(input, type) {
            if (!input.files || input.files.length === 0) return;
            if (!checkMessageQuota()) { input.value = ''; return; }

            const file = input.files[0];
            const sizeInMB = file.size / (1024 * 1024);
            const config = tierConfig[getCurrentPlan()];

            if (sizeInMB > config.fileSize) {
                showCustomAlert(`"${file.name}" exceeds your allocation limit.`);
                input.value = '';
                return;
            }

            if (type === 'image') {
                imagesSentToday = getRealImgCount(getUidForMsg());
                if (imagesSentToday >= config.imgLimit) {
                    showCustomAlert(`Hourly image limit reached. Try again next hour.`);
                    input.value = '';
                    return;
                }
                // Show uploading placeholder immediately
                const placeholderId = appendImageMessageUploading(file.name);
                const _imgUid = getUidForMsg();
                imagesSentToday = getRealImgCount(_imgUid) + 1;
                setRealImgCount(_imgUid, imagesSentToday);
                incrementMsgCount();
                updateSystemCountersUI();
                try {
                    const imgurURL = await uploadImageToImgur(file);
                    replaceUploadingBubble(placeholderId, file.name, imgurURL);
                    _persistChatMessage({
                        type:     'image',
                        message:  '[Image] ' + file.name,
                        fileName: file.name,
                        fileUrl:  imgurURL
                    });
                    // Push-only notify recipient
                    var _myNameI = (window._fbUserData && window._fbUserData.username) || 'Someone';
                    _notifyUser('image', _currentChatUid, {
                        title: _myNameI + ' sent you a photo',
                        body:  file.name
                    });
                } catch(err) {
                    // Replace placeholder with error state
                    const placeholder = document.getElementById(placeholderId);
                    if (placeholder) placeholder.remove();
                    showCustomAlert('Image upload failed. Please try again.');
                    console.error('[Imgur chat]', err);
                }
            } else {
                // Documents — base64-encode and store directly in RTDB.
                // No Firebase Storage needed; 1 MB limit keeps payloads well within
                // RTDB's 10 MB node cap. Recipient reconstructs a blob URL on render.
                const placeholderId = appendDocumentMessageUploading(file.name);
                incrementMsgCount();
                updateSystemCountersUI();
                try {
                    const base64Data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload  = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = () => reject(new Error('FileReader error'));
                        reader.readAsDataURL(file);
                    });
                    replaceDocumentUploadingBubble(placeholderId, file.name, null, base64Data, file.type);
                    _persistChatMessage({
                        type:        'document',
                        message:     '[Doc] ' + file.name,
                        fileName:    file.name,
                        mimeType:    file.type,
                        fileData:    base64Data   // stored in RTDB; no Storage required
                    });
                    // Push-only notify recipient
                    var _myNameD = (window._fbUserData && window._fbUserData.username) || 'Someone';
                    _notifyUser('document', _currentChatUid, {
                        title: _myNameD + ' sent you a document',
                        body:  file.name
                    });
                } catch(err) {
                    const placeholder = document.getElementById(placeholderId);
                    if (placeholder) placeholder.remove();
                    showCustomAlert('Document upload failed. Please try again.');
                    console.error('[DocUpload]', err);
                }
            }
            input.value = '';
        }

        function buildListingsModalContent(listings) {
            const container = document.getElementById('mockListingsContainer');
            container.innerHTML = '';
            if (!listings || listings.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:28px 0;color:var(--muted);font-size:12px;">No listings found.</div>';
                return;
            }
            listings.forEach(item => {
                const img = (item.images && item.images[0]) ? item.images[0] : (item.img || '');
                const title = item.title || item.url || 'Untitled listing';
                const desc = item.desc || item.description || item.category || '';
                const price = item.price ? Number(item.price).toLocaleString() : '—';
                const row = `
                  <div onclick="selectListingForActiveDeal('${item._id || item.id}')" class="imsg-listing-row">
                    ${img ? `<img src="${img}" alt="" onerror="this.style.display='none'">` : '<div style="width:48px;height:48px;border-radius:8px;background:rgba(168,85,247,0.1);flex-shrink:0;"></div>'}
                    <div class="imsg-listing-body">
                      <h4 class="imsg-listing-title">${title}</h4>
                      <p class="imsg-listing-desc">${desc}</p>
                    </div>
                    <span class="imsg-listing-price">$${price}</span>
                  </div>`;
                container.insertAdjacentHTML('beforeend', row);
            });
        }

        function openDealSelectionModal(mode) {
            contextDealMode = mode;
            document.getElementById('dealModalTitle').innerText = mode === 'send' ? 'Send a Marketplace Deal' : 'Request a Custom Deal';
            document.getElementById('listingSelectionModal').classList.add('open');

            const container = document.getElementById('mockListingsContainer');
            container.innerHTML = '<div style="text-align:center;padding:28px 0;color:var(--muted);font-size:12px;">Loading listings…</div>';

            // For "send": load the current user's own listings
            // For "request": load the other user's listings (the person they are chatting with)
            const targetUid = mode === 'send'
                ? (window._fbUserData && window._fbUserData.uid)
                : _currentChatUid;

            if (!targetUid) {
                buildListingsModalContent([]);
                return;
            }

            try {
                var db   = window._fbDb;
                var fns  = window._fbDbFns;
                if (!db || !fns || !fns.ref || !fns.get) {
                    // Firebase not ready — fall back to mock listings
                    buildListingsModalContent(mockListings);
                    return;
                }
                fns.get(fns.ref(db, 'users/' + targetUid + '/listings')).then(function(snap) {
                    if (snap && snap.exists && snap.exists()) {
                        var items = [];
                        snap.forEach(function(child) {
                            var v = child.val();
                            if (v) items.push(Object.assign({ _id: child.key }, v));
                        });
                        buildListingsModalContent(items);
                    } else {
                        buildListingsModalContent([]);
                    }
                }).catch(function(err) {
                    console.warn('[dealModal] listings fetch error', err);
                    buildListingsModalContent([]);
                });
            } catch(e) {
                console.warn('[dealModal] listings catch', e);
                buildListingsModalContent([]);
            }
        }

        function closeDealSelectionModal() {
            document.getElementById('listingSelectionModal').classList.remove('open');
        }

        function selectListingForActiveDeal(id) {
            closeDealSelectionModal();
            if (!checkMessageQuota()) return;

            // Check mockListings first, then look up from Firebase via dealsRegistry staging
            const mockMatch = mockListings.find(x => x.id === id);
            if (mockMatch) {
                const dealId = 'deal_' + Date.now();
                // The party who DIDN'T send/request this deal is the one who must respond to it.
                // 'send'    = I own the listing and am offering it to them -> they approve/reject.
                // 'request' = I'm asking to buy their listing -> they (the seller) approve/reject.
                // Either way the *other* person decides, never whoever just clicked send/request.
                dealsRegistry[dealId] = { ...mockMatch, mode: contextDealMode, status: 'pending', sellerIsMe: false };
                renderDealComponentMessage(dealId);
                return;
            }

            // Firebase listing — fetch by key from the correct uid path
            const targetUid = contextDealMode === 'send'
                ? (window._fbUserData && window._fbUserData.uid)
                : _currentChatUid;

            if (!targetUid) return;

            try {
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                if (!db || !fns || !fns.ref || !fns.get) return;
                fns.get(fns.ref(db, 'users/' + targetUid + '/listings/' + id)).then(function(snap) {
                    if (!snap || !snap.exists || !snap.exists()) return;
                    var v = snap.val();
                    var normalized = {
                        id:    id,
                        title: v.title || v.url || 'Untitled listing',
                        desc:  v.desc || v.description || v.category || '',
                        price: v.price ? Number(v.price) : 0,
                        img:   (v.images && v.images[0]) ? v.images[0] : ''
                    };
                    const dealId = 'deal_' + Date.now();
                    // Same rule as the mock-listing branch above: whoever just sent/requested
                    // the deal is never the one who can approve/reject it on their own screen.
                    dealsRegistry[dealId] = { ...normalized, mode: contextDealMode, status: 'pending', sellerIsMe: false };
                    renderDealComponentMessage(dealId);
                }).catch(function(err) {
                    console.warn('[dealSelect] fetch error', err);
                });
            } catch(e) {
                console.warn('[dealSelect] catch', e);
            }
        }

        function renderDealComponentMessage(dealId) {
            const container = document.getElementById('chatMessagesContent');
            const deal = dealsRegistry[dealId];

            const labelIcon = deal.mode === 'send'
                ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.1a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-4.1M16 6.5l-4-4-4 4m4-4v12.5"/></svg>'
                : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 17.5v-12.5l4 4 4-4v12.5M4 19.5h16"/></svg>';
            const labelText = (deal.mode === 'send' ? 'MARKETPLACE CONTRACT OFFER' : 'INBOUND ACQUISITION REQUEST');
            const labelClass = deal.mode === 'send' ? 'send' : 'request';
            const cardClass = deal.mode === 'send' ? '' : 'request';

            // Whoever just sent/requested this deal cannot approve or reject their own offer —
            // only the recipient on the other side of the conversation can respond.
            const actionsHtml = deal.sellerIsMe
                ? `<div class="imsg-deal-actions">
                      <button onclick="handleReceiverAction('${dealId}', 'approve')" class="imsg-deal-btn approve">APPROVE</button>
                      <button onclick="handleReceiverAction('${dealId}', 'reject')" class="imsg-deal-btn reject">REJECT</button>
                    </div>`
                : `<div class="imsg-deal-lock" style="justify-content:center;"><span><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v.008M5.25 7.5h13.5A2.25 2.25 0 0 1 21 9.75v7.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25v-7.5A2.25 2.25 0 0 1 5.25 7.5Z"/></svg>Waiting on the other party's decision</span></div>`;

            const html = `
              <div id="wrapper_${dealId}" class="imsg-bubble-out" data-deal-id="${dealId}">
                <div class="imsg-deal-card ${cardClass}">

                  <div id="overlay_approved_${dealId}" class="imsg-deal-overlay approved">
                    <div class="imsg-deal-overlay-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>
                    <span class="imsg-deal-overlay-title">DEAL APPROVED</span>
                    <p class="imsg-deal-overlay-sub">Awaiting payment from buyer</p>
                  </div>

                  <div id="overlay_rejected_${dealId}" class="imsg-deal-overlay rejected">
                    <div class="imsg-deal-overlay-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg></div>
                    <span class="imsg-deal-overlay-title">DEAL REJECTED</span>
                    <p class="imsg-deal-overlay-sub">Merchant context parameters closed by receiver side parameters</p>
                  </div>

                  <div>
                    <span class="imsg-deal-label ${labelClass}">${labelIcon}${labelText}</span>
                    <span class="imsg-deal-id">ID: ${dealId}</span>
                  </div>

                  <div class="imsg-deal-listing">
                    <img src="${deal.img}" alt="">
                    <div class="imsg-deal-listing-body">
                      <h5 class="imsg-deal-listing-title">${deal.title}</h5>
                      <p class="imsg-deal-listing-desc">${deal.desc}</p>
                      <span class="imsg-deal-listing-price">$${deal.price}</span>
                    </div>
                  </div>

                  <div style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">
                    ${actionsHtml}
                    <div class="imsg-deal-lock"><span><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>Sender Security Lock Active</span></div>
                  </div>

                </div>
              </div>`;

            container.insertAdjacentHTML('beforeend', html);
            incrementMsgCount();
            updateSystemCountersUI();

            // Activate sticky pending banner with a 3-day countdown for the seller to act
            deal.respondBy = Date.now() + (3 * 24 * 60 * 60 * 1000);
            _activeStickyDealId = dealId;
            updateDealStickyBanner(dealId);

            // Persist deal to Firebase so the recipient actually receives it.
            // Stored as type:'deal' so the inbox listener can reconstruct the full card.
            _persistChatMessage({
                type:    'deal',
                dealId:  dealId,
                message: '[Deal] ' + (deal.title || 'Untitled'),
                deal: {
                    id:     deal.id    || '',
                    title:  deal.title || '',
                    desc:   deal.desc  || '',
                    price:  deal.price || 0,
                    img:    deal.img   || '',
                    mode:   deal.mode  || 'send',
                    status: 'pending'
                }
            });

            // Push-only notify recipient about the deal
            var _myNameDeal = (window._fbUserData && window._fbUserData.username) || 'Someone';
            var _dealLabel  = deal.mode === 'request' ? 'requested a deal' : 'sent you a deal offer';
            _notifyUser('deal', _currentChatUid, {
                title: _myNameDeal + ' ' + _dealLabel,
                body:  (deal.title || 'Untitled') + ' — $' + (deal.price || 0)
            });

            scrollToLatest();
        }


        // ── Sticky deal status banner (under chat header) ──
        const _stickyIcons = {
            pending: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.8V8l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            approved: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M5.3 8.2l1.8 1.8 3.6-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            paid: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4" width="13" height="9" rx="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>'
        };

        function _fmtCountdown(ms) {
            if (ms <= 0) return 'Expired';
            const totalMin = Math.floor(ms / 60000);
            const days = Math.floor(totalMin / 1440);
            const hours = Math.floor((totalMin % 1440) / 60);
            if (days > 0) return days + 'd ' + hours + 'h left';
            const mins = totalMin % 60;
            return hours + 'h ' + mins + 'm left';
        }

        function updateDealStickyBanner(dealId) {
            const deal = dealsRegistry[dealId];
            const banner = document.getElementById('dealStickyBanner');
            if (!banner) return;
            if (!deal) { banner.classList.remove('show'); return; }

            const icon  = document.getElementById('dealStickyIcon');
            const main  = document.getElementById('dealStickyMain');
            const sub   = document.getElementById('dealStickySub');
            const cd    = document.getElementById('dealStickyCountdown');
            const viewBtn = document.getElementById('dealStickyViewBtn');

            banner.classList.remove('pending', 'approved', 'paid');
            banner.classList.add('show');
            if (_stickyCountdownTimer) { clearInterval(_stickyCountdownTimer); _stickyCountdownTimer = null; }

            if (deal.status === 'pending') {
                banner.classList.add('pending');
                icon.innerHTML = _stickyIcons.pending;
                main.innerHTML = '<strong>Deal pending</strong> — awaiting response';
                sub.textContent = deal.sellerIsMe ? 'You need to approve or reject this deal.' : 'Waiting on the other party to respond.';
                cd.style.display = '';
                viewBtn.style.display = 'none';

                const tick = () => { cd.textContent = _fmtCountdown((deal.respondBy || 0) - Date.now()); };
                tick();
                _stickyCountdownTimer = setInterval(tick, 60000);

            } else if (deal.status === 'approved') {
                banner.classList.add('approved');
                icon.innerHTML = _stickyIcons.approved;
                main.innerHTML = '<strong>Deal approved</strong>';
                sub.textContent = 'Awaiting payment from buyer.';
                cd.style.display = 'none';
                viewBtn.style.display = 'none';

            } else if (deal.status === 'paid') {
                banner.classList.add('paid');
                icon.innerHTML = _stickyIcons.paid;
                main.innerHTML = '<strong>Buyer paid $' + Number(deal.price || 0).toLocaleString() + '</strong>';
                sub.textContent = 'Awaiting seller to send buyer the site.';
                cd.style.display = 'none';
                viewBtn.style.display = '';

            } else {
                // rejected / other terminal states — hide the sticky banner
                banner.classList.remove('show');
                if (_activeStickyDealId === dealId) _activeStickyDealId = null;
            }
        }

        function viewDealStickyPlaceholder() {
            // Placeholder — wiring for the asset-transfer view comes later.
        }

        function handleReceiverAction(dealId, resolution) {
            const deal = dealsRegistry[dealId];
            if (!deal) return;

            // Only the recipient can act — if sellerIsMe is false we are the sender, not the receiver
            if (!deal.sellerIsMe) {
                console.warn('[deal] You are the sender — only the recipient can approve or reject.');
                return;
            }

            if (resolution === 'reject') {
                dealsRegistry[dealId].status = 'rejected';
                const rejEl = document.getElementById('overlay_rejected_' + dealId);
                if (rejEl) rejEl.classList.add('show');
                // Hide the action buttons so they can't click again
                const wrapper = document.getElementById('wrapper_' + dealId);
                if (wrapper) {
                    const actionsEl = wrapper.querySelector('.imsg-deal-actions');
                    if (actionsEl) actionsEl.style.display = 'none';
                }
                appendSystemLogMessage('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;color:#f87171;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>Deal notification: Marketplace entry transaction [' + dealId + '] has been rejected by receiver.');
                if (_activeStickyDealId === dealId) updateDealStickyBanner(dealId);
                _syncDealStatus(dealId, 'rejected');
                return;
            }

            if (resolution === 'approve') {
                dealsRegistry[dealId].status = 'approved';
                const appEl = document.getElementById('overlay_approved_' + dealId);
                if (appEl) appEl.classList.add('show');
                // Hide the action buttons so they can't click again
                const wrapper = document.getElementById('wrapper_' + dealId);
                if (wrapper) {
                    const actionsEl = wrapper.querySelector('.imsg-deal-actions');
                    if (actionsEl) actionsEl.style.display = 'none';
                }
                appendSystemLogMessage('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;color:#58f278;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Deal notification: Marketplace entry transaction [' + dealId + '] has been approved. Awaiting payment from buyer.');
                if (_activeStickyDealId === dealId) updateDealStickyBanner(dealId);
                _syncDealStatus(dealId, 'approved');

                // For a REQUEST deal: sender=buyer, receiver=seller.
                // Seller approves here → buyer (the sender) needs to pay, so we don't open the payment
                // modal on the seller's screen. The buyer sees the status update via Firebase and pays.
                // For a SEND deal: sender=seller, receiver=buyer.
                // Buyer (the receiver) approves here → open payment modal immediately for them to pay.
                if (deal.mode === 'send') {
                    targetPendingPaymentPrice = deal.price;
                    targetPendingDealId = dealId;

                    const modal = document.getElementById('paymentProcessingModal');
                    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
                    const setImg = (id, src) => { const el = document.getElementById(id); if (el) el.src = src || ''; };

                    setEl('dealApprovalTitle', deal.title || 'Listing');
                    setEl('dealApprovalDesc',  deal.desc  || '');
                    setEl('dealApprovalPrice', deal.price ? '$' + Number(deal.price).toLocaleString() : '—');
                    const rev = deal.revenue  ? '$' + Number(deal.revenue).toLocaleString()  : (deal.price ? '$' + Math.round(deal.price * 0.04).toLocaleString() + '/mo' : '—');
                    const exp = deal.expenses ? '$' + Number(deal.expenses).toLocaleString() : '—';
                    const pro = deal.profit   ? '$' + Number(deal.profit).toLocaleString()   : '—';
                    setEl('dealApprovalRevenue',  rev);
                    setEl('dealApprovalExpenses', exp);
                    setEl('dealApprovalProfit',   pro);
                    setImg('dealApprovalImg', deal.img || '');
                    setEl('paymentValueDisplay', '$' + deal.price);
                    setEl('paymentDescription', 'Authorize direct allocation transfer for "' + deal.title + '"');

                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            }
        }

        function closePaymentModal() {
            const modal = document.getElementById('paymentProcessingModal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        async function executeWalletDeduction() {
            // ── Pre-flight: client-side balance check for instant UX feedback ──
            const currentBalance = parseFloat((window._fbUserData && window._fbUserData.balance) || 0);
            if (currentBalance < targetPendingPaymentPrice) {
                showCustomAlert(`Insufficient wallet balance. This deal costs $${Number(targetPendingPaymentPrice).toLocaleString()}, but your balance is $${currentBalance.toFixed(2)}. Top up your wallet to continue.`);
                return;
            }

            // Disable Pay Now button while request is in flight
            const _payBtn = document.querySelector('#paymentProcessingModal button[onclick*="executeWalletDeduction"]');
            if (_payBtn) { _payBtn.disabled = true; _payBtn.textContent = 'Processing…'; }

            try {
                const _auth = window._fbAuth;
                const _user = _auth && _auth.currentUser;
                if (!_user) throw new Error('Not signed in.');
                const _idToken = await _user.getIdToken();

                // ── 1. Server-side deduction via /api/transfer ──
                const _deal       = dealsRegistry[targetPendingDealId] || {};
                const _sellerUid  = _currentChatUid; // the person the buyer is chatting with

                const _res = await fetch('/api/transfer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + _idToken
                    },
                    body: JSON.stringify({
                        recipientUid: _sellerUid,
                        amount:       Number(targetPendingPaymentPrice),
                        dealId:       targetPendingDealId,
                        _dealEscrow:  true   // flag so server writes pending instead of releasing
                    })
                });

                const _json = await _res.json().catch(() => ({}));
                if (!_res.ok) throw new Error(_json.error || 'Payment failed.');

                // ── 2. Update local balance from server response ──
                if (_json.newBalance !== undefined && window._fbUserData) {
                    window._fbUserData.balance = _json.newBalance;
                    const _balEl = document.getElementById('acStatBalance');
                    if (_balEl) _balEl.textContent = '$' + Number(_json.newBalance).toFixed(2);
                }

                // ── 3. Write deal status = 'paid' in Firebase ──
                try {
                    const _db  = window._fbDb;
                    const _fns = window._fbDbFns;
                    const _uid = _user.uid;
                    if (_db && _fns && _fns.ref && _fns.set) {
                        // Mark deal as paid in messages
                        const _dealPath = 'messages/' + [_uid, _sellerUid].sort().join('_') + '/deal_' + targetPendingDealId;
                        await _fns.set(_fns.ref(_db, _dealPath + '/status'), 'paid').catch(() => {});

                        // Write pending balance to seller (funds on hold until site transfer)
                        const _sellerPendRef = _fns.ref(_db, 'users/' + _sellerUid + '/pendingBalance');
                        const _pendSnap = await _fns.get(_sellerPendRef).catch(() => null);
                        const _prevPend = (_pendSnap && _pendSnap.val && _pendSnap.val()) || 0;
                        const _addAmt   = _json.recipientReceived || Number(targetPendingPaymentPrice);
                        await _fns.set(_sellerPendRef, parseFloat((_prevPend + _addAmt).toFixed(2))).catch(() => {});

                        // Record deal payment entry for audit trail
                        await _fns.set(_fns.ref(_db, 'deals/' + targetPendingDealId), {
                            buyerUid:   _uid,
                            sellerUid:  _sellerUid,
                            amount:     Number(targetPendingPaymentPrice),
                            received:   _addAmt,
                            status:     'paid',
                            paidAt:     Date.now(),
                            title:      _deal.title || '',
                        }).catch(() => {});
                    }
                } catch(_fe) { console.warn('[pay] firebase write partial fail', _fe); }

            } catch (_err) {
                if (_payBtn) { _payBtn.disabled = false; _payBtn.textContent = 'Pay Now'; }
                showCustomAlert(_err.message || 'Payment failed. Please try again.');
                return;
            }

            closePaymentModal();
            dealsRegistry[targetPendingDealId].status = 'paid';
            const _overlayEl = document.getElementById(`overlay_approved_${targetPendingDealId}`);
            if (_overlayEl) _overlayEl.querySelector('.imsg-deal-overlay-sub').textContent = 'Buyer paid $' + Number(targetPendingPaymentPrice).toLocaleString() + ' — awaiting site transfer';
            appendSystemLogMessage(`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;color:#58f278;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-4-3a4 4 0 0 0 4 3c2.21 0 4-1.343 4-3s-1.79-3-4-3-4-1.343-4-3 1.79-3 4-3a4 4 0 0 1 4 3"/></svg>Transaction Success: Paid $${Number(targetPendingPaymentPrice).toLocaleString()} from your wallet balance.`);
            if (_activeStickyDealId === targetPendingDealId) updateDealStickyBanner(targetPendingDealId);
            updateSystemCountersUI();

            // Notify seller (the chat partner) — push + email
            const _notifDeal  = dealsRegistry[targetPendingDealId] || {};
            const _myName     = (window._fbUserData && window._fbUserData.username) || 'Buyer';
            const _myEmail    = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.email) || '';
            const _paidAmt    = '$' + Number(targetPendingPaymentPrice).toLocaleString();
            const _dealTitle  = _notifDeal.title || 'your listing';

            // Fetch seller email from Firebase so we can email them
            (async function() {
                var sellerEmail = '';
                try {
                    var db = window._fbDb; var fns = window._fbDbFns;
                    if (db && fns && fns.ref && fns.get && _currentChatUid) {
                        var snap = await fns.get(fns.ref(db, 'users/' + _currentChatUid + '/email'));
                        sellerEmail = snap && snap.val ? (snap.val() || '') : '';
                    }
                } catch(e) {}

                _notifyUser('payment', _currentChatUid, {
                    title:   'Payment received — ' + _paidAmt,
                    body:    _myName + ' paid ' + _paidAmt + ' for "' + _dealTitle + '". Transfer the site to complete the deal.',
                    chatMsg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;color:#58f278;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-4-3a4 4 0 0 0 4 3c2.21 0 4-1.343 4-3s-1.79-3-4-3-4-1.343-4-3 1.79-3 4-3a4 4 0 0 1 4 3"/></svg>Payment sent: ' + _myName + ' paid ' + _paidAmt + ' for "' + _dealTitle + '".',
                    email: sellerEmail ? {
                        to:      sellerEmail,
                        subject: 'Payment received: ' + _paidAmt + ' for "' + _dealTitle + '" on Siterifty',
                        html:    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
                            <h2 style="margin:0 0 8px;font-size:22px;color:#58f278;">💸 Payment Received!</h2>
                            <p style="color:#a0a0b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
                                <strong style="color:#fff;">${_myName}</strong> has paid <strong style="color:#58f278;">${_paidAmt}</strong> for <strong style="color:#fff;">"${_dealTitle}"</strong>.
                            </p>
                            <p style="color:#a0a0b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
                                The funds are held in escrow. Please transfer the site assets to the buyer to release payment to your wallet.
                            </p>
                            <a href="https://siterifty.com" style="display:inline-block;background:linear-gradient(135deg,#58f278,#34d399);color:#04140f;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">Go to Siterifty →</a>
                            <p style="color:#555;font-size:11px;margin-top:24px;">Buyer email: ${_myEmail || 'N/A'} · Deal ID: ${targetPendingDealId}</p>
                        </div>`
                    } : null
                });
            })();
        }

        function appendSystemLogMessage(text) {
            const container = document.getElementById('chatMessagesContent');
            const html = `<div class="imsg-syslog-wrap"><div class="imsg-syslog">${text}</div></div>`;
            container.insertAdjacentHTML('beforeend', html);
            scrollToLatest();
        }

        // ── Unified notification dispatcher ──────────────────────────────────────
        // Sender clicks send → calls /api/push-notify.js with recipientUid + payload.
        // The API looks up recipient's push subscription from Firebase and sends
        // a real Web Push via the VAPID keys — works even when their tab is closed.
        // Email only fires for 'donate' and 'payment'.
        // ─────────────────────────────────────────────────────────────────────────
        async function _notifyUser(type, recipientUid, opts) {
            opts = opts || {};

            // 1. Append a system log line in the active chat (visible to the SENDER)
            if (opts.chatMsg) appendSystemLogMessage(opts.chatMsg);

            // 2. Call /api/push-notify.js — server reads recipient's subscription from
            //    Firebase and sends the Web Push. Works with tab closed / phone locked.
            try {
                var auth = window._fbAuth;
                var user = auth && auth.currentUser;
                if (user && recipientUid) {
                    var idToken = await user.getIdToken();
                    fetch('/api/settings.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + idToken
                        },
                        body: JSON.stringify({
                            action:       'push-notify',
                            recipientUid: recipientUid,
                            type:         type,
                            title:        opts.title || 'Siterifty',
                            body:         opts.body  || ''
                        })
                    }).catch(function(e) { console.warn('[push-notify]', e); });
                }
            } catch(e) { console.warn('[notify]', e); }

            // 3. Email — only for 'donate' and 'payment'
            if ((type === 'donate' || type === 'payment') && opts.email && window._sendEmail) {
                window._sendEmail(opts.email.to, opts.email.subject, opts.email.html).catch(function(){});
            }
        }

        // ── In-tab fallback: listen for pendingPush entries written by the API ──
        // The API also writes to /users/{uid}/pendingPush so that if the tab IS open
        // but the OS push hasn't fired yet, the listener catches it immediately.
        (function _listenPendingPush() {
            function _start(uid) {
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                if (!db || !fns || !fns.ref || !fns.onValue || !fns.remove) return;
                var pushRef = fns.ref(db, 'users/' + uid + '/pendingPush');
                fns.onValue(pushRef, function(snap) {
                    if (!snap || !snap.exists()) return;
                    var canNotify = 'Notification' in window && Notification.permission === 'granted';
                    snap.forEach(function(child) {
                        var p = child.val();
                        if (!p) return;
                        if (canNotify && !(document.hasFocus && document.hasFocus())) {
                            new Notification(p.title || 'Siterifty', {
                                body: p.body || '',
                                icon: '/favicon.ico',
                                tag:  p.type + '_' + child.key
                            });
                        }
                    });
                    fns.remove(pushRef).catch(function(){});
                });
            }

            var _iv = setInterval(function() {
                var auth = window._fbAuth;
                if (auth && auth.currentUser && window._fbDb && window._fbDbFns) {
                    clearInterval(_iv);
                    _start(auth.currentUser.uid);
                    auth.onAuthStateChanged && auth.onAuthStateChanged(function(u) {
                        if (u) _start(u.uid);
                    });
                }
            }, 800);
        })();

        function openModernLinkModal() {
            document.getElementById('dropUpMenu').classList.remove('open');
            document.getElementById('modalLinkTitle').value = '';
            document.getElementById('modalLinkUrl').value = '';
            updateLiveLinkPreview();
            document.getElementById('modernLinkModal').classList.add('open');
        }

        function closeModernLinkModal() {
            document.getElementById('modernLinkModal').classList.remove('open');
        }

        function updateLiveLinkPreview() {
            const titleInput = document.getElementById('modalLinkTitle').value || "Link Attachment Title";
            let urlInput = document.getElementById('modalLinkUrl').value || "https://yoururl.com";
            document.getElementById('previewTitle').innerText = titleInput;
            document.getElementById('previewUrl').innerText = urlInput;
        }

        // ── Persist a chat message to Firebase so it survives reloads and reaches the other person ──
        // Realtime DB has no shared "conversation" node here — each user has their own
        // users/{uid}/inbox — so a message has to be written to BOTH the sender's and the
        // recipient's inbox under the same key for both sides to see the full thread.
        //
        // Only free-text user content (type 'text' or 'link') is queued for batch AI
        // moderation — images/documents/deals/donations carry synthetic labels, not
        // user-authored prose, so they're marked moderated immediately and skipped.
        function _persistChatMessage(extra) {
            try {
                var _needsModeration = !extra || extra.type === 'text' || extra.type === 'link' || !extra.type;
                extra = Object.assign({ moderated: !_needsModeration }, extra || {});
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
                if (!db || !fns || !fns.ref || !fns.push || !fns.set || !myUid || !_currentChatUid) {
                    console.warn('[chat send] Firebase not ready or no active chat target — message was not saved.');
                    return null;
                }
                var userData = window._fbUserData || {};
                var myUsername = userData.username || (window._fbAuth.currentUser.email ? window._fbAuth.currentUser.email.split('@')[0] : 'User');

                // GROUP CHAT — shared room per sub-group, single write, no per-user inbox fan-out
                if (_currentChatUid === GROUP_CHAT_UID) {
                    var groupBase = Object.assign({
                        fromUid:      myUid,
                        fromUsername: myUsername,
                        fromPhoto:    (window._fbAuth.currentUser.photoURL) || (userData.avatarUrl) || '',
                        sentAt:       Date.now()
                    }, extra || {});
                    var activeGroupId = _currentGroupId || 'GROUP';
                    var groupKey = fns.push(fns.ref(db, 'groupChat/' + activeGroupId + '/messages')).key;
                    fns.set(fns.ref(db, 'groupChat/' + activeGroupId + '/messages/' + groupKey), groupBase).catch(function(err) {
                        console.warn('[group chat send] failed to save message', err);
                    });
                    return groupBase;
                }

                var base = Object.assign({
                    fromUid:      myUid,
                    toUid:        _currentChatUid,
                    fromUsername: myUsername,
                    fromEmail:    userData.email || window._fbAuth.currentUser.email || '',
                    toName:       _currentChatName || '',
                    sentAt:       Date.now(),
                    read:         false
                }, extra || {});

                // Use one push key shared by both copies so they can be correlated/deduped if needed.
                var newKey = fns.push(fns.ref(db, 'users/' + myUid + '/inbox')).key;

                var updates = {};
                updates['users/' + myUid + '/inbox/' + newKey]            = base;
                updates['users/' + _currentChatUid + '/inbox/' + newKey]  = base;
                fns.update(fns.ref(db, '/'), updates).catch(function(err) {
                    console.warn('[chat send] failed to save message', err);
                });
                return base;
            } catch (e) {
                console.warn('[chat send] error', e);
                return null;
            }
        }

        // ── Update deal status in both users' Firebase inbox nodes when recipient responds ──
        function _syncDealStatus(dealId, newStatus) {
            try {
                var db  = window._fbDb;
                var fns = window._fbDbFns;
                var myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
                if (!db || !fns || !fns.ref || !fns.get || !fns.update || !myUid || !_currentChatUid) return;

                // Scan my inbox for the deal message key, then update both copies
                fns.get(fns.ref(db, 'users/' + myUid + '/inbox')).then(function(snap) {
                    if (!snap || !snap.exists()) return;
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (m && m.type === 'deal' && m.dealId === dealId) {
                            var key = child.key;
                            var updates = {};
                            updates['users/' + myUid + '/inbox/' + key + '/deal/status']         = newStatus;
                            updates['users/' + _currentChatUid + '/inbox/' + key + '/deal/status'] = newStatus;
                            fns.update(fns.ref(db, '/'), updates).catch(function(err) {
                                console.warn('[dealSync] update failed', err);
                            });
                        }
                    });
                }).catch(function(err) {
                    console.warn('[dealSync] get failed', err);
                });
            } catch(e) {
                console.warn('[dealSync] error', e);
            }
        }

        function sendEmbeddedLinkMessage() {
            if (!checkMessageQuota()) return;
            const title = document.getElementById('modalLinkTitle').value || "Shared Link Asset";
            let url = document.getElementById('modalLinkUrl').value || "https://siterifty.com";

            const container = document.getElementById('chatMessagesContent');
            const msgHtml = `
              <div class="imsg-bubble-out">
                <div class="imsg-bubble-link">
                  <span class="imsg-bubble-link-tag"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>LINK EMBED</span>
                  <h5>${title}</h5>
                  <a href="${url}" target="_blank">${url}</a>
                </div>
              </div>`;

            container.insertAdjacentHTML('beforeend', msgHtml);
            _persistChatMessage({ message: '[Link] ' + title, linkTitle: title, linkUrl: url, type: 'link' });
            _triggerBatchModeration();
            incrementMsgCount();
            updateSystemCountersUI();
            scrollToLatest();
            closeModernLinkModal();

            // Push-only notify recipient (skip for the shared group room)
            if (_currentChatUid !== GROUP_CHAT_UID) {
                var _myNameL = (window._fbUserData && window._fbUserData.username) || 'Someone';
                _notifyUser('message', _currentChatUid, {
                    title: _myNameL + ' shared a link',
                    body:  title + ' — ' + url
                });
            }
        }

        // ── Batch moderation trigger ─────────────────────────────────────────
        // Fired (fire-and-forget) after a message is sent. Server enforces the
        // actual 60s cooldown via meta/lastModerationRun, so calling this often
        // is safe — most calls will just get { ran:false, reason:'cooldown' }.
        function _triggerBatchModeration() {
            try {
                fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _action: 'runModeration' })
                }).catch(function(e) { console.warn('[moderation trigger] failed', e); });
            } catch (e) { /* no-op */ }
        }

        function _showModerationToast(reason) {
            // Used when a previously-sent message is retroactively removed by
            // the batch moderation system (see _checkWarningGate).
            var existing = document.getElementById('imsgModerationToast');
            if (existing) existing.remove();
            var toast = document.createElement('div');
            toast.id = 'imsgModerationToast';
            toast.style.cssText = [
                'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:99999',
                'background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.35)',
                'border-radius:14px;padding:11px 18px;max-width:320px;width:calc(100vw - 40px)',
                'display:flex;align-items:flex-start;gap:10px',
                'box-shadow:0 8px 32px rgba(0,0,0,0.5);backdrop-filter:blur(16px)',
                'animation:imsgToastIn .2s cubic-bezier(.34,1.56,.64,1) both'
            ].join(';');
            toast.innerHTML = ''
                + '<svg style="flex-shrink:0;margin-top:1px" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                + '<div>'
                +   '<div style="font-family:\'Syne\',sans-serif;font-size:12px;font-weight:800;color:#f87171;margin-bottom:3px;">Message removed</div>'
                +   '<div style="font-size:11px;color:rgba(248,113,113,0.75);line-height:1.5;">' + (reason || 'Keep conversations professional and on-platform.') + '</div>'
                + '</div>';
            document.body.appendChild(toast);
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 5000);
        }
        window._showModerationToast = _showModerationToast;

        // Inject toast keyframe once
        if (!document.getElementById('imsgModerationStyle')) {
            var _ms = document.createElement('style');
            _ms.id = 'imsgModerationStyle';
            _ms.textContent = '@keyframes imsgToastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
            document.head.appendChild(_ms);
        }

        async function sendStandardTextMessage() {
            if (_currentChatUid === GROUP_CHAT_UID) {
                var _activeG = _gpFindGroup(_currentGroupId);
                if (_activeG && _activeG.mediaOnly) return; // text disabled in media-only groups
            }
            if (!checkMessageQuota()) return;
            const input = document.getElementById('chatTextMessageInput');
            const val = input.value.trim();
            if (!val) return;

            const container = document.getElementById('chatMessagesContent');
            const html = `
              <div class="imsg-bubble-out">
                <div class="imsg-bubble-out-content">${val}</div>
              </div>`;
            container.insertAdjacentHTML('beforeend', html);
            // Sent immediately — flagged unsafe content is reviewed and removed
            // asynchronously by the batch moderation system (runs ~every 60s).
            _persistChatMessage({ message: val, type: 'text' });
            _triggerBatchModeration();
            input.value = '';
            incrementMsgCount();
            updateSystemCountersUI();
            scrollToLatest();

            // Push-only notify recipient — no email for plain messages (skip for the shared group room)
            if (_currentChatUid !== GROUP_CHAT_UID) {
                var _myName = (window._fbUserData && window._fbUserData.username) || 'Someone';
                _notifyUser('message', _currentChatUid, {
                    title: _myName + ' sent you a message',
                    body:  val.length > 80 ? val.slice(0, 80) + '…' : val
                });
            }
        }

        function openImageInPopup(url, name) {
            document.getElementById('popupTargetImage').src = url;
            document.getElementById('popupImageName').innerText = name;
            document.getElementById('fullscreenImageModal').classList.add('open');
        }

        function closeFullscreenImage() {
            document.getElementById('fullscreenImageModal').classList.remove('open');
        }

        function appendImageMessage(fileName, objectURL) {
            const container = document.getElementById('chatMessagesContent');
            const escapedName = fileName.replace(/'/g, "\\'");
            const html = `
              <div class="imsg-bubble-out">
                <div class="imsg-img-bubble">
                  <div class="imsg-img-frame">
                    <img src="${objectURL}" alt="" />
                    <div class="imsg-img-hover">
                      <button onclick="openImageInPopup('${objectURL}', '${escapedName}')" class="imsg-img-view-btn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>VIEW IMAGE</button>
                    </div>
                  </div>
                  <div class="imsg-img-meta">
                    <span class="imsg-img-filename">${fileName}</span>
                    <button onclick="openImageInPopup('${objectURL}', '${escapedName}')" class="imsg-img-view-link">VIEW</button>
                  </div>
                </div>
              </div>`;
            container.insertAdjacentHTML('beforeend', html);
            scrollToLatest();
        }

        function appendDocumentMessage(fileName, fileUrl, fileData, mimeType, isMine, time, rawMsg) {
            const container = document.getElementById('chatMessagesContent');
            // Reconstruct a blob URL from base64 if no direct URL is available
            const resolvedUrl = fileUrl || (fileData ? base64ToObjectURL(fileData, mimeType) : '#');
            const isHtml = fileName.toLowerCase().endsWith('.html');
            const typeLabel = isHtml ? 'HTML INTERACTIVE PAGE' : 'DOCUMENT PDF';
            const bubbleClass = isMine === false ? 'imsg-bubble-in' : 'imsg-bubble-out';
            const docCorner = isMine === false
                ? 'border-bottom-left-radius:0;border-bottom-right-radius:16px;'
                : 'border-bottom-right-radius:0;border-bottom-left-radius:16px;';
            const timeAlign = isMine === false ? 'left' : 'right';
            const timeHtml  = time ? `<div style="font-size:10px;color:var(--muted,#6b6890);text-align:${timeAlign};margin-top:3px;">${time}</div>` : '';
            const docDots = rawMsg ? _msgActionsHtml(rawMsg, isMine !== false) : '';
            const html = `
              <div class="${bubbleClass}">
                ${isMine !== false ? docDots : ''}
                <a href="${resolvedUrl}" target="_blank" class="imsg-doc-bubble" style="${docCorner}">
                  <div class="imsg-doc-row">
                    <div class="imsg-doc-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    </div>
                    <div style="min-width:0;">
                      <span class="imsg-doc-type">${typeLabel}</span>
                      <p class="imsg-doc-name">${fileName}</p>
                      <span class="imsg-doc-sub">Click to preview file</span>
                    </div>
                  </div>
                </a>
                ${isMine === false ? docDots : ''}
                ${timeHtml}
              </div>`;
            container.insertAdjacentHTML('beforeend', html);
            scrollToLatest();
        }

        function appendDocumentMessageUploading(fileName) {
            const container = document.getElementById('chatMessagesContent');
            const id = 'doc_upload_' + Date.now();
            const html = `
              <div id="${id}" class="imsg-bubble-out">
                <div class="imsg-doc-bubble" style="cursor:default;">
                  <div class="imsg-doc-row">
                    <div class="imsg-doc-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    </div>
                    <div style="min-width:0;">
                      <span class="imsg-doc-type">UPLOADING…</span>
                      <p class="imsg-doc-name">${fileName}</p>
                      <span class="imsg-doc-sub">Sending securely</span>
                    </div>
                  </div>
                </div>
              </div>`;
            container.insertAdjacentHTML('beforeend', html);
            scrollToLatest();
            return id;
        }

        // base64ToObjectURL — converts stored base64 back to a usable blob URL.
        // Used by both the sender's resolving placeholder and the recipient's inbox render.
        function base64ToObjectURL(base64Data, mimeType) {
            try {
                const binary = atob(base64Data);
                const bytes  = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                return URL.createObjectURL(new Blob([bytes], { type: mimeType || 'application/octet-stream' }));
            } catch(e) {
                console.error('[base64ToObjectURL]', e);
                return null;
            }
        }

        function replaceDocumentUploadingBubble(placeholderId, fileName, fileUrl, base64Data, mimeType) {
            const placeholder = document.getElementById(placeholderId);
            if (!placeholder) return;
            const resolvedUrl = fileUrl || (base64Data ? base64ToObjectURL(base64Data, mimeType) : '#');
            const isHtml = fileName.toLowerCase().endsWith('.html');
            const typeLabel = isHtml ? 'HTML INTERACTIVE PAGE' : 'DOCUMENT PDF';
            placeholder.outerHTML = `
              <div class="imsg-bubble-out">
                <a href="${resolvedUrl}" target="_blank" class="imsg-doc-bubble">
                  <div class="imsg-doc-row">
                    <div class="imsg-doc-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    </div>
                    <div style="min-width:0;">
                      <span class="imsg-doc-type">${typeLabel}</span>
                      <p class="imsg-doc-name">${fileName}</p>
                      <span class="imsg-doc-sub">Click to preview file</span>
                    </div>
                  </div>
                </a>
              </div>`;
            scrollToLatest();
        }

        function scrollToLatest() {
            const el = document.getElementById('chatMessagesContent');
            el.scrollTop = el.scrollHeight;
        }

        // Alert type themes
        var _alertThemes = {
            error:   { bar:'linear-gradient(90deg,#ff453a,#ff6b6b)', ring:'rgba(255,69,58,0.12)', ringBorder:'rgba(255,69,58,0.28)', stroke:'#ff453a',
                       icon:'<path d="M6 18 18 6M6 6l12 12"/>', title:'Error' },
            warning: { bar:'linear-gradient(90deg,#ffd60a,#ffb340)', ring:'rgba(255,214,10,0.12)', ringBorder:'rgba(255,214,10,0.28)', stroke:'#ffd60a',
                       icon:'<path d="M12 9v3.75m0 3.75h.008v-.008H12v.008zm9-3.75a9 9 0 11-18 0 9 9 0 0118 0z"/>', title:'Warning' },
            success: { bar:'linear-gradient(90deg,#30d158,#34c759)', ring:'rgba(48,209,88,0.12)', ringBorder:'rgba(48,209,88,0.28)', stroke:'#30d158',
                       icon:'<path d="M4.5 12.75l6 6 9-13.5"/>', title:'Success' },
            info:    { bar:'linear-gradient(90deg,#0a84ff,#5e5ce6)', ring:'rgba(10,132,255,0.12)', ringBorder:'rgba(10,132,255,0.28)', stroke:'#0a84ff',
                       icon:'<path d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>', title:'Info' }
        };

        function _detectAlertType(msg) {
            var m = (msg || '').toLowerCase();
            if (/insuffici|balance|failed|error|invalid|cannot|unable|denied|blocked|rejected|no longer|expired/.test(m)) return 'error';
            if (/limit|quota|upgrade|maximum|minimum|too (long|short|many)|already|wait|cooldown/.test(m)) return 'warning';
            if (/success|sent|approved|completed|saved|updated|confirmed|subscribed/.test(m)) return 'success';
            return 'info';
        }

        function showCustomAlert(msg, typeOverride) {
            var type   = typeOverride || _detectAlertType(msg);
            var theme  = _alertThemes[type] || _alertThemes.info;
            var modal  = document.getElementById('alertModal');

            // Set message
            var msgEl = document.getElementById('alertMessage');
            if (msgEl) msgEl.textContent = msg || '';

            // Title
            var titleEl = document.getElementById('alertTitleEl');
            if (titleEl) titleEl.textContent = theme.title;

            // Accent bar
            var bar = document.getElementById('alertAccentBar');
            if (bar) bar.style.background = theme.bar;

            // Icon ring
            var ring = document.getElementById('alertIconRing');
            if (ring) { ring.style.background = theme.ring; ring.style.borderColor = theme.ringBorder; }

            // Icon SVG
            var iconSvg = document.getElementById('alertIconSvg');
            if (iconSvg) {
                iconSvg.setAttribute('stroke', theme.stroke);
                iconSvg.innerHTML = theme.icon;
            }

            // Show
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeAlert() {
            var modal = document.getElementById('alertModal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Expose globally so external scripts (donate modal, etc.) can use the custom alert
        window.showCustomAlert = showCustomAlert;
        window.closeAlert = closeAlert;

        refreshPlanUI();

(function() {
    const DONATE_FEE_RATE  = 0.03;
    const DONATE_FEE_FIXED = 0.49;
    const DONATE_MIN       = 1.00;
    const DONATE_MAX       = 999.00;
    let _donateTargetUid = '', _donateTargetName = '', _donateBalance = 0;

    const GRADS = [['#9b5de5','#e879a0'],['#38bdf8','#818cf8'],['#2dd4a0','#38bdf8'],['#f5c842','#f97316'],['#e879a0','#fb7185'],['#818cf8','#9b5de5'],['#2dd4a0','#9b5de5'],['#38bdf8','#2dd4a0'],['#fb923c','#e879a0'],['#a3e635','#38bdf8'],['#e879f9','#818cf8'],['#2dd4bf','#38bdf8']];
    function _avatarGrad(uid) {
        if (!uid) return GRADS[0];
        let h = 0; for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
        return GRADS[h % GRADS.length];
    }
    function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function _fmtMoney(n) { if (!isFinite(n) || n < 0) n = 0; return '$' + n.toFixed(2); }
    function _donateFee(amt) { if (amt <= 0) return 0; return Math.round((amt * DONATE_FEE_RATE + DONATE_FEE_FIXED) * 100) / 100; }

    window.homeUpdateDonatePreview = function() {
        const input = document.getElementById('homeDonateAmountInput');
        let amt = parseFloat(input.value);
        if (!isFinite(amt) || amt < 0) amt = 0;
        const fee  = _donateFee(amt);
        const recv = Math.max(amt - fee, 0);
        document.getElementById('homeDonateFeeAmount').textContent = _fmtMoney(fee);
        document.getElementById('homeDonateRecipientAmount').textContent = _fmtMoney(recv);
        const errEl = document.getElementById('homeDonateError');
        const btn   = document.getElementById('homeSubmitDonateBtn');
        if (amt > 0 && amt > _donateBalance) {
            errEl.textContent = 'Amount exceeds your wallet balance.'; errEl.classList.add('active'); btn.disabled = true;
        } else if (amt > 0 && amt < DONATE_MIN) {
            errEl.textContent = `Minimum donation is ${_fmtMoney(DONATE_MIN)}.`; errEl.classList.add('active'); btn.disabled = true;
        } else if (amt > DONATE_MAX) {
            errEl.textContent = `Maximum donation is ${_fmtMoney(DONATE_MAX)}.`; errEl.classList.add('active'); btn.disabled = true;
        } else {
            errEl.classList.remove('active'); btn.disabled = false;
        }
    };

    window.openDonateModal = async function(uid, name, photoURL) {
        const _myUid = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || (window._fbUserData && window._fbUserData.uid) || '';
        if (!_myUid) {
            if (typeof window.showCustomAlert === 'function') window.showCustomAlert('Please sign in to send a donation.');
            if (typeof openAuthModal === 'function') openAuthModal();
            return;
        }
        if (uid && uid === _myUid) {
            if (typeof window.showCustomAlert === 'function') window.showCustomAlert("You can't donate to yourself.");
            return;
        }
        _donateTargetUid  = uid || '';
        _donateTargetName = name || 'this seller';
        const handle = '@' + _donateTargetName.replace(/^@/, '');

        document.getElementById('homeDonateTargetName').textContent = handle;
        document.getElementById('homeDonateRecipientName').textContent = handle;
        document.getElementById('homeDonateRecipientLabel').textContent = handle + ' receives';

        const picEl = document.getElementById('homeDonateRecipientPic');
        if (photoURL) {
            picEl.innerHTML = `<img src="${_esc(photoURL)}" alt="${_esc(_donateTargetName)}">`;
        } else {
            picEl.innerHTML = '';
            picEl.textContent = _donateTargetName.slice(0, 2).toUpperCase();
            const [c1, c2] = _avatarGrad(uid);
            picEl.style.background = `linear-gradient(135deg,${c1},${c2})`;
        }

        // Reset form
        document.getElementById('homeDonateAmountInput').value = '';
        document.getElementById('homeDonateFeeAmount').textContent = '$0.00';
        document.getElementById('homeDonateRecipientAmount').textContent = '$0.00';
        document.getElementById('homeDonateError').classList.remove('active');
        const btn = document.getElementById('homeSubmitDonateBtn');
        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12.5s-5-3.1-5-6.6A2.9 2.9 0 0 1 7 4.2 2.9 2.9 0 0 1 12 5.9c0 3.5-5 6.6-5 6.6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg> Send donation';

        document.getElementById('homeDonateModal').classList.add('active');
        if (window.lockScroll) window.lockScroll();

        // Fresh balance from Firebase
        try {
            if (window._fbDb && window._fbDbFns && _myUid) {
                const { ref, get } = window._fbDbFns;
                const snap = await get(ref(window._fbDb, 'users/' + _myUid + '/balance'));
                _donateBalance = parseFloat(snap.val() || 0);
                if (!isFinite(_donateBalance)) _donateBalance = 0;
            } else { _donateBalance = 0; }
        } catch (e) { _donateBalance = 0; }
        document.getElementById('homeDonateYourBalance').textContent = _fmtMoney(_donateBalance);
    };

    window.closeDonateModal = function() {
        document.getElementById('homeDonateModal').classList.remove('active');
        if (window.unlockScroll) window.unlockScroll();
    };

    window.homeSubmitDonation = async function() {
        const input = document.getElementById('homeDonateAmountInput');
        const amt   = parseFloat(input.value);
        const errEl = document.getElementById('homeDonateError');
        const btn   = document.getElementById('homeSubmitDonateBtn');

        if (!isFinite(amt) || amt <= 0) { errEl.textContent = 'Enter a valid amount.'; errEl.classList.add('active'); return; }
        if (amt < DONATE_MIN) { errEl.textContent = `Minimum donation is ${_fmtMoney(DONATE_MIN)}.`; errEl.classList.add('active'); return; }
        if (amt > DONATE_MAX) { errEl.textContent = `Maximum donation is ${_fmtMoney(DONATE_MAX)}.`; errEl.classList.add('active'); return; }
        if (amt > _donateBalance) { errEl.textContent = 'Amount exceeds your wallet balance.'; errEl.classList.add('active'); return; }

        const auth = window._fbAuth;
        const user = auth && auth.currentUser;
        if (!user) { errEl.textContent = 'Please sign in to send a donation.'; errEl.classList.add('active'); return; }

        errEl.classList.remove('active');
        btn.disabled = true;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Sending…';

        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
                body: JSON.stringify({ action: 'donate', recipientUid: _donateTargetUid, amount: amt })
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                errEl.textContent = data.error || 'Transfer failed. Please try again.';
                errEl.classList.add('active');
                btn.disabled = false; btn.innerHTML = originalHTML;
                return;
            }

            if (typeof data.newBalance === 'number') {
                _donateBalance = data.newBalance;
                const pillAmt = document.getElementById('walletPillAmount');
                if (pillAmt) pillAmt.textContent = '$' + data.newBalance.toFixed(2);
            }

            const recipientHandle = document.getElementById('homeDonateRecipientName').textContent;
            window.closeDonateModal();

            // ── Write donation to Firebase ledger (for Transaction History) ──
            (function() {
                try {
                    const _db = window._fbDb; const _fns = window._fbDbFns;
                    if (_db && _fns && _fns.ref && _fns.push) {
                        const _senderUid = user.uid;
                        const _donorUsername = (window._fbUserData && window._fbUserData.username) || '';
                        const _now = Date.now();
                        const _sentEntry   = { amount: amt, ts: _now, recipientUid: _donateTargetUid, recipientName: recipientHandle };
                        const _recvEntry   = { amount: amt, ts: _now, senderUid: _senderUid, senderName: _donorUsername };
                        _fns.push(_fns.ref(_db, 'users/' + _senderUid      + '/donations/sent'),     _sentEntry).catch(function(){});
                        _fns.push(_fns.ref(_db, 'users/' + _donateTargetUid + '/donations/received'), _recvEntry).catch(function(){});
                    }
                } catch(e) {}
            })();
            const _donorName = (window._fbUserData && window._fbUserData.username) || 'Someone';
            const _fmtAmt = _fmtMoney(amt);

            // Post a system message in chat if a conversation is open with this person
            if (_currentChatUid && _currentChatUid === _donateTargetUid) {
                appendSystemLogMessage(
                    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;color:#fbbf24;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v13.5m0-13.5a2.25 2.25 0 1 0-2.25-2.25v.75M12 8.25a2.25 2.25 0 1 0 2.25-2.25v.75"/></svg>' +
                    _donorName + ' donated ' + _fmtAmt + ' to ' + recipientHandle + '.'
                );
            }

            // Fetch recipient's email from Firebase, then send both emails
            (async function() {
                var recipientEmail = '';
                try {
                    var db = window._fbDb; var fns = window._fbDbFns;
                    if (db && fns && fns.ref && fns.get && _donateTargetUid) {
                        var snap = await fns.get(fns.ref(db, 'users/' + _donateTargetUid + '/email'));
                        recipientEmail = snap && snap.val ? (snap.val() || '') : '';
                    }
                } catch(e) {}

                // Sender confirmation email
                var senderEmail = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.email) || '';
                if (senderEmail && window._sendEmail) {
                    window._sendEmail(senderEmail,
                        'You sent ' + _fmtAmt + ' to ' + recipientHandle + ' on Siterifty',
                        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
                            <h2 style="margin:0 0 8px;font-size:22px;color:#34d399;">Donation Sent!</h2>
                            <p style="color:#a0a0b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
                                You sent <strong style="color:#fbbf24;">${_fmtAmt}</strong> to <strong style="color:#fff;">${recipientHandle}</strong>. The funds have been deducted from your Siterifty wallet.
                            </p>
                            <a href="https://siterifty.com" style="display:inline-block;background:linear-gradient(135deg,#34d399,#38bdf8);color:#04140f;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View your wallet →</a>
                            <p style="color:#555;font-size:11px;margin-top:24px;">Siterifty · This is a confirmation of your donation.</p>
                        </div>`
                    ).catch(function(){});
                }

                // Recipient notification — push + email
                _notifyUser('donate', _donateTargetUid, {
                    title: 'You received a donation — ' + _fmtAmt,
                    body:  _donorName + ' sent you ' + _fmtAmt + ' on Siterifty.',
                    email: recipientEmail ? {
                        to:      recipientEmail,
                        subject: 'You received ' + _fmtAmt + ' from ' + _donorName + ' on Siterifty',
                        html:    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
                            <h2 style="margin:0 0 8px;font-size:22px;color:#fbbf24;">Donation Received!</h2>
                            <p style="color:#a0a0b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
                                <strong style="color:#fff;">${_donorName}</strong> sent you a donation of <strong style="color:#fbbf24;">${_fmtAmt}</strong>. The funds have been added to your Siterifty wallet.
                            </p>
                            <a href="https://siterifty.com" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a0a00;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View your wallet →</a>
                            <p style="color:#555;font-size:11px;margin-top:24px;">Siterifty · You can manage donation preferences in Settings.</p>
                        </div>`
                    } : null
                });
            })();

            // Show success celebration
            const subText = `Sent ${_fmtMoney(amt)} to ${recipientHandle}`;
            document.getElementById('homeDonateSuccessSub').textContent = subText;
            const MONEY = [
                '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/><path d="M12 6.5v11M9.3 9.3c0-1.1 1.2-1.8 2.7-1.8s2.7.8 2.7 1.8c0 2.4-5.4 1.1-5.4 3.6 0 1.1 1.2 1.9 2.7 1.9s2.7-.7 2.7-1.9" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>',
                '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" fill="#34d399" stroke="#10b981" stroke-width="1"/><circle cx="12" cy="12" r="3" stroke="#ecfdf5" stroke-width="1.2"/><circle cx="5" cy="9" r="0.9" fill="#ecfdf5"/><circle cx="19" cy="15" r="0.9" fill="#ecfdf5"/></svg>',
                '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="10" rx="2" fill="#60a5fa" stroke="#3b82f6" stroke-width="1"/><circle cx="12" cy="12" r="2.6" stroke="#eff6ff" stroke-width="1.1"/></svg>',
                '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" fill="#fde68a" stroke="#d97706" stroke-width="1"/><text x="12" y="16" font-size="11" font-weight="800" text-anchor="middle" fill="#92400e">¢</text></svg>',
                '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" fill="#f0abfc"/></svg>'
            ];
            const c = document.getElementById('homeDonateParticles');
            c.innerHTML = '';
            for (let i = 0; i < 18; i++) {
                const el = document.createElement('span');
                el.className = 'd-s-particle';
                el.innerHTML = MONEY[Math.floor(Math.random() * MONEY.length)];
                el.style.left = Math.random() * 100 + '%';
                el.style.animationDelay = (Math.random() * 1.4) + 's';
                const sz = (16 + Math.random() * 14);
                el.style.width = sz + 'px';
                el.style.height = sz + 'px';
                el.style.display = 'inline-block';
                c.appendChild(el);
            }
            const overlay = document.getElementById('homeDonateSuccessOverlay');
            // Reset bar + tick animations
            const bar = overlay.querySelector('.donate-success-bar');
            const newBar = bar.cloneNode(true); bar.parentNode.replaceChild(newBar, bar);
            overlay.querySelectorAll('.d-tick-path').forEach(p => { const n = p.cloneNode(true); p.parentNode.replaceChild(n, p); });
            requestAnimationFrame(() => overlay.classList.add('active'));
            setTimeout(() => overlay.classList.remove('active'), 3150);

        } catch (err) {
            console.error('[home-donate]', err);
            errEl.textContent = 'Network error. Please try again.';
            errEl.classList.add('active');
        }
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    };
})();

(function () {
  // ── On page load: check if we're returning from GitHub OAuth ──
  var params = new URLSearchParams(window.location.search);
  var code   = params.get('code');
  var state  = params.get('state');

  if (code && state) {
    // Clean the URL immediately
    window.history.replaceState({}, '', '/');

    // Show the overlay in connecting state
    _ghOverlayConnecting();

    // Fire the callback directly — no popup needed
    var uid = state.split('_')[0];
    fetch('/api/github-autosell?mode=callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, uid: uid })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      // Push result back as a message so existing _onOAuthMessage handler picks it up
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'gh_oauth_code', code: code, uid: uid, _resolved: data },
        origin: window.location.origin
      }));
      _ghOverlaySuccess(data.username);
      _ghConnectSucceeded = true;
      _ghConnectUsername  = data.username || '';
      _ghConnectRepos     = data.repos    || [];
      setTimeout(function () { ghConnectClose(); }, 1400);
    })
    .catch(function(err) {
      _ghOverlayError(err.message || 'Connection failed — please try again.');
    });
  }

  var _ghConnectSucceeded = false;
  var _ghConnectRepos     = [];
  var _ghConnectUsername  = '';

  // ── Open overlay & redirect to GitHub ──
  window._ghConnectStart = function(oauthUrl) {
    _ghConnectSucceeded = false;
    _ghConnectRepos     = [];
    _ghConnectUsername  = '';
    window.history.pushState({}, '', '/');
    document.getElementById('ghConnectOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    _ghOverlayConnecting();
    // Redirect this tab to GitHub — it will come back with ?code=
    window.location.href = oauthUrl;
  };

  window.ghConnectClose = function() {
    document.getElementById('ghConnectOverlay').classList.remove('open');
    document.body.style.overflow = '';
    if (window.location.pathname === '/') {
      window.history.replaceState({}, '', '/');
    }
    // After successful connect: open the repo picker modal
    if (_ghConnectSucceeded) {
      _ghConnectSucceeded = false;
      setTimeout(function() {
        if (window._renderRepoPickerModal) {
          window._renderRepoPickerModal(_ghConnectUsername, '', _ghConnectRepos);
        } else if (window.openAutoSellModal) {
          window.openAutoSellModal();
        }
      }, 120);
    }
  };

  function _ghOverlayConnecting() {
    document.getElementById('ghConnectOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('ghConnectSpinner').classList.add('active');
    document.getElementById('ghConnectIcon').style.display = 'none';
    document.getElementById('ghConnectTitle').textContent = 'Connecting GitHub…';
    var sub = document.getElementById('ghConnectSub');
    sub.textContent = 'Finishing authorization, please wait.';
    sub.className = 'gh-connect-sub';
  }

  function _ghOverlaySuccess(username) {
    document.getElementById('ghConnectSpinner').classList.remove('active');
    var icon = document.getElementById('ghConnectIcon');
    icon.style.display = 'flex';
    icon.className = 'gh-connect-icon success';
    icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="rgba(48,209,88,0.9)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.getElementById('ghConnectTitle').textContent = 'GitHub connected!';
    var sub = document.getElementById('ghConnectSub');
    sub.textContent = username ? '@' + username + ' is now linked to your account.' : 'Your GitHub account is now linked.';
    sub.className = 'gh-connect-sub';
  }

  function _ghOverlayError(msg) {
    document.getElementById('ghConnectSpinner').classList.remove('active');
    var icon = document.getElementById('ghConnectIcon');
    icon.style.display = 'flex';
    icon.className = 'gh-connect-icon error';
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#f87171" stroke-width="2" stroke-linecap="round"/></svg>';
    document.getElementById('ghConnectTitle').textContent = 'Authorization failed';
    var sub = document.getElementById('ghConnectSub');
    sub.textContent = msg;
    sub.className = 'gh-connect-sub error';
  }
})();

// ── Global: keep bg-image skeletons visible until each image has actually loaded ──
(function() {
    function wireBgSkeleton(imgId, skeletonId) {
        var img = document.getElementById(imgId);
        var skel = document.getElementById(skeletonId);
        if (!img || !skel) return;
        function reveal() { skel.classList.add('is-loaded'); }
        if (img.complete && img.naturalWidth > 0) {
            // Already loaded from cache (e.g. hero loaded it first) — reveal immediately
            reveal();
        } else {
            img.addEventListener('load', reveal, { once: true });
            img.addEventListener('error', reveal, { once: true }); // don't block forever on a broken image
        }
    }
    wireBgSkeleton('srHeroBgImg', 'srHeroBgSkeleton');
    wireBgSkeleton('pswTitleAreaImg', 'pswTitleAreaSkeleton');
    wireBgSkeleton('msgOverlayBgImg', 'msgOverlayBgSkeleton');
    wireBgSkeleton('imsgChatHeaderImg', 'imsgChatHeaderSkeleton');
    wireBgSkeleton('dashModalBgImg', 'dashModalBgSkeleton');
})();

(function() {
    const AVATAR_URLS = [
        'https://wallpapers.com/images/hd/dark-galaxy-1080-x-1920-wallpaper-2pax0j8xoqtty0av.jpg',
        'https://i.pinimg.com/474x/52/97/b4/5297b4d029cc0d64ed6484d3c9919d6b.jpg',
        'https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg',
        'https://img.magnific.com/free-photo/cyberpunk-illustration-with-neon-colors-futuristic-technology_23-2151672018.jpg',
        'https://media.licdn.com/dms/image/v2/D5612AQG1iOLVOq8rOg/article-cover_image-shrink_720_1280/B56Z2VeuyvKcAM-/0/1776329354950?e=2147483647&v=beta&t=1vi3VbDwsgwyYKqGf_03thFpOz0M3jTejsGy07sFwzY',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ5ZNLMeTSmgQWXnHT0g32VtpbTCO9Ao0GXbf0M29X8A&s=10',
        'https://m.media-amazon.com/images/I/81SNLEuNQuL._UF1000,1000_QL80_.jpg'
    ];

    // Pick a random default avatar
    function _randomAvatar() {
        return AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
    }

    // ── UNIFIED PROFILE SETUP ─────────────────────────────────────
    let _psoUid = '';
    let _psoOnDone = null;
    let _psoSelectedAvatarUrl = '';
    let _psoEmailReadonly = false;

    function _psoOpen(uid, email, emailReadonly, username, onDone) {
        _psoUid = uid;
        _psoOnDone = onDone || null;
        _psoEmailReadonly = !!emailReadonly;
        _psoSelectedAvatarUrl = AVATAR_URLS[0];

        // Reset fields
        const usernameEl = document.getElementById('psoUsername');
        const emailEl    = document.getElementById('psoEmail');
        const bioEl      = document.getElementById('psoBio');
        const errEl      = document.getElementById('psoErr');
        const previewImg = document.getElementById('psoPreviewImg');
        const previewName= document.getElementById('psoPreviewName');
        const previewUser= document.getElementById('psoPreviewUser');

        if (usernameEl) usernameEl.value = username || '';
        if (emailEl) {
            emailEl.value = email || '';
            // When the auth method already supplied a verified email (manual signup, Google),
            // lock it down outright — readOnly alone still allows focus/selection, so disable it.
            // When the provider didn't supply one (e.g. GitHub with a private email), keep it
            // fully editable and required.
            emailEl.readOnly = !!emailReadonly;
            emailEl.disabled = !!emailReadonly;
            emailEl.required = !emailReadonly;
            emailEl.style.opacity = emailReadonly ? '0.55' : '1';
            emailEl.oninput = function() {
                if (previewUser) previewUser.textContent = this.value || 'email not set';
            };
        }
        if (bioEl) bioEl.value = '';
        const bioHintEl = document.getElementById('psoBioHint');
        if (bioHintEl) { bioHintEl.textContent = '0/500 (min 20)'; bioHintEl.classList.remove('warn'); }
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        if (previewName) previewName.textContent = username ? '@' + username : '@username';
        if (previewUser) previewUser.textContent = email || 'email not set';
        if (previewImg) previewImg.src = _psoSelectedAvatarUrl;

        // Pick one random background photo from our galaxy/theme pool and apply it to
        // this card and its preview card (same image on both surfaces). If the preloader
        // has already cached it as a data URL, that's used immediately — no network wait.
        const _bgPool = (typeof THEME_OPTIONS !== 'undefined' && THEME_OPTIONS.length) ? THEME_OPTIONS : AVATAR_URLS.map(function(u){ return { url: u }; });
        const _bgChoice = _bgPool[Math.floor(Math.random() * _bgPool.length)];
        const _bgUrl = _bgChoice.url || _bgChoice;
        const psoCardEl = document.getElementById('psoCard');
        const psoPreviewCardEl = document.getElementById('psoPreviewCard');
        if (psoCardEl) psoCardEl.style.backgroundImage = 'url(' + _bgUrl + ')';
        if (psoPreviewCardEl) psoPreviewCardEl.style.backgroundImage = 'url(' + _bgUrl + ')';
        if (window._srPreloadImage) window._srPreloadImage(_bgUrl);

        // Build avatar strip
        const strip = document.getElementById('psoAvatarStrip');
        if (strip) {
            strip.innerHTML = '';
            AVATAR_URLS.forEach(function(url, i) {
                const div = document.createElement('div');
                div.className = 'pso-pfp' + (i === 0 ? ' active' : '');
                div.innerHTML = '<img src="' + url + '" alt="avatar">';
                div.onclick = function() {
                    _psoSelectedAvatarUrl = url;
                    strip.querySelectorAll('.pso-pfp').forEach(function(p) { p.classList.remove('active'); });
                    div.classList.add('active');
                    if (previewImg) previewImg.src = url;
                };
                strip.appendChild(div);
            });
        }

        document.getElementById('profileSetupOverlay').classList.add('open');
        if (window._lockBodyScroll) window._lockBodyScroll(); else document.body.style.overflow = 'hidden';
        setTimeout(function() { if (usernameEl) usernameEl.focus(); }, 200);
    }

    // All three entry points → same modal
    window._openAvatarPicker = function(uid, username, onDone) {
        _psoOpen(uid, '', false, username, function(u, e, av) { if (onDone) onDone(av); });
    };
    window._openProfileSetup = function(uid, email, onDone) {
        _psoOpen(uid, email, true, '', function(u, e, av) { if (onDone) onDone(u, ''); });
    };
    window._openSocialProfileSetup = function(uid, provider, prefillEmail, onDone) {
        _psoOpen(uid, prefillEmail, !!prefillEmail, '', onDone);
    };

    window._psoSubmit = async function() {
        const btn      = document.getElementById('psoSubmitBtn');
        const errEl    = document.getElementById('psoErr');
        const username = (document.getElementById('psoUsername').value || '').trim();
        const email    = (document.getElementById('psoEmail').value || '').trim();
        const bio      = (document.getElementById('psoBio').value || '').trim();

        errEl.style.display = 'none';

        if (!username || username.length < 3) { errEl.textContent = 'Username must be at least 3 characters.'; errEl.style.display='block'; return; }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) { errEl.textContent = 'Only letters, numbers and underscores allowed.'; errEl.style.display='block'; return; }
        if (!_psoEmailReadonly && (!email || !/\S+@\S+\.\S+/.test(email))) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display='block'; return; }
        if (!bio || bio.length < 20) { errEl.textContent = 'Bio is required — please write at least 20 characters.'; errEl.style.display='block'; return; }
        if (bio.length > 500) { errEl.textContent = 'Bio must be 500 characters or fewer.'; errEl.style.display='block'; return; }

        btn.disabled = true; btn.textContent = 'Checking…';

        try {
            if (window._fbDb && window._fbDbFns) {
                const { ref, get, set, update } = window._fbDbFns;
                const db = window._fbDb;

                const snap = await get(ref(db, 'usernames/' + username.toLowerCase()));
                if (snap.exists() && snap.val() !== _psoUid) {
                    errEl.textContent = 'That username is already taken. Try another.';
                    errEl.style.display = 'block';
                    btn.disabled = false; btn.textContent = 'Save';
                    return;
                }

                btn.textContent = 'Saving…';

                // Release old username reservation if any
                const userSnap = await get(ref(db, 'users/' + _psoUid + '/username'));
                const oldUsername = userSnap.exists() ? userSnap.val() : null;
                if (oldUsername && oldUsername.toLowerCase() !== username.toLowerCase()) {
                    await set(ref(db, 'usernames/' + oldUsername.toLowerCase()), null);
                }

                const updates = { username: username, bio: bio, photoURL: _psoSelectedAvatarUrl, profileComplete: true };
                if (!_psoEmailReadonly && email) updates.email = email;
                await update(ref(db, 'users/' + _psoUid), updates);
                await set(ref(db, 'usernames/' + username.toLowerCase()), _psoUid);
            }

            if (window._applyPhotoURL) window._applyPhotoURL(_psoSelectedAvatarUrl);

            document.getElementById('profileSetupOverlay').classList.remove('open');
            if (window._unlockBodyScroll) window._unlockBodyScroll(); else document.body.style.overflow = '';
            btn.disabled = false; btn.textContent = 'Save';

            if (_psoOnDone) _psoOnDone(username, email, _psoSelectedAvatarUrl);

        } catch(e) {
            console.warn('[pso]', e);
            errEl.textContent = 'Something went wrong. Please try again.';
            errEl.style.display = 'block';
            btn.disabled = false; btn.textContent = 'Save';
        }
    };

    // Keep legacy stubs so nothing breaks
    window._avpConfirm = window._psoSubmit;
    window._spoSubmit  = window._psoSubmit;

    // ── THEME PICKER (shown after the tour) ───────────────────────
    const THEME_OPTIONS = [
        { url: 'https://plus.unsplash.com/premium_photo-1710962184823-907ade6b3783?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Minimal' },
        { url: 'https://plus.unsplash.com/premium_photo-1711136314696-b27c2a148d55?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Noir' },
        { url: 'https://plus.unsplash.com/premium_photo-1710962184909-f9f8dc2c9f5f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Shadow' },
        { url: 'https://plus.unsplash.com/premium_photo-1710030733204-6816ffb0a1b2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Dusk' },
        { url: 'https://plus.unsplash.com/premium_photo-1710965560034-778eedc929ff?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Slate' },
        { url: 'https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0', label: 'Smoke' },
        { url: 'https://plus.unsplash.com/premium_photo-1673292293042-cafd9c8a3ab3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0', label: 'Forest' },
        { url: 'https://images.unsplash.com/photo-1502318217862-aa4e294ba657?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0', label: 'Nebula' },
        { url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0', label: 'Galaxy' },
        { url: 'https://images.unsplash.com/photo-1725615357444-6123528686cf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0', label: 'Aurora' },
        { url: 'https://m.media-amazon.com/images/I/81SNLEuNQuL._UF1000,1000_QL80_.jpg', label: 'Anime' },
        { url: 'https://i.pinimg.com/736x/0e/86/ec/0e86ec1c8b5bcbebcff97fde58530db5.jpg', label: 'Default' }
    ];
    let _tpkSelected = null;
    let _tpkOnDone = null;

    function _tpkApplyAndSave(theme) {
        if (window.srSelectBg) {
            window.srSelectBg(theme ? { dataset: { bg: theme.url, label: theme.label } } : null);
        } else {
            // Fallback if srSelectBg isn't available yet
            try { localStorage.setItem('sr_bg_img', theme ? theme.url : '__none__'); } catch(_) {}
            if (window._srApplyBg) window._srApplyBg(theme ? theme.url : '');
        }
    }

    window._openThemePicker = function(onDone) {
        _tpkOnDone = onDone || null;
        _tpkSelected = THEME_OPTIONS[0];

        const grid = document.getElementById('tpkGrid');
        if (grid) {
            grid.innerHTML = '';
            THEME_OPTIONS.forEach(function(theme, i) {
                const opt = document.createElement('div');
                opt.className = 'tpk-option' + (i === 0 ? ' selected' : '');
                opt.innerHTML = '<img src="' + theme.url + '" alt="' + theme.label + '" loading="lazy">' +
                    '<div class="tpk-option-fade"></div>' +
                    '<div class="tpk-option-label">' + theme.label + '</div>' +
                    '<div class="tpk-option-check"><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
                opt.onclick = function() {
                    _tpkSelected = theme;
                    grid.querySelectorAll('.tpk-option').forEach(function(t) { t.classList.remove('selected'); });
                    opt.classList.add('selected');
                };
                grid.appendChild(opt);
            });
        }

        document.getElementById('themePickerOverlay').classList.add('open');
        if (window._lockBodyScroll) window._lockBodyScroll(); else document.body.style.overflow = 'hidden';
    };

    window._tpkConfirm = function() {
        const btn = document.getElementById('tpkConfirmBtn');
        btn.disabled = true;
        btn.textContent = 'Saving…';
        try { _tpkApplyAndSave(_tpkSelected); } catch(e) { console.warn('[tpk]', e); }
        document.getElementById('themePickerOverlay').classList.remove('open');
        if (window._unlockBodyScroll) window._unlockBodyScroll(); else document.body.style.overflow = '';
        btn.disabled = false;
        btn.textContent = 'Use this theme →';
        if (_tpkOnDone) _tpkOnDone(_tpkSelected);
    };

    // (social profile setup unified — see _openSocialProfileSetup above)

    // Expose random avatar helper
    window._srRandomAvatar = _randomAvatar;
    window._srAvatarUrls   = AVATAR_URLS;
})();

window._avatarFallback = function(img, kind) {
    const icons = {
        bot: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="5" y="9" width="14" height="11" rx="3" stroke="#a8ff6b" stroke-width="1.4"/><circle cx="9.5" cy="14.5" r="1.3" fill="#a8ff6b"/><circle cx="14.5" cy="14.5" r="1.3" fill="#a8ff6b"/><path d="M12 9V5m-2.5 0h5" stroke="#a8ff6b" stroke-width="1.4" stroke-linecap="round"/></svg>',
        pixel: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="4" height="4" fill="#c084fc"/><rect x="16" y="4" width="4" height="4" fill="#c084fc"/><rect x="4" y="16" width="4" height="4" fill="#c084fc"/><rect x="16" y="16" width="4" height="4" fill="#c084fc"/><rect x="9" y="9" width="6" height="6" fill="#c084fc"/></svg>',
        indie: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke="#6ee7b7" stroke-width="1.4"/><path d="M5 19.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke="#6ee7b7" stroke-width="1.4" stroke-linecap="round"/></svg>',
        geo: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 7-8 11-8-11 8-7z" stroke="#7dd3fc" stroke-width="1.4" stroke-linejoin="round"/></svg>',
        smile: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#fca5a5" stroke-width="1.4"/><circle cx="9" cy="10" r="1" fill="#fca5a5"/><circle cx="15" cy="10" r="1" fill="#fca5a5"/><path d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" stroke="#fca5a5" stroke-width="1.3" stroke-linecap="round"/></svg>'
    };
    img.style.display = 'none';
    if (img.parentElement) {
        img.parentElement.style.display = 'flex';
        img.parentElement.style.alignItems = 'center';
        img.parentElement.style.justifyContent = 'center';
        img.parentElement.innerHTML = icons[kind] || icons.bot;
    }
};

window.handleAvatarClick = function() {
  var plan = (window._fbUserData && window._fbUserData.plan) || 'Free';
  if (plan === 'Free') {
    openAvatarLibrary();
  } else {
    document.getElementById('avatarFileInput').click();
  }
};
window.openAvatarLibrary = function() {
  var el = document.getElementById('avatarLibraryOverlay');
  if (el) { el.style.display = 'flex'; }
};
window.closeAvatarLibrary = function() {
  var el = document.getElementById('avatarLibraryOverlay');
  if (el) { el.style.display = 'none'; }
};
window.selectLibraryAvatar = async function(url) {
  closeAvatarLibrary();
  if (typeof window._applyPhotoURL === 'function') window._applyPhotoURL(url);
  window._cachedPhotoURL = url;
  try {
    if (typeof window._savePhotoURLToFirebase === 'function') await window._savePhotoURLToFirebase(url);
    if (typeof window._showAvatarStatus === 'function') window._showAvatarStatus('Avatar updated!', 'ok');
  } catch(e) { console.warn('[avatarLibrary] save failed', e); }
};

(function(){
  // ── State ──────────────────────────────────────────────────────────
  var _npTab       = 'me';       // 'global' | 'me'
  var _npItems     = { global: [], me: [] };
  var _npLoaded    = { global: false, me: false };
  var _npUnsubGlob = null;
  var _npUnsubMe   = null;

  // ── Helpers ────────────────────────────────────────────────────────
  function _db()  { return window._fbDb; }
  function _fns() { return window._fbDbFns || {}; }
  function _uid() {
    var u = window._fbAuth && window._fbAuth.currentUser;
    return u ? u.uid : null;
  }
  function _ts(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var now = Date.now();
    var diff = now - d.getTime();
    if (diff < 60000)   return 'Just now';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000)return Math.floor(diff/3600000) + 'h ago';
    if (diff < 604800000)return Math.floor(diff/86400000) + 'd ago';
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  // icon + colour by type
  var _typeMap = {
    sale    : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 12h.01M12 12h4"/></svg>', bg:'rgba(52,211,153,0.13)', border:'rgba(52,211,153,0.25)' },
    offer   : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>', bg:'rgba(56,189,248,0.11)', border:'rgba(56,189,248,0.25)' },
    payout  : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h.01M11 15h2"/></svg>', bg:'rgba(168,85,247,0.11)', border:'rgba(168,85,247,0.25)' },
    update  : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="12" cy="3" r="1" fill="#fbbf24" stroke="none"/></svg>', bg:'rgba(251,191,36,0.11)', border:'rgba(251,191,36,0.25)' },
    system  : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-2.93 7.07M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 2.93 7.07"/></svg>', bg:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.13)' },
    promo   : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>', bg:'rgba(248,113,113,0.11)', border:'rgba(248,113,113,0.25)' },
    message : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', bg:'rgba(129,140,248,0.11)', border:'rgba(129,140,248,0.25)' },
    default : { icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.11)' },
  };

  function _icon(type) {
    return _typeMap[type] || _typeMap.default;
  }

  // ── Render ─────────────────────────────────────────────────────────
  function npRender() {
    var feed  = document.getElementById('npFeed');
    var badge = document.getElementById('npUnreadBadge');
    var bellDot = document.getElementById('dmBellDot');
    if (!feed) return;

    var items = _npItems[_npTab] || [];

    // sort newest first
    items = items.slice().sort(function(a,b){
      return (b.createdAt||b.timestamp||'') > (a.createdAt||a.timestamp||'') ? 1 : -1;
    });

    // unread count
    var unread = items.filter(function(x){ return !x.read; }).length;
    var totalUnread = (_npItems.global||[]).filter(function(x){ return !x.read; }).length
                    + (_npItems.me    ||[]).filter(function(x){ return !x.read; }).length;

    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline' : 'none';
    }
    if (bellDot) bellDot.style.display = totalUnread > 0 ? 'block' : 'none';

    if (items.length === 0) {
      feed.innerHTML = '<div class="np-empty">'
        + '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
        + '<div class="np-empty-title">No notifications</div>'
        + '<div class="np-empty-sub">'
        + (_npTab === 'global' ? 'Platform-wide announcements will appear here.' : 'Your personal alerts — offers, payouts, messages, transactions — will show here.')
        + '</div></div>';
      return;
    }

    var html = '';
    items.forEach(function(item) {
      var ic = _icon(item.type);
      var unreadCls = item.read ? '' : ' unread';
      html += '<div class="np-item' + unreadCls + '" data-id="' + (item._key||'') + '" data-tab="' + _npTab + '" onclick="npItemClick(this)">'
        + '<div class="np-icon" style="background:' + ic.bg + ';border:1px solid ' + ic.border + ';">' + ic.icon + '</div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;">'
        +     '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:12.5px;font-weight:700;color:' + (item.read ? 'rgba(255,255,255,0.6)' : '#fff') + ';line-height:1.3;">' + _esc(item.title||'Notification') + '</div>'
        +     '<span style="font-size:9.5px;color:rgba(255,255,255,0.28);white-space:nowrap;flex-shrink:0;">' + _ts(item.createdAt||item.timestamp) + '</span>'
        +   '</div>'
        +   '<div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + _esc(item.body||item.message||'') + '</div>'
        + '</div>'
        + '</div>';
    });
    feed.innerHTML = html;
  }

  function _esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function npShowSkeleton() {
    var feed = document.getElementById('npFeed');
    if (!feed) return;
    var html = '';
    for (var i=0;i<4;i++) {
      html += '<div class="np-skeleton">'
        + '<div class="np-skel-icon"></div>'
        + '<div style="flex:1;">'
        +   '<div class="np-skel-line" style="width:60%;"></div>'
        +   '<div class="np-skel-line" style="width:90%;"></div>'
        +   '<div class="np-skel-line" style="width:45%;"></div>'
        + '</div></div>';
    }
    feed.innerHTML = html;
  }

  // ── Firebase load ──────────────────────────────────────────────────
  function npLoadGlobal() {
    if (_npLoaded.global) { npRender(); return; }
    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.onValue) { _npLoaded.global = true; npRender(); return; }
    npShowSkeleton();
    try {
      if (_npUnsubGlob) _npUnsubGlob();
      _npUnsubGlob = fns.onValue(fns.ref(db, 'notifications/global'), function(snap) {
        var items = [];
        if (snap && snap.exists && snap.exists()) {
          snap.forEach(function(child) {
            var v = child.val();
            if (v) items.push(Object.assign({ _key: child.key }, v));
          });
        }
        _npItems.global = items;
        _npLoaded.global = true;
        if (_npTab === 'global') npRender();
      }, function(err) {
        console.warn('[notifPanel] global error', err);
        _npLoaded.global = true;
        if (_npTab === 'global') npRender();
      });
    } catch(e) {
      console.warn('[notifPanel] global catch', e);
      _npLoaded.global = true;
      npRender();
    }
  }

  // ── Transaction → notification synthesiser ─────────────────────────
  function _txnToNotif(key, txn) {
    var uid    = _uid();
    var amt    = txn.amount != null ? '$' + Number(txn.amount).toLocaleString() : '';
    var label  = txn.title  || txn.description || txn.note || '';
    var ts     = txn.createdAt || txn.timestamp || txn.ts
                   ? new Date(txn.createdAt || txn.timestamp || txn.ts).toISOString()
                   : new Date().toISOString();

    // Determine direction & type
    var isSender   = txn.fromUid === uid || txn.senderUid === uid;
    var isReceiver = txn.toUid   === uid || txn.recipientUid === uid;

    var kind = (txn.type || '').toLowerCase();
    var title, body, notifType;

    if (kind === 'donation' || kind === 'donate') {
      if (isSender) {
        notifType = 'payout';
        title     = 'Donation sent' + (amt ? ' · ' + amt : '');
        body      = label || 'You sent a donation.';
      } else {
        notifType = 'sale';
        title     = 'Donation received' + (amt ? ' · ' + amt : '');
        body      = label || 'You received a donation.';
      }
    } else if (kind === 'message' || kind === 'msg') {
      notifType = 'message';
      title     = 'Message received';
      body      = label || 'You have a new message.';
    } else if (kind === 'sale' || kind === 'purchase' || kind === 'escrow') {
      if (isSender) {
        notifType = 'payout';
        title     = 'Payment sent' + (amt ? ' · ' + amt : '');
        body      = label || 'Your payment has been processed.';
      } else {
        notifType = 'sale';
        title     = 'Payment received' + (amt ? ' · ' + amt : '');
        body      = label || 'You received a payment.';
      }
    } else if (kind === 'transfer' || kind === 'wallet' || kind === 'withdrawal' || kind === 'payout') {
      if (isSender || txn.direction === 'out') {
        notifType = 'payout';
        title     = 'Money sent' + (amt ? ' · ' + amt : '');
        body      = label || 'Funds were sent from your wallet.';
      } else {
        notifType = 'sale';
        title     = 'Money received' + (amt ? ' · ' + amt : '');
        body      = label || 'Funds were added to your wallet.';
      }
    } else {
      // generic fallback — still show something useful
      if (isSender) {
        notifType = 'payout';
        title     = 'Money sent' + (amt ? ' · ' + amt : '');
        body      = label || 'A transaction was sent from your account.';
      } else if (isReceiver) {
        notifType = 'sale';
        title     = 'Money received' + (amt ? ' · ' + amt : '');
        body      = label || 'A transaction was received on your account.';
      } else {
        notifType = 'update';
        title     = 'Transaction' + (amt ? ' · ' + amt : '');
        body      = label || 'A transaction was recorded on your account.';
      }
    }

    return {
      _key      : 'txn_' + key,
      _isTxn    : true,        // flag so mark-read skips Firebase write on txn items
      type      : notifType,
      title     : title,
      body      : body,
      createdAt : ts,
      read      : !!txn.read,
    };
  }

  function npLoadMe() {
    var uid = _uid();
    if (!uid) { _npItems.me = []; _npLoaded.me = true; npRender(); return; }
    if (_npLoaded.me) { npRender(); return; }
    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.onValue) { _npLoaded.me = true; npRender(); return; }
    npShowSkeleton();

    var _notifItems = null;
    var _txnItems   = null;

    function _merge() {
      if (_notifItems === null || _txnItems === null) return; // wait for both
      _npItems.me  = _notifItems.concat(_txnItems);
      _npLoaded.me = true;
      if (_npTab === 'me') npRender();
    }

    // 1. Personal notifications node
    try {
      if (_npUnsubMe) _npUnsubMe();
      _npUnsubMe = fns.onValue(fns.ref(db, 'notifications/' + uid), function(snap) {
        var items = [];
        if (snap && snap.exists && snap.exists()) {
          snap.forEach(function(child) {
            var v = child.val();
            if (v) items.push(Object.assign({ _key: child.key }, v));
          });
        }
        _notifItems = items;
        _merge();
      }, function(err) {
        console.warn('[notifPanel] me notif error', err);
        _notifItems = [];
        _merge();
      });
    } catch(e) {
      console.warn('[notifPanel] me notif catch', e);
      _notifItems = [];
    }

    // 2. Transactions node — synthesise as typed notification items
    try {
      fns.onValue(fns.ref(db, 'transactions/' + uid), function(snap) {
        var items = [];
        if (snap && snap.exists && snap.exists()) {
          snap.forEach(function(child) {
            var v = child.val();
            if (v) items.push(_txnToNotif(child.key, v));
          });
        }
        _txnItems = items;
        _merge();
      }, function(err) {
        console.warn('[notifPanel] me txn error', err);
        _txnItems = [];
        _merge();
      });
    } catch(e) {
      console.warn('[notifPanel] me txn catch', e);
      _txnItems = [];
      _merge();
    }
  }

  // ── Open / close ───────────────────────────────────────────────────
  window.openNotifPanel = function() {
    var panel = document.getElementById('notifPanel');
    if (!panel) return;
    // reset to me tab
    npSwitchTab('me', true);
    panel.classList.add('open');
    if (window._lockBodyScroll) window._lockBodyScroll();
  };

  window.closeNotifPanel = function() {
    var panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('open');
    if (window._unlockBodyScroll) window._unlockBodyScroll();
  };

  // ── Tab switch ─────────────────────────────────────────────────────
  window.npSwitchTab = function(tab, silent) {
    _npTab = tab;
    var tg = document.getElementById('npTabGlobal');
    var tm = document.getElementById('npTabMe');
    if (tg) tg.classList.toggle('active', tab === 'global');
    if (tm) tm.classList.toggle('active', tab === 'me');

    if (tab === 'global') npLoadGlobal();
    else                  npLoadMe();
  };

  // ── Item click (mark read) ─────────────────────────────────────────
  window.npItemClick = function(el) {
    var key = el.dataset.id;
    var tab = el.dataset.tab;
    if (!key || !tab) return;

    // optimistically mark read in local state
    var arr = _npItems[tab] || [];
    arr.forEach(function(x){ if (x._key === key) x.read = true; });
    npRender();

    // persist to Firebase (skip synthesised transaction items)
    var uid  = _uid();
    var db   = _db();
    var fns  = _fns();
    var item = (_npItems[tab] || []).find(function(x){ return x._key === key; });
    if (item && item._isTxn) return; // txn items live under transactions/, not notifications/
    if (!db || !fns.ref || !fns.update || !uid) return;
    var path = tab === 'global'
      ? 'notifications/global/' + key + '/read'
      : 'notifications/' + uid + '/' + key + '/read';
    try { fns.update(fns.ref(db, 'notifications/' + (tab==='global'?'global':uid) + '/' + key), { read: true }); }
    catch(e){ console.warn('[notifPanel] mark read', e); }
  };

  // ── Mark all read ──────────────────────────────────────────────────
  window.npMarkAllRead = function() {
    var arr = _npItems[_npTab] || [];
    arr.forEach(function(x){ x.read = true; });
    npRender();

    var uid = _uid(); var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.update) return;
    var base = _npTab === 'global' ? 'notifications/global' : 'notifications/' + uid;
    arr.forEach(function(x){
      if (x._key && !x._isTxn) {
        try { fns.update(fns.ref(db, base + '/' + x._key), { read: true }); }
        catch(e){}
      }
    });
  };

  // ── Expose bell-dot init (call after auth ready) ───────────────────
  window._initNotifBellDot = function() {
    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.onValue) return;
    // Watch global notifications
    try {
      fns.onValue(fns.ref(db, 'notifications/global'), function(snap) {
        var unread = 0;
        if (snap && snap.exists && snap.exists()) {
          snap.forEach(function(c){ var v=c.val(); if(v && !v.read) unread++; });
        }
        _npItems.global.forEach(function(){ }); // already tracked in _npItems
        var dot = document.getElementById('dmBellDot');
        var meUnread = (_npItems.me||[]).filter(function(x){ return !x.read; }).length;
        if (dot) dot.style.display = (unread + meUnread) > 0 ? 'block' : 'none';
      });
    } catch(e){}
  };

  // Call once Firebase is ready
  (function pollFb(){
    if (window._fbDb && window._fbDbFns) {
      window._initNotifBellDot();
    } else {
      setTimeout(pollFb, 800);
    }
  })();

})();

(function() {

  function _getEl(id) { return document.getElementById(id); }

  function _toast(msg, color) {
    var t = document.createElement('div');
    t.innerHTML = msg;
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:' + (color||'#30d158') + ';color:#fff;padding:10px 20px;border-radius:999px;font-family:Syne,sans-serif;font-weight:700;font-size:13px;z-index:99999;pointer-events:none;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.4);opacity:0;transition:opacity .25s;display:flex;align-items:center;gap:6px;justify-content:center;';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; });
    setTimeout(function(){ t.style.opacity = '0'; setTimeout(function(){ t.remove(); }, 300); }, 2600);
  }

  function _uid() {
    try {
      var u = (window._auth && window._auth.currentUser)
           || (window._fbAuth && window._fbAuth.currentUser);
      return u ? u.uid : null;
    } catch(e) { return null; }
  }

  // Show/hide the minimum-balance field based on whether auto withdraw is on
  window.awToggleMinRow = function(source) {
    var isAcct = (source === 'acct');
    var scheduleEl = _getEl(isAcct ? 'acctAutoWithdraw' : 'payoutAutoWithdraw');
    var rowEl      = _getEl(isAcct ? 'acctAutoWithdrawMinRow' : 'payoutAutoWithdrawMinRow');
    if (!scheduleEl || !rowEl) return;
    var on = scheduleEl.value !== 'off';
    rowEl.style.display = on ? 'block' : 'none';
    if (on) {
      var minEl = _getEl(isAcct ? 'acctAutoWithdrawMin' : 'payoutAutoWithdrawMin');
      if (minEl && !minEl.value) minEl.value = 50;
    }
  };

  // Validate the minimum-balance field inline as the user types
  window.awValidateMin = function(source) {
    var isAcct = (source === 'acct');
    var minEl  = _getEl(isAcct ? 'acctAutoWithdrawMin' : 'payoutAutoWithdrawMin');
    var errEl  = _getEl(isAcct ? 'acctAutoWithdrawMinErr' : 'payoutAutoWithdrawMinErr');
    if (!minEl || !errEl) return true;
    var val = parseFloat(minEl.value);
    var msg = '';
    if (minEl.value === '' || isNaN(val)) msg = 'Enter a minimum balance.';
    else if (val < 50) msg = 'Minimum is $50.00 — that\'s the lowest amount we can withdraw.';
    else if (val > 999) msg = 'Maximum is $999.00 per withdrawal.';
    if (msg) {
      errEl.textContent = msg; errEl.style.display = 'block';
      minEl.style.borderColor = '#ff453a';
      return false;
    }
    errEl.textContent = ''; errEl.style.display = 'none';
    minEl.style.borderColor = '';
    return true;
  };

  window.savePayoutSettings = function(source) {
    // source: 'acct' (panel 1 IDs) or 'sub' (panel 2 IDs)
    var isAcct = (source === 'acct');

    var emailEl    = _getEl(isAcct ? 'acctPayoutPaypalEmail'  : 'payoutPaypalEmail');
    var currencyEl = _getEl(isAcct ? 'acctPayoutCurrency'     : 'payoutCurrency');
    var scheduleEl = _getEl(isAcct ? 'acctAutoWithdraw'       : 'payoutAutoWithdraw');
    var minEl      = _getEl(isAcct ? 'acctAutoWithdrawMin'    : 'payoutAutoWithdrawMin');

    var email    = emailEl    ? emailEl.value.trim()    : '';
    var currency = currencyEl ? currencyEl.value        : 'USD';
    var schedule = scheduleEl ? scheduleEl.value        : 'off';

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      _toast('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>Enter a valid PayPal email', '#ff453a');
      if (emailEl) { emailEl.focus(); emailEl.style.borderColor = '#ff453a'; setTimeout(function(){ emailEl.style.borderColor = ''; }, 2000); }
      return;
    }

    // Minimum-balance validation only applies when auto withdraw is enabled
    var minBalance = 50;
    if (schedule !== 'off') {
      if (!awValidateMin(source)) {
        if (minEl) minEl.focus();
        _toast('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>Fix the minimum balance amount', '#ff453a');
        return;
      }
      minBalance = parseFloat(minEl ? minEl.value : 50) || 50;
    }

    var uid = _uid();
    if (!uid) { _toast('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>Not signed in', '#ff453a'); return; }

    // Disable both save buttons while saving
    var btns = document.querySelectorAll('[onclick*="savePayoutSettings"]');
    btns.forEach(function(b){ b.disabled = true; b.dataset.origLabel = b.dataset.origLabel || b.textContent; b.textContent = 'Saving…'; });

    var db  = window._fbDb;
    var fns = window._fbDbFns;

    if (!db || !fns || !fns.ref || !fns.update) {
      _toast('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>Firebase not ready — try again', '#ff453a');
      btns.forEach(function(b){ b.disabled = false; b.textContent = 'Save payout settings'; });
      return;
    }

    // 1. Write payoutEmail + payoutCurrency to users/{uid}
    var userUpdate = { payoutEmail: email, payoutCurrency: currency, autoWithdrawSchedule: schedule, autoWithdrawMin: minBalance };

    // 2. Write schedule to /autowithdrawal/{uid}
    var awUpdate = { uid: uid, schedule: schedule, payoutEmail: email, currency: currency, minBalance: minBalance, updatedAt: Date.now() };

    Promise.all([
      fns.update(fns.ref(db, 'users/' + uid), userUpdate),
      fns.update(fns.ref(db, 'autowithdrawal/' + uid), awUpdate)
    ]).then(function() {
      // Sync both panels so they match
      ['acctPayoutPaypalEmail','payoutPaypalEmail'].forEach(function(id){ var el=_getEl(id); if(el) el.value=email; });
      ['acctPayoutCurrency','payoutCurrency'].forEach(function(id){ var el=_getEl(id); if(el) el.value=currency; });
      ['acctAutoWithdraw','payoutAutoWithdraw'].forEach(function(id){ var el=_getEl(id); if(el) el.value=schedule; });
      ['acctAutoWithdrawMin','payoutAutoWithdrawMin'].forEach(function(id){ var el=_getEl(id); if(el) el.value=minBalance; });
      ['acct','sub'].forEach(function(s){ awToggleMinRow(s); });

      // Update in-memory cache
      if (window._fbUserData) {
        window._fbUserData.payoutEmail          = email;
        window._fbUserData.payoutCurrency       = currency;
        window._fbUserData.autoWithdrawSchedule = schedule;
        window._fbUserData.autoWithdrawMin      = minBalance;
      }

      btns.forEach(function(b){ b.disabled = false; b.textContent = b.dataset.origLabel || 'Save payout settings'; });

      // Populate and collapse the cartoon-style summary card (Accounts tab)
      var summaryEmailEl = _getEl('acctPayoutSummaryEmail');
      var summaryMetaEl  = _getEl('acctPayoutSummaryMeta');
      var cardEl         = _getEl('acctPayoutCard');
      if (summaryEmailEl) summaryEmailEl.textContent = email;
      if (summaryMetaEl) {
        var scheduleLabel = schedule === 'off' ? 'Off — manual only' : schedule.charAt(0).toUpperCase() + schedule.slice(1);
        summaryMetaEl.textContent = schedule === 'off' ? scheduleLabel : scheduleLabel + ' • Min $' + minBalance;
      }
      if (cardEl) cardEl.classList.add('pc-collapsed');

      _toast('<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Payout settings saved', '#30d158');
    }).catch(function(err) {
      console.error('[savePayoutSettings]', err);
      btns.forEach(function(b){ b.disabled = false; b.textContent = b.dataset.origLabel || 'Save payout settings'; });
      _toast('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 1.6L14.8 13.4a1 1 0 0 1-.86 1.5H2.06a1 1 0 0 1-.86-1.5L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>Save failed — try again', '#ff453a');
    });
  };

})();

(function() {
  var _rpAllRepos   = [];
  var _rpUsername   = '';
  var _rpSelectedFN = '';  // currently selected full_name

  function _esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function _renderRepos(repos) {
    var listEl = document.getElementById('ghRpList');
    if (!listEl) return;
    if (!repos.length) {
      listEl.innerHTML = '<div class="gh-rp-empty">No repositories found.</div>';
      return;
    }
    listEl.innerHTML = repos.map(function(r) {
      var langColor = { JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5', Ruby:'#701516', Go:'#00ADD8', Rust:'#dea584', Java:'#b07219', CSS:'#563d7c', HTML:'#e34c26', PHP:'#4F5D95', Swift:'#fa7343', Kotlin:'#A97BFF' };
      var lc = r.language ? (langColor[r.language] || '#8b8aa8') : null;
      var langDot = lc ? '<span style="width:8px;height:8px;border-radius:50%;background:'+lc+';flex-shrink:0;display:inline-block;"></span><span style="font-size:9px;color:rgba(255,255,255,0.35);">'+_esc(r.language)+'</span>' : '';
      var privateBadge = r.private ? '<span style="font-size:8px;font-weight:700;color:rgba(251,191,36,0.7);background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:4px;padding:1px 5px;letter-spacing:.04em;">PRIVATE</span>' : '<span style="font-size:8px;font-weight:700;color:rgba(56,189,248,0.6);background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.18);border-radius:4px;padding:1px 5px;letter-spacing:.04em;">PUBLIC</span>';
      var stars = r.stargazers_count > 0 ? '<span style="font-size:9px;color:rgba(251,191,36,0.6);">★ '+r.stargazers_count+'</span>' : '';
      var isSelected = _rpSelectedFN && _rpSelectedFN === r.full_name;
      return '<div class="gh-rp-item" id="ghRpItem-'+_esc(r.full_name).replace(/\//g,'__')+'">'
        + '<div class="gh-rp-repo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3Z" stroke="rgba(48,209,88,0.6)" stroke-width="1.4"/><path d="M3 7h18" stroke="rgba(48,209,88,0.4)" stroke-width="1.2"/><path d="M7 11h6M7 14h4" stroke="rgba(48,209,88,0.5)" stroke-width="1.1" stroke-linecap="round"/></svg></div>'
        + '<div style="flex:1;min-width:0;">'
        +   '<div class="gh-rp-repo-name">'+_esc(r.name)+'</div>'
        +   (r.description ? '<div class="gh-rp-repo-desc">'+_esc(r.description)+'</div>' : '')
        +   '<div class="gh-rp-repo-meta">'+privateBadge+(lc ? ' '+langDot : '')+stars+'</div>'
        + '</div>'
        + '<button class="gh-rp-autosale-btn'+(isSelected?' selected':'')
        +   '" id="ghRpBtn-'+_esc(r.full_name).replace(/\//g,'__')+'"'
        +   ' onclick="ghRpSelectAutoSale('+JSON.stringify(JSON.stringify(r))+')">'
        +   (isSelected ? '✓ Auto Sale ON' : 'Auto Sale')
        + '</button>'
        + '</div>';
    }).join('');
  }

  window.ghRpFilter = function(q) {
    if (!q.trim()) { _renderRepos(_rpAllRepos); return; }
    var lq = q.toLowerCase();
    _renderRepos(_rpAllRepos.filter(function(r) {
      return r.name.toLowerCase().includes(lq) || (r.description||'').toLowerCase().includes(lq);
    }));
  };

  window.ghRpSelectAutoSale = function(jsonStr) {
    var r;
    try { r = JSON.parse(jsonStr); } catch(e) { return; }

    _rpSelectedFN = r.full_name;

    // Update all buttons
    _rpAllRepos.forEach(function(repo) {
      var safeId = repo.full_name.replace(/\//g,'__');
      var btn = document.getElementById('ghRpBtn-'+safeId);
      if (!btn) return;
      if (repo.full_name === r.full_name) {
        btn.textContent = '✓ Auto Sale ON';
        btn.classList.add('selected');
      } else {
        btn.textContent = 'Auto Sale';
        btn.classList.remove('selected');
      }
    });

    // Propagate selection into the AutoSell modal's internal state
    if (window.asSelectRepo) {
      // asSelectRepo expects the escHtml-encoded JSON string
      var escaped = r.full_name; // asSelectRepo handles raw r
      window.asSelectRepo(JSON.stringify(r));
    }

    // Brief toast confirmation
    var t = document.createElement('div');
    t.textContent = '✓ ' + r.name + ' set for Auto Sale';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#30d158;color:#fff;padding:10px 18px;border-radius:999px;font-family:Syne,sans-serif;font-weight:700;font-size:12px;z-index:99999;pointer-events:none;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.4);opacity:0;transition:opacity .22s;';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity='1'; });
    setTimeout(function(){
      t.style.opacity='0';
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 350);
      // After selection, close repo picker and open AutoSell modal to save
      closeGhRepoPicker();
      setTimeout(function() {
        if (window.openAutoSellModal) window.openAutoSellModal();
      }, 200);
    }, 1600);
  };

  // ── Public API ──────────────────────────────────────────────
  window._renderRepoPickerModal = function(username, avatarUrl, repos) {
    _rpAllRepos   = repos || [];
    _rpUsername   = username || '';
    _rpSelectedFN = '';

    // Try to pre-select whatever repo is already saved in AutoSell state
    try {
      var asFullName = window._asRepoFullName || '';
      if (asFullName) _rpSelectedFN = asFullName;
    } catch(e) {}

    var avatarEl = document.getElementById('ghRpAvatar');
    if (avatarEl) {
      if (avatarUrl) { avatarEl.src = avatarUrl; avatarEl.style.display = ''; }
      else { avatarEl.style.display = 'none'; }
    }
    var subEl = document.getElementById('ghRpSub');
    if (subEl) subEl.textContent = username ? '@'+username+' · '+_rpAllRepos.length+' repos' : _rpAllRepos.length+' repositories';

    var searchEl = document.getElementById('ghRpSearch');
    if (searchEl) searchEl.value = '';

    _renderRepos(_rpAllRepos);

    var overlay = document.getElementById('ghRepoPickerOverlay');
    if (overlay) { overlay.style.display = 'flex'; requestAnimationFrame(function(){ overlay.classList.add('open'); }); }
    document.body.style.overflow = 'hidden';
  };

  window.closeGhRepoPicker = function() {
    var overlay = document.getElementById('ghRepoPickerOverlay');
    if (overlay) { overlay.classList.remove('open'); setTimeout(function(){ overlay.style.display='none'; },300); }
    document.body.style.overflow = '';
  };

  // ── Open from Settings → Connected Accounts → GitHub ──
  window.openGithubConnectFromSettings = function() {
    // Check if already connected (ghUsername populated)
    var isConnected = false;
    var username = '';
    var avatarUrl = '';
    try {
      var db  = window._fbDb;
      var fns = window._fbDbFns;
      var auth = window._fbAuth;
      var user = auth && auth.currentUser;
      if (user && db && fns) {
        fns.get(fns.ref(db,'users/'+user.uid+'/github')).then(function(snap) {
          if (snap && snap.exists()) {
            var gh = snap.val();
            username  = gh.username  || '';
            avatarUrl = gh.avatarUrl || '';
            if (username) {
              // Already connected — fetch repos and show picker
              _fetchAndShowRepoPicker(user.uid, username, avatarUrl);
              return;
            }
          }
          // Not connected — start OAuth
          if (window.openAutoSellModal) {
            window.openAutoSellModal();
          } else if (window.asStartGithubOAuth) {
            window.asStartGithubOAuth();
          }
        }).catch(function() {
          if (window.openAutoSellModal) window.openAutoSellModal();
        });
      } else {
        if (window.openAutoSellModal) window.openAutoSellModal();
      }
    } catch(e) {
      if (window.openAutoSellModal) window.openAutoSellModal();
    }
  };

  function _fetchAndShowRepoPicker(uid, username, avatarUrl) {
    // Show picker immediately with loading state
    window._renderRepoPickerModal(username, avatarUrl, []);
    document.getElementById('ghRpList').innerHTML = '<div class="gh-rp-empty">Loading repositories…</div>';

    fetch('/api/github-autosell?mode=repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      _rpAllRepos = data.repos || [];
      var subEl = document.getElementById('ghRpSub');
      if (subEl) subEl.textContent = '@'+username+' · '+_rpAllRepos.length+' repos';
      _renderRepos(_rpAllRepos);
    })
    .catch(function(err) {
      var listEl = document.getElementById('ghRpList');
      if (listEl) listEl.innerHTML = '<div class="gh-rp-empty" style="color:rgba(248,113,113,0.6);">Failed to load repos. Please reconnect GitHub.</div>';
    });
  }

  // ── Sync GitHub connected status in settings row ──
  document.addEventListener('DOMContentLoaded', function() {
    // Poll for auth to load then update the GitHub settings row
    var _checkInterval = setInterval(function() {
      var auth = window._fbAuth;
      var user = auth && auth.currentUser;
      if (!user) return;
      clearInterval(_checkInterval);
      var db  = window._fbDb;
      var fns = window._fbDbFns;
      if (!db || !fns) return;
      fns.get(fns.ref(db,'users/'+user.uid+'/github')).then(function(snap) {
        if (snap && snap.exists()) {
          var gh = snap.val();
          var username = gh.username || '';
          if (username) {
            var sub = document.getElementById('socialSub-github');
            var btn = document.getElementById('socialBtn-github');
            if (sub) sub.textContent = '@' + username + ' connected';
            if (btn) { btn.textContent = 'Manage'; btn.style.color = '#34d399'; btn.style.background = 'rgba(52,211,153,0.1)'; btn.style.borderColor = 'rgba(52,211,153,0.2)'; var discBtn = document.getElementById('socialDisconnectBtn-github'); if (!discBtn) { discBtn = document.createElement('button'); discBtn.id = 'socialDisconnectBtn-github'; discBtn.textContent = 'Disconnect'; discBtn.style.cssText = 'font-size:10px;font-weight:700;font-family:Syne,sans-serif;color:rgba(248,113,113,0.8);background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.2);border-radius:7px;padding:5px 11px;cursor:pointer;flex-shrink:0;margin-left:6px;'; discBtn.onclick = function(){ asDisconnectGithub(); discBtn.remove(); if(sub){ sub.textContent='Not connected'; } if(btn){ btn.textContent='Connect'; btn.style.color='var(--lime)'; btn.style.background='rgba(168,255,107,0.1)'; btn.style.borderColor='rgba(168,255,107,0.2)'; } }; btn.parentNode.insertBefore(discBtn, btn.nextSibling); } }
          }
        }
      }).catch(function(){});
    }, 600);
  });

})();

(function() {

  // ── helpers ──────────────────────────────────────────────────────────
  function _uid() {
    try {
      var u = (window._fbAuth && window._fbAuth.currentUser)
           || (window._auth && window._auth.currentUser);
      return u ? u.uid : null;
    } catch(e) { return null; }
  }
  function _db()  { return window._fbDb || null; }
  function _fns() { return window._fbDbFns || {}; }

  function _toast(msg, color) {
    var t = document.createElement('div');
    t.innerHTML = msg;
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:'+(color||'#30d158')+';color:#fff;padding:10px 20px;border-radius:999px;font-family:Syne,sans-serif;font-weight:700;font-size:13px;z-index:99999;pointer-events:none;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.4);opacity:0;transition:opacity .25s;display:flex;align-items:center;gap:6px;';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity='1'; });
    setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); }, 300); }, 2600);
  }

  // ── in-memory state ──────────────────────────────────────────────────
  var _asEnabled       = false;
  var _asRepoUrl       = '';
  var _asRepoName      = '';
  var _asRepoFullName  = '';   // owner/repo — used for API calls
  Object.defineProperty(window, '_asRepoFullName', { get: function(){ return _asRepoFullName; }, set: function(v){ _asRepoFullName=v; } });
  var _asRepoMeta      = null; // live repo data from GitHub
  var _ghUsername      = '';
  var _ghAvatar        = '';
  var _oauthPopup      = null;

  // ── GitHub App OAuth URL ─────────────────────────────────────────────
  var GH_CLIENT_ID = 'Iv23li02xb3bQ14ZvMeR';

  // ── modal open / close ───────────────────────────────────────────────
  window.openAutoSellModal = function() {
    _loadAutoSellState();
    document.getElementById('autoSellOverlay').classList.add('open');
    if (window._lockBodyScroll) window._lockBodyScroll();
  };
  window.closeAutoSellModal = function() {
    document.getElementById('autoSellOverlay').classList.remove('open');
    if (window._unlockBodyScroll) window._unlockBodyScroll();
  };

  // ── load state from Firebase ──────────────────────────────────────────
  function _loadAutoSellState() {
    var uid = _uid();
    if (!uid) return;
    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.get) return;

    fns.get(fns.ref(db, 'users/' + uid)).then(function(snap) {
      if (!snap || !snap.exists || !snap.exists()) return;
      var d = snap.val() || {};

      var as = d.autoSell || {};
      _asEnabled      = !!as.enabled;
      _asRepoUrl      = as.repoUrl      || '';
      _asRepoName     = as.repoName     || '';
      _asRepoFullName = as.repoFullName || '';
      _asRepoMeta     = as.repoMeta     || null;
      _ghUsername     = d.github ? (d.github.username || '') : '';
      _ghAvatar       = d.github ? (d.github.avatarUrl || '') : '';

      _syncToggleUI();
      _syncGithubUI();
      if (_ghUsername && _asRepoFullName) _syncSelectedRepo();
    }).catch(function(e){ console.warn('[autoSell] load error', e); });
  }

  function _syncToggleUI() {
    var btn = document.getElementById('autoSellToggle');
    if (btn) btn.classList.toggle('on', _asEnabled);
  }

  function _syncGithubUI() {
    var disc  = document.getElementById('asGhDisconnected');
    var conn  = document.getElementById('asGhConnected');
    var unEl  = document.getElementById('asGhUsername');
    var avEl  = document.getElementById('asGhAvatar');
    var icEl  = document.getElementById('asGhIcon');
    var picker = document.getElementById('asRepoPicker');

    if (_ghUsername) {
      if (disc)   disc.style.display   = 'none';
      if (conn)   conn.style.display   = '';
      if (unEl)   unEl.textContent     = _ghUsername;
      if (avEl && _ghAvatar) {
        avEl.src = _ghAvatar;
        avEl.style.display = 'inline-block';
        if (icEl) icEl.style.display = 'none';
      }
      if (picker) picker.style.display = '';
      // Load repos if not already selected
      if (!_asRepoFullName) _loadRepoPicker();
    } else {
      if (disc)   disc.style.display   = '';
      if (conn)   conn.style.display   = 'none';
      if (picker) picker.style.display = 'none';
    }
  }

  function _syncSelectedRepo() {
    var listEl    = document.getElementById('asRepoList');
    var selEl     = document.getElementById('asSelectedRepo');
    var nameEl    = document.getElementById('asSelectedRepoName');
    var descEl    = document.getElementById('asSelectedRepoDesc');
    var loadingEl = document.getElementById('asRepoPickerLoading');

    if (_asRepoFullName) {
      if (listEl)    listEl.style.display    = 'none';
      if (loadingEl) loadingEl.style.display = 'none';
      if (selEl)     selEl.style.display     = '';
      if (nameEl)    nameEl.textContent      = _asRepoName || _asRepoFullName;
      if (descEl)    descEl.textContent      = (_asRepoMeta && _asRepoMeta.description) || _asRepoUrl || '';
    } else {
      if (selEl)  selEl.style.display  = 'none';
      if (listEl) listEl.style.display = '';
    }
  }

  // ── toggle ────────────────────────────────────────────────────────────
  window.asToggle = function() {
    _asEnabled = !_asEnabled;
    _syncToggleUI();
  };

  // ── GitHub OAuth — open popup ─────────────────────────────────────────
  window.asStartGithubOAuth = function() {
    var uid = _uid();
    if (!uid) { _toast('Sign in first', '#ff453a'); return; }

    // state = uid so callback knows which user to update
    var state    = uid + '_' + Math.random().toString(36).slice(2);
    var redirect = window.location.origin + '/';
    var oauthUrl = 'https://github.com/login/oauth/authorize'
      + '?client_id=' + GH_CLIENT_ID
      + '&redirect_uri=' + encodeURIComponent(redirect)
      + '&scope=repo'
      + '&state=' + encodeURIComponent(state);

    // Store state in case of back-navigation
    try { sessionStorage.setItem('as_gh_state', state); } catch(e){}

    // Open in-page overlay and redirect this tab to GitHub
    window._ghConnectStart(oauthUrl);
  };

  // ── Receive OAuth result ────────────────────────────────────────────────
  function _onOAuthMessage(evt) {
    if (!evt.data || evt.data.type !== 'gh_oauth_code') return;
    window.removeEventListener('message', _onOAuthMessage);
    if (_oauthPopup) { try { _oauthPopup.close(); } catch(e){} }

    var code  = evt.data.code;
    var uid   = _uid();
    if (!code || !uid) { _toast('OAuth failed — try again', '#ff453a'); return; }

    // If the overlay already called the API and resolved, just update UI
    if (evt.data._resolved) {
      var data = evt.data._resolved;
      _ghUsername = data.username;
      _ghAvatar   = data.avatar || '';
      _syncGithubUI();
      _renderRepoList(data.repos || []);
      // Also open the full repo picker modal
      if (window._renderRepoPickerModal) {
        window._renderRepoPickerModal(data.username, data.avatar || '', data.repos || []);
      }
      _toast(
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + 'GitHub connected — @' + _ghUsername, '#30d158'
      );
      return;
    }

    _toast('Connecting GitHub…', '#6b7280');

    fetch('/api/github-autosell?mode=callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, uid: uid })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      _ghUsername = data.username;
      _ghAvatar   = data.avatar || '';
      _syncGithubUI();
      _renderRepoList(data.repos || []);
      // Open the standalone repo picker modal
      if (window._renderRepoPickerModal) {
        window._renderRepoPickerModal(data.username, data.avatar || '', data.repos || []);
      }
      _toast(
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + 'GitHub connected — @' + _ghUsername, '#30d158'
      );
    })
    .catch(function(err) {
      console.error('[autoSell OAuth]', err);
      _toast('GitHub connection failed — try again', '#ff453a');
    });
  }

  // ── Load repo list from API ───────────────────────────────────────────
  function _loadRepoPicker() {
    var uid = _uid();
    if (!uid) return;
    var loadingEl = document.getElementById('asRepoPickerLoading');
    var listEl    = document.getElementById('asRepoList');
    if (loadingEl) { loadingEl.textContent = 'Loading your repos…'; loadingEl.style.display = ''; }
    if (listEl)    listEl.style.display = 'none';

    fetch('/api/github-autosell?mode=repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      _renderRepoList(data.repos || []);
    })
    .catch(function(err) {
      if (loadingEl) loadingEl.textContent = 'Failed to load repos — reconnect GitHub.';
      console.warn('[autoSell repos]', err);
    });
  }

  function _renderRepoList(repos) {
    var loadingEl = document.getElementById('asRepoPickerLoading');
    var listEl    = document.getElementById('asRepoList');
    if (!listEl) return;
    if (loadingEl) loadingEl.style.display = 'none';

    if (!repos.length) {
      listEl.innerHTML = '<div style="font-size:12px;color:rgba(255,255,255,0.3);padding:8px 0;">No repos found.</div>';
      listEl.style.display = '';
      return;
    }

    listEl.innerHTML = repos.map(function(r) {
      var lockIcon = r.private
        ? '<svg width="9" height="9" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="rgba(255,255,255,0.3)" stroke-width="1.3"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="rgba(255,255,255,0.3)" stroke-width="1.3"/></svg>'
        : '';
      var lang = r.language ? '<span style="color:rgba(255,255,255,0.28);font-size:10px;">'+_escHtmlAs(r.language)+'</span>' : '';
      return '<div onclick="asSelectRepo('+JSON.stringify(JSON.stringify(r))+')" style="cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 12px;transition:background .15s;" onmouseover="this.style.background=\'rgba(48,209,88,0.06)\';this.style.borderColor=\'rgba(48,209,88,0.2)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.03)\';this.style.borderColor=\'rgba(255,255,255,0.07)\'">'
        + '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">'
        + lockIcon
        + '<span style="font-size:12.5px;font-weight:700;color:#fff;font-family:\'Plus Jakarta Sans\',sans-serif;">'+_escHtmlAs(r.name)+'</span>'
        + lang
        + '</div>'
        + (r.description ? '<div style="font-size:10.5px;color:rgba(255,255,255,0.3);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_escHtmlAs(r.description)+'</div>' : '')
        + '</div>';
    }).join('');
    listEl.style.display = 'flex';
  }

  window.asSelectRepo = function(jsonStr) {
    var r;
    try { r = JSON.parse(jsonStr); } catch(e) { return; }
    var uid = _uid();
    if (!uid) return;

    _asRepoFullName = r.full_name;
    _asRepoName     = r.name;
    _asRepoUrl      = r.html_url || r.url || ("https://github.com/" + r.full_name);
    _asRepoMeta     = r;
    _syncSelectedRepo();

    // Fetch full metadata in background and cache to Firebase
    fetch('/api/github-autosell?mode=repodata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid, fullName: r.full_name })
    })
    .then(function(res){ return res.json(); })
    .then(function(data){ if (data.repo) _asRepoMeta = data.repo; })
    .catch(function(e){ console.warn('[autoSell repodata]', e); });
  };

  window.asClearSelectedRepo = function() {
    _asRepoFullName = '';
    _asRepoName     = '';
    _asRepoUrl      = '';
    _asRepoMeta     = null;
    var selEl = document.getElementById('asSelectedRepo');
    var listEl = document.getElementById('asRepoList');
    if (selEl)  selEl.style.display  = 'none';
    if (listEl) listEl.style.display = '';
  };

  // ── save AutoSell settings ────────────────────────────────────────────
  window.saveAutoSellSettings = function() {
    var uid = _uid();
    if (!uid) { _toast('Not signed in', '#ff453a'); return; }

    if (_asEnabled && !_ghUsername) {
      _toast('Connect your GitHub account first', '#ff453a'); return;
    }
    if (_asEnabled && !_asRepoFullName) {
      _toast('Select a repo to sell first', '#ff453a'); return;
    }

    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.update) {
      _toast('Firebase not ready — try again', '#ff453a'); return;
    }

    var btn = document.getElementById('asSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    var asData = {
      enabled:      _asEnabled,
      repoUrl:      _asRepoUrl,
      repoName:     _asRepoName,
      repoFullName: _asRepoFullName,
      repoMeta:     _asRepoMeta || null,
      updatedAt:    Date.now()
    };

    Promise.all([
      fns.update(fns.ref(db, 'users/' + uid + '/autoSell'), asData),
      fns.update(fns.ref(db, 'autosell/' + uid), Object.assign({ uid: uid }, asData))
    ]).then(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Save AutoSell settings'; }
      _toast(
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + (_asEnabled ? 'AutoSell enabled — AI is live in your chats' : 'AutoSell disabled'),
        _asEnabled ? '#30d158' : '#6b7280'
      );
      _refreshChatAutoSellBadge(uid);
      closeAutoSellModal();
    }).catch(function(err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Save AutoSell settings'; }
      _toast('Save failed — try again', '#ff453a');
      console.error('[autoSell save]', err);
    });
  };

  // ── disconnect GitHub ─────────────────────────────────────────────────
  window.asDisconnectGithub = function() {
    var uid = _uid();
    if (!uid) return;
    _ghUsername = ''; _ghAvatar = '';
    _asRepoFullName = ''; _asRepoName = ''; _asRepoUrl = ''; _asRepoMeta = null;
    _syncGithubUI();
    var db = _db(); var fns = _fns();
    if (db && fns.ref && fns.remove) {
      fns.remove(fns.ref(db, 'users/' + uid + '/github')).catch(function(){});
    }
    _toast('GitHub disconnected', '#6b7280');
  };

  // ── Check if chat partner (seller) has AutoSell enabled ──────────────
  var _autoSellListenerUnsub = null;
  var _autoSellSellerData    = null; // full autoSell node from Firebase
  var _autoSellAiActive      = false;
  var _autoSellConvoHistory  = []; // rolling window for AI context
  var _autoSellSellerUidRef  = null;

  window._checkPartnerAutoSell = function(sellerUid) {
    if (_autoSellListenerUnsub) { try { _autoSellListenerUnsub(); } catch(e){} _autoSellListenerUnsub = null; }
    _autoSellSellerData   = null;
    _autoSellAiActive     = false;
    _autoSellConvoHistory = [];
    _autoSellSellerUidRef = sellerUid || null;
    _refreshChatAutoSellBadge(null);

    if (!sellerUid) return;
    var db = _db(); var fns = _fns();
    if (!db || !fns.ref || !fns.onValue) return;

    _autoSellListenerUnsub = fns.onValue(fns.ref(db, 'users/' + sellerUid + '/autoSell'), function(snap) {
      if (snap && snap.exists && snap.exists()) {
        var d = snap.val() || {};
        _autoSellSellerData = d;
        _autoSellAiActive   = !!d.enabled;
        _refreshChatAutoSellBadge(sellerUid);
      } else {
        _autoSellSellerData = null;
        _autoSellAiActive   = false;
        _refreshChatAutoSellBadge(null);
      }
    });
  };

  function _refreshChatAutoSellBadge(sellerUid) {
    var badge = document.getElementById('asChatBadge');
    if (!badge) return;
    if (_autoSellAiActive && sellerUid) badge.classList.add('visible');
    else badge.classList.remove('visible');
  }

  // ── Build repo context string for AI system prompt ───────────────────
  function _buildRepoContext(d) {
    var meta = d.repoMeta || {};
    var lines = [
      '== PRODUCT BEING SOLD ==',
      'Name: '        + (meta.name        || d.repoName    || ''),
      'GitHub URL: '  + (meta.url         || d.repoUrl     || ''),
      'Description: ' + (meta.description || 'No description provided'),
      'Language: '    + (meta.language    || 'Not specified'),
      'Stars: '       + (meta.stars       != null ? meta.stars : 'N/A'),
      'Forks: '       + (meta.forks       != null ? meta.forks : 'N/A'),
      'License: '     + (meta.license     || 'Not specified'),
      'Topics: '      + ((meta.topics && meta.topics.length) ? meta.topics.join(', ') : 'None'),
      'Visibility: '  + (meta.private     ? 'Private repo (buyer will be added as collaborator after payment)' : 'Public repo'),
      'Open issues: ' + (meta.open_issues != null ? meta.open_issues : 'N/A'),
      'Last updated: ' + (meta.updated_at ? new Date(meta.updated_at).toLocaleDateString('en-GB') : 'N/A'),
    ];
    return lines.join('\n');
  }

  // ── Intercept buyer message → AI reply via /api/chat (Groq) ──────────
  window._autoSellInterceptOutgoing = async function(buyerMessage) {
    if (!_autoSellAiActive || !_autoSellSellerData) return;

    _autoSellConvoHistory.push({ role: 'user', content: buyerMessage });
    if (_autoSellConvoHistory.length > 20) _autoSellConvoHistory = _autoSellConvoHistory.slice(-20);

    var container = document.getElementById('chatMessagesContent');
    if (!container) return;
    var typingId = 'as_typing_' + Date.now();
    container.insertAdjacentHTML('beforeend',
      '<div id="'+typingId+'" class="imsg-ai-bubble">'
      + '<div class="imsg-ai-avatar"><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#fff" stroke-width="1.4"/><path d="M7 10l2 2 4-4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      + '<div class="imsg-ai-content"><div class="imsg-ai-label">AutoSell AI · replying for seller</div>'
      + '<div class="imsg-ai-typing"><div class="imsg-ai-dot"></div><div class="imsg-ai-dot"></div><div class="imsg-ai-dot"></div></div>'
      + '</div></div>');
    if (window.scrollToLatest) window.scrollToLatest();

    // Build a sales-focused system prompt injected into /api/chat
    var repoContext = _buildRepoContext(_autoSellSellerData);
    var salesSystemOverride = [
      'You are AutoSell AI — an automated sales assistant replying on behalf of a seller on Siterifty.',
      'Your ONLY job is to answer buyer questions about the product below, build excitement, and guide the buyer to click "Send Deal" in the chat to purchase.',
      'Keep replies concise (2-4 sentences), conversational, and never use markdown or lists.',
      'When payment is confirmed, the buyer will be automatically added as a GitHub collaborator — you can mention this as reassurance.',
      'Never reveal the seller\'s personal details or token. Never discuss other products.',
      repoContext
    ].join('\n');

    try {
      // Use the same /api/chat endpoint as the support AI — it handles Firebase context + Groq
      // We pass sellerUid as deviceId so the AI also knows seller's account/plan
      var resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:    _autoSellConvoHistory,
          deviceId:    _autoSellSellerUidRef || '',
          _systemOverride: salesSystemOverride  // api/chat must check for this field — see note below
        })
      });
      var data   = await resp.json();
      var aiText = data.reply || '';

      if (aiText) _autoSellConvoHistory.push({ role: 'assistant', content: aiText });

      var typingEl = document.getElementById(typingId);
      if (typingEl) {
        typingEl.outerHTML =
          '<div class="imsg-ai-bubble">'
          + '<div class="imsg-ai-avatar"><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#fff" stroke-width="1.4"/><path d="M7 10l2 2 4-4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
          + '<div class="imsg-ai-content"><div class="imsg-ai-label">AutoSell AI · replying for seller</div>'
          + _escHtmlAs(aiText)
          + '</div></div>';
      }

      _persistAutoSellAiMessage(aiText);

    } catch(err) {
      console.warn('[autoSell AI]', err);
      var typingEl2 = document.getElementById(typingId);
      if (typingEl2) typingEl2.remove();
    }

    if (window.scrollToLatest) window.scrollToLatest();
  };

  // ── Persist AI message to Firebase as if sent by seller ──────────────
  function _persistAutoSellAiMessage(text) {
    try {
      var db = _db(); var fns = _fns();
      var sellerUid = window._currentChatUid || '';
      var buyerUid  = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
      if (!db || !fns.ref || !fns.push || !fns.set || !sellerUid || !buyerUid) return;

      var base = {
        fromUid:      sellerUid,
        toUid:        buyerUid,
        fromUsername: 'AutoSell AI',
        toName:       (window._currentChatName || ''),
        message:      text,
        type:         'text',
        isAutoSell:   true,
        sentAt:       Date.now(),
        read:         false
      };
      var newKey = fns.push(fns.ref(db, 'users/' + buyerUid + '/inbox')).key;
      var updates = {};
      updates['users/' + buyerUid  + '/inbox/' + newKey] = base;
      updates['users/' + sellerUid + '/inbox/' + newKey] = base;
      fns.update(fns.ref(db, '/'), updates).catch(function(e){ console.warn('[autoSell persist]', e); });
    } catch(e){ console.warn('[autoSell persist]', e); }
  }

  // ── After payment: ask buyer for GitHub username, then invite ─────────
  window._autoSellDeliverRepo = function() {
    if (!_autoSellAiActive || !_autoSellSellerData) return;
    var repoUrl      = _autoSellSellerData.repoUrl      || '';
    var repoName     = _autoSellSellerData.repoName     || '';
    var repoFullName = _autoSellSellerData.repoFullName || '';
    var repoMeta     = _autoSellSellerData.repoMeta     || {};
    var sellerUid    = window._currentChatUid           || '';
    var buyerUid     = (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid) || '';
    if (!repoUrl || !repoFullName) return;

    var container = document.getElementById('chatMessagesContent');
    if (!container) return;

    if (window.appendSystemLogMessage) {
      appendSystemLogMessage(
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>'
        + 'AutoSell: payment confirmed — requesting buyer\'s GitHub to grant repo access'
      );
    }

    // Show GitHub username request bubble with inline input
    var requestId = 'as_ghreq_' + Date.now();
    container.insertAdjacentHTML('beforeend',
      '<div class="imsg-ai-bubble" id="'+requestId+'">'
      + '<div class="imsg-ai-avatar"><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#fff" stroke-width="1.4"/><path d="M7 10l2 2 4-4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      + '<div class="imsg-ai-content">'
      + '<div class="imsg-ai-label">AutoSell AI · payment confirmed 🎉</div>'
      + 'Payment received! To give you access to <strong>'+_escHtmlAs(repoName)+'</strong>, please enter your GitHub username below and I\'ll add you as a collaborator right away.'
      + '<div style="margin-top:10px;display:flex;gap:7px;align-items:center;">'
      + '<input id="asBuyerGhInput_'+requestId+'" type="text" placeholder="your-github-username" autocomplete="off" spellcheck="false" style="flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:7px 11px;font-size:12px;font-weight:600;color:#fff;font-family:\'Plus Jakarta Sans\',sans-serif;outline:none;" onkeydown="if(event.key===\'Enter\')asSubmitBuyerGithub(\''+requestId+'\',\''+_escHtmlAs(sellerUid)+'\',\''+_escHtmlAs(repoFullName)+'\',\''+_escHtmlAs(repoUrl)+'\',\''+_escHtmlAs(repoName)+'\',\''+_escHtmlAs(buyerUid)+'\')">'
      + '<button onclick="asSubmitBuyerGithub(\''+requestId+'\',\''+_escHtmlAs(sellerUid)+'\',\''+_escHtmlAs(repoFullName)+'\',\''+_escHtmlAs(repoUrl)+'\',\''+_escHtmlAs(repoName)+'\',\''+_escHtmlAs(buyerUid)+'\')" style="background:rgba(48,209,88,0.15);border:1px solid rgba(48,209,88,0.35);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;color:#30d158;cursor:pointer;white-space:nowrap;">Add me →</button>'
      + '</div>'
      + '<div id="asBuyerGhStatus_'+requestId+'" style="margin-top:6px;font-size:11px;display:none;"></div>'
      + '</div></div>'
    );
    if (window.scrollToLatest) window.scrollToLatest();

    // Also log sale
    try {
      var db = _db(); var fns = _fns();
      if (db && fns.ref && fns.push && sellerUid) {
        fns.push(fns.ref(db, 'autosell/' + sellerUid + '/sales'), {
          buyerUid:     buyerUid,
          repoUrl:      repoUrl,
          repoFullName: repoFullName,
          repoName:     repoName,
          splitPct:     50,
          completedAt:  Date.now()
        }).catch(function(){});
      }
    } catch(e){}
  };

  // ── Buyer submits GitHub username → call /api/github-autosell?mode=invite
  window.asSubmitBuyerGithub = async function(requestId, sellerUid, repoFullName, repoUrl, repoName, buyerUid) {
    var input     = document.getElementById('asBuyerGhInput_'   + requestId);
    var statusEl  = document.getElementById('asBuyerGhStatus_'  + requestId);
    var ghUsername = input ? input.value.trim() : '';
    if (!ghUsername) { if (input) input.focus(); return; }

    if (input) input.disabled = true;
    if (statusEl) { statusEl.style.display = ''; statusEl.style.color = 'rgba(255,255,255,0.4)'; statusEl.textContent = 'Adding you as collaborator…'; }

    try {
      var res  = await fetch('/api/github-autosell?mode=invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerUid: sellerUid, buyerGithubUsername: ghUsername, repoFullName: repoFullName })
      });
      var json = await res.json();

      if (json.success) {
        if (statusEl) { statusEl.style.color = '#30d158'; statusEl.textContent = '✓ Done! Check your GitHub email — you\'ll get a collaborator invite for ' + repoName + '.'; }
        // Save buyer's GitHub to their Firebase profile for future
        var db = _db(); var fns = _fns();
        if (db && fns.ref && fns.update && buyerUid) {
          fns.update(fns.ref(db, 'users/' + buyerUid + '/github'), { username: ghUsername, linkedAt: Date.now() }).catch(function(){});
        }
        // Persist final delivery message
        _persistAutoSellAiMessage('🎉 You\'ve been added as a collaborator on ' + repoName + ' (' + repoUrl + '). Check your GitHub email to accept the invite. Thanks for your purchase!');
      } else {
        if (input) input.disabled = false;
        if (statusEl) { statusEl.style.color = '#f87171'; statusEl.textContent = json.error || 'Failed — check the username and try again.'; }
      }
    } catch(err) {
      if (input) input.disabled = false;
      if (statusEl) { statusEl.style.color = '#f87171'; statusEl.textContent = 'Network error — try again.'; }
      console.warn('[autoSell invite]', err);
    }
  };

  window._asToastCopied = function() { _toast('Repo link copied!', '#30d158'); };

  function _escHtmlAs(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Patch sendStandardTextMessage to call the AI intercept ───────────
  function _patchSendMessage() {
    var orig = window.sendStandardTextMessage;
    if (typeof orig !== 'function') { setTimeout(_patchSendMessage, 200); return; }
    window.sendStandardTextMessage = function() {
      var input = document.getElementById('chatTextMessageInput');
      var val = input ? input.value.trim() : '';
      orig();
      if (val && _autoSellAiActive) window._autoSellInterceptOutgoing(val);
    };
  }
  _patchSendMessage();

  // ── Patch executeWalletDeduction to trigger repo delivery ────────────
  function _patchWalletDeduction() {
    var orig = window.executeWalletDeduction;
    if (typeof orig !== 'function') { setTimeout(_patchWalletDeduction, 200); return; }
    window.executeWalletDeduction = function() {
      orig();
      if (_autoSellAiActive) setTimeout(function(){ window._autoSellDeliverRepo(); }, 800);
    };
  }
  _patchWalletDeduction();

  // ── Patch openChat to check if partner has AutoSell on ───────────────
  function _patchOpenChat() {
    var orig = window.openChat;
    if (typeof orig !== 'function') {
      setTimeout(_patchOpenChat, 200);
      return;
    }
    window.openChat = function(name, avatarUrl, status, uid, partnerUid) {
      orig(name, avatarUrl, status, uid, partnerUid);
      // Check if the seller (the person we're chatting with) has AutoSell on
      var targetUid = uid || partnerUid || '';
      if (targetUid) window._checkPartnerAutoSell(targetUid);
    };
  }
  _patchOpenChat();

  // ── Expose openAutoSellModal globally (for settings button hookup) ──
  // This is already done above — just a comment marker.

})();

// ══════════════════════════════════════════════════════════════
//  TRANSACTION HISTORY PANEL
//  Aggregates: donations (sent/received), deals (escrow),
//              withdrawals (localStorage), wallet transfers
// ══════════════════════════════════════════════════════════════
(function() {
    'use strict';

    var _txnAll     = [];   // full merged list sorted newest-first
    var _txnTab     = 'all';
    var _txnLoading = false;

    // ── helpers ──────────────────────────────────────────────
    function $id(id) { return document.getElementById(id); }

    function fmtUSD(n) {
        var v = parseFloat(n);
        return isNaN(v) ? '$—' : '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtDate(ts) {
        if (!ts) return '—';
        var d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // colour config per type
    var TYPE_CFG = {
        donation_sent:     { label: 'Donation sent',     icon: '🎁', color: '#f87171', dot: '#f87171', sign: '-' },
        donation_received: { label: 'Donation received', icon: '🎁', color: '#34d399', dot: '#34d399', sign: '+' },
        deal_sold:         { label: 'Deal — sold',       icon: '🤝', color: '#34d399', dot: '#a855f7', sign: '+' },
        deal_bought:       { label: 'Deal — bought',     icon: '🤝', color: '#f87171', dot: '#818cf8', sign: '-' },
        deal_pending:      { label: 'Deal — in progress',icon: '🔒', color: '#fbbf24', dot: '#fbbf24', sign: '' },
        withdrawal:        { label: 'Withdrawal',         icon: '💸', color: '#f87171', dot: '#38bdf8', sign: '-' },
        topup:             { label: 'Top-up',             icon: '💳', color: '#34d399', dot: '#34d399', sign: '+' },
        transfer_sent:     { label: 'Transfer sent',      icon: '➡️', color: '#f87171', dot: '#f87171', sign: '-' },
        transfer_received: { label: 'Transfer received',  icon: '⬅️', color: '#34d399', dot: '#34d399', sign: '+' }
    };

    function _tabFilter(list) {
        if (_txnTab === 'all') return list;
        if (_txnTab === 'donations') return list.filter(function(t) { return t.type === 'donation_sent' || t.type === 'donation_received'; });
        if (_txnTab === 'deals')     return list.filter(function(t) { return t.type === 'deal_sold' || t.type === 'deal_bought' || t.type === 'deal_pending'; });
        if (_txnTab === 'withdrawals') return list.filter(function(t) { return t.type === 'withdrawal' || t.type === 'topup'; });
        if (_txnTab === 'transfers') return list.filter(function(t) { return t.type === 'transfer_sent' || t.type === 'transfer_received'; });
        return list;
    }

    function _renderEmpty(msg) {
        var el = $id('txnList');
        if (!el) return;
        el.innerHTML = '<div style="text-align:center;padding:48px 0 24px;">'
            + '<div style="opacity:.25;color:var(--text);display:flex;justify-content:center;margin-bottom:12px;">'
            + '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="32" height="26" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M4 16h32" stroke="currentColor" stroke-width="1.6"/><path d="M11 25h10M11 29h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></div>'
            + '<div style="font-size:13px;color:var(--muted);">' + (msg || 'No transactions yet') + '</div>'
            + '</div>';
    }

    function _renderList(list) {
        var el = $id('txnList');
        if (!el) return;
        if (!list.length) { _renderEmpty('Nothing in this category yet.'); return; }

        // Stats
        var totalIn = 0, totalOut = 0;
        list.forEach(function(t) {
            var cfg = TYPE_CFG[t.type] || {};
            if (cfg.sign === '+') totalIn  += (t.amount || 0);
            if (cfg.sign === '-') totalOut += (t.amount || 0);
        });
        var statTotal = $id('txnStatTotal');
        var statIn    = $id('txnStatIn');
        var statOut   = $id('txnStatOut');
        var statCount = $id('txnStatCount');
        if (statTotal) statTotal.textContent = fmtUSD(totalIn - totalOut);
        if (statIn)    statIn.textContent    = '+' + fmtUSD(totalIn);
        if (statOut)   statOut.textContent   = '−' + fmtUSD(totalOut);
        if (statCount) statCount.textContent = list.length;

        el.innerHTML = list.map(function(t) {
            var cfg   = TYPE_CFG[t.type] || { label: t.type, color: '#8b8aa8', dot: '#8b8aa8', sign: '', icon: '·' };
            var amtStr = cfg.sign + fmtUSD(t.amount);
            var note  = t.note || '';
            var badgeCfg = { pending: ['#fbbf24','rgba(251,191,36,0.12)','Pending'], approved: ['#34d399','rgba(52,211,153,0.10)','Complete'], complete: ['#34d399','rgba(52,211,153,0.10)','Complete'], released: ['#34d399','rgba(52,211,153,0.10)','Released'], declined: ['#f87171','rgba(248,113,113,0.10)','Declined'], funded: ['#38bdf8','rgba(56,189,248,0.10)','Funded'], inspection: ['#a855f7','rgba(168,85,247,0.10)','Review'], assets_transferred: ['#38bdf8','rgba(56,189,248,0.10)','Assets Sent'], disputed: ['#f87171','rgba(248,113,113,0.10)','Disputed'] };
            var bc = badgeCfg[t.status] || ['rgba(255,255,255,0.3)','rgba(255,255,255,0.05)', t.status || ''];
            var badge = t.status ? '<span style="flex-shrink:0;font-size:9px;font-weight:700;font-family:\'Syne\',sans-serif;color:'+bc[0]+';background:'+bc[1]+';border:1px solid '+bc[0].replace(')',',0.25)').replace('rgb','rgba')+';border-radius:999px;padding:2px 8px;letter-spacing:.04em;">'+bc[2].toUpperCase()+'</span>' : '';

            return '<div style="display:flex;align-items:flex-start;gap:11px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
                + '<div style="width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;">' + cfg.icon + '</div>'
                + '<div style="flex:1;min-width:0;">'
                +   '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                +     '<span style="font-family:\'Syne\',sans-serif;font-size:12px;font-weight:700;color:var(--text);">' + cfg.label + '</span>'
                +     badge
                +   '</div>'
                +   (note ? '<div style="font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + note + '</div>' : '')
                +   '<div style="font-size:10px;color:rgba(139,138,168,0.5);margin-top:3px;">' + fmtDate(t.ts) + '</div>'
                + '</div>'
                + '<div style="text-align:right;flex-shrink:0;">'
                +   '<div style="font-family:\'Syne\',sans-serif;font-size:13px;font-weight:800;color:' + cfg.color + ';">' + amtStr + '</div>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    function _render() {
        var filtered = _tabFilter(_txnAll);
        // Reset stats to — when empty
        var els = ['txnStatTotal','txnStatIn','txnStatOut','txnStatCount'];
        els.forEach(function(id) { var e = $id(id); if (e) e.textContent = '—'; });
        if (!filtered.length) { _renderEmpty(); return; }
        _renderList(filtered);
    }

    // ── Tab switcher ──────────────────────────────────────────
    window._txnSwitchTab = function(tab) {
        _txnTab = tab;
        var tabs = ['all','donations','deals','withdrawals','transfers'];
        tabs.forEach(function(t) {
            var btn = $id('txnTab-' + t);
            if (!btn) return;
            if (t === tab) {
                btn.style.color = '#38bdf8';
                btn.style.borderBottom = '2px solid #38bdf8';
            } else {
                btn.style.color = 'var(--muted)';
                btn.style.borderBottom = '2px solid transparent';
            }
        });
        _render();
    };

    // ── Main loader ───────────────────────────────────────────
    window._txnLoadAll = async function() {
        if (_txnLoading) return;
        _txnLoading = true;
        var listEl = $id('txnList');
        if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:40px 0 20px;color:var(--muted);font-size:12px;">Loading…</div>';

        try {
            var auth = window._fbAuth;
            var user = auth && auth.currentUser;
            if (!user) { _renderEmpty('Sign in to view your transaction history.'); _txnLoading = false; return; }

            var uid = user.uid;
            var fb  = window._fb && window._fb();
            var txns = [];

            // 1. WITHDRAWALS — localStorage (already stored on withdraw)
            try {
                var wds = JSON.parse(localStorage.getItem('siterifty_withdrawals') || '[]');
                wds.forEach(function(w) {
                    txns.push({ type: 'withdrawal', amount: w.amount, ts: w.date ? new Date(w.date).getTime() : Date.now(), status: w.status || 'pending', note: 'PayPal · ' + (w.email || '') });
                });
            } catch(e) {}

            if (fb) {
                // 2. DONATIONS — users/<uid>/donations/sent + received
                try {
                    var dSnap = await fb.get(fb.ref(fb.db, 'users/' + uid + '/donations'));
                    if (dSnap && dSnap.exists()) {
                        var dVal = dSnap.val();
                        // sent
                        var sent = dVal.sent || {};
                        Object.values(sent).forEach(function(d) {
                            txns.push({ type: 'donation_sent', amount: d.amount, ts: d.ts || d.createdAt || Date.now(), status: 'complete', note: 'To: ' + (d.recipientName || d.recipientUid || '') });
                        });
                        // received
                        var recv = dVal.received || {};
                        Object.values(recv).forEach(function(d) {
                            txns.push({ type: 'donation_received', amount: d.amount, ts: d.ts || d.createdAt || Date.now(), status: 'complete', note: 'From: ' + (d.senderName || d.senderUid || '') });
                        });
                    }
                } catch(e) {}

                // 3. DEALS — users/<uid>/escrow (active) + users/<uid>/offers (released)
                try {
                    var escSnap = await fb.get(fb.ref(fb.db, 'users/' + uid + '/escrow'));
                    if (escSnap && escSnap.exists()) {
                        Object.values(escSnap.val()).forEach(function(deal) {
                            var isSeller = deal.sellerUid === uid;
                            var isReleased = deal.status === 'released';
                            var t = isSeller
                                ? (isReleased ? 'deal_sold'    : 'deal_pending')
                                : (isReleased ? 'deal_bought'  : 'deal_pending');
                            txns.push({ type: t, amount: deal.amount || deal.offerPrice, ts: deal.updatedAt || deal.createdAt || Date.now(), status: deal.status || 'pending', note: deal.listingTitle || deal.listingUrl || '' });
                        });
                    }
                } catch(e) {}

                // 4. OFFERS (released deals not in escrow anymore)
                try {
                    var offSnap = await fb.get(fb.ref(fb.db, 'users/' + uid + '/offers'));
                    if (offSnap && offSnap.exists()) {
                        Object.values(offSnap.val()).forEach(function(o) {
                            if (o.status !== 'released') return; // only completed deals
                            var isBuyer = o.buyerUid === uid;
                            txns.push({ type: isBuyer ? 'deal_bought' : 'deal_sold', amount: o.offerPrice, ts: o.updatedAt || o.createdAt || Date.now(), status: 'released', note: o.listingTitle || o.listingUrl || '' });
                        });
                    }
                } catch(e) {}

                // 5. WALLET LEDGER — users/<uid>/walletLedger (topups, transfers if server writes them)
                try {
                    var ledSnap = await fb.get(fb.ref(fb.db, 'users/' + uid + '/walletLedger'));
                    if (ledSnap && ledSnap.exists()) {
                        Object.values(ledSnap.val()).forEach(function(entry) {
                            var type = entry.type || 'topup';
                            // Normalise server-side type strings
                            if (type === 'topup' || type === 'top_up' || type === 'credit') type = 'topup';
                            if (type === 'transfer_out' || type === 'money_transfer_sent') type = 'transfer_sent';
                            if (type === 'transfer_in'  || type === 'money_transfer_received') type = 'transfer_received';
                            if (type === 'withdraw' || type === 'withdrawal') type = 'withdrawal';
                            txns.push({ type: type, amount: Math.abs(entry.amount || 0), ts: entry.ts || entry.createdAt || Date.now(), status: entry.status || 'complete', note: entry.note || entry.description || '' });
                        });
                    }
                } catch(e) {}

                // 6. TRANSFERS — users/<uid>/transfersLedger
                try {
                    var trSnap = await fb.get(fb.ref(fb.db, 'users/' + uid + '/transfersLedger'));
                    if (trSnap && trSnap.exists()) {
                        Object.values(trSnap.val()).forEach(function(tr) {
                            var type = (tr.direction === 'in' || tr.senderUid !== uid) ? 'transfer_received' : 'transfer_sent';
                            txns.push({ type: type, amount: Math.abs(tr.amount || 0), ts: tr.ts || tr.createdAt || Date.now(), status: tr.status || 'complete', note: type === 'transfer_sent' ? ('To: ' + (tr.recipientName || tr.recipientEmail || tr.recipientUid || '')) : ('From: ' + (tr.senderName || tr.senderEmail || tr.senderUid || '')) });
                        });
                    }
                } catch(e) {}
            }

            // De-duplicate by type+amount+ts (in case escrow + offers overlap)
            var seen = {};
            txns = txns.filter(function(t) {
                var key = t.type + '|' + Math.round((t.amount||0)*100) + '|' + Math.round((t.ts||0)/60000);
                if (seen[key]) return false;
                seen[key] = true;
                return true;
            });

            // Sort newest-first
            txns.sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });

            _txnAll = txns;
            _render();

        } catch(err) {
            _renderEmpty('Failed to load. Please try again.');
            console.error('[txnHistory]', err);
        } finally {
            _txnLoading = false;
        }
    };

})();



    let _banCountdownInterval = null;
    let _banTimerExpired = false;

    function _formatCountdown(ms) {
        if (ms <= 0) return '00:00:00';
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    }

    function showBanGate(banData) {
        const isPermanent = !banData.bannedUntil;
        document.getElementById('banGateTitle').textContent =
            isPermanent ? 'Your account has been permanently suspended' : 'Your account has been temporarily suspended';
        document.getElementById('banGateSubtitle').textContent =
            isPermanent
                ? 'This account has been permanently removed from Siterifty due to a serious violation.'
                : 'Access to Siterifty has been temporarily restricted until the timer below ends.';
        document.getElementById('banGateReason').textContent =
            banData.banReason || 'Violation of community guidelines.';
        document.getElementById('banGateType').textContent = isPermanent ? 'Permanent' : 'Temporary';
        const expiryMs = banData.bannedUntil || null;
        if (isPermanent) {
            document.getElementById('banGateExpiry').textContent = 'Never';
        } else if (expiryMs) {
            document.getElementById('banGateExpiry').textContent = new Date(expiryMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else {
            document.getElementById('banGateExpiry').textContent = '—';
        }
        const appealSub = document.getElementById('banAppealSub');
        if (isPermanent && appealSub) appealSub.textContent = 'You may still submit an appeal for review by our moderation team, though permanent suspensions are reserved for the most serious violations.';

        // ── Countdown timer for temporary bans ──
        const countdownBox = document.getElementById('banCountdownBox');
        const reentryBtn   = document.getElementById('banReentryBtn');
        if (_banCountdownInterval) { clearInterval(_banCountdownInterval); _banCountdownInterval = null; }
        _banTimerExpired = false;

        if (!isPermanent && expiryMs) {
            countdownBox.style.display = 'block';
            reentryBtn.style.display = 'none';
            const tick = () => {
                const remaining = expiryMs - Date.now();
                if (remaining <= 0) {
                    document.getElementById('banCountdownTimer').textContent = '00:00:00';
                    clearInterval(_banCountdownInterval);
                    _banCountdownInterval = null;
                    _banTimerExpired = true;
                    countdownBox.style.display = 'none';
                    reentryBtn.style.display = 'block';
                } else {
                    document.getElementById('banCountdownTimer').textContent = _formatCountdown(remaining);
                }
            };
            tick();
            _banCountdownInterval = setInterval(tick, 1000);
        } else {
            countdownBox.style.display = 'none';
            reentryBtn.style.display = 'none';
        }

        document.getElementById('banGateOverlay').classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function hideBanGate() {
        document.getElementById('banGateOverlay').classList.remove('visible');
        document.body.style.overflow = '';
        if (_banCountdownInterval) { clearInterval(_banCountdownInterval); _banCountdownInterval = null; }
    }

    // ── User clicks "I understand — continue" once the countdown hits zero ──
    // This is the explicit re-entry gate: even though the ban has technically
    // expired, we keep the overlay up until the user acknowledges it.
    window.banGateReentry = function() {
        if (!_banTimerExpired) return; // guard — button is hidden until timer ends anyway
        hideBanGate();
    };

    function isBanActive(data) {
        const s = data.banStatus;
        if (!s || s === 'none') return false;
        if (s === 'permanent') return true;
        if (s === 'suspended') {
            const u = data.bannedUntil;
            if (!u) return true;
            // Once the timer has expired AND the user has acknowledged it via
            // the re-entry button, treat the gate as cleared even if Firebase
            // hasn't been updated yet (admin/cron may lag).
            if (Date.now() >= u && _banTimerExpired) return false;
            return true;
        }
        return false;
    }

    window._checkBanGate = function(data, uid) {
        _banUid = uid;
        if (isBanActive(data)) showBanGate(data);
        else hideBanGate();
    };

    window._resetBanGate = function() {
        _banUid = null; _appealSubmitted = false; hideBanGate();
        const s = document.getElementById('banAppealStatus');
        if (s) { s.style.display = 'none'; s.className = 'ban-appeal-status'; }
        const b = document.getElementById('banAppealBtn');
        if (b) { b.disabled = false; b.textContent = 'Submit Appeal →'; }
        const t = document.getElementById('banAppealText');
        if (t) t.value = '';
    };

    // ── Warning gate (yellow modal, warnings 1-3, no account lockout) ──
    let _lastWarnCountShown = null; // null = not yet seeded from initial load
    window._checkWarningGate = function(data) {
        const warnings = data.warnings || 0;
        if (_lastWarnCountShown === null) {
            // First call this session — just record the baseline, don't show
            // the modal for warnings the user already knew about.
            _lastWarnCountShown = warnings;
            return;
        }
        // Only show when the warning count just went UP during this session.
        if (warnings > 0 && warnings > _lastWarnCountShown && warnings <= 3) {
            document.getElementById('warnCounterChip').textContent = 'Warning ' + warnings + ' of 3';
            document.getElementById('warnGateReason').textContent =
                data.lastModerationReason || 'Violation of community guidelines.';
            document.getElementById('warnGateOverlay').classList.add('visible');
            if (typeof window._showModerationToast === 'function') {
                window._showModerationToast(data.lastModerationReason);
            }
        }
        _lastWarnCountShown = warnings;
    };

    window._dismissWarningGate = function() {
        document.getElementById('warnGateOverlay').classList.remove('visible');
    };

    window._resetWarningGate = function() {
        _lastWarnCountShown = null;
        const o = document.getElementById('warnGateOverlay');
        if (o) o.classList.remove('visible');
    };

    window.submitBanAppeal = async function() {
        if (_appealSubmitted) return;
        const ta = document.getElementById('banAppealText');
        const btn = document.getElementById('banAppealBtn');
        const msg = (ta ? ta.value : '').trim();
        if (!msg || msg.length < 20) { _showStatus('err', 'Please write at least a sentence explaining your situation.'); return; }
        if (!_banUid) { _showStatus('err', 'Something went wrong — please refresh and try again.'); return; }
        btn.disabled = true; btn.textContent = 'Submitting…';
        _showStatus('pending', 'Sending your appeal to our moderation system…');
        try {
            const res = await fetch('/api/security?mode=appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: _banUid, message: msg })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                if (json.unbanned) {
                    _appealSubmitted = true;
                    btn.innerHTML = 'Appeal approved <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-left:2px;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    _showStatus('ok', '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:4px;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Appeal approved — your suspension has been lifted. Refreshing…');
                    setTimeout(() => window.location.reload(), 2200);
                } else if (json.queued) {
                    _appealSubmitted = true;
                    btn.innerHTML = 'Appeal submitted <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-left:2px;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    _showStatus('ok', '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:4px;"><path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Your appeal has been submitted and will be reviewed by our team within 24–48 hours.');
                } else {
                    btn.disabled = false; btn.textContent = 'Submit Appeal →';
                    _showStatus('err', _escapeHtml(json.error) || 'Unexpected response. Please try again.');
                }
            } else {
                btn.disabled = false; btn.textContent = 'Submit Appeal →';
                _showStatus('err', _escapeHtml(json.error) || 'Server error. Please try again in a moment.');
            }
        } catch(e) {
            btn.disabled = false; btn.textContent = 'Submit Appeal →';
            _showStatus('err', 'Network error. Please check your connection and try again.');
        }
    };

    function _escapeHtml(s) {
        if (!s) return s;
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function _showStatus(type, msg) {
        const el = document.getElementById('banAppealStatus');
        if (!el) return;
        el.className = 'ban-appeal-status ' + type;
        el.innerHTML = msg;
        el.style.display = 'block';
    }

    window.banGateSignOut = async function() {
        try {
            const a = window._fbAuth || (window._auth && window._auth());
            if (a && a.signOut) await a.signOut();
        } catch(e) {}
        window.location.reload();
    };

// ══════════════════════════════════════════════════════════════
//  DEVICE LOCK GATE
// ══════════════════════════════════════════════════════════════
(function() {
    'use strict';

    function _getDeviceId() {
        let id = localStorage.getItem('sr_device_id');
        if (!id) {
            id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem('sr_device_id', id);
        }
        return id;
    }

    window._checkDeviceLock = function(data) {
        const lock = data.deviceLock || {};
        if (!lock.enabled) { _hideDlock(); return; }
        const myId = _getDeviceId();
        if (lock.trustedDeviceId && lock.trustedDeviceId !== myId) {
            _showDlock();
        } else {
            _hideDlock();
        }
    };

    function _showDlock() {
        const el = document.getElementById('deviceLockOverlay');
        if (el) { el.classList.add('visible'); document.body.style.overflow = 'hidden'; }
    }
    function _hideDlock() {
        const el = document.getElementById('deviceLockOverlay');
        if (el) { el.classList.remove('visible'); document.body.style.overflow = ''; }
    }

    window._resetDeviceLockGate = function() { _hideDlock(); };

    window.dlockSignOut = async function() {
        try {
            const a = window._fbAuth || (window._auth && window._auth());
            if (a && a.signOut) await a.signOut();
        } catch(e) {}
        window.location.reload();
    };
})();

// ══════════════════════════════════════════════════════════════
//  ACCOUNT INVITE SYSTEM
//  pendingInvites/{emailKey} → modal on login → accept writes
//  users/{myUid}/managedAccounts/{ownerUid} = { role, ownerEmail, ownerName }
//  users/{ownerUid}/teamMembers/{emailKey}.status = 'active'
// ══════════════════════════════════════════════════════════════
(function() {
    'use strict';

    var _pendingInviteKey  = null;
    var _pendingInviteData = null;
    var _managedUid        = null;   // uid of account currently being managed
    var _ownUid            = null;   // user's own uid

    // ── helpers ──────────────────────────────────────────────
    function $id(id) { return document.getElementById(id); }
    function _esc(s) {
        const d = document.createElement('div');
        d.textContent = String(s || '');
        return d.innerHTML;
    }
    function _fbRef() { return window._fbDB || (window.db); }
    function _fbUpdate(path, val) {
        const { ref, update } = window._fbSDK || {};
        if (!ref || !update) return Promise.reject('SDK not ready');
        return update(ref(_fbRef(), path), val);
    }
    function _fbSet(path, val) {
        const { ref, set } = window._fbSDK || {};
        if (!ref || !set) return Promise.reject('SDK not ready');
        return set(ref(_fbRef(), path), val);
    }
    function _fbGet(path) {
        const { ref, get } = window._fbSDK || {};
        if (!ref || !get) return Promise.reject('SDK not ready');
        return get(ref(_fbRef(), path));
    }

    // ── Check for pending invite on login ──────────────────────
    window._checkPendingInvite = async function(user) {
        if (!user || !user.email) return;
        _ownUid = user.uid;
        const emailKey = user.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
        try {
            const snap = await _fbGet('pendingInvites/' + emailKey);
            if (!snap.exists()) return;
            const inv = snap.val();
            if (!inv || inv.status !== 'pending') return;
            _pendingInviteKey  = emailKey;
            _pendingInviteData = inv;
            _showInviteModal(inv);
        } catch(e) {
            console.warn('[invite check]', e);
        }
    };

    function _showInviteModal(inv) {
        const role      = inv.role || 'viewer';
        const ownerName = inv.ownerName || inv.ownerEmail || 'Someone';
        const initial   = ownerName.charAt(0).toUpperCase();

        const avatarEl = $id('ainvAvatar');
        if (avatarEl) avatarEl.textContent = initial;

        const titleEl = $id('ainvTitle');
        if (titleEl) titleEl.textContent = _esc(ownerName) + ' invited you';

        const subEl = $id('ainvSub');
        if (subEl) subEl.textContent = _esc(ownerName) + ' (' + _esc(inv.ownerEmail) + ') has invited you to help manage their Siterifty account.';

        const roleTextEl = $id('ainvRoleText');
        if (roleTextEl) roleTextEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);

        const permsEl = $id('ainvPerms');
        if (permsEl) {
            if (role === 'editor') {
                permsEl.innerHTML = '<strong>As an Editor</strong> you can manage listings, respond to messages, and handle offers on this account. You cannot change account settings or billing.';
            } else {
                permsEl.innerHTML = '<strong>As a Viewer</strong> you can browse listings and view analytics on this account, but cannot make changes.';
            }
        }

        const el = $id('accountInviteModal');
        if (el) { el.classList.add('visible'); document.body.style.overflow = 'hidden'; }
    }

    function _hideInviteModal() {
        const el = $id('accountInviteModal');
        if (el) { el.classList.remove('visible'); document.body.style.overflow = ''; }
    }

    window.acceptAccountInvite = async function() {
        if (!_pendingInviteData || !_ownUid) return;
        const statusEl = $id('ainvStatus');
        if (statusEl) statusEl.textContent = 'Accepting…';
        const inv = _pendingInviteData;
        try {
            const token = await (window._fbAuth && window._fbAuth.currentUser
                ? window._fbAuth.currentUser.getIdToken()
                : Promise.reject('no auth'));
            const res = await fetch('/api/security?mode=accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ action: 'accept', ownerUid: inv.ownerUid })
            });
            const json = await res.json();
            if (!res.ok) { if (statusEl) statusEl.textContent = json.error || 'Something went wrong.'; return; }
            _pendingInviteData = null;
            _hideInviteModal();
            _showSwitcherBar(inv.ownerUid, inv.ownerName || inv.ownerEmail);
        } catch(e) {
            console.error('[invite accept]', e);
            if (statusEl) statusEl.textContent = 'Something went wrong. Try again.';
        }
    };

    window.rejectAccountInvite = async function() {
        if (!_pendingInviteKey) return;
        const statusEl = $id('ainvStatus');
        if (statusEl) statusEl.textContent = 'Declining…';
        try {
            const token = await (window._fbAuth && window._fbAuth.currentUser
                ? window._fbAuth.currentUser.getIdToken()
                : Promise.reject('no auth'));
            await fetch('/api/security?mode=accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ action: 'reject', ownerUid: _pendingInviteData && _pendingInviteData.ownerUid })
            });
            _pendingInviteData = null;
            _hideInviteModal();
        } catch(e) {
            if (statusEl) statusEl.textContent = 'Something went wrong. Try again.';
        }
    };

    // ── Account switcher bar ──────────────────────────────────
    function _showSwitcherBar(uid, name) {
        _managedUid = uid;
        const bar = $id('acctSwitcherBar');
        const nameEl = $id('asbName');
        if (nameEl) nameEl.textContent = name || 'Unknown account';
        if (bar) bar.classList.add('visible');
        // Notify rest of app that we're in managed mode
        window._managedAccountUid  = uid;
        window._managedAccountName = name;
    }

    window.switchToOwnAccount = function() {
        _managedUid = null;
        window._managedAccountUid  = null;
        window._managedAccountName = null;
        const bar = $id('acctSwitcherBar');
        if (bar) bar.classList.remove('visible');
        // TODO: trigger a re-load of UI scoped to own uid
        if (typeof window._reloadUserScope === 'function') window._reloadUserScope(_ownUid);
    };

    window.exitManagedAccount = function() {
        window.switchToOwnAccount();
    };

    // ── Wire into onAuthStateChanged via hook ─────────────────
    // applyUserData already fires after login — we add a one-shot invite check
    const _origApply = window._applyUserDataHook;
    window._checkInviteOnLogin = function(user) {
        window._checkPendingInvite(user);
        // Also load any existing managed accounts and show switcher if any
        _loadManagedAccounts(user);
    };

    async function _loadManagedAccounts(user) {
        if (!user) return;
        try {
            const snap = await _fbGet('users/' + user.uid + '/managedAccounts');
            if (!snap.exists()) return;
            const accounts = snap.val() || {};
            const uids = Object.keys(accounts);
            if (!uids.length) return;
            // For now, surface the first one if user is not already managing one
            if (!_managedUid) {
                const first = accounts[uids[0]];
                // Don't auto-switch — just let them know via the switcher bar
                // User explicitly switches by clicking
                // We store them so the UI can show a "switch account" option
                window._availableManagedAccounts = accounts;
            }
        } catch(e) {
            console.warn('[managed accounts]', e);
        }
    }
})();
