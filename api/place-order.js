export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; 

    const getCountryCode = (name) => {
        if (!name) return "US";
        const n = name.trim().toLowerCase();
        const codes = {
            "south africa": "ZA",
            "united states": "US", "usa": "US",
            "united kingdom": "GB", "uk": "GB",
            "australia": "AU", "canada": "CA",
            "nigeria": "NG", "ghana": "GH"
        };
        return codes[n] || "US";
    };

    try {
        // 1. Get Access Token
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error(`Auth Failed: ${authData.message}`);

        const accessToken = authData.data.accessToken;

        // 2. Prepare Data
        const firstName = customer.name.split(' ')[0];
        const lastName = customer.name.split(' ').slice(1).join(' ') || 'Customer';
        const isoCountry = getCountryCode(customer.country);

        // 3. Push Order to CJ (V3)
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id,
                // CRITICAL FIX 1: Change to 'shippingAddressRequest'
                shippingAddressRequest: {
                    firstName: firstName,
                    lastName: lastName,
                    addressLine1: customer.addr, // FIX 2: Use addressLine1
                    addressLine2: customer.apt || "",
                    city: customer.city,
                    province: customer.state || customer.city,
                    zipCode: customer.zip,
                    countryCode: isoCountry, 
                    phone: customer.phone || "0000000000"
                },
                products: [{ 
                    // FIX 3: Use 'variantSku' instead of 'sku'
                    variantSku: TARGET_SKU, 
                    quantity: parseInt(q) || 1 
                }]
            })
        });

        const orderResult = await cjResponse.json();

        // Log this to your Vercel logs so you can see it!
        console.log("CJ API RESPONSE:", orderResult);

        if (orderResult.result) {
            return res.status(200).json({ success: true, orderId: orderResult.data.orderId });
        } else {
            // This captures the exact reason CJ said no (e.g., "Invalid SKU")
            return res.status(400).json({ success: false, details: orderResult.message });
        }

    } catch (error) {
        console.error("SERVER ERROR:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
