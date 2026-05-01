export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; 

    // --- COUNTRY NAME TO ISO CODE CONVERTER ---
    const getCountryCode = (name) => {
        if (!name) return "US"; // Default
        const n = name.trim().toLowerCase();
        const codes = {
            "south africa": "ZA",
            "united states": "US",
            "usa": "US",
            "united kingdom": "GB",
            "uk": "GB",
            "australia": "AU",
            "canada": "CA",
            "nigeria": "NG",
            "ghana": "GH",
            "united arab emirates": "AE",
            "uae": "AE"
        };
        return codes[n] || "US"; // If unknown, default to US to try and process
    };

    try {
        // 1. Get Access Token
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error("CJ Auth Failed");

        const accessToken = authData.data.accessToken;

        // 2. Prepare Data
        const firstName = customer.name.split(' ')[0];
        const lastName = customer.name.split(' ').slice(1).join(' ') || 'Customer';
        const fullAddress = customer.apt ? `${customer.addr}, ${customer.apt}` : customer.addr;
        
        // Convert the text from your "inCountry" field to ISO Code
        const isoCountry = getCountryCode(customer.country);

        // 3. Push Order to CJ
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id,
                shippingAddress: {
                    firstName: firstName,
                    lastName: lastName,
                    address1: fullAddress,
                    city: customer.city,
                    province: customer.state || customer.city,
                    zipCode: customer.zip,
                    countryCode: isoCountry, 
                    phone: customer.phone || "0000000000"
                },
                products: [{ 
                    sku: TARGET_SKU, 
                    quantity: parseInt(q) || 1 
                }]
            })
        });

        const orderResult = await cjResponse.json();

        if (orderResult.result) {
            return res.status(200).json({ success: true, orderId: orderResult.data.orderId });
        } else {
            return res.status(400).json({ success: false, details: orderResult.message });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
