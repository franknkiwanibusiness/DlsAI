export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY; 
    const TARGET_SKU = "CJJT163563001AZ"; 

    // 1. THE MAPPER (Stays inside the API)
    const getCountryCode = (name) => {
        if (!name) return "";
        const n = name.trim().toUpperCase();
        if (n.length === 2) return n; // If user sends "ZA", use it.

        const codes = {
            "SOUTH AFRICA": "ZA", "NIGERIA": "NG", "GHANA": "GH", "KENYA": "KE",
            "UNITED STATES": "US", "USA": "US", "UNITED KINGDOM": "GB", "UK": "GB",
            "CANADA": "CA", "AUSTRALIA": "AU", "GERMANY": "DE", "FRANCE": "FR"
        };
        return codes[n] || ""; 
    };

    try {
        // AUTHENTICATION
        const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.result) throw new Error(`Auth Failed: ${authData.message}`);
        const accessToken = authData.data.accessToken;

        // 2. DATA PREP
        const isoCountry = getCountryCode(customer.country);
        const firstName = customer.name.split(' ')[0];
        const lastName = customer.name.split(' ').slice(1).join(' ') || ' ';

        // 3. EMERGENCY CHECK: Stop if country code is missing
        if (!isoCountry) {
            return res.status(400).json({ 
                success: false, 
                msg: `CJ requires a 2-letter country code. Received: ${customer.country}` 
            });
        }

        // 4. CREATE THE ORDER
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id,
                fromCountryCode: 'CN', 
                shippingCountry: customer.country, 
                shippingAddressRequest: {
                    firstName: firstName,
                    lastName: lastName,
                    addressLine1: customer.addr, 
                    addressLine2: customer.apt || "",
                    city: customer.city,
                    province: customer.state || customer.city,
                    zipCode: customer.zip,
                    countryCode: isoCountry, // The fix is here
                    phone: customer.phone || "0000000000"
                },
                products: [{ 
                    variantSku: TARGET_SKU, 
                    quantity: parseInt(q) || 1 
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
