// This function is triggered by your "Upload" button
async function startAIScan(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Show the Scanning UI
    const overlay = document.getElementById('scanOverlay');
    const terminal = document.getElementById('terminalText');
    overlay.classList.remove('hidden');
    document.getElementById('previewImg').src = URL.createObjectURL(file);

    terminal.innerHTML = "> Connecting to Nkiwani Vision...";

    // 2. Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        
        try {
            terminal.innerHTML += "<br>> Sending to Vercel Edge Service...";
            
            // 3. POST to your Vercel API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: base64Image, 
                    mimeType: file.type 
                })
            });

            const data = await response.json();

            if (data.value) {
                terminal.innerHTML += `<br>> Success! Value: $${data.value}`;
                // Optional: Update your UI with the final value
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    alert(`Squad Valued at $${data.value}!`);
                }, 1500);
            }
        } catch (err) {
            terminal.innerHTML += "<br>> ERROR: Connection Lost.";
            console.error(err);
        }
    };
}
