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

// --- 1. THE VISION CHAT ENGINE (Upgraded: $0.35 Logic & Identity Sync) ---
const AI_PFP = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzVSbd57etdSJc7XQWpZLhwdMYyys0f-yfx-eN1g-BxNcy0ZLRVn-mjR3X&s=10";
const AI_NAME = "@NKIWANI AI V2";

function initChat(user) {
    const modal = document.getElementById('chatModal');
    const openBtn = document.getElementById('askAiBtn'); 
    const closeBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');

    // Sync User Identity to Modal Header instantly
    onValue(ref(db, `users/${user.uid}`), (snap) => {
        const data = snap.val();
        if(data) {
            if(document.getElementById('chatUsernameDisplay')) 
                document.getElementById('chatUsernameDisplay').innerText = (data.username || "User").toUpperCase();
            if(document.getElementById('chatUserPfp')) 
                document.getElementById('chatUserPfp').src = data.avatars || PFP_PLACEHOLDER;
        }
    });

    const toggleModal = (show) => {
        if (!modal) return;
        if (show) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        } else {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };

    if (openBtn) openBtn.onclick = () => toggleModal(true);
    if (closeBtn) closeBtn.onclick = () => toggleModal(false);

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            // 1. Precise Token Validation (Need 0.35 for full interaction)
            const userRef = ref(db, `users/${user.uid}`);
            const snap = await get(userRef);
            const currentTokens = snap.exists() ? (snap.val().tokens || 0) : 0;
            
            if (currentTokens < 0.35) {
                return notify("Neural link failed: 0.35 tokens required per interaction!", "error");
            }

            // 2. UI Update: User Message with Identity
            appendMessage('user', text);
            chatInput.value = '';
            window.chatHistory.push({ role: 'user', content: text });
            
            // 3. UI Update: AI Loading State
            const tempId = appendMessage('ai', 'Synchronizing with Neural Net...');

            try {
                // 4. API Call to backend
                const response = await fetch('/api/aichat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: window.chatHistory, 
                        uid: user.uid 
                    })
                });
                
                const data = await response.json();
                
                // 5. Deduct 0.35 (0.10 User Input + 0.25 AI Response)
                const newBalance = Number((currentTokens - 0.35).toFixed(2));
                await update(userRef, { tokens: newBalance });
                
                updateMessage(tempId, data.reply);
                window.chatHistory.push({ role: 'assistant', content: data.reply });
            } catch (err) { 
                updateMessage(tempId, "Connection to Vision Engine lost. Check your network."); 
            }
        });
    }

    function appendMessage(role, text) {
        if (!container) return;
        const id = 'msg-' + Date.now();
        const isAi = role === 'ai';
        
        // Dynamic Identity Selection
        const pfp = isAi ? AI_PFP : document.getElementById('chatUserPfp').src;
        const name = isAi ? AI_NAME : document.getElementById('chatUsernameDisplay').innerText;

        const html = `
            <div id="${id}" class="message-wrapper ${isAi ? 'ai-align' : 'user-align'}">
                <div style="display: flex; flex-direction: ${isAi ? 'row' : 'row-reverse'}; gap: 10px; align-items: flex-end; margin-bottom: 10px;">
                    <img src="${pfp}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid ${isAi ? 'var(--cyan)' : '#333'}; background: #000;">
                    <div class="${isAi ? 'ai-bubble' : 'user-bubble'}" style="max-width: 75%;">
                        <span style="font-size: 0.6rem; display: block; margin-bottom: 4px; color: ${isAi ? 'var(--cyan)' : '#888'}; font-weight: 800; letter-spacing: 0.5px;">${name}</span>
                        <p style="margin: 0; font-size: 0.85rem; line-height: 1.4;">${text}</p>
                    </div>
                </div>
            </div>`;
            
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        return id;
    }

    function updateMessage(id, text) {
        const el = document.getElementById(id);
        if (el) el.querySelector('p').innerText = text;
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
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

document.getElementById('openAuth').onclick = () => document.getElementById('modalOverlay').classList.add('active');
document.getElementById('userDisplay').onclick = () => document.getElementById('profileModal').classList.add('active');
document.getElementById('closeProfile').onclick = () => document.getElementById('profileModal').classList.remove('active');
document.getElementById('closeModalX').onclick = () => document.getElementById('modalOverlay').classList.remove('active');
// Global Hero Button Handler
document.addEventListener('click', (e) => {
    if (e.target.closest('#askAiBtn')) {
        if (auth.currentUser) {
            // User is logged in, initChat logic handles the modal
            // (The click will be caught by the listener inside initChat)
        } else {
            // User is guest, show login modal
            notify("Identity required for Neural Link", "error");
            document.getElementById('modalOverlay').classList.add('active');
        }
    }
});

