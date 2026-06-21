// ── AutoSell System Logic ──
<!-- ══ AUTOSELL SYSTEM LOGIC ══ -->
<script>
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
      var newKey = fns.push(fns.ref(db, 'users/' + buyerUid + '/threads/' + sellerUid + '/messages')).key;
      var updates = {};
      updates['users/' + buyerUid  + '/threads/' + sellerUid + '/messages/' + newKey] = base;
      updates['users/' + sellerUid + '/threads/' + buyerUid  + '/messages/' + newKey] = base;
      // Update thread meta for buyer
      updates['users/' + buyerUid + '/threads/' + sellerUid + '/meta/partnerName']  = 'AutoSell AI';
      updates['users/' + buyerUid + '/threads/' + sellerUid + '/meta/lastMessage']  = base.message || '';
      updates['users/' + buyerUid + '/threads/' + sellerUid + '/meta/lastSentAt']   = base.sentAt;
      fns.update(fns.ref(db, '/'), updates).then(function() {
          if (fns.runTransaction) {
              fns.runTransaction(fns.ref(db, 'users/' + buyerUid + '/threads/' + sellerUid + '/meta/unread'), function(c){ return (c||0)+1; }).catch(function(){});
              fns.runTransaction(fns.ref(db, 'users/' + buyerUid + '/unreadTotal'), function(c){ return (c||0)+1; }).catch(function(){});
          }
      }).catch(function(e){ console.warn('[autoSell persist]', e); });
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
</script>
