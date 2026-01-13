export function initChat(userData) {
    if (document.getElementById('chatModal')) return; 

    document.body.insertAdjacentHTML('beforeend', ChatSection);
    
    const modal = document.getElementById('chatModal');
    const chatBox = document.getElementById('chatBox');
    const closeBtn = document.getElementById('closeChatBtn');
    const closeOverlay = document.getElementById('closeChatOverlay');
    const chatForm = document.getElementById('chatForm');
    const container = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');

    // Button Selectors
    const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ASK DLS AI'));

    const toggleModal = (show) => {
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    };

    if (openBtn) openBtn.onclick = () => toggleModal(true);
    closeBtn.onclick = () => toggleModal(false);
    closeOverlay.onclick = () => toggleModal(false);

    // Chat Submission Logic
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';
        chatHistory.push({ role: 'user', content: text });

        const tempId = appendMessage('ai', 'Scanning...');

        try {
            const response = await fetch('/api/aichat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });
            const data = await response.json();
            
            updateMessage(tempId, data.reply);
            chatHistory.push({ role: 'assistant', content: data.reply });
        } catch (err) {
            updateMessage(tempId, "Engine Offline.");
        }
    };

    function appendMessage(role, text) {
        const id = 'msg-' + Date.now();
        const isAi = role === 'ai';
        const html = `
            <div id="${id}" class="flex ${isAi ? 'justify-start' : 'justify-end'}">
                <div class="${isAi ? 'bg-zinc-900 border-white/5 text-gray-300' : 'bg-green-500 text-black font-bold'} border p-3 rounded-2xl max-w-[85%] shadow-lg transition-all duration-300">
                    <p class="text-[11px] leading-relaxed">${text}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function updateMessage(id, text) {
        const el = document.getElementById(id);
        if (el) el.querySelector('p').innerText = text;
        container.scrollTop = container.scrollHeight;
    }
}
