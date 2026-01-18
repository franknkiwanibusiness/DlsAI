import { db } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let timerStarted = false;

export async function startTimedAds() {
    if (timerStarted) return;
    timerStarted = true;

    const snap = await get(ref(db, "codes"));
    if (!snap.exists()) return;

    const { loaderEnabled, interval, items } = snap.val();
    if (!loaderEnabled || !items) return;

    const delay = Math.max(interval || 30000, 10000); // minimum 10s

    setInterval(() => {
        Object.values(items).forEach(item => {
            if (!item.enabled) return;
            inject(item.content);
        });
    }, delay);
}

function inject(code) {
    // prevent duplicate execution (important for ads)
    if (sessionStorage.getItem("ad-fired")) return;

    const temp = document.createElement("div");
    temp.innerHTML = code;

    temp.querySelectorAll("script").forEach(old => {
        const s = document.createElement("script");
        s.async = true;
        if (old.src) s.src = old.src;
        else s.textContent = old.textContent;
        document.body.appendChild(s);
    });

    sessionStorage.setItem("ad-fired", "1");
}