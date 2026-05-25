export default function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = process.env.EMAIL_API_KEY    || '';
  const pass  = process.env.PASSWORD_API_KEY || '';

  if (!email || !pass) {
    console.warn('[config] WARNING: EMAIL_API_KEY or PASSWORD_API_KEY env var is not set on Vercel.');
  }

  // Prevent caching so creds are always fresh
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ email, pass });
}