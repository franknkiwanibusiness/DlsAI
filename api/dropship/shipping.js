const axios = require('axios');

const CJ_API_KEY = process.env.DROPSHIP_API_KEY;
const CJ_BASE    = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getCJToken() {
    const res = await axios.post(
        `${CJ_BASE}/authentication/getAccessToken`,
        { apiKey: CJ_API_KEY },
        { headers: { 'Content-Type': 'application/json' } }
    );
    const token = res.data?.data?.accessToken;
    if (!token) throw new Error(`CJ Auth Failed: ${JSON.stringify(res.data)}`);
    return token;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });
    if (!CJ_API_KEY)             return res.status(500).json({ error: 'DROPSHIP_API_KEY env variable is not set' });

    const { zip, country, qty } = req.body;

    console.log('[shipping] Lookup:', { zip, country, qty });

    if (!zip || !country) {
        return res.status(400).json({ error: 'zip and country are required' });
    }

    try {
        console.log('[shipping] Getting CJ token...');
        const token = await getCJToken();
        console.log('[shipping] CJ token acquired.');

        const cjRes = await axios.post(
            `${CJ_BASE}/logistic/freightCalculate`,
            {
                quantity:    qty || 1,
                productSku:  "CJYD239388103CX",
                zipCode:     zip,
                countryCode: country
            },
            { headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' } }
        );

        console.log('[shipping] CJ response:', JSON.stringify(cjRes.data, null, 2));
        return res.status(200).json(cjRes.data);

    } catch (error) {
        console.error('[shipping] ERROR:', error.message, error.response?.data || '');
        return res.status(500).json({
            error:   error.message,
            details: error.response?.data || null
        });
    }
};