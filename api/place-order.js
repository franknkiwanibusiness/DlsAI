// api/place-order.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { details, customer, q } = req.body;
    const API_KEY = process.env.DROPSHIP_API_KEY;
    const TARGET_SKU = "CJJT163563001AZ"; // Your confirmed Volcanic Humidifier SKU

    try {
        const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
            method: 'POST',
            headers: {
                'CJ-Access-Token': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: details.id, // PayPal Order ID
                shippingAddress: {
                    firstName: customer.name.split(' ')[0],
                    lastName: customer.name.split(' ')[1] || 'Customer',
                    address1: customer.addr,
                    city: customer.city,
                    zipCode: customer.zip,
                    countryCode: "US", // Default target market
                    phone: "0000000000"
                },
                products: [{
                    sku: TARGET_SKU,
                    quantity: q
                }]
            })
        });

        const data = await cjResponse.json();
        return res.status(200).json({ success: true, cjData: data });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
