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

// Modal Logic
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

// Logo Interaction
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

// Main Auth Submission
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

onAuthStateChanged(auth, (user) => {
    if (user) {
        get(ref(db, 'users/' + user.uid)).then(s => {
            if (s.exists()) {
                document.getElementById('openAuth').style.display = 'none';
                document.getElementById('userDisplay').style.display = 'flex';
                handleDailyTokens(user.uid, s.val());
            }
            document.getElementById('main-loader').style.display = 'none';
        });
    } else { 
        document.getElementById('main-loader').style.display = 'none'; 
    }
});
