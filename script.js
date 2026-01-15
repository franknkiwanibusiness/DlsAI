import { auth, db } from './firebase-config.js';
import { notify } from './ui-utils.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get, update, increment, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global State
let isLoginMode = true;
window.chatHistory = [];
const PLAN_ID = 'P-9GX41892X09700340NFT6UOQ';
const PFP_PLACEHOLDER = "https://i.ytimg.com/vi/7p4LBOLGpFg/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAFu1lISn--VT-CrIS7Nc1LbUTy6Q";

// --- 1. THE VISION CHAT ENGINE (NKIWANI AI V2: Typing, Tiered Storage & Random Ads) ---
const AI_PFP = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzVSbd57etdSJc7XQWpZLhwdMYyys0f-yfx-eN1g-BxNcy0ZLRVn-mjR3X&s=10";
const AI_NAME = "@NKIWANI AI V2";

async function initChat(user) {
    const modal = document.getElementById('chatModal');
    const openBtn = document.getElementById('askAiBtn'); 
    const closeBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    
    let messageCounter = 0; 
    let isPremiumUser = false;

    // 1. IDENTITY & PREMIUM STATUS WATCHER
    onValue(ref(db, `users/${user.uid}`), (snap) => {
        const data = snap.val();
        if(data) {
            isPremiumUser = data.isPremium || false;
            if(document.getElementById('chatUsernameDisplay')) 
                document.getElementById('chatUsernameDisplay').innerText = (data.username || "User").toUpperCase();
            if(document.getElementById('chatUserPfp')) 
                document.getElementById('chatUserPfp').src = data.avatars || PFP_PLACEHOLDER;
            
            const statusText = document.querySelector('.header-left p');
            if(statusText) statusText.innerText = "NKIWANI ENGINE V2 ACTIVE";
        }
    });

    // 2. LOAD HISTORY
    const loadHistory = async () => {
        container.innerHTML = '<p style="text-align:center; color:#444; font-size:0.7rem; padding:20px; letter-spacing:1px;">INITIALIZING NKIWANI V2 ENGINE...</p>';
        let savedHistory = [];
        const localData = localStorage.getItem(`chat_cache_${user.uid}`);
        
        if (isPremiumUser) {
            const cloudSnap = await get(ref(db, `chats/${user.uid}`));
            if (cloudSnap.exists()) savedHistory = cloudSnap.val();
            else if (localData) savedHistory = JSON.parse(localData);
        } else if (localData) {
            savedHistory = JSON.parse(localData);
        }

        container.innerHTML = ''; 
        window.chatHistory = savedHistory;
        savedHistory.forEach(msg => appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content, true));
    };

    const toggleModal = (show) => {
        if (!modal) return;
        if (show) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            if (container.children.length === 0) loadHistory();
        } else {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };

    if (openBtn) openBtn.onclick = () => toggleModal(true);
    if (closeBtn) closeBtn.onclick = () => toggleModal(false);

    // 3. RANDOM AD INJECTION (Firebase /ads Source)
    async function injectAd() {
        try {
            const adsRef = ref(db, 'ads');
            const snap = await get(adsRef);
            
            if (snap.exists()) {
                const adsData = snap.val();
                // Handle both array and object formats from Firebase
                const adsList = Object.values(adsData); 
                const randomAd = adsList[Math.floor(Math.random() * adsList.length)];

                const adHtml = `
                    <div class="chat-ad-inline" style="margin: 20px 0; width: 100%; animation: slideUp 0.4s ease; transform-origin: bottom;">
                        <p style="font-size: 0.5rem; color: #555; margin-bottom: 6px; text-align: left; letter-spacing: 1px; font-weight: 800; text-transform: uppercase;">Engine Sponsor</p>
                        <div style="aspect-ratio: 16/9; width: 100%; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1a; position: relative; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                            <img src="${randomAd.image}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, #000000ee, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px;">
                                 <a href="${randomAd.url}" target="_blank" style="display: block; width: 100%; padding: 12px; background: #fff; color: #000; text-align: center; border-radius: 12px; font-weight: 900; font-size: 0.75rem; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Visit Site</a>
                            </div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', adHtml);
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        } catch (e) { console.error("Ad Engine Sync Error", e); }
    }

    // 4. SEND MESSAGE LOGIC
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            const userRef = ref(db, `users/${user.uid}`);
            const snap = await get(userRef);
            const currentTokens = snap.exists() ? (snap.val().tokens || 0) : 0;
            
            if (currentTokens < 0.35) return notify("Inadequate Credits for NKIWANI V2 Analysis", "error");

            appendMessage('user', text);
            chatInput.value = '';
            window.chatHistory.push({ role: 'user', content: text });
            messageCounter++;

            const tempId = appendMessage('ai', 'STARTING NKIWANI AI V2...');

            try {
                const response = await fetch('/api/aichat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: window.chatHistory, uid: user.uid })
                });
                
                const data = await response.json();
                await update(userRef, { tokens: Number((currentTokens - 0.35).toFixed(2)) });
                
                updateMessage(tempId, data.reply);
                window.chatHistory.push({ role: 'assistant', content: data.reply });
                messageCounter++;

                // Ad Logic: Trigger roughly every 2-3 individual messages
                if (messageCounter % 3 === 0) {
                    await injectAd();
                }

                // Tiered Storage
                localStorage.setItem(`chat_cache_${user.uid}`, JSON.stringify(window.chatHistory));
                if (isPremiumUser) await set(ref(db, `chats/${user.uid}`), window.chatHistory);

            } catch (err) { 
                updateMessage(tempId, "Engine Error: Communication lost."); 
            }
        });
    }

    function appendMessage(role, text, isInitialLoad = false) {
        if (!container) return;
        const id = 'msg-' + Date.now();
        const isAi = role === 'ai' || role === 'assistant';
        const pfp = isAi ? AI_PFP : document.getElementById('chatUserPfp').src;
        const name = isAi ? AI_NAME : document.getElementById('chatUsernameDisplay').innerText;

        const html = `
            <div id="${id}" class="message-wrapper ${isAi ? 'ai-align' : 'user-align'}">
                <div style="display: flex; flex-direction: ${isAi ? 'row' : 'row-reverse'}; gap: 10px; align-items: flex-end; margin-bottom: 15px;">
                    <img src="${pfp}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid ${isAi ? '#00ffff' : '#333'};">
                    <div class="${isAi ? 'ai-bubble' : 'user-bubble'}" style="max-width: 75%;">
                        <span style="font-size: 0.6rem; display: block; margin-bottom: 4px; color: ${isAi ? '#00ffff' : '#888'}; font-weight: 800;">${name}</span>
                        <p style="margin: 0; font-size: 0.85rem; line-height: 1.4; color: #fff;"></p>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
        
        const pTag = document.getElementById(id).querySelector('p');
        if (isInitialLoad || !isAi) {
            pTag.innerText = text;
            container.scrollTop = container.scrollHeight;
        }
        return id;
    }

    function updateMessage(id, text) {
        const el = document.getElementById(id);
        if (!el) return;
        const p = el.querySelector('p');
        p.innerText = '';
        let i = 0;
        const typeEffect = () => {
            if (i < text.length) {
                p.innerText += text.charAt(i);
                i++;
                setTimeout(typeEffect, 12);
                container.scrollTop = container.scrollHeight;
            }
        };
        typeEffect();
    }
}


// --- 2. REFILL, SUBSCRIPTION & UTILS ---
window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => notify("Link copied!"));
};

window.openRefillModal = () => {
    const modal = document.getElementById('refillModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
};

const closeRefill = document.getElementById('closeRefill');
if (closeRefill) {
    closeRefill.onclick = () => {
        const modal = document.getElementById('refillModal');
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };
}

// Handler for One-Time Token Purchases
window.selectPack = (qty) => {
    const pricing = { 100: 1.10, 500: 3.00, 1000: 5.00 };
    const base = pricing[qty];
    // PayPal requires the value to be a string formatted to 2 decimal places
    const finalAmount = ((base + 0.30) / (1 - 0.044)).toFixed(2).toString();
    
    const container = document.getElementById('paypal-tokens-container');
    
    if (container) {
        // Clear previous button instance to prevent "Duplicate Render" error
        container.innerHTML = ''; 
    }

    paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical' },
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{ 
                    description: `${qty} Tokens Pack`, 
                    amount: { 
                        currency_code: "USD", 
                        value: finalAmount 
                    } 
                }]
            });
        },
        onApprove: async (data, actions) => {
            await actions.order.capture();
            // Direct update for one-time tokens using variables from your main script
            await update(ref(db, `users/${auth.currentUser.uid}`), { 
                tokens: increment(qty) 
            });
            notify(`Success! ${qty} tokens added.`);
            
            const closeBtn = document.getElementById('closeRefill');
            if (closeBtn) closeBtn.click();
        },
        onError: (err) => {
            console.error("PayPal Render Error:", err);
        }
    }).render('#paypal-tokens-container');
};

// Handler for Monthly Premium Subscriptions
function initPaypalSystems(user) {
    const subContainer = document.getElementById(`paypal-button-container-${PLAN_ID}`);
    
    // Safety check: only render if container exists and is empty
    if (subContainer && !subContainer.hasChildNodes()) {
        paypal.Buttons({
            style: { 
                shape: 'pill', 
                color: 'gold', 
                layout: 'vertical', 
                label: 'subscribe' 
            },
            createSubscription: (data, actions) => {
                return actions.subscription.create({
                    plan_id: PLAN_ID,
                    // IMPORTANT: This passes the User UID to your Vercel Webhook
                    custom_id: user.uid 
                });
            },
            onApprove: async (data) => {
                // The Vercel Webhook handles the database upgrade (isPremium: true)
                // We just show a pending message to the user
                notify("Payment success! Syncing Premium status...", "success");
                console.log("Subscription ID:", data.subscriptionID);
            },
            onError: (err) => {
                console.error("PayPal Error:", err);
                notify("Payment Engine Error. Please retry.", "error");
            }
        }).render(subContainer);
    }
}
// --- 3. DATA WATCHER (LINKS & COUNTDOWN) ---
let isClaiming = false; // Prevents loops

function syncUserUI(uid) {
    // A. Profile & Premium Status Watcher
    onValue(ref(db, `users/${uid}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const now = Date.now();

            // 1. PREMIUM EXPIRATION SAFETY CHECK
            if (data.isPremium && data.premiumUntil && now > data.premiumUntil) {
                update(ref(db, `users/${uid}`), { 
                    isPremium: false, 
                    tier: 'Free' 
                });
                return; 
            }

            const pfp = data.avatars || PFP_PLACEHOLDER; 
            
            // 2. HEADER & PROFILE UI UPDATES
            document.getElementById('headerUsername').innerText = data.username || "User";
            document.getElementById('tokenBalance').innerText = data.tokens || 0;
            document.getElementById('headerAvatar').src = pfp;
            document.getElementById('modalFullUser').innerText = "@" + (data.username || "user");
            document.getElementById('modalLargeAvatar').src = pfp;

            // 3. TIER INDICATOR BADGE
            const tierEl = document.getElementById('accountTier');
            if(tierEl) {
                tierEl.innerHTML = `<span style="background:${data.isPremium ? '#d4af37':'#222'}; color:${data.isPremium ? '#000':'#888'}; font-size:0.6rem; padding:2px 8px; border-radius:4px; font-weight:800; letter-spacing:1px;">${data.isPremium ? 'PREMIUM':'FREE'}</span>`;
            }

            // 4. USAGE BAR LOGIC
            const limit = data.isPremium ? 250 : 25; 
            document.getElementById('usageText').innerText = `${data.tokens || 0} / ${limit}`;
            document.getElementById('usageBar').style.width = `${Math.min(((data.tokens || 0) / limit) * 100, 100)}%`;

            // 5. NEW SAFE DAILY REFILL LOGIC (Top-up Only)
            const oneDay = 24 * 60 * 60 * 1000;
            const lastClaim = data.lastDailyClaim || 0;

            if (!isClaiming && (now - lastClaim >= oneDay)) {
                isClaiming = true; 
                const currentTokens = data.tokens || 0;
                const dailyAllowance = data.isPremium ? 250 : 25;

                // Scenario: User has less than their daily allowance -> Top them up to the limit
                if (currentTokens < dailyAllowance) {
                    update(ref(db, `users/${uid}`), {
                        tokens: dailyAllowance, 
                        lastDailyClaim: now
                    }).then(() => {
                        notify(`DLSVALE: Daily Engine Refill Active (${dailyAllowance} Tokens)`);
                        isClaiming = false;
                    }).catch(() => { isClaiming = false; });
                } 
                // Scenario: User has "Extra" tokens (Paid) -> Just reset the 24h timer, don't touch tokens
                else {
                    update(ref(db, `users/${uid}`), {
                        lastDailyClaim: now
                    }).then(() => {
                        // Silent update, no need to notify as they kept their higher balance
                        isClaiming = false;
                    }).catch(() => { isClaiming = false; });
                }
            }
        }
    });

    // B. WATCH LINKS & COUNTDOWN (Remains unchanged)
    onValue(ref(db, `links/${uid}`), (snapshot) => {
        const container = document.getElementById('linksContainer');
        if (!container) return;
        container.innerHTML = '';
        
        const links = snapshot.val();
        if (!links) {
            container.innerHTML = '<p style="text-align:center; color:#444; font-size:0.7rem;">No active links</p>';
            return;
        }

        Object.entries(links).forEach(([key, link]) => {
            const linkId = `timer-${key}`;
            const html = `
                <div class="link-card" style="background:#1a1a1a; padding:15px; border-radius:15px; margin-bottom:10px; border:1px solid #333;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="color:#fff; font-weight:800; font-size:0.8rem;">${link.title || 'Vision Link'}</span>
                        <span id="${linkId}" style="color:#d4af37; font-size:0.65rem; font-family:monospace; font-weight:bold;">--:--</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button onclick="window.copyToClipboard('${link.url}')" style="background:#222; color:#fff; border:none; padding:8px; border-radius:8px; font-size:0.6rem; font-weight:800; cursor:pointer;">COPY</button>
                        <a href="${link.url}" target="_blank" style="background:#d4af37; color:#000; text-align:center; text-decoration:none; padding:8px; border-radius:8px; font-size:0.6rem; font-weight:800;">OPEN</a>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);

            const countdownInterval = setInterval(() => {
                const now = new Date().getTime();
                const distance = link.expiresAt - now;
                const el = document.getElementById(linkId);
                
                if (!el) {
                    clearInterval(countdownInterval);
                    return;
                }

                if (distance < 0) {
                    el.innerText = "EXPIRED";
                    el.style.color = "#ff4444";
                    clearInterval(countdownInterval);
                } else {
                    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((distance % (1000 * 60)) / 1000);
                    el.innerText = `${h}h ${m}m ${s}s`;
                }
            }, 1000);
        });
    });
}


// --- 4. AUTH & OBSERVER ---

// A. Fingerprint Engine: Mixes hardware specs into a unique ID
const getDeviceID = () => {
    const traits = [
        navigator.userAgent,
        screen.width + "x" + screen.height,
        navigator.language,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || '4'
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < traits.length; i++) {
        hash = ((hash << 5) - hash) + traits.charCodeAt(i);
        hash |= 0;
    }
    return "NKI-" + Math.abs(hash);
};

// B. Auth State Observer
onAuthStateChanged(auth, (user) => {
    const userDisplay = document.getElementById('userDisplay');
    const openAuth = document.getElementById('openAuth');
    if (user) {
        if (openAuth) openAuth.style.display = 'none';
        if (userDisplay) userDisplay.style.display = 'flex';
        syncUserUI(user.uid);
        initChat(user);
        initPaypalSystems(user);
    } else {
        if (openAuth) openAuth.style.display = 'block';
        if (userDisplay) userDisplay.style.display = 'none';
    }
    if (document.getElementById('main-loader')) document.getElementById('main-loader').style.display = 'none';
});

// C. Auth Submission with Shadow Token Logic
const mainSubmitBtn = document.getElementById('mainSubmitBtn');
if (mainSubmitBtn) {
    mainSubmitBtn.onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        const deviceID = getDeviceID(); 

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                const deviceRef = ref(db, 'registered_devices/' + deviceID);
                const deviceSnap = await get(deviceRef);
                
                let startingTokens = 50;
                let isCheatAttempt = false;

                if (deviceSnap.exists()) {
                    startingTokens = 0; 
                    isCheatAttempt = true;
                }

                const avatar = document.querySelector('input[name="pfp"]:checked')?.value || PFP_PLACEHOLDER;
                const username = document.getElementById('regUsername').value;
                const now = Date.now(); // Create timestamp for refill timer
                
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                
                // Save User Profile with lastDailyClaim included
                await set(ref(db, 'users/' + res.user.uid), { 
                    username: username, 
                    avatars: avatar, 
                    tokens: startingTokens, 
                    isPremium: false,
                    fingerprint: deviceID,
                    lastDailyClaim: now // Starts the 24h clock for the refill
                });

                if (!isCheatAttempt) {
                    await set(deviceRef, { claimedBy: res.user.uid, timestamp: now });
                } else {
                    const secModal = document.getElementById('securityModal');
                    if(secModal) {
                        secModal.style.display = 'flex';
                        setTimeout(() => secModal.classList.add('active'), 10);
                        if(typeof toggleScroll === 'function') toggleScroll(true);
                    }
                }
            }
            document.getElementById('modalOverlay').classList.remove('active');
            if(typeof toggleScroll === 'function') toggleScroll(false);
        } catch (err) { 
            notify(err.message, "error"); 
        }
    };
}

// D. Logout & Security Modal Close
if(document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').onclick = () => signOut(auth).then(() => { location.reload(); });
}

const closeSecurity = document.getElementById('closeSecurity');
if (closeSecurity) {
    closeSecurity.onclick = () => {
        const secModal = document.getElementById('securityModal');
        secModal.classList.remove('active');
        setTimeout(() => { 
            secModal.style.display = 'none'; 
            if(typeof toggleScroll === 'function') toggleScroll(false);
        }, 300);
    };
}


// --- 5. MODAL TOGGLES ---
const switchBtn = document.getElementById('switchAuth');
if(switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
        document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
        switchBtn.innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
    };
}
// --- 1. MODAL & AUTH BUTTON HANDLERS ---
document.getElementById('openAuth').onclick = () => document.getElementById('modalOverlay').classList.add('active');
document.getElementById('userDisplay').onclick = () => document.getElementById('profileModal').classList.add('active');
document.getElementById('closeProfile').onclick = () => document.getElementById('profileModal').classList.remove('active');
document.getElementById('closeModalX').onclick = () => document.getElementById('modalOverlay').classList.remove('active');

// Global Hero Button Handler
document.addEventListener('click', (e) => {
    if (e.target.closest('#askAiBtn')) {
        if (!auth.currentUser) {
            notify("Identity required for Neural Link", "error");
            document.getElementById('modalOverlay').classList.add('active');
        }
    }
}); 

// --- SQUAD SCANNER SYSTEM V2 (2026 - STABLE) ---

// 1. GLOBAL SCANNER STATE
var currentScanFile = null;
var scannerTimer = null;

// Use 'const' only if not defined elsewhere; otherwise, the browser will error.
// These variables now match your HTML IDs perfectly.
const scanBtn = document.getElementById('uploadSquadBtn');
const scanModal = document.getElementById('scanPreviewModal');
const scanPreview = document.getElementById('previewImg');
const scanCancel = document.getElementById('cancelScan');
const scanConfirm = document.getElementById('confirmScan');
const scanRetry = document.getElementById('retryContainer'); 
const scanBox = document.getElementById('scanActions');       
const scanStatusContainer = document.getElementById('scanStatusContainer');
const statusText = document.getElementById('liveStatusText');

// --- 2. UI UTILITIES ---

// Result Popup with Typewriter Effect
window.openVisionChat = (reportText) => {
    const modal = document.createElement('div');
    modal.className = 'scan-result-modal active';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:10001;padding:20px;`;
    
    modal.innerHTML = `
        <div style="background:#0a0c10; border:1px solid #00ffff; border-radius:15px; width:100%; max-width:500px; padding:25px; box-shadow:0 0 30px rgba(0,255,255,0.2);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <span style="color:#00ffff; font-weight:900; letter-spacing:2px; font-size:0.8rem;">NEURAL DEBRIEF</span>
                <div style="flex:1; height:1px; background:linear-gradient(90deg, #00ffff, transparent);"></div>
            </div>
            <div id="typewriterText" style="color:#fff; font-family:monospace; font-size:0.9rem; line-height:1.6; height:300px; overflow-y:auto; white-space:pre-wrap;"></div>
            <button id="closeResultBtn" style="width:100%; margin-top:20px; padding:12px; background:#fff; border:none; color:#000; border-radius:8px; cursor:pointer; font-weight:800; transition:0.3s; width:100%;">DISMISS</button>
        </div>`;
        
    document.body.appendChild(modal);
    const container = document.getElementById('typewriterText');
    let i = 0;
    const type = () => {
        if (i < reportText.length) {
            container.innerHTML += reportText.charAt(i);
            i++;
            container.scrollTop = container.scrollHeight;
            setTimeout(type, 10);
        }
    };
    type();
    document.getElementById('closeResultBtn').onclick = () => modal.remove();
};

// Reset Scanner to Default State
const resetScannerUI = () => {
    if(scanModal) scanModal.classList.remove('active');
    if (scannerTimer) clearInterval(scannerTimer);
    
    if(scanConfirm) {
        scanConfirm.classList.remove('loading');
        scanConfirm.disabled = false;
    }
    
    if(scanBox) scanBox.style.display = 'flex';
    if(scanRetry) scanRetry.style.display = 'none';
    if(scanStatusContainer) scanStatusContainer.style.display = 'none';
    
    if(statusText) {
        statusText.innerText = "";
        statusText.style.color = "#00ffff"; 
    }
    
    if(scanPreview) scanPreview.src = "";
    currentScanFile = null;
};

// --- 3. EVENT LISTENERS ---

// File selection and preview
if (scanBtn) {
    scanBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            currentScanFile = e.target.files[0];
            if (!currentScanFile) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                scanPreview.src = event.target.result;
                scanModal.classList.add('active'); 
            };
            reader.readAsDataURL(currentScanFile);
        };
        input.click();
    };
}

if (scanCancel) scanCancel.onclick = resetScannerUI;

if (scanModal) {
    scanModal.onclick = (e) => { if (e.target === scanModal) resetScannerUI(); };
}

if (scanRetry) {
    scanRetry.onclick = () => {
        if(scanBox) scanBox.style.display = 'flex';
        scanRetry.style.display = 'none';
        scanConfirm.click(); 
    };
}

// --- 4. CORE SCAN LOGIC ---

if (scanConfirm) {
    scanConfirm.onclick = async () => {
        if (!currentScanFile) return;

        // Identity & Token Check (Firebase logic)
        if (typeof auth !== 'undefined' && auth.currentUser) {
            const userRef = ref(db, `users/${auth.currentUser.uid}`);
            const snap = await get(userRef);
            const tokens = snap.exists() ? snap.val().tokens : 0;
            if (tokens < 0.50) return notify("Insufficient Tokens (0.50 Required)", "error");
        } else {
            return notify("Identity Link Required", "error");
        }
        
        scanConfirm.classList.add('loading');
        scanConfirm.disabled = true;
        if(scanStatusContainer) scanStatusContainer.style.display = 'block';

        const updates = [
            "Initializing Llama-4 Scout...",
            "Scanning Squad Screenshot...",
            "Extracting Player Data...",
            "Compiling Strategic Advice..."
        ];
        
        let step = 0;
        scannerTimer = setInterval(() => {
            if (step < updates.length && statusText) {
                statusText.innerText = "> " + updates[step];
                step++;
            }
        }, 900);

        const reader = new FileReader();
        reader.readAsDataURL(currentScanFile);
        reader.onload = async () => {
            try {
                // Pointing to your updated Vercel API
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        image: reader.result, 
                        uid: auth.currentUser.uid 
                    })
                });

                if (!response.ok) {
                    const errorMsg = await response.json();
                    throw new Error(errorMsg.details || "SYSTEM_OVERLOAD");
                }

                const result = await response.json();
                const report = result.analysis || result.report;
                
                if (report) {
                    // Success: Deduct credits and show report
                    await update(ref(db, `users/${auth.currentUser.uid}`), { 
                        tokens: increment(-0.50) 
                    });
                    resetScannerUI();
                    window.openVisionChat(report); 
                } else {
                    throw new Error("EMPTY_RESPONSE");
                }
            } catch (err) {
                if (scannerTimer) clearInterval(scannerTimer);
                if (statusText) {
                    statusText.style.color = "#ff4444"; 
                    statusText.innerText = "!! ENGINE ERROR: " + err.message.toUpperCase();
                }
                if(scanBox) scanBox.style.display = 'none';
                if(scanRetry) scanRetry.style.display = 'block';
                scanConfirm.classList.remove('loading');
                scanConfirm.disabled = false;
            }
        };
    };
}

