export default async function handler(req, res) {
    // 1. SYSTEM HEALTH CHECK (For your Green/Red light)
    if (req.method === 'HEAD') return res.status(200).send('OK');
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { orderId, customer, items, pricing } = req.body;
    
    // Environment Variables
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = process.env.PRODUCT_API_KEY || "CJJT163563001AZ"; 

    // ISO COUNTRY MAPPER
    const getCountryCode = (name) => {
        if (!name) return "";
        const n = name.trim().toUpperCase();
        if (n.length === 2) return n;

        const codes = {
            "SOUTH AFRICA": "ZA", "NIGERIA": "NG", "GHANA": "GH", "KENYA": "KE",
            "UNITED STATES": "US", "USA": "US", "UNITED KINGDOM": "GB", "UK": "GB",
            "CANADA": "CA", "AUSTRALIA": "AU", "GERMANY": "DE", "FRANCE": "FR"
        };
        return codes[n] || n.substring(0, 2); 
    };

    try {
        // 2. CJ AUTHENTICATION
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error(`Auth Failed: ${authData.message}`);
        const accessToken = authData.data.accessToken;

        // 3. DATA PREP
        const isoCountry = getCountryCode(customer.country);
        const nameParts = customer.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        // 4. PUSH TO CJ DROPSHIPPING
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: orderId, 
                fromCountryCode: 'CN', 
                shippingCountry: customer.country, 
                shippingAddressRequest: {
                    firstName: firstName,
                    lastName: lastName,
                    addressLine1: customer.address, 
                    addressLine2: "", 
                    city: customer.city,
                    province: customer.city, 
                    zipCode: customer.zip,
                    countryCode: isoCountry,
                    phone: customer.phone || "0000000000"
                },
                products: [{ 
                    variantSku: TARGET_SKU, 
                    quantity: parseInt(items.quantity) || 1 
                }]
            })
        });

        const orderResult = await cjResponse.json();

        if (orderResult.result || orderResult.success) {
            return res.status(200).json({ 
                success: true, 
                cjOrderId: orderResult.data?.orderId 
            });
        } else {
            console.error("CJ REJECTION:", orderResult.message);
            return res.status(400).json({ success: false, msg: orderResult.message });
        }

    } catch (error) {
        console.error("VERCEL ERROR:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
