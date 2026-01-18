import { db } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let started = false;

function boot() {
  if (started) return;
  started = true;

  startTimedAds();
}

// ensure DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

async function startTimedAds() {
  console.log("🔥 Ad timer started");

  const snap = await get(ref(db, "codes"));
  if (!snap.exists()) return;

  const { loaderEnabled, interval, items } = snap.val();
  if (!loaderEnabled || !items) return;

  const delay = interval || 30000;

  setInterval(() => {
    Object.values(items).forEach(item => {
      if (!item.enabled) return;
      inject(item.content);
    });
  }, delay);
}

function inject(code) {
  // TEMP: allow firing for testing
  // remove this block later for safety
  // if (sessionStorage.getItem("ad-fired")) return;

  const temp = document.createElement("div");
  temp.innerHTML = code;

  temp.querySelectorAll("script").forEach(old => {
    const s = document.createElement("script");
    if (old.src) s.src = old.src;
    else s.textContent = old.textContent;
    s.async = true;
    document.body.appendChild(s);
  });

  // sessionStorage.setItem("ad-fired", "1");
}