import { auth, db } from './firebase-config.js';
import { notify } from './ui-utils.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global State
let isLoginMode = true;
window.chatHistory = [];

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
                refreshUserData(user.uid); 

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
        const isAi = role === 'ai';
        const wrapperClass = isAi ? 'message-wrapper ai-align' : 'message-wrapper user-align';
        const bubbleClass = isAi ? 'ai-bubble' : 'user-bubble';
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
    window.appendChatMessage = appendMessage;
}

// --- 2. AUTH SUBMIT & LOGOUT ---
const mainSubmitBtn = document.getElementById('mainSubmitBtn');
if (mainSubmitBtn) {
    mainSubmitBtn.onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        const usernameInput = document.getElementById('regUsername');

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
                notify("Welcome back!");
            } else {
                // GET AVATAR FROM RADIO BUTTONS
                const avatarRadio = document.querySelector('input[name="pfp"]:checked');
                const avatarUrl = avatarRadio ? avatarRadio.value : "";
                
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                
                // SAVE WITH AVATAR
                await set(ref(db, 'users/' + res.user.uid), {
                    username: usernameInput.value,
                    avatar: avatarUrl,
                    tokens: 50,
                    tier: 'Free'
                });
                notify("Account created!");
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

// --- 3. UI SYNC (FETCHING USERNAME/TOKENS/AVATAR) ---
async function refreshUserData(uid) {
    const snapshot = await get(ref(db, `users/${uid}`));
    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Update Text
        document.getElementById('headerUsername').innerText = data.username || "User";
        document.getElementById('tokenBalance').innerText = data.tokens || 0;
        document.getElementById('modalFullUser').innerText = "@" + (data.username || "user");
        
        // Update Avatar Images
        if (data.avatar) {
            document.getElementById('headerAvatar').src = data.avatar;
            document.getElementById('modalLargeAvatar').src = data.avatar;
        }

        // Update Progress Bar
        const tokens = data.tokens || 0;
        document.getElementById('usageText').innerText = `${tokens} / 50`;
        document.getElementById('usageBar').style.width = `${(tokens / 50) * 100}%`;
    }
}

// --- 4. FIREBASE OBSERVER ---
onAuthStateChanged(auth, (user) => {
    const openAuth = document.getElementById('openAuth');
    const userDisplay = document.getElementById('userDisplay');
    const loader = document.getElementById('main-loader');

    if (user) {
        if (openAuth) openAuth.style.display = 'none';
        if (userDisplay) userDisplay.style.display = 'flex';
        refreshUserData(user.uid);
        initChat(user);
    } else {
        if (openAuth) openAuth.style.display = 'block';
        if (userDisplay) userDisplay.style.display = 'none';
        
        // Reset images to placeholder on logout
        document.getElementById('headerAvatar').src = ""; 
        document.getElementById('modalLargeAvatar').src = "";
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

// Standard Modal Listeners
const overlay = document.getElementById('modalOverlay');
const profModal = document.getElementById('profileModal');

if(document.getElementById('openAuth')) document.getElementById('openAuth').onclick = () => overlay.classList.add('active');
if(document.getElementById('userDisplay')) document.getElementById('userDisplay').onclick = () => profModal.classList.add('active');
if(document.getElementById('closeProfile')) document.getElementById('closeProfile').onclick = () => profModal.classList.remove('active');
if(document.getElementById('closeModalX')) document.getElementById('closeModalX').onclick = () => overlay.classList.remove('active');
