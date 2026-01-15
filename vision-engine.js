import { auth } from './firebase-config.js';
import { notify } from './ui-utils.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function initVisionScanner() {
    const uploadBtn = document.getElementById('uploadSquadBtn');
    const previewModal = document.getElementById('scanPreviewModal');
    const previewImg = document.getElementById('previewImg');
    const cancelScan = document.getElementById('cancelScan');
    const confirmScan = document.getElementById('confirmScan');
    const statusContainer = document.getElementById('scanStatusContainer');
    const statusText = document.getElementById('liveStatusText');

    let selectedFile = null;

    if (!uploadBtn) return;

    // --- A. FILE PICKER ---
    uploadBtn.onclick = () => {
        if (!auth.currentUser) return notify("Neural Link requires Identity", "error");
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            selectedFile = e.target.files[0];
            if (!selectedFile) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                previewModal.classList.add('active');
            };
            reader.readAsDataURL(selectedFile);
        };
        input.click();
    };

    cancelScan.onclick = () => {
        previewModal.classList.remove('active');
        selectedFile = null;
    };

    // --- B. SCAN EXECUTION ---
    confirmScan.onclick = async () => {
        if (!selectedFile) return;
        
        // UI Feedback
        confirmScan.classList.add('loading');
        statusContainer.style.display = 'block';
        statusText.style.color = "#00ffff"; // Reset to cyan

        const updates = [
            "Initializing Neural Engine...",
            "Scanning Full Image...",
            "Detecting Player Ratings...",
            "Checking Coins & Diamonds...",
            "Analyzing Squad Value...",
            "Finalizing Report..."
        ];

        let currentStatusIndex = 0;
        const statusInterval = setInterval(() => {
            if (currentStatusIndex < updates.length - 1) {
                statusText.innerText = "> " + updates[currentStatusIndex];
                currentStatusIndex++;
            }
        }, 800);

        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            
            try {
                // CHANGED: Endpoint must match your file api/scan.js
                const response = await fetch('/api/scan', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        image: base64Image, 
                        uid: auth.currentUser.uid 
                    })
                });

                if (!response.ok) throw new Error("API_ERROR");
                const result = await response.json();
                
                // Success Sequence
                clearInterval(statusInterval);
                statusText.innerText = "> " + updates[updates.length - 1]; // "Finalizing Report..."
                await sleep(800);

                previewModal.classList.remove('active');
                confirmScan.classList.remove('loading');
                statusContainer.style.display = 'none';
                
                // CHANGED: result.report matches your backend JSON key
                if (window.openVisionChat) {
                    window.openVisionChat(result.report); 
                }
                
            } catch (err) {
                console.error("Scan error:", err);
                clearInterval(statusInterval);
                statusText.innerText = "> NEURAL LINK FAILED.";
                statusText.style.color = "#ff4444";
                
                setTimeout(() => {
                    confirmScan.classList.remove('loading');
                    statusContainer.style.display = 'none';
                }, 3000);
            }
        };
    };
}
