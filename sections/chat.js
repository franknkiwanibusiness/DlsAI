export const ChatSection = `
<div id="chatModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300">
    <div class="absolute inset-0 bg-black/90 backdrop-blur-md" id="closeChat"></div>
    
    <div class="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div class="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 class="text-xs font-black uppercase tracking-widest italic text-white">DLS VALUE <span class="text-green-500">AI</span></h3>
            </div>
            <button id="closeChatBtn" class="material-icons text-gray-500 hover:text-white transition-colors">close</button>
        </div>

        <div id="chatContainer" class="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 to-transparent">
            <div class="bg-white/5 border border-white/5 p-4 rounded-2xl max-w-[80%]">
                <p class="text-[12px] text-gray-300 leading-relaxed">Welcome, Manager. I am the **DLSVALUE AI**. Ask me about squad building, player maxing, or market trends. How can I help today?</p>
            </div>
        </div>

        <div class="p-4 bg-zinc-900/80 border-t border-white/5">
            <form id="chatForm" class="flex gap-2">
                <input type="text" id="chatInput" placeholder="Ask anything about DLS..." 
                    class="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-[12px] text-white focus:outline-none focus:border-green-500/50 transition-all">
                <button type="submit" class="bg-white text-black w-12 h-12 rounded-xl flex items-center justify-center hover:bg-green-500 transition-all active:scale-95">
                    <span class="material-icons text-xl">send</span>
                </button>
            </form>
        </div>
    </div>
</div>
`;
