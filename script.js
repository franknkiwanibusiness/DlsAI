import { auth, db } from './firebase-config.js';
import { notify, updateProfileUI } from './ui-utils.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let isLoginMode = true;
let chatHistory = [];

// --- 1. NEAT CHAT LOGIC ---
function initChat(userData) {
    const modal = document.getElementById('chatModal');
    const chatBox = document.getElementById('chatBox');
    const closeBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');

    // Select the button from your Hero Section
    const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ASK DLS AI'));

    // Toggle with "Neat" Animation
    const toggleModal = (show) => {
        if (show) {
            modal.classList.add('active'); // CSS should handle opacity/pointer-events
            modal.classList.remove('opacity-0', 'pointer-events-none');
            if(chatBox) chatBox.classList.remove('scale-95', 'translate-y-8');
        } else {
            modal.classList.remove('active');
            modal.classList.add('opacity-0', 'pointer-events-none');
            if(chatBox) chatBox.classList.add('scale-95', 'translate-y-8');
        }
    };

    if (openBtn) openBtn.onclick = () => toggleModal(true);
    if (closeBtn) closeBtn.onclick = () => toggleModal(false);

    // Close on outside click
    modal.onclick = (e) => { if(e.target === modal) toggleModal(false); };

    // Handle GROQ AI Chat
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // User Side
        appendMessage('user', text);
        chatInput.value = '';
        chatHistory.push({ role: 'user', content: text });

        // AI "Thinking" state
        const tempId = appendMessage('ai', 'Scanning DLS Database...');

        try {
            const response = await fetch('/api/aichat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });
            const data = await response.json();
            
            updateMessage(tempId, data.reply);
            chatHistory.push({ role: 'assistant', content: data.reply });
        } catch (err) {
            updateMessage(tempId, "Connection lost. AI engine offline.");
            notify("Chat Error", "error");
        }
    };

    function appendMessage(role, text) {
        const id = 'msg-' + Date.now();
        const isAi = role === 'ai';
        const html = `
            <div id="${id}" class="flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in">
                <div class="${isAi ? 'bg-zinc-900 border-white/5 text-gray-300' : 'bg-white text-black font-bold'} border p-4 rounded-2xl max-w-[85%] shadow-lg">
                    <p class="text-[12px] leading-relaxed">${text}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function updateMessage(id, text) {
        const el = document.getElementById(id);
        if (el) el.querySelector('p').innerText = text;
        container.scrollTop = container.scrollHeight;
    }
}

// --- 2. AUTH MODAL LOGIC ---
const closeModal = () => document.getElementById('modalOverlay').classList.remove('active');
document.getElementById('closeModalX').onclick = closeModal;
document.getElementById('openAuth').onclick = () => document.getElementById('modalOverlay').classList.add('active');
document.getElementById('userDisplay').onclick = () => document.getElementById('profileModal').classList.add('active');
document.getElementById('closeProfile').onclick = () => document.getElementById('profileModal').classList.remove('active');
document.getElementById('logoutBtn').onclick = () => signOut(auth).then(() => location.reload());

document.getElementById('switchAuth').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('switchAuth').innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// --- 3. REVENUE SYSTEM ---
async function handleDailyTokens(uid, data) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - (data.lastTokenClaim || 0) >= oneDay) {
        const amount = data.premium ? 250 : 50;
        await update(ref(db, 'users/' + uid), { 
            tokens: increment(amount), 
            tokensClaimedToday: amount, 
            lastTokenClaim: now 
        });
        const fresh = await get(ref(db, 'users/' + uid));
        updateProfileUI(uid, fresh.val());
    } else { 
        updateProfileUI(uid, data); 
    }
}

// --- 4. LOGO INTERACTION ---
document.getElementById('logoTrigger').onclick = async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const user = auth.currentUser;
    if (user) {
        const valueSpan = document.querySelector('.logo-value');
        valueSpan.style.animationDuration = '1s';
        try {
            const snap = await get(ref(db, 'users/' + user.uid));
            if (snap.exists()) {
                updateProfileUI(user.uid, snap.val());
                notify("Profile Synced");
            }
        } catch (e) { notify("Sync failed", "error"); }
        setTimeout(() => { valueSpan.style.animationDuration = '6s'; }, 1000);
    }
};

// --- 5. AUTH OBSERVER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        get(ref(db, 'users/' + user.uid)).then(s => {
            if (s.exists()) {
                const userData = s.val();
                document.getElementById('openAuth').style.display = 'none';
                document.getElementById('userDisplay').style.display = 'flex';
                handleDailyTokens(user.uid, userData);
                
                // Initialize Chat listeners once logged in
                initChat(userData);
            }
            document.getElementById('main-loader').style.display = 'none';
        });
    } else { 
        document.getElementById('main-loader').style.display = 'none'; 
    }
});

// Auth Submit
document.getElementById('mainSubmitBtn').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    if (!email || !pass) return notify("Fill all fields", "error");
    
    try {
        if (isLoginMode) { 
            await signInWithEmailAndPassword(auth, email, pass); 
        } else {
            const username = document.getElementById('regUsername').value.toLowerCase().trim();
            const avatar = document.querySelector('input[name="pfp"]:checked').value;
            const check = await get(ref(db, 'usernames/' + username));
            if (check.exists()) throw new Error("Username taken");
            
            const creds = await createUserWithEmailAndPassword(auth, email, pass);
            await set(ref(db, 'users/' + creds.user.uid), { 
                username, avatar, tokens: 50, tokensClaimedToday: 50, lastTokenClaim: Date.now() 
            });
            await set(ref(db, 'usernames/' + username), creds.user.uid);
        }
        closeModal();
    } catch (e) { notify(e.message, "error"); }
};
