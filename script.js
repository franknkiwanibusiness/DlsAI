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

// UI Toggles
document.getElementById('closeModalX').onclick = () => modal.classList.remove('active');
document.getElementById('openAuth').onclick = () => modal.classList.add('active');
document.getElementById('switchAuth').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('switchAuth').innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// Auth Submission
document.getElementById('mainSubmitBtn').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
    } else {
        const username = document.getElementById('regUsername').value.toLowerCase().trim().replace(/\s+/g, '');
        const avatar = document.querySelector('input[name="pfp"]:checked').value;
        if(username.length < 3) return alert("Username too short");

        const snapshot = await get(ref(db, 'usernames/' + username));
        if (snapshot.exists()) return alert("Username taken");

        createUserWithEmailAndPassword(auth, email, pass).then(async (userCredential) => {
            const uid = userCredential.user.uid;
            await set(ref(db, 'users/' + uid), { 
                username, avatar, tokens: 50, tier: 'free', lastClaim: Date.now() 
            });
            await set(ref(db, 'usernames/' + username), uid);
            modal.classList.remove('active');
        }).catch(err => alert(err.message));
    }
};

// State Change & Reward Logic
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            let data = snapshot.val();
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (!data.lastClaim || (now - data.lastClaim >= oneDay)) {
                const reward = data.tier === 'pro' ? 250 : 50;
                data.tokens = (data.tokens || 0) + reward;
                await update(userRef, { tokens: data.tokens, lastClaim: now });
                alert(`Refilled ${reward} daily tokens!`);
            }

            document.getElementById('openAuth').style.display = 'none';
            document.getElementById('userDisplay').style.display = 'flex';
            document.getElementById('headerUsername').innerText = data.username;
            document.getElementById('headerAvatar').src = data.avatar;
            document.getElementById('tokenDisplay').innerText = `${data.tokens} Tokens`;
            const tag = document.getElementById('tierTag');
            tag.innerText = data.tier;
            tag.className = `tier-tag ${data.tier === 'pro' ? 'tier-pro' : 'tier-free'}`;
        }
    }
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
});
