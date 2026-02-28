<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Hoyoo AI | Mobile</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js"></script>
    <style>
        .glass { background: rgba(15, 15, 15, 0.8); backdrop-filter: blur(12px); }
        body { background-color: #050505; -webkit-tap-highlight-color: transparent; }
    </style>
</head>
<body class="text-white pb-20">

    <header class="sticky top-0 z-50 glass border-b border-white/10 p-4 flex justify-between items-center">
        <div>
            <h1 class="text-xl font-black tracking-tighter text-blue-500">HOYOO AI</h1>
            <div class="flex items-center gap-1">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Engine</span>
            </div>
        </div>
        <button id="scan-btn" class="bg-blue-600 px-4 py-2 rounded-full text-xs font-bold active:scale-90 transition">SCAN ALL</button>
    </header>

    <main id="feed" class="p-4 space-y-4">
        <div class="bg-gray-900/50 h-40 rounded-3xl animate-pulse"></div>
        <div class="bg-gray-900/50 h-40 rounded-3xl animate-pulse"></div>
    </main>

    <script>
        // FIREBASE CONFIG (Replace with yours)
        const firebaseConfig = { 
            apiKey: "...", 
            databaseURL: "https://your-project-default-rtdb.firebaseio.com",
            projectId: "..."
        };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        // REAL-TIME AUTO LOAD
        db.ref('hoyoo_predictions').limitToLast(20).on('value', (snap) => {
            const feed = document.getElementById('feed');
            feed.innerHTML = '';
            const data = snap.val();
            if(!data) return;

            Object.values(data).reverse().forEach(p => {
                feed.innerHTML += `
                    <div class="bg-[#111] border border-white/5 rounded-[2rem] p-5 shadow-2xl">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] font-bold text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full uppercase">${p.league}</span>
                            <span class="text-[10px] text-gray-500">${new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <h2 class="text-lg font-bold mb-4 leading-tight">${p.match}</h2>
                        
                        <div class="space-y-3">
                            <div class="bg-white/5 p-3 rounded-2xl border-l-4 border-purple-500">
                                <p class="text-[9px] font-black text-purple-400 uppercase tracking-tighter">Groq Intelligence</p>
                                <p class="text-sm text-gray-300 mt-1">${p.predictions.groq}</p>
                            </div>
                            <div class="bg-white/5 p-3 rounded-2xl border-l-4 border-blue-500">
                                <p class="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Gemini Reason</p>
                                <p class="text-sm text-gray-300 mt-1">${p.predictions.gemini}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
        });

        // TRIGGER ENGINE
        document.getElementById('scan-btn').onclick = async function() {
            this.innerText = "SCANNING...";
            this.classList.add('opacity-50');
            try {
                await fetch('/api/hoyooai');
            } finally {
                this.innerText = "SCAN ALL";
                this.classList.remove('opacity-50');
            }
        };
    </script>
</body>
</html>
