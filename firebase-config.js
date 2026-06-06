/**
 * firebase-config.js — Siterifty Global Firebase Module
 *
 * Single source of truth for Firebase across all pages.
 * Import `app`, `auth`, and `db` from this file instead of
 * re-initialising Firebase inside each page script.
 *
 * Usage in any page script (type="module"):
 *   import { app, auth, db } from '/firebase-config.js';
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase }            from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getAuth }                from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// ─── Config ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    authDomain:        "itzhoyoo-f9f7e.firebaseapp.com",
    databaseURL:       "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
    projectId:         "itzhoyoo-f9f7e",
    storageBucket:     "itzhoyoo-f9f7e.filestorage.app",
    messagingSenderId: "1094792075584",
    appId:             "1:1094792075584:web:d49e9c3f899d3cd31082a5"
};

// ─── Initialise once, reuse on every page ──────────────────────────────────
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

export { app, auth, db };
