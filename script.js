import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

let isLoginMode = true;
const loader = document.getElementById('main-loader');
const modal = document.getElementById('modalOverlay');

// UI Controls
const openAuthBtn = document.getElementById('openAuth');
const userDisplay = document.getElementById('userDisplay');

document.getElementById('closeModalX').onclick = () => modal.classList.remove('active');
openAuthBtn.onclick = () => modal.classList.add('active');

document.getElementById('switchAuth').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('switchAuth').innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// Authentication Submission
document.getElementById('mainSubmitBtn').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
    } else {
        const username = document.getElementById('regUsername').value.toLowerCase().trim().replace(/\s+/g, '');
        const avatar = document.querySelector('input[name="pfp"]:checked').value;
        if(username.length < 3) return alert("Username too short");

        try {
            const snapshot = await get(ref(db, 'usernames/' + username));
            if (snapshot.exists()) return alert("Username taken");

            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            // Step 1: Profile
            await set(ref(db, 'users/' + uid), { username, avatar, tier: 'free' });
            // Step 2: Tokens
            await set(ref(db, 'AITOKENS/' + uid), { tokens: 50, lastClaim: Date.now() });
            // Step 3: Handle
            await set(ref(db, 'usernames/' + username), uid);
            
            modal.classList.remove('active');
        } catch (err) { alert(err.message); }
    }
};

// The Logic "Fixer"
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User detected:", user.uid);
        try {
            const [userSnap, tokenSnap] = await Promise.all([
                get(ref(db, 'users/' + user.uid)),
                get(ref(db, 'AITOKENS/' + user.uid))
            ]);

            if (userSnap.exists()) {
                const userData = userSnap.val();
                let tokenData = tokenSnap.exists() ? tokenSnap.val() : { tokens: 50, lastClaim: 0 };
                
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                // Daily Reward
                if (!tokenData.lastClaim || (now - tokenData.lastClaim >= oneDay)) {
                    const reward = userData.tier === 'pro' ? 250 : 50;
                    tokenData.tokens = (tokenData.tokens || 0) + reward;
                    tokenData.lastClaim = now;
                    await update(ref(db, 'AITOKENS/' + user.uid), tokenData);
                }

                // UI UPDATE - Force Switch
                document.getElementById('headerUsername').innerText = `@${userData.username}`;
                document.getElementById('headerAvatar').src = userData.avatar;
                document.getElementById('tokenDisplay').innerText = tokenData.tokens;
                
                const tag = document.getElementById('tierTag');
                tag.innerText = userData.tier.toUpperCase();
                tag.className = `tier-tag ${userData.tier === 'pro' ? 'tier-pro' : 'tier-free'}`;

                // Critical: Hide Login, Show Profile
                openAuthBtn.style.display = 'none';
                userDisplay.style.display = 'flex';
                modal.classList.remove('active');
            }
        } catch (e) { console.error("Database fetch failed", e); }
    } else {
        console.log("No user session found.");
        openAuthBtn.style.display = 'block';
        userDisplay.style.display = 'none';
    }
    
    // Smooth loader exit
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
});
