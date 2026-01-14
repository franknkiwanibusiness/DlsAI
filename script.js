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
const PLAN_ID = 'P-47S21200XM2944742NFPLPEA';
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

window.selectPack = (qty) => {
    const pricing = { 100: 1.10, 500: 3.00, 1000: 5.00 };
    const base = pricing[qty];
    const finalAmount = ((base + 0.30) / (1 - 0.044)).toFixed(2);
    const container = document.getElementById('paypal-tokens-container');
    if(container) container.innerHTML = '';

    paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical' },
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{ description: `${qty} Tokens Pack`, amount: { currency_code: "USD", value: finalAmount } }]
            });
        },
        onApprove: async (data, actions) => {
            await actions.order.capture();
            await update(ref(db, `users/${auth.currentUser.uid}`), { tokens: increment(qty) });
            notify(`Success! ${qty} tokens added.`);
            document.getElementById('closeRefill').click();
        }
    }).render('#paypal-tokens-container');
};

function initPaypalSystems(user) {
    const subContainer = document.getElementById(`paypal-button-container-${PLAN_ID}`);
    if (subContainer && !subContainer.hasChildNodes()) {
        paypal.Buttons({
            style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' },
            createSubscription: (data, actions) => actions.subscription.create({ plan_id: PLAN_ID, custom_id: user.uid }),
            onApprove: async () => {
                await update(ref(db, `users/${user.uid}`), { isPremium: true, tokens: increment(250), tier: 'Premium' });
                notify("Premium Activated!");
            }
        }).render(subContainer);
    }
}

// --- 3. DATA WATCHER (LINKS & COUNTDOWN) ---
function syncUserUI(uid) {
    // Watch Profile Data
    onValue(ref(db, `users/${uid}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const pfp = data.avatars || PFP_PLACEHOLDER; 
            document.getElementById('headerUsername').innerText = data.username || "User";
            document.getElementById('tokenBalance').innerText = data.tokens || 0;
            document.getElementById('modalFullUser').innerText = "@" + (data.username || "user");
            document.getElementById('headerAvatar').src = pfp;
            document.getElementById('modalLargeAvatar').src = pfp;
            const limit = data.isPremium ? 250 : 50;
            document.getElementById('usageText').innerText = `${data.tokens || 0} / ${limit}`;
            document.getElementById('usageBar').style.width = `${Math.min(((data.tokens || 0) / limit) * 100, 100)}%`;
            const tierEl = document.getElementById('accountTier');
            if(tierEl) tierEl.innerHTML = `<span style="background:${data.isPremium ? '#d4af37':'#222'}; color:${data.isPremium ? '#000':'#888'}; font-size:0.6rem; padding:2px 8px; border-radius:4px; font-weight:800;">${data.isPremium ? 'PREMIUM':'FREE'}</span>`;
        }
    });

    // Watch Links & Countdown
    onValue(ref(db, `links/${uid}`), (snapshot) => {
        const container = document.getElementById('linksContainer');
        if (!container) return;
        container.innerHTML = '';
        const links = snapshot.val();
        if (!links) return container.innerHTML = '<p style="text-align:center; color:#444; font-size:0.7rem;">No active links</p>';

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

            // Start Countdown Timer
            const countdownInterval = setInterval(() => {
                const now = new Date().getTime();
                const distance = link.expiresAt - now;
                const el = document.getElementById(linkId);
                if (!el) return clearInterval(countdownInterval);

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

const mainSubmitBtn = document.getElementById('mainSubmitBtn');
if (mainSubmitBtn) {
    mainSubmitBtn.onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                const avatar = document.querySelector('input[name="pfp"]:checked')?.value || PFP_PLACEHOLDER;
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await set(ref(db, 'users/' + res.user.uid), { username: document.getElementById('regUsername').value, avatars: avatar, tokens: 50, isPremium: false });
            }
            document.getElementById('modalOverlay').classList.remove('active');
        } catch (err) { notify(err.message, "error"); }
    };
}

if(document.getElementById('logoutBtn')) document.getElementById('logoutBtn').onclick = () => signOut(auth).then(() => { location.reload(); });
// --- 5. MODAL TOGGLES & GLOBAL SCROLL LOCK ---

// 1. Master Scroll Lock Function
const toggleScrollLock = (isLocked) => {
    if (isLocked) {
        if (document.body.classList.contains('modal-open')) return;
        const scrollY = window.scrollY;
        document.body.style.top = `-${scrollY}px`;
        document.body.classList.add('modal-open');
    } else {
        if (!document.body.classList.contains('modal-open')) return;
        const scrollY = document.body.style.top;
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
};

// 2. Global Modal Observer 
// Watches for any modal being opened/closed across the entire app
const modalObserver = new MutationObserver(() => {
    const activeSelectors = [
        '.modal-overlay.active', 
        '.profile-modal.active', 
        '.vision-modal-fs.active', 
        '#refillModal.active',
        '#chatModal.active',
        '.preview-modal[style*="flex"]',
        '.preview-modal[style*="block"]'
    ];
    const isAnyActive = document.querySelector(activeSelectors.join(','));
    toggleScrollLock(!!isAnyActive);
});

// Initialize observer on body
if (document.body) {
    modalObserver.observe(document.body, { 
        attributes: true, 
        subtree: true, 
        attributeFilter: ['class', 'style'] 
    });
}

// 3. Auth UI Setup
const switchBtn = document.getElementById('switchAuth');
const mainSubmitBtn = document.getElementById('mainSubmitBtn');
const regFields = document.getElementById('regFields');
const modalTitle = document.getElementById('modalTitle');

// Force Login state on script load to prevent glitches
if (regFields) regFields.style.display = 'none';
isLoginMode = true; 

if(switchBtn) {
    switchBtn.onclick = (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        if (regFields) regFields.style.display = isLoginMode ? 'none' : 'block';
        if (modalTitle) modalTitle.innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
        if (mainSubmitBtn) mainSubmitBtn.innerText = isLoginMode ? 'Login' : 'Register';
        
        // Update helper text around the switch link
        const parentPara = switchBtn.closest('.toggle-text');
        if (parentPara) {
            parentPara.innerHTML = isLoginMode ? 
                `Need an account? <span id="switchAuth" style="color:#00ffff; text-decoration:underline; cursor:pointer;">Register</span>` : 
                `Have an account? <span id="switchAuth" style="color:#00ffff; text-decoration:underline; cursor:pointer;">Login</span>`;
            // Re-bind the click event because we replaced the innerHTML
            const newSwitchBtn = document.getElementById('switchAuth');
            if(newSwitchBtn) newSwitchBtn.onclick = switchBtn.onclick;
        }
    };
}

// 4. Modal Open/Close Event Handlers
const openAuth = document.getElementById('openAuth');
if (openAuth) {
    openAuth.onclick = () => {
        if (!isLoginMode && switchBtn) switchBtn.click(); 
        document.getElementById('modalOverlay').classList.add('active');
    };
}

const userDisplay = document.getElementById('userDisplay');
if (userDisplay) {
    userDisplay.onclick = () => document.getElementById('profileModal').classList.add('active');
}

const closeProfile = document.getElementById('closeProfile');
if (closeProfile) {
    closeProfile.onclick = () => document.getElementById('profileModal').classList.remove('active');
}

const closeModalX = document.getElementById('closeModalX');
if (closeModalX) {
    closeModalX.onclick = () => document.getElementById('modalOverlay').classList.remove('active');
}

// 5. Global Hero Button Handler
document.addEventListener('click', (e) => {
    const aiBtn = e.target.closest('#askAiBtn');
    if (aiBtn) {
        if (!auth.currentUser) {
            notify("Identity required for Neural Link", "error");
            document.getElementById('modalOverlay').classList.add('active');
            if (!isLoginMode && switchBtn) switchBtn.click();
        } else {
            // Logic for opening Chat Modal when logged in
            const chatModal = document.getElementById('chatModal');
            if (chatModal) {
                chatModal.style.display = 'flex';
                setTimeout(() => chatModal.classList.add('active'), 10);
            }
        }
    }
});

