import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    authDomain: "itzhoyoo-f9f7e.firebaseapp.com",
    projectId: "itzhoyoo-f9f7e",
    databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
    storageBucket: "itzhoyoo-f9f7e.filestorage.app",
    messagingSenderId: "1094792075584",
    appId: "1:1094792075584:web:d49e9c3f899d3cd31082a5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- UI ELEMENTS ---
const loader = document.getElementById('main-loader');
const modal = document.getElementById('modalOverlay');
const openAuthBtn = document.getElementById('openAuth');
const switchAuthBtn = document.getElementById('switchAuth');
const mainSubmitBtn = document.getElementById('mainSubmitBtn');
const regFields = document.getElementById('regFields');
const modalTitle = document.getElementById('modalTitle');
const userDisplay = document.getElementById('userDisplay');

let isLoginMode = true;

// --- UTILITIES ---
const closeModal = () => modal.classList.remove('active');
const hideLoader = () => {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
};

// --- LISTENERS ---
openAuthBtn.onclick = () => modal.classList.add('active');
document.getElementById('closeModalX').onclick = closeModal;

switchAuthBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    regFields.style.display = isLoginMode ? 'none' : 'block';
    modalTitle.innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    switchAuthBtn.innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// --- AUTHENTICATION LOGIC ---
mainSubmitBtn.onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
    } else {
        const username = document.getElementById('regUsername').value.toLowerCase().trim().replace(/\s+/g, '');
        const avatar = document.querySelector('input[name="pfp"]:checked').value;
        
        if(username.length < 3) return alert("Username too short");

        try {
            const nameCheck = await get(ref(db, 'usernames/' + username));
            if (nameCheck.exists()) return alert("Username taken");

            const userCreds = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCreds.user.uid;

            // 1. Save User Profile
            await set(ref(db, 'users/' + uid), {
                username, avatar, tier: 'free'
            });

            // 2. Initialize AITOKENS node
            await set(ref(db, 'AITOKENS/' + uid), {
                tokens: 50,
                lastClaim: Date.now()
            });

            // 3. Map Username
            await set(ref(db, 'usernames/' + username), uid);
            
            closeModal();
        } catch (err) {
            alert(err.message);
        }
    }
};

// --- AUTH STATE & TOKEN SYNC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userSnap = await get(ref(db, 'users/' + user.uid));
            const tokenSnap = await get(ref(db, 'AITOKENS/' + user.uid));

            if (userSnap.exists()) {
                const userData = userSnap.val();
                let tokenData = tokenSnap.exists() ? tokenSnap.val() : { tokens: 50, lastClaim: 0 };
                
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                // Daily Refill Check
                if (now - tokenData.lastClaim >= oneDay) {
                    const refill = userData.tier === 'pro' ? 250 : 50;
                    tokenData.tokens = (tokenData.tokens || 0) + refill;
                    tokenData.lastClaim = now;
                    
                    await set(ref(db, 'AITOKENS/' + user.uid), tokenData);
                    alert(`Daily Reward: +${refill} tokens added to AITOKENS!`);
                }

                // Update UI Header
                document.getElementById('headerUsername').innerText = `@${userData.username}`;
                document.getElementById('headerAvatar').src = userData.avatar;
                document.getElementById('tokenDisplay').innerText = tokenData.tokens;
                
                const tag = document.getElementById('tierTag');
                tag.innerText = userData.tier;
                tag.className = `tier-tag ${userData.tier === 'pro' ? 'tier-pro' : 'tier-free'}`;

                openAuthBtn.style.display = 'none';
                userDisplay.style.display = 'flex';
            }
        } catch (error) {
            console.error("Data Sync Error:", error);
        }
        hideLoader();
        closeModal();
    } else {
        hideLoader();
        openAuthBtn.style.display = 'block';
        userDisplay.style.display = 'none';
    }
});
