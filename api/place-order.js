export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; 

    // WORLDWIDE MAPPER
    const getCountryCode = (name) => {
        if (!name) return "US";
        const n = name.trim().toLowerCase();
        const codes = {
            "south africa": "ZA", "nigeria": "NG", "ghana": "GH", "kenya": "KE",
            "united states": "US", "usa": "US", "canada": "CA", "mexico": "MX",
            "united kingdom": "GB", "uk": "GB", "germany": "DE", "france": "FR",
            "australia": "AU", "new zealand": "NZ", "brazil": "BR"
        };
        // If it's a 2-letter code already (like someone typing 'ZA'), use it. 
        // Otherwise, look it up or default to US.
        return n.length === 2 ? n.toUpperCase() : (codes[n] || "US");
    };

    try {
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error(`Auth Failed: ${authData.message}`);
        const accessToken = authData.data.accessToken;

        const firstName = customer.name.split(' ')[0];
        const lastName = customer.name.split(' ').slice(1).join(' ') || 'Customer';
        const isoCountry = getCountryCode(customer.country);

        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id,
                fromCountryCode: 'CN', // Origin: China
                shippingCountry: customer.country || "United States", // Dynamic Worldwide Name
                shippingAddressRequest: {
                    firstName: firstName,
                    lastName: lastName,
                    addressLine1: customer.addr, 
                    addressLine2: customer.apt || "",
                    city: customer.city,
                    province: customer.state || customer.city,
                    zipCode: customer.zip,
                    countryCode: isoCountry, // 2-Letter Code
                    phone: customer.phone || "0000000000"
                },
                products: [{ 
                    variantSku: TARGET_SKU, 
                    quantity: parseInt(q) || 1 
                }]
            })
        });

        const orderResult = await cjResponse.json();
        console.log("WORLDWIDE CJ API RESPONSE:", orderResult);

        if (orderResult.result || orderResult.success) {
            return res.status(200).json({ 
                success: true, 
                orderId: orderResult.data ? orderResult.data.orderId : "SUCCESS" 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                details: orderResult.message || "CJ API Error" 
            });
        }

    } catch (error) {
        console.error("SERVER ERROR:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
