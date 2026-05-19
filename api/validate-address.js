// /api/validate-address.js
// Validates shipping address meets CJ Dropship requirements
// Called before payment is shown to the user

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, contact } = req.body || {};

  if (!address || !contact) {
    return res.status(400).json({ valid: false, message: 'Missing address or contact data' });
  }

  const errors = [];

  // ── CJ Dropship required field checks ──
  if (!contact.firstName && !contact.lastName) {
    errors.push('Full name is required');
  }
  if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.push('Valid email is required');
  }
  if (!contact.phone || contact.phone.replace(/\D/g, '').length < 6) {
    errors.push('Valid phone number is required');
  }
  if (!address.line1 || address.line1.trim().length < 3) {
    errors.push('Street address is required');
  }
  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required');
  }
  if (!address.country && !address.countryCode) {
    errors.push('Country is required');
  }
  if (!address.postal || address.postal.trim().length < 2) {
    errors.push('Postal code is required');
  }

  // ── CJ unsupported / restricted countries (example list — update as needed) ──
  const restricted = ['CU', 'IR', 'KP', 'SY', 'RU'];
  const countryCode = (address.countryCode || '').toUpperCase();
  if (restricted.includes(countryCode)) {
    errors.push(`Shipping to ${address.country || countryCode} is currently not available`);
  }

  // ── Address length limits (CJ API hard limits) ──
  if (address.line1 && address.line1.length > 100) {
    errors.push('Street address is too long (max 100 characters)');
  }
  if (address.city && address.city.length > 50) {
    errors.push('City name is too long (max 50 characters)');
  }

  if (errors.length > 0) {
    console.warn(`[validate-address] Invalid for order — errors: ${errors.join('; ')}`);
    return res.status(200).json({
      valid:   false,
      message: errors[0], // Show first error to user
      errors,
    });
  }

  return res.status(200).json({
    valid:   true,
    message: 'Address verified — ready for dispatch',
  });
}