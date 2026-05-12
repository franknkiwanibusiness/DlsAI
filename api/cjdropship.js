const axios = require('axios');

// Credentials from Vercel Environment Variables
const CJ_API_KEY = process.env.DROPSHIP_API_KEY; 
const CJ_API_URL = 'https://api.cjdropshipping.com/api2.0/v1';

// ─── THE VARIANT MAPPING TABLE ────────────────────────────────
// Maps the names used in your frontend to the specific CJ SKUs
const SKU_MAP = {
    "Blue 4000mAh":      "CJYD239388104DW",
    "Dark Gray 4000mAh": "CJYD239388103CX",
    "Pink 4000mAh":      "CJYD239388102BY",
    "White 4000mAh":     "CJYD239388101AZ"
};

async function getCJToken() {
    try {
        const response = await axios.post(`${CJ_API_URL}/authentication/getAccessToken`, {
            apiKey: CJ_API_KEY
        });
        if (response.data && response.data.data) return response.data.data.accessToken;
        throw new Error('Token failure');
    } catch (e) { throw e; }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const token = await getCJToken();

        // ROUTE: Shipping Lookup (Uses Blue SKU as the base reference)
        if (req.method === 'POST' && req.url.includes('/shipping')) {
            const { zip, country, qty } = req.body;
            const response = await axios.post(`${CJ_API_URL}/logistic/freightCalculate`, {
                quantity: qty || 1,
                productSku: SKU_MAP["Blue 4000mAh"], 
                zipCode: zip,
                countryCode: country
            }, { headers: { 'CJ-Access-Token': token } });
            return res.status(200).json(response.data);
        }

        // ROUTE: Fulfillment (Maps each bundle slot to its correct SKU)
        if (req.method === 'POST' && req.url.includes('/fulfill')) {
            const { paypalOrderId, bundleColors, shipping } = req.body;

            const orderPayload = {
                orderNumber: paypalOrderId,
                shippingAddress: shipping.cjShipping,
                products: Object.values(bundleColors).map(variantName => ({
                    sku: SKU_MAP[variantName] || SKU_MAP["Dark Gray 4000mAh"], // Fallback to Dark Gray
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
