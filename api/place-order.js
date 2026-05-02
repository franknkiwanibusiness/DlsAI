export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q, selectedColor } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; 

    // CLEAN MAPPER: No "guessing" or defaults
    const getCountryCode = (name) => {
        if (!name) return "";
        const n = name.trim().toLowerCase();
        const codes = {
            "south africa": "ZA", "nigeria": "NG", "ghana": "GH", "kenya": "KE",
            "united states": "US", "usa": "US", "united kingdom": "GB", "uk": "GB",
            "canada": "CA", "australia": "AU", "germany": "DE", "france": "FR"
        };
        // Use 2-letter input directly, or look up, or return empty
        return n.length === 2 ? n.toUpperCase() : (codes[n] || "");
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
        const nameParts = customer.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' '); // Empty if only one name provided
        const isoCountry = getCountryCode(customer.countryFull || customer.country);

        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id,
                fromCountryCode: 'CN', 
                shippingCountry: customer.countryFull || customer.country, 
                shippingAddressRequest: {
                    firstName: firstName,
                    lastName: lastName,
                    addressLine1: customer.addr, 
                    addressLine2: customer.apt || "",
                    city: customer.city,
                    province: customer.state || "",
                    zipCode: customer.zip,
                    countryCode: isoCountry, 
                    phone: customer.phone || ""
                },
                products: [{ 
                    variantSku: TARGET_SKU, 
                    quantity: parseInt(q),
                    shippingName: "CJPacket Sensitive" // High-performance line
                }]
            })
        });

        const orderResult = await cjResponse.json();
        console.log("CJ_SYNC_LOG:", orderResult);

        if (orderResult.result || orderResult.success) {
            return res.status(200).json({ success: true, orderId: orderResult.data?.orderId });
        } else {
            return res.status(400).json({ success: false, msg: orderResult.message });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
