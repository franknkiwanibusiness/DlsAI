// iOS-style notification (replaces old toast)
let currentNotifyTimeout;

export function notify(message, type = 'success') {
    // Remove existing notification if any
    const existing = document.getElementById('ios-notify');
    if (existing) existing.remove();
    clearTimeout(currentNotifyTimeout);

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'ios-notify';
    modal.style.position = 'fixed';
    modal.style.top = '20px';
    modal.style.left = '50%';
    modal.style.transform = 'translateX(-50%) translateY(-10px)';
    modal.style.zIndex = '9999';
    modal.style.minWidth = '200px';
    modal.style.maxWidth = '90%';
    modal.style.padding = '15px 20px';
    modal.style.borderRadius = '15px';
    modal.style.color = '#fff';
    modal.style.fontWeight = '500';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.style.backgroundColor = type === 'success' ? '#34C759' : '#FF3B30';
    modal.innerText = message;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'translateX(-50%) translateY(0)';
        modal.style.pointerEvents = 'auto';
    });

    // Auto-hide after 3s
    currentNotifyTimeout = setTimeout(() => {
        modal.style.opacity = '0';
        modal.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => modal.remove(), 300);
    }, 3000);
}

// Update profile UI
export function updateProfileUI(uid, data) {
    const isPremium = data.premium || false;
    const dailyLimit = isPremium ? 250 : 50;

    document.getElementById('headerUsername').innerText = `@${data.username}`;
    document.getElementById('modalFullUser').innerText = `@${data.username}`;
    document.getElementById('headerAvatar').src = data.avatar;
    document.getElementById('modalLargeAvatar').src = data.avatar;
    document.getElementById('tokenBalance').innerText = `${data.tokens || 0} Tokens`;

    const claimed = data.tokensClaimedToday || 0;
    document.getElementById('usageText').innerText = `${claimed} / ${dailyLimit}`;
    document.getElementById('usageBar').style.width = `${(claimed / dailyLimit) * 100}%`;

    document.getElementById('accountTier').innerHTML = isPremium ?
        '<span class="premium-badge">Premium</span>' :
        '<span style="color:#555;font-size:0.7rem">Free Tier</span>';

    document.getElementById('premiumUpsell').style.display = isPremium ? 'none' : 'block';
}