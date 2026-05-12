// api/cjdropship.js
const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_API_KEY = process.env.DROPSHIP_API_KEY; // Pulled from your Vercel Environment Variables

export default async function handler(req, res) {
  try {
    // 1. SECURE AUTHENTICATION
    const authRes = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: CJ_API_KEY })
    });
    
    const authResult = await authRes.json();
    if (!authResult.data || !authResult.data.accessToken) {
      return res.status(500).json({ error: "CJ Authentication Failed" });
    }
    const accessToken = authResult.data.accessToken;

    // 2. ROUTE ACTIONS
    const { action } = req.query;

    // --- SHIPPING LOOKUP ACTION ---
    if (action === 'shipping') {
      const { sku, country, zip, qty } = req.body;
      const shippingRes = await fetch(`${CJ_API_URL}/logistic/getShippingCost`, {
        method: 'POST',
        headers: { 
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          shoppingCartAttributes: [{ quantity: qty, sku: sku }],
          countryCode: country,
          zip: zip
        })
      });
      const data = await shippingRes.json();
      return res.status(200).json(data);
    }

    // --- FULL ORDER FULFILLMENT ACTION ---
    if (action === 'fulfill') {
      const { paypalOrderId, sku, variantName, quantity, shipping } = req.body;

      // This maps your site's data to the exact keys CJ requires
      const cjOrderBody = {
        orderNumber: paypalOrderId, 
        shippingAddress: {
          consigneeName: shipping.name,
          addressLine1:  shipping.address,
          addressLine2:  shipping.address2 || "",
          city:          shipping.city,
          province:      shipping.state,
          countryCode:   shipping.cjShipping.countryCode, // e.g., "ZA" or "US"
          zipCode:       shipping.zip,
          phoneNumber:   shipping.phone,
        },
        products: [{
          sku: sku, // CJYD239388104DW
          quantity: quantity,
          variantName: variantName // e.g., "Dark Gray 4000mAh"
        }],
        remark: "MINIMISTY AUTOMATED ORDER"
      };

      const orderRes = await fetch(`${CJ_API_URL}/order/create`, {
        method: 'POST',
        headers: { 
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(cjOrderBody)
      });

      const orderResult = await orderRes.json();
      
      // Log fulfillment to your Firebase project itzhoyoo-f9f7e if needed here
      return res.status(200).json(orderResult);
    }

    return res.status(404).json({ error: "Invalid Action" });

  } catch (error) {
    console.error("Bridge Error:", error.message);
    res.status(500).json({ error: "Bridge Internal Error" });
  }
}
