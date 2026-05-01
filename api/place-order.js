// api/place-order.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; // Your CJUserNum@api@... key
    const TARGET_SKU = "CJJT163563001AZ";

    try {
        // STEP 1: Exchange API Key for Access Token (Handshake)
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: API_KEY 
            })
        });

        const authData = await authResponse.json();
        
        if (!authData.success || !authData.data.accessToken) {
            return res.status(401).json({ 
                success: false, 
                message: "CJ Auth failed", 
                details: authData.message 
            });
        }

        const accessToken = authData.data.accessToken;

        // STEP 2: Create the Order
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id, 
                shippingAddress: {
                    firstName: customer.name.split(' ')[0] || 'Customer',
                    lastName: customer.name.split(' ').slice(1).join(' ') || 'Buyer',
                    address1: customer.addr,
                    city: customer.city,
                    province: customer.city, 
                    zipCode: customer.zip,
                    countryCode: customer.countryCode || "US", 
                    phone: customer.phone || "0000000000"
                },
                products: [{
                    sku: TARGET_SKU,
                    quantity: q
                }]
            })
        });

        const orderData = await cjResponse.json();
        return res.status(200).json({ success: true, cjData: orderData });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
