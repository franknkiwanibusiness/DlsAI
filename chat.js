// ── Messages Modal + Chat + Inbox ──
    <script>
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

        // Receives threads map {partnerUid: {meta:{...}, messages:{...}}} from Firebase
        function _renderInboxThreadsFromMeta(threadsData, myUid) {
            var list = document.getElementById('imsgThreadList');
            var empty = document.getElementById('imsgThreadEmpty');
            if (!list) return;

            var sorted = Object.entries(threadsData || {}).map(function(e) {
                var partnerUid = e[0];
                var meta = (e[1] && e[1].meta) ? e[1].meta : {};
                return {
                    partnerUid:   partnerUid,
                    partnerName:  meta.partnerName  || partnerUid,
                    message:      meta.lastMessage  || '',
                    sentAt:       meta.lastSentAt   || 0,
                    unread:       meta.unread       || 0,
                    listingTitle: meta.listingTitle || ''
                };
            }).sort(function(a,b){ return (b.sentAt||0)-(a.sentAt||0); });

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
                var preview  = (t.message||'').length > 60 ? t.message.slice(0,60)+'…' : (t.message||'');
                var timeStr  = _imsgTimeAgo(t.sentAt);
                var unreadBadge = t.unread > 0 ? '<div class="imsg-thread-unread">' + t.unread + '</div>' : '';

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
                // Zero per-thread unread counter, then decrement global unreadTotal
                fns.get(fns.ref(db, 'users/' + myUid + '/threads/' + partnerUid + '/meta/unread')).then(function(s) {
                    var had = s.exists() ? (s.val() || 0) : 0;
                    if (!had) return;
                    var updates = {};
                    updates['users/' + myUid + '/threads/' + partnerUid + '/meta/unread'] = 0;
                    fns.update(fns.ref(db, '/'), updates).then(function() {
                        if (fns.runTransaction) {
                            fns.runTransaction(fns.ref(db, 'users/' + myUid + '/unreadTotal'), function(cur) {
                                return Math.max(0, (cur || 0) - had);
                            }).catch(function(){});
                        }
                    }).catch(function(){});
                }).catch(function(){});
            } catch(e) {}
        }

        function _loadInbox(uid) {
            // Unsubscribe previous listener
            if (_inboxUnsubscribe) { try { _inboxUnsubscribe(); } catch(e){} _inboxUnsubscribe = null; }

            var db  = window._fbDb;
            var fns = window._fbDbFns;
            if (!db || !fns || !fns.ref || !fns.onValue) return;

            // Subscribe to lightweight thread meta only — O(partners), not O(all messages)
            var threadsRef = fns.ref(db, 'users/' + uid + '/threads');
            _inboxUnsubscribe = fns.onValue(threadsRef, function(snap) {
                var threads = snap.exists() ? snap.val() : {};
                _renderInboxThreadsFromMeta(threads, uid);
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

            // Subscribe to per-thread messages — limitToLast(50) for efficient lazy load
            var threadMsgsRef = (fns.query && fns.limitToLast)
                ? fns.query(fns.ref(db, 'users/' + myUid + '/threads/' + uid + '/messages'), fns.limitToLast(50))
                : fns.ref(db, 'users/' + myUid + '/threads/' + uid + '/messages');
            _chatMsgUnsubscribe = fns.onValue(threadMsgsRef, function(snap) {
                var msgs = [];
                if (snap.exists()) {
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (m) msgs.push(m);
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

                // Write to per-thread path: users/{uid}/threads/{partnerUid}/messages/{key}
                // and update lightweight thread meta so _loadInbox never needs to scan messages.
                var newKey = fns.push(fns.ref(db, 'users/' + myUid + '/threads/' + _currentChatUid + '/messages')).key;
                var partnerName = _currentChatName || '';
                var metaBase = {
                    partnerName:  partnerName,
                    lastMessage:  base.message || '',
                    lastSentAt:   base.sentAt,
                    listingTitle: base.listingTitle || ''
                };
                var updates = {};
                // Messages — both sides share same key
                updates['users/' + myUid + '/threads/' + _currentChatUid + '/messages/' + newKey]          = base;
                updates['users/' + _currentChatUid + '/threads/' + myUid + '/messages/' + newKey]          = base;
                // Thread meta for sender (mark unread:0 since I sent it)
                updates['users/' + myUid + '/threads/' + _currentChatUid + '/meta'] = Object.assign({}, metaBase, { unread: 0 });
                // Thread meta fields for recipient (preserve unread counter via atomic increment below)
                updates['users/' + _currentChatUid + '/threads/' + myUid + '/meta/partnerName']  = myUsername;
                updates['users/' + _currentChatUid + '/threads/' + myUid + '/meta/lastMessage']  = base.message || '';
                updates['users/' + _currentChatUid + '/threads/' + myUid + '/meta/lastSentAt']   = base.sentAt;
                updates['users/' + _currentChatUid + '/threads/' + myUid + '/meta/listingTitle'] = base.listingTitle || '';
                fns.update(fns.ref(db, '/'), updates).then(function() {
                    // Atomically increment recipient unread counters
                    if (fns.runTransaction) {
                        fns.runTransaction(fns.ref(db, 'users/' + _currentChatUid + '/threads/' + myUid + '/meta/unread'), function(cur) {
                            return (cur || 0) + 1;
                        }).catch(function(){});
                        fns.runTransaction(fns.ref(db, 'users/' + _currentChatUid + '/unreadTotal'), function(cur) {
                            return (cur || 0) + 1;
                        }).catch(function(){});
                    } else {
                        // Fallback: non-atomic get+set
                        fns.get(fns.ref(db, 'users/' + _currentChatUid + '/threads/' + myUid + '/meta/unread')).then(function(s) {
                            var n = (s.exists() ? (s.val() || 0) : 0) + 1;
                            fns.set(fns.ref(db, 'users/' + _currentChatUid + '/threads/' + myUid + '/meta/unread'), n).catch(function(){});
                            fns.get(fns.ref(db, 'users/' + _currentChatUid + '/unreadTotal')).then(function(st) {
                                fns.set(fns.ref(db, 'users/' + _currentChatUid + '/unreadTotal'), (st.exists() ? (st.val() || 0) : 0) + 1).catch(function(){});
                            }).catch(function(){});
                        }).catch(function(){});
                    }
                }).catch(function(err) {
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

                // Scan per-thread messages for the deal, then update both copies
                fns.get(fns.ref(db, 'users/' + myUid + '/threads/' + _currentChatUid + '/messages')).then(function(snap) {
                    if (!snap || !snap.exists()) return;
                    snap.forEach(function(child) {
                        var m = child.val();
                        if (m && m.type === 'deal' && m.dealId === dealId) {
                            var key = child.key;
                            var updates = {};
                            updates['users/' + myUid + '/threads/' + _currentChatUid + '/messages/' + key + '/deal/status']         = newStatus;
                            updates['users/' + _currentChatUid + '/threads/' + myUid + '/messages/' + key + '/deal/status'] = newStatus;
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
    </script>
