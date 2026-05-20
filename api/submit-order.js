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

  // ── Log incoming colour + resolved SKU for every item ──
  console.log(`[submit-order] Order ${orderId} — ${cart.length} item(s):`);
  cart.forEach((item, i) => {
    const SKU_MAP = {
      'Blue':  'CJYD239388104DW',
      'Black': 'CJYD239388103CX',
      'Pink':  'CJYD239388102BY',
      'White': 'CJYD239388101AZ',
    };
    const key = Object.keys(SKU_MAP).find(k => k.toLowerCase() === (item.variant || '').toLowerCase());
    const resolved = item.cjSku || item.sku || item.variantId || SKU_MAP[key] || 'NOT FOUND';
    console.log(`  [${i + 1}] Name: ${item.name || '—'} | Colour: ${item.variant || '—'} | Qty: ${item.qty || 1} | SKU: ${resolved}`);
  });

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

    // ── SKU lookup — variant name → CJ vid ──
    const SKU_MAP = {
      'Blue':  'CJYD239388104DW',
      'Black': 'CJYD239388103CX',
      'Pink':  'CJYD239388102BY',
      'White': 'CJYD239388101AZ',
    };

    function resolveSku(item) {
      // 1. Already has a sku on the item — use it
      if (item.cjSku || item.sku || item.variantId) {
        return item.cjSku || item.sku || item.variantId;
      }
      // 2. Look up by variant name (case-insensitive)
      if (item.variant) {
        const key = Object.keys(SKU_MAP).find(
          k => k.toLowerCase() === item.variant.toLowerCase()
        );
        if (key) return SKU_MAP[key];
      }
      // 3. Fallback — log and return empty (CJ will reject, but won't silently ship wrong item)
      console.error('[submit-order] Could not resolve SKU for item:', item);
      return '';
    }

    // ── Step 2: Build CJ order payload ──
    const products = cart.map(item => ({
      vid:          resolveSku(item),
      quantity:     item.qty || 1,
      shippingName: shippingMode === 'prime' ? 'CJPacket' : 'CJPacket Ordinary',
    }));

    // Abort if any product has no vid — prevents a bad order reaching CJ
    const missingVid = products.find(p => !p.vid);
    if (missingVid) {
      console.error('[submit-order] Missing vid — aborting CJ submission');
      return res.status(200).json({
        success: false,
        warning: 'missing_sku',
        orderId,
        products,
      });
    }

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