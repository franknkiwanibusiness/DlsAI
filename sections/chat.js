export const ChatSection = `
<div id="chatModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300 ease-out bg-black/40 backdrop-blur-sm">
    <div class="absolute inset-0" id="closeChatOverlay"></div>
    
    <div id="chatBox" class="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[75vh] transform scale-95 translate-y-8 transition-all duration-300 ease-out">
        
        <div class="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] italic text-white/50">DLS VALUE <span class="text-green-500">AI</span></h3>
            </div>
            <button id="closeChatBtn" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
                <span class="material-icons text-sm text-gray-500">close</span>
            </button>
        </div>

        <div id="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[radial-gradient(circle_at_top,_#18181b,_transparent)]">
            <div class="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                <p class="text-[12px] text-gray-300 leading-relaxed">Welcome, Manager. I am the **DLSVALUE AI**. Ready to optimize your squad?</p>
            </div>
        </div>

        <div class="p-4 bg-black/40 border-t border-white/5">
            <form id="chatForm" class="flex gap-2">
                <input type="text" id="chatInput" placeholder="Ask about maxing players..." 
                    class="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 text-[12px] text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-600">
                <button type="submit" class="bg-green-500 text-black w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-green-400 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <span class="material-icons">send</span>
                </button>
            </form>
        </div>
    </div>
</div>
`;
