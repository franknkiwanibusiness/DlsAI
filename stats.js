// stats.js
import { ref, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const PFP_PLACEHOLDER = "https://i.ytimg.com/vi/7p4LBOLGpFg/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAFu1lISn--VT-CrIS7Nc1LbUTy6Q";

export function initMarketTracker(db) {
    const marketGrid = document.getElementById('marketGrid');
    if (!marketGrid) return;

    onValue(ref(db, 'stats'), (snapshot) => {
        if (!snapshot.exists()) return;
        marketGrid.innerHTML = '';
        Object.entries(snapshot.val()).forEach(([id, player]) => {
            const isUp = player.trend === 'up';
            const card = document.createElement('div');
            card.className = 'market-item';
            card.innerHTML = `
                <div class="market-player" style="display:flex; gap:12px; align-items:center;">
                    <img src="${player.photo || PFP_PLACEHOLDER}" style="width:40px; height:40px; border-radius:8px;">
                    <div>
                        <span style="display:block; font-size:0.8rem; font-weight:800; color:#fff;">${player.name.toUpperCase()}</span>
                        <span style="font-size:0.6rem; color:${player.color || '#22c55e'}; font-weight:900;">${player.ovr} OVR</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span style="display:block; font-size:0.9rem; font-weight:800; color:#fff;">$${player.price}</span>
                    <span style="color:${isUp ? '#22c55e' : '#ff4444'}; font-size:0.7rem; font-weight:800;">${isUp ? '▲' : '▼'} ${player.percent}%</span>
                </div>`;
            marketGrid.appendChild(card);
        });
    });
}

export function initLeaderboard(db) {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;

    const usersRef = query(ref(db, 'users'), orderByChild('tokens'), limitToLast(5));

    onValue(usersRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const users = [];
        snapshot.forEach(child => { users.push(child.val()); });
        users.reverse();

        leaderboardBody.innerHTML = '';
        users.forEach((user, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            leaderboardBody.insertAdjacentHTML('beforeend', `
                <tr style="border-bottom: 1px solid #0a0a0a;">
                    <td style="padding:12px 10px;"><span class="rank-num ${rankClass}">${rank}</span></td>
                    <td style="padding:12px 10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <img src="${user.avatars || PFP_PLACEHOLDER}" style="width:24px; height:24px; border-radius:6px;">
                            <span style="font-size:0.75rem; color:#fff;">@${user.username || 'User'}</span>
                        </div>
                    </td>
                    <td style="padding:12px 10px; text-align:right; color:#00ffff; font-family:monospace; font-weight:800;">$${user.tokens || 0}</td>
                </tr>`);
        });
    });
}
