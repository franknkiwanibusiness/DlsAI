// api/send-email.js
export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 10,
};

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.EMAIL_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('EMAIL_API_KEY not set in environment');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { type, email, name, affiliateCode, data } = req.body;
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    let subject = '';
    let html = '';

    switch(type) {
      case 'affiliate_welcome':
        subject = '🎯 You\'re now a MINIMISTY Affiliate!';
        html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff;">
            <div style="text-align: center; padding: 20px; background: #0f0f0f; border-radius: 16px;">
              <h2 style="color: #a3ff12;">Welcome to MINIMISTY Affiliates, ${escapeHtml(name || 'Partner')}!</h2>
              <p>Your unique affiliate link:</p>
              <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong style="color: #00f0ff;">https://minimisty.store/?ref=${escapeHtml(affiliateCode)}</strong>
              </div>
              <p>Share this link and earn <strong style="color: #a3ff12;">15% commission</strong> on every sale!</p>
              <p>Track your earnings in your affiliate dashboard.</p>
              <hr style="border-color: #222;">
              <p style="font-size: 12px; color: #666;">MINIMISTY.store · support@minimisty.store</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'subscriber_welcome':
        subject = '🎁 Welcome to MINIMISTY — Here\'s 10% Off!';
        html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff;">
            <div style="text-align: center; padding: 20px; background: #0f0f0f; border-radius: 16px;">
              <h2 style="color: #a3ff12;">Thanks for subscribing, ${escapeHtml(name || 'friend')}!</h2>
              <p>Use your exclusive coupon on your first order:</p>
              <div style="background: #a3ff12; padding: 15px; text-align: center; border-radius: 8px; margin: 15px 0;">
                <h2 style="margin:0; letter-spacing: 4px; color: #000;">WELCOME10</h2>
              </div>
              <p style="color: #ccc;">Valid for 30 days. Minimum order $20.</p>
              <p>Stay cool! ❄️</p>
              <hr style="border-color: #222;">
              <p style="font-size: 12px; color: #666;">MINIMISTY.store · support@minimisty.store</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'payment_cancelled':
        subject = '❄️ Your MINIMISTY Order Wasn\'t Completed';
        
        // Extract variables from data object
        const {
          CANCEL_CODE = '—',
          ORDER_ID = '—',
          CANCEL_TIME = '—',
          ITEM_COUNT = '0',
          ORDER_ITEMS_HTML = '',
          FULL_NAME = '—',
          ADDRESS_LINE1 = '—',
          ADDRESS_LINE2 = '',
          CITY = '—',
          STATE_PROVINCE = '—',
          POSTAL_CODE = '—',
          COUNTRY = '—',
          PHONE = '—',
          SUBTOTAL = '—',
          SHIPPING = '—',
          SHIPPING_FREE = false,
          TAX = '—',
          TOTAL = '—',
          DISCOUNT_CODE = 'WELCOME10'
        } = data || req.body.data || {};

        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MINIMISTY Order Wasn't Completed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #0f0f0f; border-radius: 24px; border: 1px solid #1e1e1e; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #0d0d0d 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1a1a1a; }
    .logo-link { text-decoration: none; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .logo-icon { width: 40px; height: 40px; }
    .logo-text { font-size: 22px; font-weight: 800; color: #fff; }
    .logo-suffix { color: #00f0ff; font-size: 13px; font-weight: 600; }
    .cancel-icon { width: 64px; height: 64px; background: rgba(255,59,48,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(255,59,48,0.2); }
    h1 { font-size: 24px; font-weight: 700; color: #ff3b30; margin-bottom: 8px; }
    .subhead { font-size: 14px; color: #888; font-weight: 500; }
    .content { padding: 28px 24px; }
    .info-box { background: #080808; border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #151515; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #111; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-weight: 600; }
    .info-value { color: #fff; font-weight: 700; text-align: right; }
    .info-value.cancelled { color: #ff3b30; }
    .order-items { background: #080808; border-radius: 16px; padding: 16px; margin-bottom: 24px; border: 1px solid #151515; }
    .order-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #111; }
    .order-item:last-child { border-bottom: none; }
    .item-thumb { width: 48px; height: 48px; background: #111; border-radius: 10px; background-size: cover; background-position: center; flex-shrink: 0; }
    .item-details { flex: 1; }
    .item-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .item-meta { font-size: 11px; color: #666; font-weight: 600; }
    .item-price { font-size: 14px; font-weight: 700; color: #fff; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #555; margin-bottom: 12px; }
    .address-block { background: #080808; border-radius: 16px; padding: 16px; margin-bottom: 24px; border: 1px solid #151515; }
    .address-line { font-size: 13px; color: #ccc; line-height: 1.6; font-weight: 500; }
    .cta-button { display: block; width: 100%; background: #fff; color: #000; text-align: center; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 16px; text-decoration: none; margin: 24px 0 16px; }
    .cta-button:hover { opacity: 0.9; }
    .discount-badge { background: rgba(163,255,18,0.1); border: 1px solid rgba(163,255,18,0.2); border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px; }
    .discount-code { font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #a3ff12; margin: 8px 0 4px; }
    .discount-text { font-size: 12px; color: #888; font-weight: 600; }
    .footer { padding: 20px 24px; text-align: center; border-top: 1px solid #111; background: #080808; }
    .footer-text { font-size: 11px; color: #444; font-weight: 600; line-height: 1.6; }
    .highlight { color: #a3ff12; }
    @media (max-width: 480px) { .content { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://minimisty.store" class="logo-link">
        <svg class="logo-icon" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="16" fill="#fff"/>
          <path d="M50 34 C30 30 30 4 50 4 C70 4 70 30 50 34 Z" fill="#fff"/>
          <path d="M66 50 C70 30 96 30 96 50 C96 70 70 70 66 50 Z" fill="#fff"/>
          <path d="M50 66 C70 70 70 96 50 96 C30 96 30 70 50 66 Z" fill="#fff"/>
          <path d="M34 50 C30 70 4 70 4 50 C4 30 30 30 34 50 Z" fill="#fff"/>
          <circle cx="50" cy="50" r="6" fill="#000"/>
        </svg>
        <span class="logo-text">MINIMISTY<span class="logo-suffix">.store</span></span>
      </a>
      <div class="cancel-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <h1>Payment Not Completed</h1>
      <div class="subhead">No charge was made to your account</div>
    </div>
    <div class="content">
      <div class="info-box">
        <div class="info-row"><span class="info-label">Cancellation Code</span><span class="info-value cancelled">${escapeHtml(CANCEL_CODE)}</span></div>
        <div class="info-row"><span class="info-label">Order Reference</span><span class="info-value">${escapeHtml(ORDER_ID)}</span></div>
        <div class="info-row"><span class="info-label">Cancelled At</span><span class="info-value">${escapeHtml(CANCEL_TIME)}</span></div>
      </div>
      <div class="order-items">
        <div class="section-title">YOUR ORDER (${escapeHtml(ITEM_COUNT)} ITEMS)</div>
        ${ORDER_ITEMS_HTML || '<div class="order-item"><div class="item-details">No items found</div></div>'}
      </div>
      <div class="address-block">
        <div class="section-title">DELIVERY ADDRESS</div>
        <div class="address-line">
          ${escapeHtml(FULL_NAME)}<br>
          ${escapeHtml(ADDRESS_LINE1)}${ADDRESS_LINE2 ? `<br>${escapeHtml(ADDRESS_LINE2)}` : ''}<br>
          ${escapeHtml(CITY)}, ${escapeHtml(STATE_PROVINCE)} ${escapeHtml(POSTAL_CODE)}<br>
          ${escapeHtml(COUNTRY)}<br>
          📞 ${escapeHtml(PHONE)}
        </div>
      </div>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value">${escapeHtml(SUBTOTAL)}</span></div>
        <div class="info-row"><span class="info-label">Shipping</span><span class="info-value">${SHIPPING_FREE === true ? 'FREE' : escapeHtml(SHIPPING)}</span></div>
        <div class="info-row"><span class="info-label">Tax (5%)</span><span class="info-value">${escapeHtml(TAX)}</span></div>
        <div class="info-row" style="margin-top:8px;padding-top:12px;border-top:1px solid #1a1a1a;"><span class="info-label" style="font-size:15px;font-weight:800;">Total</span><span class="info-value" style="font-size:18px;font-weight:800;">${escapeHtml(TOTAL)}</span></div>
      </div>
      <div class="discount-badge">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3ff12" stroke-width="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <div class="discount-code">${escapeHtml(DISCOUNT_CODE)}</div>
        <div class="discount-text">Use this code at checkout for 10% OFF your next order</div>
      </div>
      <a href="https://minimisty.store" class="cta-button">🛒 RETURN TO CART & COMPLETE ORDER</a>
      <div style="font-size:12px;color:#555;text-align:center;line-height:1.5;">Your cart is saved for <strong>48 hours</strong>.<br><span class="highlight">Free shipping on all bundle orders (2+ units)!</span></div>
    </div>
    <div class="footer">
      <div class="footer-text">MINIMISTY.store — The cooler that goes everywhere you do.<br>Need help? Reply to this email or contact support@minimisty.store<br>© 2026 MINIMISTY · All rights reserved</div>
    </div>
  </div>
</body>
</html>`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid email type. Use: affiliate_welcome, subscriber_welcome, or payment_cancelled' });
    }

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MINIMISTY <orders@dlsvalue.site>',
        to: email,
        subject: subject,
        html: html,
        reply_to: 'support@minimisty.store'
      })
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', responseData);
      return res.status(500).json({ error: responseData.message || 'Failed to send email' });
    }

    return res.status(200).json({ success: true, id: responseData.id });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}