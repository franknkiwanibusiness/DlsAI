// ── Firebase Module 2 — PayPal subscription realtime listener ──
    <script type="module">
        //  Hero image slideshow — images fetched from Firebase /heroimages 
        import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
        import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
            authDomain: "itzhoyoo-f9f7e.firebaseapp.com",
            databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
            projectId: "itzhoyoo-f9f7e",
            storageBucket: "itzhoyoo-f9f7e.filestorage.app",
            messagingSenderId: "1094792075584",
            appId: "1:1094792075584:web:d49e9c3f899d3cd31082a5"
        };

        // Reuse existing app if already initialised by the auth module
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db  = getDatabase(app);

        const heroBg      = document.getElementById('heroBg');
        const loaderBar   = document.getElementById('loaderProgress');
        const loaderText  = document.getElementById('loaderText');
        const loaderPct   = document.getElementById('loaderPct');
        const loadingScreen = document.getElementById('loadingScreen');

        function setProgress(pct, label) {
            loaderBar.style.width = pct + '%';
            if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
            if (label && loaderText) loaderText.textContent = label;
        }

        setProgress(5, 'Loading assets…');
        setTimeout(() => { setProgress(30, 'Loading assets…'); }, 80);
        setTimeout(() => { setProgress(55, 'Fetching listings…'); }, 500);
        setTimeout(() => { setProgress(76, 'Almost ready…'); }, 1000);
        setTimeout(() => { setProgress(90, 'Almost ready…'); }, 1500);

        const loaderStartTime = Date.now();
        const MIN_LOADER_MS = 1800;

        function dismissWhenReady() {
            const elapsed = Date.now() - loaderStartTime;
            const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
            setTimeout(function() {
                setProgress(100, 'Ready!');
                setTimeout(() => dismissLoader(), 420);
            }, remaining);
        }

        dismissWhenReady();

        // Safety: dismiss loader after 4s no matter what
        const safetyTimer = setTimeout(() => dismissWhenReady(), 4000);

        function dismissLoader() {
            clearTimeout(safetyTimer);
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('loader-lock');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
            if (window._signalLoaderReady) window._signalLoaderReady();
        }
    </script>
