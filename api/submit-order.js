// /api/submit-order.js
// Receives verified order data and forwards it to CJ Dropship
// Uses DROPSHIP_API_KEY from Vercel environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    orderId,
    paypalData,
    contact,
    address,
    cart,
    pricing,
    currency,
    shippingMode,
    giftWrap,
  } = req.body || {};

  if (!orderId || !contact || !address || !cart?.length) {
    return res.status(400).json({ success: false, error: 'Missing required order fields' });
  }

  const CJ_API_KEY  = process.env.DROPSHIP_API_KEY;
  const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  if (!CJ_API_KEY) {
    console.warn('[submit-order] DROPSHIP_API_KEY not set — logging order only');
    return res.status(200).json({
      success: true,
      warning: 'cj_key_not_configured',
      orderId,
    });
  }

  try {
    // ── Step 1: Get CJ access token ──
    const authRes = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: null, password: null, apiKey: CJ_API_KEY }),
    });

    let accessToken = CJ_API_KEY; // CJ also supports direct API key as Bearer in some endpoints
    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.data?.accessToken) accessToken = authData.data.accessToken;
    }

    // ── Step 2: Build CJ order payload ──
    // Map your cart items to CJ products
    // Each item needs a CJ product/variant ID (sku) — stored in item.cjSku or item.sku
    const products = cart.map(item => ({
      vid:          item.cjSku || item.sku || item.variantId || '',
      quantity:     item.qty || 1,
      shippingName: shippingMode === 'prime' ? 'CJPacket' : 'CJPacket Ordinary',
    }));

    const cjPayload = {
      orderNumber:      orderId,
      shippingZip:      address.postal   || '',
      shippingCountry:  address.countryCode || address.country || '',
      shippingCity:     address.city      || '',
      shippingProvince: address.state     || '',
      shippingAddress:  address.line1     || '',
      shippingAddress2: address.line2     || '',
      shippingCustomerName: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
      shippingPhone:    contact.phone     || '',
      remark:           giftWrap ? 'GIFT_WRAP_REQUESTED' : '',
      fromCountryCode:  'US',
      houseNumber:      '',
      products,
      payType:          2, // 2 = wallet balance; adjust per your CJ account setup
    };

    // ── Step 3: Submit to CJ ──
    const cjRes = await fetch(`${CJ_BASE_URL}/shopping/order/createOrder`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'CJ-Access-Token': accessToken,
      },
      body: JSON.stringify(cjPayload),
    });

    const cjData = cjRes.ok ? await cjRes.json() : { result: false };

    console.log(`[submit-order] CJ response for ${orderId}:`, JSON.stringify(cjData));

    if (cjData.result || cjData.data) {
      return res.status(200).json({
        success:        true,
        orderId,
        cjOrderId:      cjData.data?.orderId || null,
        trackingNumber: cjData.data?.trackingNumber || null,
        cjRaw:          cjData,
      });
    } else {
      // CJ rejected — log but don't fail the customer
      console.error('[submit-order] CJ rejected order:', cjData);
      return res.status(200).json({
        success: false,
        warning: 'cj_rejected',
        orderId,
        cjRaw:   cjData,
      });
    }

  } catch (err) {
    console.error('[submit-order] Error:', err.message);
    return res.status(200).json({
      success: false,
      warning: 'submit_error',
      error:   err.message,
      orderId,
    });
  }
}