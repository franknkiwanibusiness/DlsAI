import { db } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

async function loadSharedReport() {
    // 1. Parse URL Parameters
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('uid');
    const reportId = params.get('id');

    if (!userId || !reportId) {
        document.getElementById('reportOutput').innerText = "ERROR: INVALID_LINK_SIGNATURE";
        return;
    }

    try {
        // 2. Fetch Data from Firebase
        // NOTE: Ensure your 'share' logic saves data to reports/${userId}/${reportId}
        const reportRef = ref(db, `reports/${userId}/${reportId}`);
        const snapshot = await get(reportRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // 3. Populate UI
            document.getElementById('networthAmount').innerText = data.valuation || "$0.00";
            document.getElementById('analyzedPreview').src = data.image;
            document.getElementById('statTopPlayer').innerText = data.topPlayer || "Unknown";
            document.getElementById('statExpensive').innerText = data.avgRating || "0.0";
            
            // Display Report Text
            document.getElementById('reportOutput').innerText = data.reportText;
        } else {
            document.getElementById('reportOutput').innerText = "ERROR: REPORT_NOT_FOUND_OR_EXPIRED";
        }
    } catch (error) {
        console.error(error);
        document.getElementById('reportOutput').innerText = "ERROR: DATABASE_CONNECTION_FAILED";
    }
}

window.onload = loadSharedReport;
