// api/cjdropship.js
const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
// This matches your Vercel Environment Variable name
const CJ_API_KEY = process.env.DROPSHIP_API_KEY; 

export default async function handler(req, res) {
  try {
    // 1. Get Access Token from CJ
    const authResponse = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: CJ_API_KEY })
    });
    
    const authResult = await authResponse.json();
    
    if (!authResult.data || !authResult.data.accessToken) {
      return res.status(500).json({ error: "Failed to authenticate with CJ" });
    }

    const accessToken = authResult.data.accessToken;

    // 2. Route the request based on what the frontend needs
    const { action } = req.query;

    if (action === 'shipping') {
      const shippingResponse = await fetch(`${CJ_API_URL}/logistic/getShippingCost`, {
        method: 'POST',
        headers: { 
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(req.body)
      });
      const data = await shippingResponse.json();
      return res.status(200).json(data);
    }

    if (action === 'fulfill') {
      // Logic for creating the order in CJ
      return res.status(200).json({ success: true, message: "Order data received by bridge" });
    }

    res.status(404).json({ error: "Action not found" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
