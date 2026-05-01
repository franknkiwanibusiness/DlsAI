// api/place-order.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; // Your Volcanic Humidifier

    try {
        // 1. Get Access Token (The "Handshake")
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error("CJ Auth Failed");

        const accessToken = authData.data.accessToken;

        // 2. Push Order to CJ
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id, 
                shippingAddress: {
                    firstName: customer.name.split(' ')[0],
                    lastName: customer.name.split(' ').slice(1).join(' ') || 'Buyer',
                    address1: customer.addr,
                    city: customer.city,
                    province: customer.city, 
                    zipCode: customer.zip,
                    countryCode: customer.countryCode || "US", 
                    phone: customer.phone || "0000000000"
                },
                products: [{ sku: TARGET_SKU, quantity: q }]
            })
        });

        const orderResult = await cjResponse.json();
        return res.status(200).json({ success: true, cj: orderResult });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
