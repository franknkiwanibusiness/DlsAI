// api/verify-meta.js
// Vercel serverless function — fetches the user's site and checks for the
// Siterifty verification meta tag.
// Deploy this file at: /api/verify-meta.js in your Vercel project root.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, token } = req.body || {};

  if (!url || !token) {
    return res.status(400).json({ verified: false, error: 'Missing url or token.' });
  }

  // Basic URL sanity check
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('bad protocol');
  } catch {
    return res.status(400).json({ verified: false, error: 'Invalid URL.' });
  }

  // Block private/internal addresses
  const hostname = parsedUrl.hostname;
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (blocked.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return res.status(400).json({ verified: false, error: 'URL must be a publicly accessible site.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Siterifty-Verifier/1.0 (+https://siterifty.com)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(200).json({
        verified: false,
        error: `Site returned HTTP ${response.status}. Make sure it's publicly accessible.`,
      });
    }

    // Read only the first 20KB — the <head> is always at the top
    const reader = response.body.getReader();
    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 20_000;

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytesRead += value.length;
      // Stop once we've passed </head>
      if (html.toLowerCase().includes('</head>')) break;
    }
    reader.cancel();

    // Check for the meta tag with the correct token
    // Matches: <meta name="siterifty-site-verification" content="TOKEN">
    // (attribute order, spacing, quote style all flexible)
    const metaPattern = new RegExp(
      `<meta[^>]+name=["']siterifty-site-verification["'][^>]+content=["']${escapeRegex(token)}["'][^>]*>` +
      `|<meta[^>]+content=["']${escapeRegex(token)}["'][^>]+name=["']siterifty-site-verification["'][^>]*>`,
      'i'
    );

    const verified = metaPattern.test(html);

    return res.status(200).json({ verified });

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(200).json({ verified: false, error: 'Request timed out. Make sure your site is live and accessible.' });
    }
    console.error('[verify-meta] fetch error:', err.message);
    return res.status(200).json({ verified: false, error: 'Could not reach your site. Please check the URL and try again.' });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
