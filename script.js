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

// --- 1. THE VISION CHAT ENGINE ---
function initChat(user) {
    const modal = document.getElementById('chatModal');
    const openBtn = document.getElementById('askAiBtn'); 
    const closeBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    
    const fileInput = document.getElementById('fileInput');
    const uploadTrigger = document.getElementById('uploadBtn');

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

    if (uploadTrigger && fileInput) {
        uploadTrigger.onclick = (e) => { e.preventDefault(); fileInput.click(); };
    }

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            const userRef = ref(db, `users/${user.uid}`);
            const snap = await get(userRef);
            if (snap.exists() && snap.val().tokens <= 0) {
                return notify("Out of tokens! Upgrade to Premium.", "error");
            }

            appendMessage('user', text);
            chatInput.value = '';
            window.chatHistory.push({ role: 'user', content: text });

            const tempId = appendMessage('ai', 'Processing...');

            try {
                const response = await fetch('/api/aichat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: window.chatHistory, uid: user.uid })
                });
                const data = await response.json();
                
                await update(userRef, { tokens: increment(-1) });
                updateMessage(tempId, data.reply);
                window.chatHistory.push({ role: 'assistant', content: data.reply });
            } catch (err) {
                updateMessage(tempId, "Connection lost. Vision Engine offline.");
            }
        });
    }

    function appendMessage(role, text) {
        if (!container) return;
        const id = 'msg-' + Date.now();
        const wrapperClass = role === 'ai' ? 'message-wrapper ai-align' : 'message-wrapper user-align';
        const bubbleClass = role === 'ai' ? 'ai-bubble' : 'user-bubble';
        const html = `<div id="${id}" class="${wrapperClass}"><div class="${bubbleClass}"><p>${text}</p></div></div>`;
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

// --- 2. REFILL & SUBSCRIPTION LOGIC ---
window.openRefillModal = () => {
    const modal = document.getElementById('refillModal');
    if (modal) modal.classList.remove('hidden');
};

const closeRefill = document.getElementById('closeRefill');
if (closeRefill) {
    closeRefill.onclick = () => {
        document.getElementById('refillModal').classList.add('hidden');
        const payBox = document.getElementById('paypal-tokens-container');
        if (payBox) payBox.innerHTML = '<p class="text-zinc-500 text-[10px] text-center italic">Select a pack above to pay</p>';
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
                purchase_units: [{ description: `${qty} Tokens`, amount: { currency_code: "USD", value: finalAmount } }]
            });
        },
        onApprove: async (data, actions) => {
            await actions.order.capture();
            await update(ref(db, `users/${auth.currentUser.uid}`), { tokens: increment(qty) });
            notify(`Success! ${qty} tokens added.`);
            document.getElementById('refillModal').classList.add('hidden');
        }
    }).render('#paypal-tokens-container');
};

function initPaypalSystems(user) {
    const subContainer = document.getElementById(`paypal-button-container-${PLAN_ID}`);
    if (subContainer && !subContainer.hasChildNodes()) {
        paypal.Buttons({
            style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' },
            createSubscription: (data, actions) => {
                return actions.subscription.create({ plan_id: PLAN_ID, custom_id: user.uid });
            },
            onApprove: async (data) => {
                await update(ref(db, `users/${user.uid}`), { isPremium: true, tokens: increment(250), tier: 'Premium' });
                notify("Premium Activated!");
            }
        }).render(subContainer);
    }
}

// --- 3. DATA WATCHER & UI SYNC ---
function syncUserUI(uid) {
    onValue(ref(db, `users/${uid}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const pfp = data.avatars || PFP_PLACEHOLDER; 
            
            document.getElementById('headerUsername').innerText = data.username || "User";
            document.getElementById('tokenBalance').innerText = data.tokens || 0;
            document.getElementById('modalFullUser').innerText = "@" + (data.username || "user");
            
            document.getElementById('headerAvatar').src = pfp;
            document.getElementById('modalLargeAvatar').src = pfp;

            const tokens = data.tokens || 0;
            const limit = data.isPremium ? 250 : 50;
            document.getElementById('usageText').innerText = `${tokens} / ${limit}`;
            document.getElementById('usageBar').style.width = `${Math.min((tokens / limit) * 100, 100)}%`;
            
            const tierEl = document.getElementById('accountTier');
            if(tierEl) {
                tierEl.innerHTML = `<span style="background:${data.isPremium ? '#d4af37':'#222'}; color:${data.isPremium ? '#000':'#888'}; font-size:0.6rem; padding:2px 8px; border-radius:4px; font-weight:800;">${data.isPremium ? 'PREMIUM':'FREE'}</span>`;
            }
        }
    });
}

// --- 4. AUTH HANDLERS ---
const mainSubmitBtn = document.getElementById('mainSubmitBtn');
if (mainSubmitBtn) {
    mainSubmitBtn.onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        const usernameInput = document.getElementById('regUsername');

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                const avatarRadio = document.querySelector('input[name="pfp"]:checked');
                const avatarUrl = avatarRadio ? avatarRadio.value : PFP_PLACEHOLDER;
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await set(ref(db, 'users/' + res.user.uid), {
                    username: usernameInput.value,
                    avatars: avatarUrl, 
                    tokens: 50,
                    isPremium: false,
                    tier: 'Free'
                });
            }
            document.getElementById('modalOverlay').classList.remove('active');
        } catch (err) { notify(err.message, "error"); }
    };
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await signOut(auth);
        document.getElementById('profileModal').classList.remove('active');
        notify("Logged out");
    };
}

onAuthStateChanged(auth, (user) => {
    const openAuth = document.getElementById('openAuth');
    const userDisplay = document.getElementById('userDisplay');
    const loader = document.getElementById('main-loader');

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
    if (loader) loader.style.display = 'none';
});

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
