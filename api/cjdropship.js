// api/dropship.js
const axios = require('axios');

// ─── CONFIG ──────────────────────────────────────────────────
const CJ_API_KEY = process.env.DROPSHIP_API_KEY;
const CJ_API_URL = 'https://api.cjdropshipping.com/api2.0/v1';

const SKU_MAP = {
    "Blue 4000mAh":      "CJYD239388104DW",
    "Dark Gray 4000mAh": "CJYD239388103CX",
    "Pink 4000mAh":      "CJYD239388102BY",
    "White 4000mAh":     "CJYD239388101AZ"
};

// ─── CJ AUTH ─────────────────────────────────────────────────
async function getCJToken() {
    try {
        const response = await axios.post(
            `${CJ_API_URL}/authentication/getAccessToken`,
            { apiKey: CJ_API_KEY }
        );
        const token = response.data?.data?.accessToken;
        if (!token) throw new Error('No accessToken in CJ response');
        return token;
    } catch (e) {
        throw new Error(`CJ Auth Failed: ${e.response?.data?.message || e.message}`);
    }
}

// ─── HANDLER ─────────────────────────────────────────────────
// NOTE: Uses module.exports (CommonJS) not export default
// because Vercel serverless functions use CommonJS by default
// unless you add "type": "module" to package.json
module.exports = async function handler(req, res) {

    // CORS headers — allow all origins (tighten before production)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Browser preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── GUARD: API key must exist ──
    if (!CJ_API_KEY) {
        return res.status(500).json({ error: 'DROPSHIP_API_KEY env variable is not set' });
    }

    try {
        const token = await getCJToken();
        const url   = req.url || '';

        // ── ROUTE: /api/dropship/shipping ──────────────────────
        if (url.includes('/shipping')) {
            const { zip, country, qty } = req.body;

            if (!zip || !country) {
                return res.status(400).json({ error: 'zip and country are required' });
            }

            const response = await axios.post(
                `${CJ_API_URL}/logistic/freightCalculate`,
                {
                    quantity:   qty || 1,
                    productSku: SKU_MAP["Dark Gray 4000mAh"], // reference SKU
                    zipCode:    zip,
                    countryCode: country
                },
                { headers: { 'CJ-Access-Token': token } }
            );

            return res.status(200).json(response.data);
        }

        // ── ROUTE: /api/dropship/fulfill ───────────────────────
        if (url.includes('/fulfill')) {
            const {
                paypalOrderId,
                bundleColors,
                quantity,
                shippingMethod,
                shipping
            } = req.body;

            // Validate required fields
            if (!paypalOrderId || !bundleColors || !shipping?.cjShipping) {
                return res.status(400).json({
                    error: 'paypalOrderId, bundleColors, and shipping.cjShipping are required'
                });
            }

            // Build product list from per-slot color selections
            // bundleColors format: { "1": "Blue 4000mAh", "2": "Pink 4000mAh" }
            const products = Object.values(bundleColors).map(variantName => ({
                vid:      SKU_MAP[variantName] || SKU_MAP["Dark Gray 4000mAh"],
                quantity: 1
            }));

            // Deduplicate — CJ requires one line per SKU with combined qty
            const merged = {};
            products.forEach(p => {
                if (merged[p.vid]) {
                    merged[p.vid].quantity += 1;
                } else {
                    merged[p.vid] = { ...p };
                }
            });

            const cj = shipping.cjShipping;

            const orderPayload = {
                orderNumber:      paypalOrderId,
                shippingAddress: {
                    consignee:   cj.consignee,
                    email:       cj.email,
                    phone:       cj.phone,
                    countryCode: cj.countryCode,
                    province:    cj.province,
                    city:        cj.city,
                    address:     cj.address,
                    address2:    cj.address2 || '',
                    zip:         cj.zip
                },
                products: Object.values(merged),
                // Remark lets CJ ops see the PayPal reference
                remark: `PayPal: ${paypalOrderId} | Ship: ${shippingMethod || 'Standard'}`
            };

            const response = await axios.post(
                `${CJ_API_URL}/shopping/order/createOrder`,
                orderPayload,
                { headers: { 'CJ-Access-Token': token } }
            );

            // CJ returns { code, message, data: { orderId } }
            if (response.data?.code !== 200) {
                throw new Error(
                    response.data?.message || `CJ rejected order (code ${response.data?.code})`
                );
            }

            return res.status(200).json({
                success:  true,
                orderId:  response.data?.data?.orderId || 'PENDING',
                cjRaw:    response.data
            });
        }

        // ── No route matched ───────────────────────────────────
        return res.status(404).json({ error: 'Endpoint not found' });

    } catch (error) {
        console.error('[dropship] Error:', error.message);
        return res.status(500).json({
            error:   error.message,
            details: error.response?.data || null
        });
    }
};