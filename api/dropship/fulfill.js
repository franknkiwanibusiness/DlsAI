const axios = require('axios');

const CJ_API_KEY = process.env.DROPSHIP_API_KEY;
const CJ_BASE    = 'https://developers.cjdropshipping.com/api2.0/v1';

const SKU_MAP = {
    "Blue 4000mAh":      "CJYD239388104DW",
    "Dark Gray 4000mAh": "CJYD239388103CX",
    "Pink 4000mAh":      "CJYD239388102BY",
    "White 4000mAh":     "CJYD239388101AZ"
};

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

    const { paypalOrderId, bundleColors, quantity, shippingMethod, shipping } = req.body;

    console.log('[fulfill] Received:', JSON.stringify({
        paypalOrderId,
        bundleColors,
        quantity,
        shippingMethod,
        shippingName: shipping?.cjShipping?.consignee
    }, null, 2));

    if (!paypalOrderId || !bundleColors || !shipping?.cjShipping) {
        console.error('[fulfill] Missing required fields');
        return res.status(400).json({
            error: 'paypalOrderId, bundleColors, and shipping.cjShipping are required',
            received: {
                paypalOrderId: !!paypalOrderId,
                bundleColors:  !!bundleColors,
                cjShipping:    !!shipping?.cjShipping
            }
        });
    }

    try {
        console.log('[fulfill] Getting CJ token...');
        const token = await getCJToken();
        console.log('[fulfill] CJ token acquired.');

        // ── Build product list ───────────────────────────────────────────────
        const merged = {};
        Object.values(bundleColors).forEach(variantName => {
            const vid = SKU_MAP[variantName] || SKU_MAP["Dark Gray 4000mAh"];
            merged[vid] = (merged[vid] || 0) + 1;
        });

        const products = Object.entries(merged).map(([vid, qty]) => ({
            vid,
            quantity: qty
        }));

        const cj = shipping.cjShipping;

        // ── Sanitise address fields ─────────────────────────────────────────
        const sanitise = (v) => (v || '').toString().trim();

        // ── Build the order payload (flat — CJ rejects nested objects) ──────
        const orderPayload = {
            orderNumber:          sanitise(paypalOrderId),
            shippingCustomerName: sanitise(cj.consignee),
            shippingEmail:        sanitise(cj.email),
            shippingPhone:        sanitise(cj.phone),
            shippingCountryCode:  sanitise(cj.countryCode),
            shippingProvince:     sanitise(cj.province),
            shippingCity:         sanitise(cj.city),
            shippingAddress:      sanitise(cj.address),
            shippingAddress2:     sanitise(cj.address2 || ''),
            shippingZip:          sanitise(cj.zip),
            products,
            remark: `PayPal:${sanitise(paypalOrderId)}|Ship:${sanitise(shippingMethod) || 'Standard'}`
        };

        console.log('[fulfill] Sending to CJ:', JSON.stringify(orderPayload, null, 2));

        const cjRes = await axios.post(
            `${CJ_BASE}/shopping/order/createOrder`,
            orderPayload,
            {
                headers: {
                    'CJ-Access-Token': token,
                    'Content-Type':    'application/json'
                }
            }
        );

        console.log('[fulfill] CJ response:', JSON.stringify(cjRes.data, null, 2));

        // CJ returns code 200 on success; anything else is a business error
        if (cjRes.data?.code !== 200) {
            throw new Error(
                `CJ rejected order: ${cjRes.data?.message} (code ${cjRes.data?.code})`
            );
        }

        const cjOrderId = cjRes.data?.data?.orderId || 'PENDING';
        console.log('[fulfill] Success — CJ order ID:', cjOrderId);

        return res.status(200).json({
            success: true,
            orderId: cjOrderId,
            cjRaw:   cjRes.data
        });

    } catch (error) {
        const detail = error.response?.data || null;
        console.error('[fulfill] ERROR:', error.message, detail || '');
        return res.status(500).json({
            error:   error.message,
            details: detail
        });
    }
};