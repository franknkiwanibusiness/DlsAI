import { auth, db } from './firebase-config.js';
import { notify, updateProfileUI } from './ui-utils.js';
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
function initChat(userData) {
    const modal = document.getElementById('chatModal');
    const openBtn = document.getElementById('askAiBtn'); 
    const closeBtn = document.getElementById('closeChatBtn');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    
    // UI Elements for Gallery Trigger
    const fileInput = document.getElementById('fileInput');
    const uploadTrigger = document.getElementById('uploadBtn'); // <--- MUST MATCH HTML ID

    // Toggle Chat Modal
    const toggleModal = (show) => {
        if (show) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        } else {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };

    if (openBtn) openBtn.addEventListener('click', () => toggleModal(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleModal(false));

    // Handle Gallery Upload Trigger (Simply opens picker)
    if (uploadTrigger && fileInput) {
        uploadTrigger.onclick = (e) => {
            e.preventDefault();
            fileInput.click();
        };
    }

    // Handle Text Messages
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';
        window.chatHistory.push({ role: 'user', content: text });

        const tempId = appendMessage('ai', 'Processing...');

        try {
            const response = await fetch('/api/aichat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: window.chatHistory })
            });
            const data = await response.json();
            updateMessage(tempId, data.reply);
            window.chatHistory.push({ role: 'assistant', content: data.reply });
        } catch (err) {
            updateMessage(tempId, "Connection lost. Vision Engine offline.");
        }
    });

    // UI Helpers
    function appendMessage(role, text) {
        const id = 'msg-' + Date.now();
        const isAi = role === 'ai';
        const wrapperClass = isAi ? 'message-wrapper ai-align' : 'message-wrapper user-align';
        const bubbleClass = isAi ? 'ai-bubble' : 'user-bubble';

        const html = `
            <div id="${id}" class="${wrapperClass}">
                <div class="${bubbleClass}">
                    <p>${text}</p>
                </div>
            </div>`;

        container.insertAdjacentHTML('beforeend', html);
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        return id;
    }

    function updateMessage(id, text) {
        const el = document.getElementById(id);
        if (!el) return;
        const p = el.querySelector('p');
        if (p) p.innerText = text;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }

    // Expose globally for the Preview Modal logic
    window.appendChatMessage = appendMessage;
}

// --- 2. INDEPENDENT IMAGE MODAL LOGIC ---
const fileInput = document.getElementById('fileInput');
const previewModal = document.getElementById('imagePreviewModal');
const previewTarget = document.getElementById('previewTarget');
const analyzeBtn = document.getElementById('ANALYZE'); // Inside Full Screen Modal

// Detect File Selection -> Open Full Screen Preview
if (fileInput) {
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewTarget.src = event.target.result;
                previewModal.style.display = 'flex'; // Opens the Image Scan Modal
            };
            reader.readAsDataURL(file);
        }
    };
}

// Handle the "ANALYZE SQUAD" Button inside the preview modal
if (analyzeBtn) {
    analyzeBtn.onclick = async () => {
        const btnText = analyzeBtn.querySelector('.btn-text') || analyzeBtn;
        btnText.innerText = "SCANNING..."; // Logic starts ONLY here
        
        try {
            const response = await fetch('/api/analyze-squad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: previewTarget.src })
            });
            const data = await response.json();

            // Success: Close Modal and Open Chat
            previewModal.style.display = 'none';
            const chatBtn = document.getElementById('askAiBtn');
            if (chatBtn) chatBtn.click(); 
            
            if (window.appendChatMessage) {
                window.appendChatMessage('ai', data.reply || "Squad scan complete. Check analysis above.");
            }
        } catch (err) {
            alert("Analysis failed. System Offline.");
            btnText.innerText = "ANALYZE SQUAD";
        }
    };
}

// Cancel Preview
if (document.getElementById('cancelUpload')) {
    document.getElementById('cancelUpload').onclick = () => {
        previewModal.style.display = 'none';
        fileInput.value = '';
    };
}

// --- 3. AUTH & MODAL UI LOGIC ---
const authOverlay = document.getElementById('modalOverlay');
const profileModal = document.getElementById('profileModal');

const closeModal = () => authOverlay.classList.remove('active');

if(document.getElementById('closeModalX')) document.getElementById('closeModalX').onclick = closeModal;
if(document.getElementById('openAuth')) document.getElementById('openAuth').onclick = () => authOverlay.classList.add('active');
if(document.getElementById('userDisplay')) document.getElementById('userDisplay').onclick = () => profileModal.classList.add('active');
if(document.getElementById('closeProfile')) document.getElementById('closeProfile').onclick = () => profileModal.classList.remove('active');

const switchBtn = document.getElementById('switchAuth');
if(switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
        document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
        switchBtn.innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
    };
}

// --- 4. FIREBASE OBSERVER & INIT ---
if (typeof onAuthStateChanged !== 'undefined') {
    onAuthStateChanged(auth, (user) => {
        const loader = document.getElementById('main-loader');
        if (user) {
            document.getElementById('openAuth').style.display = 'none';
            document.getElementById('userDisplay').style.display = 'flex';
            initChat(user);
        } else {
            document.getElementById('openAuth').style.display = 'block';
            document.getElementById('userDisplay').style.display = 'none';
        }
        if (loader) loader.style.display = 'none';
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = document.getElementById('main-loader');
        if (loader) loader.style.display = 'none';
        initChat({ username: "Guest" });
    });
}
