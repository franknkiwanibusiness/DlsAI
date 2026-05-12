const axios = require('axios');

// ─── YOUR UPDATED CREDENTIALS ────────────────────────────────
const CJ_API_KEY = process.env.DROPSHIP_API_KEY; // franknkiwanibusiness@gmail.com
const CJ_API_URL = 'https://api.cjdropshipping.com/api2.0/v1';
const MINIMISTY_SPU = "CJYD239388104DW"; 

// ─── 1. AUTHENTICATION: GET ACCESS TOKEN ─────────────────────
async function getCJToken() {
    try {
        const response = await axios.post(`${CJ_API_URL}/authentication/getAccessToken`, {
            apiKey: CJ_API_KEY // Recommended method for your Gmail-linked account
        });
        
        if (response.data && response.data.data) {
            return response.data.data.accessToken;
        }
        throw new Error('CJ Token Retrieval Failed');
    } catch (error) {
        console.error('CJ Auth Error:', error.response?.data || error.message);
        throw error;
    }
}

// ─── 2. MAIN HANDLER ──────────────────────────────────────────
export default async function handler(req, res) {
    // Standard CORS and JSON headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        const token = await getCJToken();

        // ROUTE A: Shipping Lookup
        if (req.method === 'POST' && req.url.includes('/shipping')) {
            const { zip, country, qty } = req.body;
            const response = await axios.post(`${CJ_API_URL}/logistic/freightCalculate`, {
                quantity: qty || 1,
                productSku: MINIMISTY_SPU, // Automatically using your SPU
                zipCode: zip,
                countryCode: country
            }, { headers: { 'CJ-Access-Token': token } });

            return res.status(200).json(response.data);
        }

        // ROUTE B: Fulfillment (Create Order)
        if (req.method === 'POST' && req.url.includes('/fulfill')) {
            const { paypalOrderId, bundleColors, shipping } = req.body;

            // Map frontend selection to CJ Order structure
            const orderPayload = {
                orderNumber: paypalOrderId,
                shippingAddress: shipping.cjShipping,
                products: Object.values(bundleColors).map(color => ({
                    sku: MINIMISTY_SPU, // Primary SPU
                    quantity: 1
                }))
            };

            const response = await axios.post(`${CJ_API_URL}/shopping/order/createOrder`, orderPayload, {
                headers: { 'CJ-Access-Token': token }
            });

            return res.status(200).json(response.data);
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
