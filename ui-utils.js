export function notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

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
