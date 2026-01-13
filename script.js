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

// --- UI EVENT LISTENERS ---
document.getElementById('closeModalX').onclick = () => modal.classList.remove('active');
document.getElementById('openAuth').onclick = () => modal.classList.add('active');

document.getElementById('switchAuth').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('regFields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('modalTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('switchAuth').innerText = isLoginMode ? 'Need an account? Register' : 'Have an account? Login';
};

// --- AUTH SUBMISSION ---
document.getElementById('mainSubmitBtn').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass)
            .then(() => modal.classList.remove('active'))
            .catch(err => alert(err.message));
    } else {
        const username = document.getElementById('regUsername').value.toLowerCase().trim().replace(/\s+/g, '');
        const avatar = document.querySelector('input[name="pfp"]:checked').value;
        
        if(username.length < 3) return alert("Username too short");

        try {
            const snapshot = await get(ref(db, 'usernames/' + username));
            if (snapshot.exists()) return alert("Username already taken");

            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            // 1. Set User Profile
            await set(ref(db, 'users/' + uid), { 
                username: username, 
                avatar: avatar, 
                tier: 'free' 
            });

            // 2. Set AITOKENS separately
            await set(ref(db, 'AITOKENS/' + uid), { 
                tokens: 50, 
                lastClaim: Date.now() 
            });

            // 3. Map Username
            await set(ref(db, 'usernames/' + username), uid);
            
            modal.classList.remove('active');
        } catch (err) {
            alert(err.message);
        }
    }
};

// --- STATE CHANGE & TOKEN REWARDS ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userRef = ref(db, 'users/' + user.uid);
            const tokenRef = ref(db, 'AITOKENS/' + user.uid);
            
            const [userSnap, tokenSnap] = await Promise.all([get(userRef), get(tokenRef)]);

            if (userSnap.exists()) {
                const userData = userSnap.val();
                let tokenData = tokenSnap.exists() ? tokenSnap.val() : { tokens: 50, lastClaim: 0 };
                
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                // Daily Reward Logic (Refs AITOKENS node)
                if (!tokenData.lastClaim || (now - tokenData.lastClaim >= oneDay)) {
                    const reward = userData.tier === 'pro' ? 250 : 50;
                    tokenData.tokens = (tokenData.tokens || 0) + reward;
                    tokenData.lastClaim = now;
                    await set(tokenRef, tokenData);
                    alert(`Daily Gift: +${reward} tokens!`);
                }

                // --- UPDATE UI ---
                document.getElementById('headerUsername').innerText = `@${userData.username}`;
                document.getElementById('headerAvatar').src = userData.avatar;
                document.getElementById('tokenDisplay').innerText = tokenData.tokens;
                
                const tag = document.getElementById('tierTag');
                tag.innerText = userData.tier.toUpperCase();
                tag.className = `tier-tag ${userData.tier === 'pro' ? 'tier-pro' : 'tier-free'}`;

                document.getElementById('openAuth').style.display = 'none';
                document.getElementById('userDisplay').style.display = 'flex';
            }
        } catch (error) {
            console.error("Sync Error:", error);
        }
    } else {
        document.getElementById('openAuth').style.display = 'block';
        document.getElementById('userDisplay').style.display = 'none';
    }
    
    // Hide loader regardless of state
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
});
