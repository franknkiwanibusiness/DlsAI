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

let isLoginMode = true;

// --- UTILITY FUNCTIONS ---
function hideLoader() {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

const closeModal = () => modal.classList.remove('active');

// --- EVENT LISTENERS ---
openAuthBtn.onclick = () => modal.classList.add('active');
document.getElementById('closeModalX').onclick = closeModal;

switchAuthBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    regFields.style.display = isLoginMode ? 'none' : 'block';
    modalTitle.innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    switchAuthBtn.innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// --- CORE AUTH LOGIC ---
mainSubmitBtn.onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
    } else {
        const username = document.getElementById('regUsername').value.toLowerCase().trim().replace(/\s+/g, '');
        const avatar = document.querySelector('input[name="pfp"]:checked').value;
        
        if(!username || username.length < 3) return alert("Username too short");

        try {
            // Check for unique username
            const snapshot = await get(ref(db, 'usernames/' + username));
            if (snapshot.exists()) return alert("Username taken!");

            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            // Initialize User Data
            await set(ref(db, 'users/' + uid), {
                username: username,
                avatar: avatar,
                tokens: 50,
                tier: 'free',
                lastClaim: Date.now()
            });

            // Map username to UID
            await set(ref(db, 'usernames/' + username), uid);
            closeModal();
        } catch (err) {
            alert(err.message);
        }
    }
};

// --- AUTH STATE & TOKEN CLAIM ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            let userData = snapshot.val();
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // Handle Daily Token Refill
            if (now - userData.lastClaim >= oneDay) {
                const refill = userData.tier === 'pro' ? 250 : 50;
                userData.tokens += refill;
                userData.lastClaim = now;
                await update(userRef, { tokens: userData.tokens, lastClaim: now });
                alert(`Refilled ${refill} tokens!`);
            }

            // Update UI
            document.getElementById('headerUsername').innerText = userData.username;
            document.getElementById('headerAvatar').src = userData.avatar;
            document.getElementById('tokenDisplay').innerText = `${userData.tokens} Tokens`;
            
            const tag = document.getElementById('tierTag');
            tag.innerText = userData.tier;
            tag.className = `tier-tag ${userData.tier === 'pro' ? 'tier-pro' : 'tier-free'}`;

            openAuthBtn.style.display = 'none';
            document.getElementById('userDisplay').style.display = 'flex';
        }
        hideLoader();
        closeModal();
    } else {
        hideLoader();
        openAuthBtn.style.display = 'block';
        document.getElementById('userDisplay').style.display = 'none';
    }
});
