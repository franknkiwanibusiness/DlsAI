const sections = [
    // 1. Hero
    `<section class="relative w-full pt-16 pb-10 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div class="absolute inset-0 z-0">
            <img src="https://i.ytimg.com/vi/Agj4RwNLNfc/maxresdefault.jpg" class="w-full h-full object-cover opacity-50 brightness-[0.4]">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </div>
        <div class="relative z-10 max-w-sm">
            <div class="inline-block bg-green-500/20 backdrop-blur-md text-green-400 text-[8px] font-bold px-3 py-1 rounded-full mb-4 border border-green-500/30 uppercase tracking-[0.3em]">NKIWANI VISION V1</div>
            <h1 class="text-3xl font-black tracking-tighter leading-none mb-3 uppercase italic">SQUAD<span class="text-green-500">VALUATION</span></h1>
            <p class="text-gray-300 text-[12px] mb-8 leading-tight font-medium">World's first AI scanner for Dream League Soccer.</p>
            <button class="w-full bg-white text-black font-black py-3.5 rounded-xl uppercase text-[11px] tracking-widest mb-2">UPLOAD SQUAD</button>
            <button class="w-full bg-black/40 border border-white/20 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-widest">ASK DLS AI</button>
        </div>
    </section>`,

    // 2. Stats Ticker
    `<div class="py-2.5 bg-zinc-950 border-y border-white/5 overflow-hidden">
        <div class="animate-infinite-scroll flex gap-4 px-4">
            <div class="flex items-center gap-2 px-4 py-1 rounded-lg bg-white/5 border border-white/5 whitespace-nowrap">
                <span class="text-green-500 material-icons text-[12px]">check_circle</span>
                <span class="text-[9px] font-bold text-white/50 uppercase">1.2M Scans Done</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-1 rounded-lg bg-white/5 border border-white/5 whitespace-nowrap">
                <span class="text-blue-500 material-icons text-[12px]">security</span>
                <span class="text-[9px] font-bold text-white/50 uppercase">Verified Market Prices</span>
            </div>
        </div>
    </div>`,

    // 3. Top Valued Accounts
    `<section class="py-10 px-6 reveal border-b border-white/5" data-bg="#0b0b1a">
        <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 text-center italic">Top Valued Accounts</h2>
        <div class="space-y-3 max-w-sm mx-auto">
            <div class="flex items-center justify-between p-4 bg-zinc-900/40 border border-amber-500/30 rounded-2xl relative">
                <div class="flex items-center gap-4"><span class="text-xl font-black italic text-amber-500">01</span><p class="text-sm font-bold tracking-tight">DLS_GOAT_7</p></div>
                <p class="font-mono font-bold text-lg text-amber-400">$215.00</p>
            </div>
        </div>
    </section>`,

    // 4. Market Index (Price Tracking)
    `<section class="py-12 px-6 border-b border-white/5 bg-zinc-950/50">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-8 italic">Live Market Index</h2>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">Legendary Cards</p>
                    <span class="text-xl font-mono font-bold">$12.40</span>
                </div>
                <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">Maxed Accounts</p>
                    <span class="text-xl font-mono font-bold">$184.00</span>
                </div>
            </div>
        </div>
    </section>`,

    // 5. Deep Scan Tech
    `<section class="py-16 px-6 reveal" data-bg="#0a0a0f">
        <div class="max-w-sm mx-auto">
            <h2 class="text-2xl font-black italic uppercase mb-2">Deep Scan<span class="text-green-500"> Tech</span></h2>
            <p class="text-xs text-gray-500 mb-8 uppercase tracking-widest">Neural Variable Analysis</p>
            <div class="space-y-4">
                <div class="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <h4 class="text-xs font-bold uppercase">Stat Variance Check</h4>
                    <p class="text-[10px] text-gray-500">Detects coaching breakthroughs and rare stat spreads.</p>
                </div>
            </div>
        </div>
    </section>`,

    // 6. Neural Spinner (Visualizer)
    `<section class="py-12 px-6 reveal" data-bg="#051005">
        <div class="max-w-sm mx-auto border border-dashed border-white/20 p-8 rounded-3xl flex flex-col items-center">
            <div class="w-16 h-16 border-2 border-green-500 rounded-full border-t-transparent animate-spin mb-4"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-green-500">Engine Online</p>
        </div>
    </section>`,

    // 7. Recent Scans Pulse
    `<section class="py-10 reveal" data-bg="#080808">
        <div class="px-6 mb-4"><h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Live Feed</h2></div>
        <div class="px-6 space-y-2">
            <div class="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center animate-pulse">
                <span class="text-[10px] font-bold">USER_9901</span>
                <span class="text-[11px] font-mono text-green-500">$84.20</span>
            </div>
        </div>
    </section>`,

    // 8. Market Dynamics (Chart)
    `<section class="py-12 px-6 reveal" data-bg="#0c0214">
        <div class="max-w-sm mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 italic">Market Trends</h2>
            <div class="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                <div class="flex items-end gap-1 h-16 mb-4">
                    <div class="bg-white/10 w-full h-[40%]"></div>
                    <div class="bg-white/10 w-full h-[60%]"></div>
                    <div class="bg-green-500 w-full h-[90%] shadow-[0_0_15px_#22c55e]"></div>
                </div>
                <p class="text-[10px] text-gray-500">Trend: Maxed Legends demand +22%.</p>
            </div>
        </div>
    </section>`,

    // 9. Synergy Analysis
    `<section class="py-12 px-6 reveal" data-bg="#120a04">
        <div class="max-w-sm mx-auto p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-4">
            <span class="material-icons text-orange-500">groups</span>
            <p class="text-[10px] text-gray-300">Chemistry bonus detected: +$12.00 premium added to account.</p>
        </div>
    </section>`,

    // 10. Global Benchmarks
    `<section class="py-12 px-6 reveal" data-bg="#000">
        <div class="max-w-sm mx-auto">
            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6">Benchmarks</h2>
            <div class="w-full h-1 bg-white/10 rounded-full mb-2"><div class="h-full bg-green-500" style="width: 92%"></div></div>
            <p class="text-[9px] uppercase font-bold text-gray-500">Speed Percentile: 92%</p>
        </div>
    </section>`,

    // 11. Security (Zero Storage)
    `<section class="py-12 px-6 reveal" data-bg="#04100b">
        <div class="max-w-sm mx-auto flex gap-4 items-center">
            <span class="material-icons text-green-500 text-3xl">shutter_speed</span>
            <p class="text-[10px] text-gray-500">Zero-Storage Policy: Images destroyed instantly after scan.</p>
        </div>
    </section>`,

    // 12. Transfer News Alerts
    `<section class="py-12 px-6 reveal" data-bg="#100505">
        <div class="max-w-sm mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h4 class="text-xs font-bold uppercase text-red-500 mb-1">Market Alert</h4>
            <p class="text-[10px] text-gray-500">Neymar Jr. removed. Legacy card rarity increased.</p>
        </div>
    </section>`,

    // 13. Growth Blueprint (Coaching)
    `<section class="py-12 px-6 reveal" data-bg="#050a10">
        <div class="max-w-sm mx-auto text-center border border-blue-500/30 p-6 rounded-3xl">
            <h3 class="text-sm font-bold uppercase mb-2">Growth Blueprint</h3>
            <button class="bg-blue-600 px-6 py-2 rounded-lg text-[9px] font-black uppercase">View Path</button>
        </div>
    </section>`,

    // 14. Global Demand Map
    `<section class="py-12 px-6 reveal" data-bg="#000">
        <div class="max-w-sm mx-auto h-32 bg-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center">
            <span class="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Global Map Data</span>
            <div class="absolute top-1/2 left-1/2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
        </div>
    </section>`,

    // 15. Mobile App Preview
    `<section class="py-20 px-6 reveal text-center" data-bg="#000">
        <h3 class="text-xl font-black italic uppercase mb-6">NKIWANI <span class="text-green-500">MOBILE</span></h3>
        <div class="flex gap-2 justify-center">
            <div class="px-4 py-2 border border-white/10 rounded text-[8px] font-bold">iOS</div>
            <div class="px-4 py-2 border border-white/10 rounded text-[8px] font-bold">ANDROID</div>
        </div>
    </section>`,

    // 16. Audit Verification
    `<section class="py-10 bg-black flex justify-around opacity-30 grayscale text-[10px] font-black">
        <span>NKIWANI</span><span>NEXUS</span><span>DLS_HUB</span>
    </section>`,

    // 17. Sold Ticker
    `<section class="py-4 bg-green-500/5 border-y border-green-500/10 overflow-hidden">
        <div class="animate-infinite-scroll flex gap-8 text-[9px] font-mono">
            <span>SOLD: USER_88... $140.00</span><span>SOLD: DLS_GOD... $210.00</span>
        </div>
    </section>`,

    // 18. Project Roadmap 2026
    `<section class="py-12 px-6 reveal" data-bg="#0a0510">
        <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 italic">Roadmap</h2>
        <div class="max-w-sm mx-auto border-l border-white/10 pl-6 space-y-6">
            <div class="relative"><span class="absolute -left-[29px] w-2 h-2 bg-green-500 rounded-full"></span><p class="text-[10px] font-bold uppercase">Q1: Vision Core</p></div>
            <div class="relative"><span class="absolute -left-[29px] w-2 h-2 bg-zinc-700 rounded-full"></span><p class="text-[10px] font-bold uppercase text-gray-600">Q2: Marketplace</p></div>
        </div>
    </section>`,

    // 19. Investor Portal
    `<section class="py-20 px-8 bg-zinc-950 border-t-2 border-green-500/50 reveal" data-bg="#000">
        <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-black italic uppercase leading-none mb-4">PARTNER & <span class="text-green-500">INVEST</span></h2>
            <p class="text-gray-400 text-xs mb-8">Scaling the first decentralized valuation layer for sports gaming.</p>
            <button class="w-full py-4 bg-white text-black font-black uppercase text-[11px] rounded-xl">CONTACT VENTURE LEAD</button>
        </div>
    </section>`,

    // 20. Footer
    `<footer class="p-10 border-t border-white/5 text-center bg-black">
        <p class="text-[9px] text-white/20 uppercase tracking-[0.5em] italic mb-1">DLSVALUE AI CORE v1.8</p>
        <p class="text-[8px] text-gray-800 font-black">Powered by Nkiwani Vision AI</p>
    </footer>`
];

// --- APP ENGINE ---

// 1. Inject Sections
document.getElementById('app').innerHTML = sections.join('');

// 2. Background Switcher & Reveal Observer
const observerOptions = { threshold: 0.2 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            const newBg = entry.target.getAttribute('data-bg');
            if (newBg) document.body.style.backgroundColor = newBg;
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 3. Progress Bar Logic
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById("progress-bar").style.width = scrolled + "%";
    
    if (window.scrollY < 100) document.body.style.backgroundColor = "#000000";
});
